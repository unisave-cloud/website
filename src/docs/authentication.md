---
title: "Authentication"
titleHtml: "Authentication"
url: "docs/authentication"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: "2020-09-01"
dateUpdated: null
---


This documentation page is all about player registration and authentication. What templates will get you started quickly, how to protect certain facet methods from unauthorized players, and how to implement custom authentication.


## Player entity

Players of your game are represented by an entity called `PlayerEntity`. Unisave provides template for this entity to get you started quickly. Go to your `Backend` folder, right-click, and select `Create > Unisave > PlayerEntity`. A file very simmilar to the following will be created:

```cs
public class PlayerEntity : Entity
{
    // Add authentication via email:
    // https://unisave.cloud/docs/email-authentication
    //
    //      public string email;
    //      public string password;
    //      public DateTime lastLoginAt = DateTime.UtcNow;
    //

    // Add custom fields to the entity:
    //
    //      public string nickname;
    //      public int coins = 1_000;
    //      public DateTime premiumUntil = DateTime.UtcNow;
    //      public DateTime bannedUntil = DateTime.UtcNow;
    //
}
```

You will add new fields to this entity as you will need. If you have anonymous players, you would add some identification token. If you register and login via email, you add `email` and `password` fields. If you login via Steam, you add `steamId` field, etc...

Apart from authentication fields, you may add any aditional fields important to your game. This might be some player preferences (nickname, favourite color, racing number) or resources (coins, gold, experience) or timestamps (premium account until, banned until, last login at), etc...


## Authentication templates

Depending on the type of your game, you can use authentication templates to quickly set up player registration and login:

**[Email authentication](email-authentication)**<br>
This method is typical for web-browser-based games and some desktop games. You register via email, provide a password and use them to login later.

**[Steam authentication](steam-authentication)**<br>
If you distribute your game via Steam, this authentication method is a no-brainer. Use it together with *Email authentication* by showing a `[Login via Steam]` button on the login form, or use it transparently in the background during game startup.

If none of these templates suit your needs, you can always implement [custom authentication method](#custom-authentication).

With an authentication template installed, you can start treating authenticated players differently:


## Authenticated player

You can ask for the currently authenticated player using the `Auth.GetPlayer<PlayerEntity>()` method:

```cs
using Unisave.Facades;
using Unisave.Facets;

public class WhoIsFacet : Facet
{
    public void WhoIsLoggedIn()
    {
        var player = Auth.GetPlayer<PlayerEntity>();

        if (player == null)
            Log.Info("Nobody is logged in.");
        else
            Log.Info(player.email + " is logged in.");
    }
}
```

You can also only check whether there is anyone logged in:

```cs
bool someoneIsLoggedIn = Auth.Check();
```


## Guarding facets

Oftentimes you want only authenticated players to call facet methods. You can enforce this by specifying an authentication middleware for the facet:

```cs
using Unisave;
using Unisave.Facades;
using Unisave.Facets;
using Unisave.Authentication.Middleware;

[Middleware(typeof(Authenticate))] // <-- this line
public class PlayerFacet : Facet
{
    public void ChangePlayerName(string newName)
    {
        var player = Auth.GetPlayer<PlayerEntity>();

        // player won't be null here because of the middleware check

        player.name = newName;
        player.Save();
    }
}
```

The middleware declaration `[Middleware(typeof(Authenticate))]` can also be applied to a single method only.

A `Unisave.Authentication.AuthException` will be raised whenever a non-authenticated game client tries to call a guarded facet method.

> **Note:** It's not catastrophic to forget to add the middleware. Most methods that work with players first ask for the player via `Auth.GetPlayer<...>(...)` and since this method would return `null`, it will in turn cause a `NullReferenceException` to be thrown down the line. But it's not ideal and in some cases could be used to break into your server. So be safe and add the middleware.


## Security

> **\[ ! \]** This section talks about security. Read it all and carefully!


### Password hashing

Hashing is an important technique that makes sure you don't store player's passwords as-is. A hashed password is almost impossible to turn back to the original password so if you were to accidentally leak your database, your player's passwords wouldn't be compromised.

**Just remember that anytime you access a `player.password` field, there's not really a plain password but its hash fingerprint.**

Unisave provides utility functions in `Unisave.Utils.Hash` class that can help you with hashing:

```cs
// create hash (during registration)
string hashedPassword = Hash.Make("password");

// compare value against a hash (during login)
string providedPassword = "password";
bool matches = Hash.Check(providedPassword, hashedPassword); // true
```

> **Tip:** You can read more about hashing at https://crackstation.net/hashing-security.htm


### Sensitive data leakage

The `PlayerEntity` might contain sensitive data like an email address, real name, password hash, access tokens, etc. Leaking this information might give malicious actor access to the player's account and steal their identity. Because of this, you should be very wary about returning player entities from facets.

Say you implement a matchmaker. Many players participate in a single match. Each player needs to know the nicknames of all the other players. If you were to download entire player entities you would gain access not only to the nicknames but also to all the sensitive information. Make sure you extract only the information you actually need and nothing more.

Never trust your game client. It could have been disassembled and modified. It can call facets in a different order than you've anticipated. Trust only the server-side code (facets) - it cannot be tampered with.

Even if a player would download their own player entity. They could have a virus-infected computer. They could have a cracked version of your game. **Sensitive information should never leave the server.**


## Custom authentication

You can build any custom authentication system on top of the `Auth` facade. The `Auth` facade simply remembers the authenticated player during the playing session.

There are a few methods used to query the currently authenticated player:

```cs
// Tests whether somebody is logged in.
bool someoneIsLoggedIn = Auth.Check();

// Gets ID of the entity representing the authenticated player.
// Null if there's nobody logged in.
string playerEntityId = Auth.Id();

// Gets the entity representing the authenticated player.
// Null if there's nobody logged in.
PlayerEntity player = Auth.GetPlayer<PlayerEntity>();
```

Then there are two methods that make a player logged in or logged out:

```cs
// Takes in the entity representing a player.
Auth.Login(player);

// Logs out the authenticated player.
// Does nothing if nobody authenticated.
Auth.Logout();
```