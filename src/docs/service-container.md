---
title: "Service Container"
titleHtml: "Service Container"
url: "docs/service-container"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: "2023-12-19"
dateUpdated: null
---

A service container is a container for services (e.g. database connection, logger, HTTP client). It is a glorified dictionary `Dictionary<Type, object>`, that contains instances of services. These services are registered into the container during application starup via [bootstrappers](bootstrapping.md) and can later be accessed and utilized when processing backend requests (such as facet calls).

Your game backend uses the Unisave Framework to perform actions (talk to the database, handle facet calls). At the heart of the Unisave Framework is one big sevice container that holds all of the services you use. The `Auth`, `DB`, `Log`, and other facades are just static class wrappers, that resolve that given service from the container on demand, and let you perform actions with it. Having the container lets you easily extend it with your own services (say a `Discord` client) or even replace or re-configure the existing ones.


## Backend application lifecycle

When you write your backend application in Unisave, you create a set of classes (facets, entities, and custom classes) that will be compiled together with the Unisave Framework into one executable - one program. Unisave cloud than takes this program and launches it on some machine when a request comes that needs to be handled. That program runs for some time and when there is no more traffic, it gets stopped and destroyed. So the lifecycle of your backend code is roughly the following:

1. The server program starts.
    - It receives configuration in the form of [environment variables](environments.md).
2. The service container is created.
3. The [bootstrapping system](bootstrapping.md) runs, which registers services into the container according to the environment variables.
4. The program handles requests (e.g. facet calls).
    - This lasts for most of the program's lifetime, hundreds of thousands of requests may be handled in production. It can live for tens of hours.
5. The program stops, the service container is disposed together with all of the services.

For the service container, the steps 3\. and 4\. are important. In 3\., we register services and in 4\. we use them (resolve them from the container).


## Service registration

You are most likely to register services inside your own `Bootstrapper` classes, where the container is available via the `this.Services` variable:

```csharp
using Unisave.Bootstrapping;
using Unisave.Foundation;

class MyDiscordClientBootstrapper : Bootstrapper
{
    public override void Main()
    {
        DiscordClient discord = new DiscordClient(...);

        Services.RegisterInstance(discord);
    }
}
```

This code creates a new `DiscordClient` instance and stores it in the container. While this approach works, it creates the client even if we never use it. A better approach is to register a lambda expression that will be called when it actually becomes needed, and then the container reuses the one instance each time someone needs it again:

```csharp
Services.RegisterSingleton((IContainer container) => {
    return new DiscordClient(...);
});
```

If we want to create a fresh instance of the `DiscordClient` each time someone needs it, we can use `RegisterTransient`:

```csharp
Services.RegisterTransient((IContainer container) => {
    return new DiscordClient(...);
});
```


## Service resolution

Resolving from the container directly is easy. You just ask it to give you the type you want:

```csharp
DiscordClient discord = Services.Resolve<DiscordClient>();
```

The service container will obtain the instance based on how it was registered:
- For instances, it will return the registered instance.
- For singletons, it will construct the instance only once, during the first resolution. Then it will reuse the one instance.
- For transients, it will construct a new instance each time you call `Resolve`.

You can also test if a service of given type can be resolved:

```csharp
bool can = Services.CanResolve<DiscordClient>();
```

Or carefully try to resolve it:

```csharp
if (Services.TryResolve<DiscordClient>(out DiscordClient discord))
{
    discord.SendMessage(...);
}
else
{
    // could not be resolved
}
```


## Transitive resolution

The service container has two nice features:

1. It can resolve services that are not registered, by assuming they are in the transient mode.
2. It can automatically call a constructor, for which it can resolve all the arguments. So you can resolve non-registered services that depend on other (possibly registered) services.

So if we create a `DiscordExceptionLogger` like this:

```csharp
class DiscordExceptionLogger
{
    private DiscordClient discord;

    public DiscordExceptionLogger(DiscordClient discord)
    {
        this.discord = discord;
    }

    public void LogException(Exception e)
    {
        discord.SendMessage("Exception: " + e.ToString());
    }
}
```

We can directly resolve it from the container (with no prior registration), and the container will call the constructor with the previously registered `DiscordClient`:

```csharp
var logger = Services.Resolve<DiscordExceptionLogger>();
```

If we later choose to change how the logger is created (singleton or transitive), or what arguments it gets, we can always register it manually ourselves.


## Dependency injection

