---
title: "Async-Await for Dummies"
titleHtml: "<em>Async-Await</em> for <em>Dummies</em>"
url: "guides/async-await-for-dummies"
image: NO_IMAGE
tags: ["getting-started", "http"]
author: "Jiří Mayer"
datePublished: "2025-03-20"
dateUpdated: null
---


You never had to use the `async` and `await` keywords when working in Unity and now you see them in the Unisave documentation and don't know how to use them? Good, read this guide!

I'm not going to waste time explaining how they work - I will first show how to use them (it's fairly intuitive actually) and then I'll talk about the *why* and *how*. But as a TL;DR: they increase throughput and decrease latency in your backend server and they allow non-blocking waiting for requests in your client.


## Asynchronous facet methods

This is a simple facet method that changes the nickname for the currently logged-in player:

```csharp
public PlayerEntity UpdateNickname(string newNickname)
{
	var player = Auth.GetPlayer<PlayerEntity>();
	
	player.Nickname = newNickname;
	player.Save();
	
	return player;
}
```

Inside the `GetPlayer` and `Save` methods, there is a request to the database. And when this request leaves the backend server, your backend server just waits doing nothing. Asynchronous code lets your backend server work on other tasks (other requests) while *this place* waits for the database to respond. This is how to rewrite the facet method to be asynchronous:

```csharp
using System.Threading.Tasks;

public async Task<PlayerEntity> UpdateNickname(string newNickname)
//     ^^^^^ ^^^^^            ^
{
	var player = await Auth.GetPlayerAsync<PlayerEntity>();
	//           ^^^^^               ^^^^^
	
	player.Nickname = newNickname;
	await player.SaveAsync();
	//^^^            ^^^^^
	
	return player;
}
```

First, we changed the method signature:

1. We added the `async` keyword. This allows us to use the `await` keyword inside the method body. Without it, we would have to construct `Task` instances manually, and that's tedious and hard to read. It *'switches on'* the async-await syntactic sugar inside the method body.
2. We wrap the return type in the `Task<...>` type. This changes the meaning of the returned value from *'just a `PlayerEntity`'* to *'will become a `PlayerEntity` eventually'*. Eventually means *'after someone calls `await` on the `Task`'*.

These two changes to the method signature is what you will use in 90% of cases so you can think of it as the default thing to do.

Then inside the function, we call the asynchronous variants of methods wherever possible and `await` their returned `Task`s. This is the change:

```csharp
// synchronous method that sleeps when waiting
// for external operations
var result = DoSomething();

// asynchronous method that lets the backend do other
// things when waiting for external operations
var result = await DoSomethingAsync();
```

We don't *have to* call the asynchronous variants, but wherever we do, we let the backend server work on other tasks, while waiting for our operation to finish. Therefore we *want* to call them wherever we can.

Calling an asynchronous method is no magic - it works like a regular method that returns a `Task<...>` and then we `await` the task to get the returned value:

```csharp
// start the asynchronous method
Task<PlayerEntity> playerTask = Auth.GetPlayerAsync<PlayerEntity>();

// wait for the result
PlayerEntity player = await playerTask;
```

The `await` operator is where magic is hidden - this is where the *'work on other things while waiting'* part is hidden.


## Await even `void` return values

The synchronous `Save()` method on an entity has no return value, but the asynchronous method `SaveAsync()` still returns a `Task`. This is because we need to `await` *something* in order to wait for the asynchronous operation to complete:

```csharp
// synchronous variant
player.Save();

// asynchronous variant
await player.SaveAsync();

// what really happens inside the asynchronous variant
Task saveTask = player.SaveAsync();
await saveTask;
```

You can see that the returned `Task` does not wrap any returned value (nothing like `Task<void>`). This is because there is no return value.

> ⚠️ **Always call `await` on tasks!**
> You should NEVER forget `await` on tasks, even ones that you don't need to wait for. This is mainly because the `await` operator also re-throws exceptions that have been emitted inside the asynchronous method and if you never `await` its task, you will never know there was an exception! It will just get silenced and you will never know there is a bug.


## Custom asynchronous methods

As your code gets more complicated, you may want to create custom methods. If you want to call asynchronous methods inside of them, you need to make them asynchronous as well. 

Let's say we would like to put a `SaveNickname` method onto the `PlayerEntity` class. This is what the synchronous variant would look like:

```csharp
public class PlayerEntity
{
	/* ... */

	public void SaveNickname(string newNickname)
	{
		this.Nickname = newNickname;
		this.Save();
	}
}
```

This is how we would change it to be asynchronous:
```csharp
public class PlayerEntity
{
	/* ... */

	public async Task SaveNicknameAsync(string newNickname)
	//     ^^^^^ ^^^^             ^^^^^
	{
		this.Nickname = newNickname;
		await this.SaveAsync();
		//^^^          ^^^^^
	}
}
```

This is how it would be used from inside the facet method:

