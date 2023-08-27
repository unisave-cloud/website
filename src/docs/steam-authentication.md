---
title: "Steam Authentication"
titleHtml: "Steam Authentication"
url: "docs/steam-authentication"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: "2020-09-01"
dateUpdated: null
---


This template lets you quickly add "login via Steam" functionality to your game. Make sure you read the [authentication](authentication) documentation page first.


## Player entity

Before you add the template to your game, you need to add the following fields to your `PlayerEntity`:

```cs
public class PlayerEntity : Entity
{
    public string steamId;
    public DateTime lastLoginAt = DateTime.UtcNow;
}
```

The `steamId` field stores the player's [Steam ID](https://partner.steamgames.com/doc/api/steam_api#CSteamID). If this value is `null`, it's considered that the player entity has no associated Steam account. This is because you could combine Steam authentication with other forms of authentication (e.g. via email). If Steam authentication is the only authentication you use, then you shouldn't have any `null`s in the field.

> **Note:** If you already have players registered in your database, you can simply add these new fields and all the old entities will be considered to have the default values (`null` for `steamId` and `UtcNow` for `lastLoginAt`, set at the time of loading from the database).


## Instantiating the template

We begin by creating the server-side code. Go to your `Backend` folder, right-click and choose `Create > Unisave > Steam authentication > Backend`. This will create the following files:

    Backend/
    └── SteamAuthentication/
        └── SteamLoginFacet.cs

- `SteamLoginFacet.cs` handles logging in via Steam. If the given Steam ID has never been seen ago, it performs player registration. It also has a `Logout` method for logging out.

Now we need to create one client-side script that will talk with the facet. Go to your `Scripts` folder, right click and choose `Create > Unisave > Steam authentication > Login client`.

Now all you need to do is to put one button into the scene, that when clicked calls the `LoginViaSteam` method on the just created `SteamLoginClient`. The `SteamLoginClient` also requires one field to be filled out, called `sceneAfterLogin`. It contains the name of the scene that should be loaded after loggin in.

If you want to perform different action after login, simply modify the source code of the `SteamLoginClient`.

If you've done everything described so far, you should now be able to use this template. If you, however, want to understand how it works, then continue reading.


## The authentication process

This section describes in high-level how the authentication process works.

Let's look at it from the perspective of your backend server. Some client makes requests and we need to know, who that client is (what Steam ID they have). We cannot simply let them tell us their Steam ID, because they could lie to us which would allow anyone to log in as anyone else (Steam ID is more or less public, it's not a secret password, more like an email address).

This template uses [Steam Session Tickets](https://partner.steamgames.com/doc/features/auth#client_to_backend_webapi) to verify the client's identity. The process is as follows:

1. Your game client asks the Steam client to generate a secure *Session Ticket*.
2. Your game client sends this ticket to your backend server.
3. Your backend server sends the ticket to Steam, which responds with the Steam ID that generated the ticket.
4. Your backend server now knows the Steam ID and can be sure of it's validity.

The *Session Ticket* basically acts as a one-time password that Steam client gives your game client that can only be used to login the player who is currently logged into the Steam client app.


## Staying up-to-date

The latest version of the *Steam authentication* template is `0.9.1`.

For instructions on how to update, check out [the changelog and upgrade guide](https://github.com/Jirka-Mayer/UnisaveAsset/blob/master/Assets/UnisaveFixture/TemplateChangelogs/SteamAuthentication.md).

You can view the latest template code on Github for [the backend part](https://github.com/Jirka-Mayer/UnisaveAsset/tree/master/Assets/UnisaveFixture/Backend/SteamAuthentication) and [the client](https://github.com/Jirka-Mayer/UnisaveAsset/blob/master/Assets/UnisaveFixture/Scripts/SteamAuthentication).
