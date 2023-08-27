---
title: "Facets"
titleHtml: "Facets"
url: "docs/facets"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: "2020-12-17"
dateUpdated: null
---


Facet is a class, whose public methods can be called remotely from your game client. Each one of these methods usually handles a player request that queries or modifies the database (e.g. player buys an item).


## Creating a facet

Inside your `Backend/Facets` folder right click and choose `Create > Unisave > Facet` and name the facet `HomeFacet`.

```cs
using System;
using System.Collections;
using System.Collections.Generic;
using Unisave;

public class HomeFacet : Facet
{
    /// <summary>
    /// Client can call this facet method and receive a greeting
    /// Replace this with your own server-side code
    /// </summary>
    public string GreetClient()
    {
        return "Hello client! I'm the server!";
    }
}
```

Each public method on this class can be called over the internet.

> **Note:** Protected, private or static methods cannot be called remotely.

> **Warning:** Make sure you don't accidentally create a public helper method here since it could be called remotely and this might pose a security risk to your game. Make all helper methods private or protected instead.


## Calling a facet method

When you want to call a facet method, use the `OnFacet<T>` facade:

```cs
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Unisave;

public class MyScript : MonoBehaviour
{
    void Start()
    {
        OnFacet<HomeFacet>
            .Call<string>(nameof(HomeFacet.GreetClient))
            .Then(FacetMethodHasBeenCalled)
            .Done();
    }

    void FacetMethodHasBeenCalled(string serverGreeting)
    {
        Debug.Log("Server greets you: " + serverGreeting);
    }
}
```

You can notice, that it's not exactly like calling an ordinary method. This is because of the time it takes for the call to complete. It may take hundreds of milliseconds, depending on the internet connection so you cannot wait, because your game would freeze. Instead, you register a callback using the `.Then(...)` method, that will be called once the response is received.

It's usually more convenient to use a lambda expression for the callback:

```cs
OnFacet<HomeFacet>
    .Call<string>(nameof(HomeFacet.GreetClient))
    .Then((greeting) => {
        Debug.Log("Server greets you: " + greeting);
    })
    .Done();
```

> **Note:** The first argument that `Call<T>(...)` accepts is the name of the method to call. By using the `nameof` construct you tell your IDE, that this string is not any arbitrary string, but a method name. When you automatically rename the method, the code inside the `nameof` expression will be updated accordingly.

> **Credit:** Unisave uses promises library by Real Serious Games, that provides an implementation of these `.Then`, `.Catch` and `.Done` methods. Check out their [Github repository](https://github.com/Real-Serious-Games/C-Sharp-Promise).


### Arguments

You can declare the facet method with arguments that can be passed to it via additional arguments of the `.Call<T>(...)` method:

```cs
string trackName = "Monaco";
string motorbikeName = "Yamaha";
int tier = 8;

OnFacet<MatchmakerFacet>
    .Call(
        nameof(MatchmakerFacet.StartWaiting),
        trackName, motorbikeName, tier
    )
    .Done();
```

> **Note:** Arguments have to match the declaration exactly (same count, same type).


### Return value

Since the facet method is called in this unusual way, C# has no way of knowing the return type of the called method. You have to provide it as a type parameter to the `Call<TReturn>(...)` method:

```cs
OnFacet<HomeFacet>
    .Call<PlayerEntity>(nameof(HomeFacet.GetPlayerEntity))
    .Then((playerEntity) => {
        Debug.Log(playerEntity.PlayerName);
    })
    .Done();
```

> **Note:** Use the exact type defined in the method. Polymorphism is not advised, nor tested.

If the method returns `void`, simply omit the return type:

```cs
OnFacet<MatchmakerFacet>
    .Call(nameof(MatchmakerFacet.StartWaiting))
    .Then(() => {
        // notice callback has no arguments
    })
    .Done();
```


### Exceptions

When an exception is raised inside the facet method, it can be caught using the `.Catch` method:

```cs
OnFacet<MatchmakerFacet>
    .Call(nameof(MatchmakerFacet.StartWaiting))
    .Then(() => { ... })
    .Catch((exception) => {
        if (exception is PlayerAlreadyWaitingException)
            Debug.Log("Already waiting.");
    });
```

Note that you have to call either the `.Catch(...)` method, or the `.Done()` method. When neither is present, all exceptions will be silenced and that will make debugging difficult.

> **Note:** `Done()` acts like a `Catch(...)` that reports exceptions to the console.

Also note that a classical `try`, `catch` block won't work, since the entire process is asynchronous.


### `await` calls

The `OnFacet` facade supports the `async`, `await` approach of C#:

```cs
using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using Unisave;

public class MyScript : MonoBehaviour
{
    // notice the *async* keyword
    async void Start()
    {
        // notice Async suffix and the *await* keyword
        string serverGreeting = await OnFacet<HomeFacet>
            .CallAsync<string>(nameof(HomeFacet.GreetClient));

        Debug.Log("Server greets you: " + serverGreeting);
    }
}
```

While this approach is more readable, it comes with its own problems. Make sure you fully understand the consequences of using `async` and `await` inside Unity before using it.

> **Tip:** If you want to understand the differences between callbacks, async-await, and coroutines, watch this video from Unite Copenhagen 2019: [https://www.youtube.com/watch?v=7eKi6NKri6I](https://www.youtube.com/watch?v=7eKi6NKri6I)

This approach, however, has the advantage, that you can use `try` and `catch` the way you are used to:

```cs
try
{
    await OnFacet<MatchmakerFacet>.CallAsync<string>(
        nameof(MatchmakerFacet.StartWaiting)
    );
}
catch (PlayerAlreadyWaitingException)
{
    Debug.Log("Already waiting.");
}
```


## Multiple return values

Sometimes you need to return multiple values from a facet method. For example, when you need to load a garage, you need to have data about the player, data about the motorbikes they own, achievements they unlocked, ...

The cleanest way to do that is to simply define a new class to act as a data container:

```cs
using System;
using System.Collections;
using System.Collections.Generic;
using Unisave;

public class GarageFacet : Facet
{
    public class GarageData
    {
        public PlayerEntity playerEntity;
        public List<MotorbikeEntity> motorbikes;
        public AchievementsEntity achievementsEntity;
    }

    /// <summary>
    /// Player enters the garage so it has to be loaded
    /// </summary>
    public GarageData LoadGarage()
    {
        PlayerEntity player = Auth.GetPlayer<PlayerEntity>();

        return new GarageData {
            playerEntity = player,

            motorbikes = DB.TakeAll<MotorbikeEntity>()
                .Filter(m => m.Owner == player)
                .Get(),

            achievementsEntity = DB.TakeAll<AchievementsEntity>()
                .Filter(a => a.Owner == player)
                .First() ?? AchievementsEntity.Empty
        };
    }
}
```

Then if the new class becomes useful in other places, you can always refactor and extract it into a separate `.cs` file.

If on the other hand you want to be lazy, or you need a quick and simple solution, you can always use the `System.Tuple<T1, T2, T3, ...>` classes.

> **Note:** You can learn more about C# tuples here: [https://docs.microsoft.com/en-us/dotnet/csharp/tuples](https://docs.microsoft.com/en-us/dotnet/csharp/tuples)