```csharp
public async Task<PlayerEntity> UpdateNickname(string newNickname)
{
	var player = await Auth.GetPlayerAsync<PlayerEntity>();
	
	await player.SaveNickname(newNickname);
	
	return player;
}
```

> **Note:** So far, whenever we had an asynchronous method, its name ended with the `...Async` suffix. This approach is used in Unisave Framework, because it provides most methods in both a synchronous and an asynchronous variant. However, if all of your backend code is asynchronous, it makes little sense to put `...Async` at the end of every single method. It makes the code unnecessarily bloated. In that case, I would advise against it.
>
> Some people add the `Async` suffix so that they don't forget to use the `await` operator when calling asynchronous methods. However modern IDEs (Visual Studio or Rider) usually display a warning if you forget to `await` a task. So unless you write your code in MS Notepad, I would ignore this concern.


## Async in Unity

Async-await is great for writing code that interacts with long-running operations. So far we talked about database requests being such operations, however a facet call is also such an operation.

This is exactly the reason we cannot call facets like usual methods - a facet call takes around a second, and it would just freeze the game for that time:

```csharp
// this would freeze the game for a second or so
MyPlayerFacet.UpdateNickname("Johnny");
```

Also, it's not a *real* method call, it is really a network request that calls a method on the server. So it uses a different syntax:

```csharp
this.CallFacet(
	(MyPlayerFacet f) => f.UpdateNickname("Johnny")
);
```

So when you call `this.CallFacet`, it just sends the request and immediately moves on to the next line of code without waiting for the response. If you want to do something *after* the response arrives, you can register a callback - a function that Unisave will call later:

```csharp
this.CallFacet(
	(MyPlayerFacet f) => f.UpdateNickname("Johnny")
).Then(() => {
	// here do things after the call finishes
});
```

However, when you want to chain a number of facet calls together, the callback-oriented code becomes very messy very fast. So instead, Unisave supports the `await` operator, that can fill out the space in between the `CallFacet` method and the `Then` method:

```csharp
await this.CallFacet( // see the *await* keyword here!
	(MyPlayerFacet f) => f.UpdateNickname("Johnny")
);
// here do things after the call finishes
```

But `await` can only be used inside an `async` method. So this is the full context:

```csharp
public class MyScript : MonoBehaviour
{
    async void Start()
    {
        await this.CallFacet( // see the *await* keyword here!
			(MyPlayerFacet f) => f.UpdateNickname("Johnny")
		);
    }
}
```

Notice that the the `Start` method does not return a `Task` but a `void`, despite being `async`. This is because Unity event hooks are special.


## Async-void methods

In the previous sections I've said that to make a `void` method asynchronous, you make it return a `Task`. I've also said that you must `await` every async method to make sure you don't accidentally silence exceptions. There are two exceptions to that, and those are:

- Unity *event hook* methods (`Update`, `Start`, `Awake`, ...)
- Unity/C# event handlers (`myButton.onClick.AddListener( {here} )`)

This is due to compatibility reasons. These methods have never been historically asynchronous and the code that calls them cannot `await` them. Therefore they cannot return a `Task`. But also in many cases, it doesn't make sense awaiting them (a UI button does not need to wait for all of its handlers to finish).

