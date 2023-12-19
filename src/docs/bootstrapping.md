---
title: "Bootstrapping"
titleHtml: "Bootstrapping"
url: "docs/bootstrapping"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: "2023-12-19"
dateUpdated: null
---


This documentation page talks about the *bootstrapping system*. It is an extensible set of `Bootstrapper` classes, which initialize the backend application during startup. This includes:

- **Defining backend configuration data**
    - Fixed configuration can be set in C# code and modified by re-compiling
        - e.g. timeout constants, handler functions
    - Dynamic configuration can be read from [environment variables](environments.md) and modified from the web dashboard
        - e.g. database connection credentials, Steam app ID
- **Constructing services**
    - e.g. database connection, logger, HTTP client
- **Registering services into the [service container](service-container.md)**
    - so that they could be used by the application to handle requests
- **Extending existing services in the container**
    - e.g. setting custom global exception handler

Before reading this page, you should know about the [application lifecycle](service-container.md#backend-application-lifecycle) and the [service container](service-container.md).


## The `Main` method analogy

To write a simple backend server console application in C#, you would have a `Main` function where you create the HTTP server, and then a loop that accepts and handles incoming backend requests. It would look something like this:

```csharp
void Main()
{
    PrepareServices();

    while (NotKilled)
        ProcessRequest();
}
```

Or more elaborated, it would look like this:

```csharp
class MyBackendServer
{
    private IArango db;

    static void Main(string[] args)
    {
        // prepare services
        // (database connection, logger, HTTP client, ...)
        db = new ArangoConnection("https://localhost:8529");

        // start processing requests
        HTTPServer.Start();
        while (HTTPServer.IsRunning)
        {
            var request = HTTPServer.AcceptRequest();
            ProcessRequest(request);
        }
    }

    static void ProcessRequest(HTTPRequest request)
    {
        // here your facets run
    }
}
```

This is exactly how the backend server that you create runs in the Unisave cloud. Bootstrappers are a way to modify the `PrepareServices` section of the server. Instead of variables, like the `private IArango db;`, you have the [service container](service-container.md), because you can easily add more services to it.

When you create a new backend class, that inherits from the `Bootstrapper` class, it will be automatically loaded and executed during startup. This is an example bootstrapper that registers the database connection service:

```csharp
using Unisave.Bootstrapping;

class ArangoBootstrapper : Bootstrapper
{
    public override void Main()
    {
        IArango db = new ArangoConnection(
            "https://localhost:8529"
        );

        Services.RegisterInstance<IArango>(db);
    }
}
```

The `Main` method of the bootstrapper is like a little piece of the program's `Main` method, that you get for yourself to work with. All the bootstrappers are loaded, sorted, and executed before the server starts handling any requests:

```csharp
void Main()
{
    new LoggingBootstrapper().Main();
    new ArangoBootstrapper().Main();
    new EntitiesBootstrapper().Main();
    new SessionBootstrapper().Main();
    new AuthBootstrapper().Main();

    while (NotKilled)
        ProcessRequest();
}
```


## Bootstrapper creation and execution

When the application starts, the Unisave Framework first discovers all the bootstrapper classes. It finds those classes that implement the `IBootstrapper` interface, which are not abstract.

> **Note:** In practise, you would inherit from the `Bootstrapper` abstract class instead of the interface, so that you don't have to implement most of the basic boilerplate yourself.

Then all the classes are registered into the [service container](service-container.md) (as singletons), and resolved from it. This constructs them in some semi-deterministic order. By using the service container, you can ask for other bootstrappers as dependencies in your constructor (as long as there is no dependency cycle) and they will be instantiated in the proper dependency order.

Once they are instantiated, they are sorted according to a set of rules (see the [execution order](#execution-order) section), and their `Main` method is executed.

> This is very analogous to the `Awake` and `Start` methods of Unity's `MonoBehaviour` class. When `Awake` runs (the bootstrapper constructor), other bootstrappers may have not even been constructed yet. Then the `Start` method runs (the bootstrapper `Main` method).


## Execution order

The bootstrappers are first split up into stages. The two main stages are the `Framework` stage that runs first, and the `Default` stage, which runs second. This is so that we have clear distinction between framework code and user code. The user code typically runs last and assumes that the framework and all other Unisave modules are already initialized.

To override the stage of the bootstrapper, you can override its public property:

```csharp
using Unisave.Bootstrapping;

class NotificationSystemBootstrapper : Bootstrapper
{
    // run in between the framework and the user
    public override int Stage => BootstrappingStage.Modules;

    public override void Main()
    {
        // ...
    }
}
```

> The definition of all stages can be found here: https://github.com/unisave-cloud/framework/blob/master/UnisaveFramework/Bootstrapping/BootstrappingStage.cs

For bootstrappers within one stage, you can define constraints, such as `RunBefore` or `RunAfter` some other bootstrapper. For example, you can define your `NotificationSystemBootstrapper` to run after `DiscordClientBootstrapper`, since the notification system initialization code needs to use configuration from the discord client bootstrapper.

In the code, you'd define the constraint like this:

```csharp
using Unisave.Bootstrapping;

class NotificationSystemBootstrapper : Bootstrapper
{
    public override Type[] RunAfter => new Type[] {
        // we must run after the discord bootstrapper
        typeof(DiscordClientBootstrapper)
    };

    public override Type[] RunBefore => new Type[] {
        // can be omitted if empty
    };

    public override void Main()
    {
        // ...
    }
}
```

Notice that in practise and in most cases, you won't need to define the stage or the order constraints, because the bootstrapper rarely creates service instances. It ususally just registers them into the service container, and the services are created only when they are first needed, long after all the bootstrappers have executed. And the service container will make sure they are constructed in the proper order of their dependencies. So the example with the `DiscordClient` and the `NotificationSystem` is a little bit artificial. In practise, both bootstrappers would just register their respective services (in any order) and when the `NotificationService` would be resolved, it would in turn create the `DiscordClient` service just in time.


## Bootstrapper as a configuration object

Since bootstrappers are registered into the [service container](service-container.md), you can use them to store configuration data, and resolve them when you need to access that data. For example, if you create a simple webhook discord client, you may want to configure the bot name, the webhook URL and other small details. You could store these values as public fields or properties of the bootstrapper class:

```csharp
using Unisave.Bootstrapping;

class MyDiscordClientBootstrapper : Bootstrapper
{
    public string webhookUrl;
    public string botName;

    // static configuration can be set at compile-time
    public double webhookTimeoutSeconds = 5.0;

    public override void Main()
    {
        EnvStore env = Services.Resolve<EnvStore>();

        // read dynamic configuration from environment variables
        webhookUrl = env.GetString("DISCORD_BOT_WEBHOOK_URL");
        botName = env.GetString("DISCORD_BOT_NAME", "Clyde");

        Services.RegisterSingleton<DiscordClient>(
            container => new DiscordClient(
                webhookUrl, botName
            )
        );
    }
}
```

Then later, when you need to access this information from somewhere (say a facet), you can just ask for the bootstrapper and it will behave like a configuration object with all the values readable:

```csharp
using Unisave.Facets;

class MyFacet : Facet
{
    private MyDiscordClientBootstrapper bootstrapper;

    public MyFacet(MyDiscordClientBootstrapper bootstrapper)
    {
        this.bootstrapper = bootstrapper;
    }

    public string WhosTalking()
    {
        return $"It's {bootstrapper.botName}!";
    }
}
```


## Configuration as a separate class

When your configuration grows larger, it will make more sense to extract the configuration into a separate class and a separate object:

```csharp
using System;

class DiscordClientConfig
{
    public string webhookUrl;
    public string botName;
    public double webhookTimeoutSeconds = 5.0;
    public Func<string, string> messageTransformer;
}
```

You can create an instance of the config inside the bootstrapper:

```csharp
using Unisave.Bootstrapping;

class MyDiscordClientBootstrapper : Bootstrapper
{
    public override void Main()
    {
        EnvStore env = Services.Resolve<EnvStore>();

        var config = new DiscordClientConfig();
        config.webhookUrl = env.GetString("DISCORD_BOT_WEBHOOK_URL");
        config.botName = env.GetString("DISCORD_BOT_NAME", "Clyde");
        
        config.messageTransformer = BooYaMessage;

        // register the config so that it can be injected
        // into any class by the container
        Services.RegisterInstance(config);

        // the DiscordClient can request the config in its constructor,
        // so the container will resolve the client automatically
        Services.RegisterSingleton<DiscordClient>();
    }

    private string BooYaMessage(string msg)
    {
        return msg + " Boo ya!";
    }
}
```

You can now ask for the config object just like you asked for the bootstrapper before:

```csharp
using Unisave.Facets;

class MyFacet : Facet
{
    private DiscordClientConfig config;

    public MyFacet(DiscordClientConfig config)
    {
        this.config = config;
    }

    public string WhosTalking()
    {
        return $"It's {config.botName}!";
    }
}
```


## Abstract bootstrapper for a module

When writing a [Unisave module](modules.md) (an extension asset for Unisave), you should create a bootstrapper as a place that configures and sets up your module. Let's say we want to convert our `DiscordClient` system into a module, so that we can sell it on the Unity asset store. We will make our bootstrapper `abstract` and we will make our users override our bootstrapper, so that they provide their own configuration values.

We can keep the `webhookUrl` and `botName` as they are, since they are configurable from the environment variables, but the `messageTransformer` can be made into an abstract method that our users need to implement:

```csharp
using Unisave.Bootstrapping;

abstract class DiscordClientBootstrapperBase : Bootstrapper
{
    public override void Main()
    {
        EnvStore env = Services.Resolve<EnvStore>();

        var config = new DiscordClientConfig();
        config.webhookUrl = env.GetString("DISCORD_BOT_WEBHOOK_URL");
        config.botName = env.GetString("DISCORD_BOT_NAME", "Clyde");
        
        config.messageTransformer = TransformMessage;

        Services.RegisterInstance(config);
        Services.RegisterSingleton<DiscordClient>();
    }

    protected abstract string TransformMessage(string msg);
}
```

Our users then need to define this bootstrapper, to set up our module:

```csharp
using Unisave.Bootstrapping;

abstract class DiscordClientBootstrapper : DiscordClientBootstrapperBase
{
    protected override string TransformMessage(string msg)
    {
        return msg.ToUpper() + "!!!";
    }
}
```


## Asynchronous bootstrapper

If the boostrapper needs to be asynchronous (say you need to do an HTTP, or a database request), you can inherit from `AsyncBootstrapper` and the `Main` method becomes asynchronous:

```csharp
using Unisave.Bootstrapping;

class MyBootstrapper : AsyncBootstrapper
{
    public override async Task MainAsync()
    {
        await DoStuffAsync();
    }
}
```

Remember, that the asynchronous operation blocks the startup of the entire application, which makes worker cold-starts slower and may cause issues if the delay is too great.