The [transitive resolution](#transitive-resolution) feature is used by the Unisave Framework to create instances of your classes (e.g. facets, bootstrappers). This means that in order to use your new `DiscordClient` in a [facet](facets.md), you simply ask for it in the constructor:

```csharp
using Unisave.Facets;

class FacetThatUsesDiscord : Facet
{
    private DiscordClient discord;

    public FacetThatUsesDiscord(DiscordClient discord)
    {
        this.discord = discord;
    }

    public void PerformSomeLogic(string foo)
    {
        discord.SendMessage(
            "Some logic has been performed: " + foo
        );
    }
}
```

This software design pattern, where we don't create the `DiscordClient` ourselves in the facet, but instead we just ask for it in the constructor is called **dependency injection**. The thing that we depend on (the `DiscordClient`, the dependency), got injected to us by the one who created us (the Unisave Framework via the service container).

> **Note:** This process of creating dependencies first and then injecting them into the thing you're creating is called *inversion of control* or IoC, and the service container is therefore also called the IoC container, since it facilitates this behaviour.


## Registering without lambda factory

So far, we only registerd services by providing a lambda expression that constructed the service like this:

```csharp
Services.RegisterSingleton((IContainer container) => {
    return new DiscordClient(...);
});
```

Because the container can also call constructors automatically, and resolve its dependencies, we can register some services without providing the lambda expression:

```csharp
/*
 * The logger only needs DiscordClient and the container knows
 * how to get that. So we don't need to specify how to construct
 * the logger. The container will figure it out.
 */
Services.RegisterSingleton<DiscordExceptionLogger>();
```


## Interface registration

Interfaces are a great way, how to separate the "what a service does" from "how it does it". Let's say we have a database connection `ArangoConnection` that talks to the ArangoDB database. But for testing, we would like to have a `ArangoInMemory`, which looks the same to the user, but stores all the data in memory, does not communicate with anything, and can be quickly created and thrown away.

We may define an interface `IArango` which is what the user will be using and make both classes implement it. Then when we create the database service, we can either create the real, proper connection, or the fake, lightweight, in-memory database.

These are the classes and the interface that we have:

```csharp
interface IArango
{
    JsonArray Execute(string aql);
}

class ArangoConnection : IArango { ... }

class ArangoInMemory : IArango { ... }
```

We can hardcode the service registration, to use the actual connection:

```csharp
Services.RegisterSingleton<IArango>((IContainer container) => {
    return new ArangoConnection(
        url: "http://localhost:8529",
        user: "root",
        password: "s3cr3t"
    );
});
```

When we want to test, we can overwrite the registration with our in-memory service:

```csharp
// There are no special arguments to the constructor,
// so the container can figure out how to construct it.
Services.RegisterSingleton<IArango, ArangoInMemory>();
```


## Per-request container

Some services, such as the database connection, exist for the entire lifetime of the application. These are registered and used in the way described above. But some services exist only in the context of a single backend request. For example the authentication manager that stores the currently logged-in player (the `Auth` facade). It needs to be created when a new request arrives, it extracts the session ID from the request and looks up the logged-in player for that session. If there are two requests from two different players being processed simultaneously, there need to be two separate authentication managers existing in the application.

For this reason the Unisave Framework creates a per-request child service container, which holds these per-request services. When you use [dependency injection](#dependency-injection) in your facet classes, you in fact use this child container. This means that you have access to the authentication manager, the current session data, and other request-related services. The per-request container is configured to fall back onto the main service container, whenever it can't itself resolve a service (such as the database connection). **This means that per-request services can depend on global services, but not the other way around. It also means you can't use per-request services in [bootstrappers](bootstrapping.md), as these run outside of the scope of any request.**

To register a per-request service, like the authentication manager, you can use the `RegisterPerRequestSingleton` method of the global container inside a bootstraper:

```csharp
class AuthBootstrapper : Bootstrapper
{
    public override void Main()
    {
        Services.RegisterPerRequestSingleton<AuthenticationManager>(
            (IContainer container) => new AuthenticationManager(
                container.Resolve<ISession>(),
                container.Resolve<IArango>()
            )
        );
    }
}
```

Notice that the `container` argument to the lambda expression is the **per-request container**, not the global one. So you can use it to resolve per-request services, such as the `ISession` service, as well as any global service, such as the `IArango` database connection.

```csharp
Services.RegisterSingleton<MyService>(container => {
    // TRUE ... the same, global service container
    Services == container;
});

Services.RegisterPerRequestSingleton<MyService>(container => {
    // FALSE ... a request-specific child container
    // (notice that this lambda expression may be called
    // once for each request processed)
    Services == container;
});
```