> **Note:** This has changed for Unity event hooks since the 2023 release - Unity has introduced the [`Awaitable`](https://docs.unity3d.com/6000.0/Documentation/Manual/async-await-support.html) class (to be used instead of `Task` inside Unity code) and it can be returned from event hooks. But you still have async-void for button click handlers.

Therefore just remember this edge case:

```csharp
public class MyScript : MonoBehaviour
{
	// ✅ DO
    async void Start() { }

	// ✅ DO (since Unity 2023)
	// Awaitable = Unity's fancy "Task" class
	async Awaitable Start() { }

	// ❌ DON'T
	async Task Start() { }
}
```

Similarly with event handlers:

```csharp
public class MyScript : MonoBehaviour
{
    void Start()
    {
	    // ✅ DO
	    myButton.onClick.AddListener(OnMyButtonClick);
    }
	
	// ✅ DO
	async void OnMyButtonClick() { }
}
```

You can also define your own async-void methods in Unity scripts if you want them to be fire-and-forget kind of methods:

```csharp
public class MyScript : MonoBehaviour
{
    void Start()
    {
	    // ✅ DO
	    // notice no *await* here because no Task is returned
	    ReloadLeaderboard();
    }
	
	// ✅ DO
	// in Unity you can use async-void methods
	// for fire & forget actions
	async void ReloadLeaderboard() { }
}
```

But the moment you need to wait for the result of such a method, you should make it return a `Task` and `await` it from the caller.

If an exception is thrown inside an async-void method, it does not propagate to the caller. Instead, it's given to the runtime (the Unity Engine) to handle it somehow. Unity then just logs it to the console. Therefore you also cannot `catch` exceptions from an async-void method - if you need to, you have to make it return a `Task` and `await` it.

Async-void methods should only exist in your Unity client code. There is no reason for them to exist inside the Unisave backend code. This is because you can use the regular async-task methods all the way up to the facet method. Moreover, you should NOT use them in the backend code, because Unisave does not handle uncaught exceptions in async-void methods and such an exception would cause the whole backend worker process to crash (uncaught exception).

```csharp
public class MyFacet : Facet
{
	// ❌ DON'T
	// in Unisave backend code, async-void methods
	// should not be used - they may crash the process
	async void MyAsyncVoidMethod() { }
	
	// ✅ DO INSTEAD
	async Task MyAsyncTaskMethod() { }
}
```


## Why use it

There are two main reasons why to use async-await in your unisave-related code:

- performance on the server-side
- readability on the client-side

The performance on the server side is gained by getting rid of so-called *blocking waits*. This is a situation where the CPU thread waits for some task to finish (say, a database request) and has nothing else to work on. It just sleeps. This is wasted compute time - the thread could be processing other requests in the mean time. Asynchronous code allows for this because inside every `await` call that cannot be executed immediately, there's a little *"what other `Task` could I be working on in the meantime?"* moment.

The second benefit is the readability of more complex client-side code. Imagine doing this with callbacks:

```csharp
await JoinMatchmaker();

while (! await AreWeMatchedNow())
{
	// sleep 5 seconds
	await Task.Delay(5_000);
}

await JoinMatch();
```


## Must have for HTTP requests

Asynchronous code is a must-have if you make HTTP requests from your backend code. Unisave backend server uses a single thread to process requests (Unity does the same and it's so that you don't need to worry about locks and other multi-threading headaches). This means that if you make a blocking synchronous HTTP call (e.g. `Http.Get(...)`), the server gets blocked for up to a couple of seconds with all other requests waiting in a queue. If instead you make the call asynchronous (e.g. `Http.GetAsync(...)`), the backend thread can go work on other requests in the meantime.

```csharp
// ✅ DO
var response = await Http.GetAsync("http://test.com");

// ❌ DON'T
var response = Http.Get("http://test.com");
```


## Things to avoid

If you call a method that returns a `Task`, you should:

- always `await` the `Task`
- never wait for the `Task` in a blocking manner

You should `await` the `Task` to make sure you know about any exceptions that were thrown while the task ran. Forgetting to call `await` might silence them. But also, if the logic that follows your call expects the async method to have finished, without `await` it may not be the case.

```csharp
Task myTask = DoStuffAsync();

// always await a Task at some point,
// never just throw it away
await myTask;
```

The TLP library that defines the `Task` class also provides some advanced methods for waiting in a blocking synchronous manner. You can use those if you know what you are doing, but using them naively will likely cause a deadlock in both Unity and the Unisave backend (because of the single-threaded environment). So prefer not to do that:

```csharp
Task myTask = DoStuffAsync();

// ❌ DON'T
// (please just don't... message me on Discord if you think you need it)
myTask.Result;
myTask.Wait();
myTask.GetAwaiter().GetResult();
```


## Misconceptions

**Is async code multithreaded?**<br/>
Asynchronicity and multi-threading are two separate, orthogonal concepts. Multi-threading means there *may* be multiple physical processors executing two places in your code at the same time. Asynchronous means a framework for structuring the code in such a way that the processor (either one, or many) can have multiple tasks being in-progress at the same time and can switch between them in well-defined places (inside the `await` operator). Multi-threading is what you want when you do CPU-intensive work, asynchronicity is what you want when you wait for a lot of external things (e.g. database requests).

**Do I need to use locks and other synchronization primitives?**<br/>
No. Only multi-threaded code needs that (code where you can have two processors executing your code at the same time). The asynchronous code in both Unisave and Unity is single-threaded.

**Isn't async code slower?**<br/>
Yes, but it doesn't matter. In the backend code, the performance increase by getting rid of blocking waits outweighs the slowdown introduced by `Task`s and `await` many times over. In the client code, async-await should only be used in the high-level code that invokes at most a few `await` operators per second. Unless you call `await` inside the `Update` method, you don't need to worry. `Task` instances have slight overhead in terms of memory allocation and garbage collection, so Unity introduced the `Awaitable` class as its replacement since Unity 2023. But it's intended to be capable of replacing coroutines, which are `Update`-like performance heavy. For a facet call here and there it doesn't make a difference.

**Can I use async await with exceptions and try-catch?**<br/>
Yes indeed! That's one of the advantages over callbacks and coroutines. Note that exceptions are re-thrown from inside the `await` operator, not from where you first invoke the asynchronous method.


## More resources

- Similar overview from a purely C# perspective:<br/>https://medium.com/@robertdennyson/demystifying-async-await-in-c-net-8-optimizing-performance-and-responsiveness-b04f5e32d0d2
- Unity manual on async-await and `Awaitable`:<br/>https://docs.unity3d.com/6000.0/Documentation/Manual/async-await-support.html
- Very technical Microsoft overview of how tasks work:<br/>https://devblogs.microsoft.com/dotnet/how-async-await-really-works/
