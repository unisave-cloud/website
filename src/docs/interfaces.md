---
title: "Interfaces"
titleHtml: "Interfaces"
url: "docs/interfaces"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: "2023-10-17"
dateUpdated: null
---

This page describes the internal interfaces and APIs within the Unisave system.

> **🚧 Internal documentation:** This documentation page describes Unisave internals and is meant for Unisave developers and very advanced users. Information here might be incomplete, not yet implemented, deprecated, or changed without notice.


## Unisave Framework

> **GitHub:** [unisave-cloud/framework](https://github.com/unisave-cloud/framework)

From version `v0.11.0`, the [Unisave Framework](https://github.com/unisave-cloud/framework) is being redesigned as a [web framework](https://en.wikipedia.org/wiki/Web_framework), drawing inspiration from [Laravel](https://laravel.com/), [express.js](https://expressjs.com/), [ASP.NET Core](https://en.wikipedia.org/wiki/ASP.NET_Core), and [NancyFx](https://nancyfx.org/).

The redesign stands on the [OWIN](http://owin.org/) standard (Open Web Interface for .NET) and its Microsoft [Katana project](https://github.com/aspnet/AspNetKatana) implementation. These are the two most important technologies since both are referenced and used by the Unisave Framework.

The OWIN standard defines a set of terms:

> 1. **Server** - The HTTP server that directly communicates with the client and then uses OWIN semantics to process requests. Servers may require an adapter layer that converts to OWIN semantics.
> 2. **Web Framework** - A self-contained component on top of OWIN exposing its own object model or API that applications may use to facilitate request processing. Web Frameworks may require an adapter layer that converts from OWIN semantics.
> 3. **Web Application** - A specific application, possibly built on top of a Web Framework, which is run using OWIN compatible Servers.
> 4. **Middleware** - Pass through components that form a pipeline between a server and application to inspect, route, or modify request and response messages for a specific purpose.
> 5. **Host** - The process an application and server execute inside of, primarily responsible for application startup. Some Servers are also Hosts.

Based on these terms, Unisave Framework is both a *Web Framework* and also a *Middleware*. The backend application that the game developer creates is a *Web Application* and is fully loaded and managed by the Unisave Framework. The *Server* and the *Host* could be any technology capable of hosting an OWIN application (say the [Katana self-host server](https://github.com/unisave-cloud/framework/tree/master/ExampleHost)), or in case of the Unisave cloud, the [Unisave Server](#unisave-server).


### Startup

During startup, the *Host* creates a *Properties* dictionary, that is passed to the *Application*, which uses it to create an *Application Delegate* (`AppFunc`) and the *Server* uses this delegate to handle HTTP requests. The OWIN specification (section 4) is very general. In practise, the Katana project uses the [`Owin.dll`](https://www.nuget.org/packages/Owin/) which contains an interface `Owin.IAppBuilder` and this interface is what facilitates the transfer of the *Properties* dictionary back and forth and also the construction of the `AppFunc` delegate.

Moreover, the *Application* typically defines a class called `Startup` that is automatically found in the *Application* assembly by the [`Owin.Loader`](https://github.com/aspnet/AspNetKatana/blob/main/src/Owin.Loader/DefaultLoader.cs) system and its `Configuration` method is invoked with the `IAppBuilder` instance provided.

```cs
// Web Application
public class Startup
{
    public void Configuration(IAppBuilder app)
    {
        // Define the OWIN app here
        app.Properties["..."] = ...;
        app.Use(/* some middleware */)
    }
}

// Host
var appFunc = app.Build();
var httpResponse = appFunc(httpRequest);
```

Unisave Framework respects this OWIN extension by the Katana project and defines a [`Unisave.FrameworkStartup`](https://github.com/unisave-cloud/framework/blob/master/UnisaveFramework/FrameworkStartup.cs) class. This class is what should be loaded by the *Host*.

The framework assembly is also tagged by the [`Microsoft.Owin.OwinStartupAttribute`](https://github.com/aspnet/AspNetKatana/blob/main/src/Microsoft.Owin/Loader/OwinStartupAttribute.cs) attribute that states the `FrameworkStartup` is in fact the startup class to be used, if you want to start the `"UnisaveFramework"` web application:

```cs
[assembly: Microsoft.Owin.OwinStartup(
    "UnisaveFramework",
    typeof(Unisave.FrameworkStartup)
)]
```

This `OwinStartupAttribute` tag is what is used by the Unisave Worker to locate the OWIN startup class.


#### OWIN Properties

Unisave Framework expects these properties provided by the *Host* or the *Server* in the *Properties* startup dictionary.

**host.OnAppDisposing**<br>
This is a `CancellationToken` that must be invoked by the *Host* when the server is shutting down. It will trigger the disposal of all created backend services.


#### Custom Properties

Unisave Framework expects a set of additional values to be provided by the *Host* or the *Server* in the *Properties* startup dictionary.

**unisave.GameAssemblies**<br>
A required property of type [`Assembly[]`](https://learn.microsoft.com/en-us/dotnet/api/system.reflection.assembly?view=net-7.0). Contains all the game backend assemblies that should be used to look up Bootstrappers, Facets, Entities, etc. This must include the Unisave Framework assembly as well, otherwise the Framework will not load properly.

> **Note:** The reason for explicit inclusion of the framework assembly stems from the possibility of not using the Unisave Framework in the backend application. An advanced user could upload a backend code without the framework but with their own startup class and thus utilize a different web framework if they choose so. Another words, the framework is just an internal part of the web application.

**unisave.EnvironmentVariables**<br>
An optional property of type [`IDictionary<string, string>`](https://learn.microsoft.com/en-us/dotnet/api/system.collections.generic.idictionary-2?view=net-7.0). If the application uses environment variables, the values provided here should take precedence. The Unisave Framework initializes the environment variables it provides to the backend application via the [`Environment.GetEnvironmentVariables`](https://learn.microsoft.com/en-us/dotnet/api/system.environment.getenvironmentvariables?view=net-7.0) method and then extends/overwrites those with values provided in this *Property* value.

> **Note:** The motivation here is to theoretically allow the hosting of multiple web applications within a single OS process.

**unisave.BackendApplication**<br>
This property is set by the framework startup class and is exported back up into the server and the host. It contains the `BackendApplication` instance that will be used for request handling. This is used by framework startup tests, not by the Unisave Worker (yet).


### HTTP Request

The application can now handle HTTP requests via the middleware components registered to the `IAppBuilder` instance. How exactly this registration happens is managed by the framework bootstrapping, which is not the scope of this documentation page.


#### Asynchronicity & Multi-threading

The whole framework should be designed with asynchronicity in mind. The OWIN request handling core uses C# `Task` class to achieve this, and the same approach should be present throughout the whole framework.

This is necessary, because a backend server acts very much like a gateway, receiving requests, and making other requests to other services (the database, broadcasting, external third-party services). Especially the presence of third-party services makes this important, as these requests may take on the order of seconds and block an excecution thread.

**Synchronous single-threading**<br>
The current system works completely synchronously, only allowing a single request at a time, being processed by one thread. (parallelism may occur between workers though) This suffers from the long-blocking HTTP request problem mentioned above. The goal is to get rid of this system.

**Asynchronous single-threading**<br>
In this paradigm, there is only one thread, but all the logic is written in the `async`, `await` fashion, which makes all the external requests non-blocking. This allows for multiple requests to be processed simultaneously, using cooperative multitasking. This is the current goal state for the system to be in. The framework is ready for this, but the *Unisave Server* needs to be refactored to support this. This is also the paradigm used by Node.js, Python, and even Unity Engine, as it allows for a responsive, multitasking system, while avoiding the pain of managing multiple threads (synchronization primitives, race conditions, and deadlocks). This paradigm should be the default for all Unisave users as it's the best performance-complexity tradeoff.

**Asynchronous multi-threading**<br>
This paradigm builds on the previous by allowing multiple threads be used. It is used by the ASP.NET framework and allows for maximum performance. When working in the scope of a single request, the paradigm behaves like the previous one, so not much more complexity is added. The problem arises in singleton services used by multiple requests simultaneously. These need to be designed with thread-safety in mind. This paradigm should be an opt-in variant for advanced Unisave users, who need performance or are dealing with blocking-synchronous code that otherwise starves the cooperative model from before (they need preemptive multitasking). The framework could support this in theory, but all the core services and the service container would need to become thread-safe and be thoroughly tested, that there are no race-conditions hidden inside. This paradigm should be enabled by setting an environment variable that will be parsed by the Unisave Server.


#### Error Handling

Developers aren't perfect and it may happen that the backned handling logic raises an exception that is not handled by any specialized subsystem (like the facet calling system). The recommended behaviour for production web servers is to return a `500 Internal Server Error` response with minimal body (to not expose any internal logic). The problem is, that the backend server runs behind a gateway and the backend developer would like to see the full error message when a problem occurs.

For this reason, I design a *Unisave Error Response*, a standardized JSON response that describes the exception. It can be parsed by the gateway and pruned for sensitive data. The response is identified by an HTTP header:

```
X-Unisave-Error-Response: 1.0
```

The header contains the version of the response format. The format is the following:

```json
{
    "exception": {
        "ClassName": "MyException",
        "Message": "Something went wrong!",
        "StackTraceString": "  at Program.Main...",
        ...
    }
}
```

Currently, only the `exception` field is present with the serialized exception instance.

The format is open for more fields to be added in the future, such as:

- tracing IDs
- error metadata
- logging output

The request gateway can prune this data during production and return very little information, such as this:

```json
{
    "exception": {
        "ClassName": "System.Exception",
        "Message": "Internal Server Error",
    }
}
```


#### Request Context

When the `AppFunc` delegate of the Unisave Framework gets invoked (the method `Task BackendApplication.Invoke(IOwinContext)`), it immediately constructs `RequestContext` instance. This class is the Unisave object representing the request. It contains the request-scoped service container and all OWIN-related interfaces.

To bind it fully with the underlying OWIN *Environment* dictionary, it registers the following keys:

**unisave.RequestContext**<br>
Holds the `RequestContext` instance.

**unisave.RequestServices**<br>
Holds the `IContainer` request-scoped service container.

Most other request-related services (e.g. auth and middleware results) should be available through the request-scoped service container, not the *Environment* dictionary.


### Unisave Request

Apart from plain HTTP requests, Unisave defines special types of requests (e.g. facet calls). These requests are identified by the following HTTP request header:

```
X-Unisave-Request: Facet
```

If this header is missing, the request is treated as a plain HTTP request. If present with any value, the request is treated as a Unisave Request.

There are following request kinds:

- [`Facet`](#facet-request) - An invocation of a public RPC method from the Facet system.
- more can be added (e.g. scheduler, job system)


### Facet Request

#### Path

The HTTP request path has the form:

```
/{facetName}/{methodName}
```

The facet name may be the short or full name of the class and method name is the exact name of the method to call. So given a facet method `MyNamespace.MyFacet.MyMethod()`, these are valid ways how to call it:

```
/MyNamespace.MyFacet/MyMethod
/MyFacet/MyMethod
```

The prefered variant is the full name (the [`FullName`](https://learn.microsoft.com/en-us/dotnet/api/system.type.fullname?view=net-7.0) property of the `Type` class), and the shortened variant is a human-friendly option.


#### Request Headers

**`Content-Type: application/json`**<br>
The request body must be in the JSON format.

**`Cookie:`** `unisave_session_id=K1EzKcOGZnjdksmza8Tz`<br>
Cookies are used to identify the session, so the client should persist them and send them to the server.


#### Request Body

The request body contains the arguments to the invoked facet method:

```json
{
    "arguments": [
        42,
        "hello world!",
        {"x": 42, "y": 43, "z": 45}
    ]
}
```

The number of provided arguments must match the number declared by the method and the values are serialized and de-serialized according to the declared types via the Unisave serializer.

The request body may contain additional values apart from `"arguments"` in the future.


#### Status Code

A successful facet execution will result in a `200` status code.

When an exception occurs (inside facet or during facet serach and/or serialization) the status code is still `200`. This behaviour is consistent with the JSON-RPC protocol.

A `non-200` status code indicates a deeper problem with the delivery of the facet request. This problem might be temporary (such as rate limitting, or server restart), which the client can interpret as having a go-ahead to retry the request at a later time.


#### Response Headers

**`Content-Type: application/json`**<br>
The response body will always be in the JSON format.

**`Set-Cookie:`** `unisave_session_id=K1EzKcOGZnjdksmza8Tz; expires=Tue, 17-Oct-2023 23:45:02 GMT; Max-Age=7200; path=/; httponly`<br>
Cookies are used to identify the session, so the client should persist them and send them to the server. The `Set-Cookie` header may be sent multiple times - once per each cookie.


#### Response Body

A successful method invocation:

```json
{
    "status": "ok",
    "returned": ...,
    "logs": [
        {
            "time": "2023-10-18T00:10:24.134Z",
            "level": "info",
            "message": "Hello!",
            "context": null
        }
    ]
}
```

An exception was thrown:

```json
{
    "status": "exception",
    "exception": {
        "ClassName": "MyException",
        "Message": "Something went wrong!",
        "StackTraceString": "  at Program.Main...",
        ...
    },
    "isKnownException": true,
    "logs": [...]
}
```

The `"status"` attribute can be `"ok"` or `"exception"` and it states, how the facet method finished its execution. The exception may also be thrown by the surrounding framework code before or after the facet is called.

If there was no exception, the returned value is serialized by the unisave serializer according to the declared return type and sent in the `"returned"` attribute.

If there is an exception, it's also serialized and sent in the `"exception"` attribute. There are two kinds of exceptions, those that are expected (say invalid arguments, invalid server state) and those that are unexpected (a bug in the code). Since we don't want bugs to leak information during production, the facet has to define known exception types via C# attributes. Whether the exception is or isn't known (expected) is stored in the `"isKnownException"` field.

The Unisave Framework by default does not strip away data about unknown exceptions since it expects to be running behind a request gateway that does this stripping for us (so that we can record crashes in production). If you want to strip the data within the framework, you need to modify the facet system bootstrapping code.

The response also contains server-side debug logs as a list of log messages. These make the development within Unity Editor easier. These logs are also stripped away by the request gateway for production builds.

A stripped down response for a production client may look like this:

```json
{
    "status": "exception",
    "exception": {
        "ClassName": "System.Exception",
        "Message": "Internal Server Error",
    },
    "isKnownException": false,
    "logs": []
}
```


### Stopping

The Katana project provides a `host.OnAppDisposing` value in the *Properties* dictionary. It's a `CancellationToken` that is fired the moment the app should terminate. The `FrameworkStartup` class hooks into this token and triggers app disposal.

Stopping needs to happen synchronously and immediately. There should be no lengthy cleanup.


## Unisave Worker

> **GitHub:** [unisave-cloud/watchdog](https://github.com/unisave-cloud/watchdog)

A component of the Unisave cloud responsible for hosting the backend applications and providing their oversight.

> **Note:** Formerly known as *Unisave Watchdog* - taken from the [OpenFaaS](https://www.openfaas.com/) terminology.

The complete API of the *Unisave Worker* is documented in its GitHub repository. Start by reading its README file.


## Request Gateway

> **TODO:** facet requests target some URL, they need additional data (editor key, build GUID)

> **TODO:** list possible error responses (too many requests, quota exceeded, etc...)
