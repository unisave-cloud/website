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

When you want to call a facet method, use the `CallFacet` extension method:

```cs
using System;
using UnityEngine;
using Unisave;
using Unisave.Facets; // necessary for the extension to load

public class MyScript : MonoBehaviour
{
    void Start()
    {
        this.CallFacet(
            (HomeFacet f) => f.GreetClient()
        ).Then(FacetMethodHasBeenCalled);
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
this.CallFacet(
    (HomeFacet f) => f.GreetClient()
).Then((greeting) => {
    Debug.Log("Server greets you: " + greeting);
});
```


### Arguments

You can declare the facet method with arguments that can be passed to it via additional arguments, just like when calling an ordinary method:

```cs
string trackName = "Monaco";
string motorbikeName = "Yamaha";
int tier = 8;

this.CallFacet(
    (MatchmakerFacet f) => f.StartWaiting(
        trackName, motorbikeName, tier
    )
);
```


### Return value

If your facet method returns a value, it will be passed as the only argument to the `.Then` callback.

```cs
this.CallFacet(
    (HomeFacet f) => f.GetPlayerEntity()
).Then((playerEntity) => {
    Debug.Log(playerEntity.PlayerName);
});
```

If it returns `void`, the callback should not accept any arguments:

```cs
this.CallFacet(
    (MatchmakerFacet f) => f.StartWaiting(...)
).Then(() => {
    // notice callback has no arguments
});
```


### Exceptions

When an exception is raised inside the facet method, it can be caught using the `.Catch` callback:

```cs
this.CallFacet(
    (MatchmakerFacet f) => f.StartWaiting(...)
)
    .Then(() => { ... })
    .Catch((exception) => {
        if (exception is PlayerAlreadyWaitingException)
            Debug.Log("Already waiting.");
    });
```

Note that a classical `try`, `catch` block won't work, since the exception is not `throw`n as usual.


### `await` calls

While the `.Then` callback approach is fine for simple calls, when you want to call multiple facets in a sequence or in a loop, you can use the `async`, `await` syntax of C#:

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
        // notice the *await* keyword
        string serverGreeting = await this.CallFacet(
            (HomeFacet f) => f.GreetClient()
        );

        Debug.Log("Server greets you: " + serverGreeting);
    }
}
```

This approach is more readable and more C# friendly. I recommend using it over the `.Then` callbacks, however, make sure you fully understand the consequences of using `async` and `await` inside Unity first.

> **Tip:** If you want to understand the differences between callbacks, async-await, and coroutines, watch this video from Unite Copenhagen 2019: [https://www.youtube.com/watch?v=7eKi6NKri6I](https://www.youtube.com/watch?v=7eKi6NKri6I)

This approach also has the advantage, that you can use `try` and `catch` the way you are used to:

```cs
try
{
    await this.CallFacet(
        (MatchmakerFacet f) => f.StartWaiting(...)
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


## Avoid complex argument expressions

While it might seem like we get an instance of a facet on which we call a method `f.MyMethod()`, it isn't actually what is happening:

```cs
this.CallFacet(
    (MyFacet f) => f.MyMethod() // this line actually NEVER RUNS!
);
```

The line `(MyFacet f) => f.MyMethod()` is only compiled as an [expression tree](https://learn.microsoft.com/en-us/dotnet/csharp/advanced-topics/expression-trees/) and then dynamically analyzed during runtime to extract the name of the facet method and values for all arguments.

So while it can handle variable lookups, basic arithmetic operators, and function calls, I'd suggest keeping the arguments to this simple level. Compute any complex expressions before you call the facet and store them in a variable before passing them in.

```cs
// ✅ DO
this.CallFacet(
    (MyFacet f) => f.MyMethod(
        12, myVar, foo + "asd",
        Bar(), Baz(13, "14")
    )
);

// ❌ DON'T
this.CallFacet(
    (MyFacet f) => f.MyMethod(
        (from num in numbers
        where num % 2 == 0
        select num),
        await FooBar() ?? "none",
        3 << 5 as sbyte
    )
);

// ✅ DO INSTEAD
var a = (from num in numbers
        where num % 2 == 0
        select num);
var b = await FooBar() ?? "none";
var c = 3 << 5 as sbyte;
this.CallFacet(
    (MyFacet f) => f.MyMethod(a, b, c)
);
```


## Calling facets outside of MonoBehaviours

Calling facets via the `this.CallFacet` is useful, because the facet request also knows which `MonoBehaviour` is making the request. This is helpful in cases where the request outlives the behvaiour i.e. the behaviour is `Destroy(gameObject)`-ed before the facet request finishes. In this case, Unisave discards the result of the facet call and does not call any callbacks (`.Then` and `.Catch` are never called, `await` never returns). Unity coroutines behave in the same way - they no longer run if the game object was destroyed.

If you want to call a facet from outside a `MonoBehaviour` or you want to break this behaviour association that the request has, you can call the API method directly through the [`FacetClient`](https://github.com/unisave-cloud/asset/blob/master/Assets/Plugins/Unisave/Scripts/Facets/FacetClient.cs) static class:

```cs
using Unisave.Facets;

public static async void MyGlobalFunction()
{
    var result = await FacetClient.CallFacet(
        (MyFacet f) => f.MyMethod()
    );
}
```
