---
title: "Epic Authentication"
titleHtml: "Epic Authentication"
url: "docs/epic-authentication"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: "2023-08-29"
dateUpdated: null
---


This module lets you quickly add "login via Epic Games" functionality to your game. It relies on the *Epic Online Services (EOS) Software Development Kit (SDK)* - a C# library that communicates with EOS. The EOS SDK is responsible for the authentication of the player inside your game client. Once authenticated there, this module will use the EOS SDK to authenticate the same player in Unisave by finding or creating a corresponding player document in the ArangoDB database and calling `Auth.Login(doc)` with that document (learn more about the `Auth` facade [here](authentication#custom-authentication)).


## Module overview

Before you begin, you should understand how [Unisave authentication](authentication) via the `Auth` facade works. To do a brief recap:

- We store all known players in the ArangoDB database as documents of a collection. One document represents one player and the ID of that document is the ID of that player as far as Unisave is concerned. We may use raw AQL queries, or we can use [entities](entities) to work with the database.
- The `Auth` facade is a Unisave backend-only utility, that lets us remember, which player is logged in (for each [client session](session) separately). We give it a database document ID and it will remember that ID (typically the document ID representing the player). We can ask it for the ID if we need to check if or who is logged in.
- To build a custom authentication system (say email and password), we need to store the email and password in the player document. During login we find the document based on the entered credentials and pass the document to the `Auth` facade to perform the login.

With Epic Games, we have players that have an *Epic Account*. This account has an ID, called *Epic Account ID*. What this module does is that it stores the *Epic Account ID* in the player document (like the email address) and performs some talking to the Epic servers to verify the player (like the password). Then it stores the corresponding player document in the `Auth` facade.

This process happens in two phases:

1. Your game client logs into EOS via the EOS SDK (no Unisave interaction).
2. You call `this.LoginUnisaveViaEpic(...);` in a `MonoBehaviour` which logs the same player in on the backend server.


### EOS phase

The first phase only interacts with the EOS SDK. The SDK is needed if you want to use the *Epic Online Services* from your game client (say, listing Epic friends, or giving Epic achievements). We will use the SDK to log the player in inside the game client:

- The EOS *Platform interface* needs to get initialized (a C# object through which you communicate with EOS). Read the [EOS documentation](https://dev.epicgames.com/docs/epic-online-services/eos-get-started/eossdkc-sharp-getting-started) or the [section below](#eos-sdk-initialization) to learn more.
- You need to authenticate the game client with the EOS SDK (you need to "login via Epic" locally). Read the [EOS documentation](https://dev.epicgames.com/docs/epic-online-services/eos-get-started/eossdkc-sharp-getting-started#signing-in) or the [section below](#eos-sdk-authentication) to learn more.


### Epic has two login interfaces

Note that there are two ways to "log into Epic": [the Auth interface](https://dev.epicgames.com/docs/epic-account-services/auth/auth-interface) and [the Connect interface](https://dev.epicgames.com/docs/game-services/eos-connect-interface). The first is for players that have an *Epic Account* and it grants access to the entire EOS ecosystem. The second grants access only to *EOS Game Services*, but can be used even by players that lack an *Epic Account*. What's complicated is that for access to *EOS Game Services*, even players with an *Epic Account* need to also login via the *Connect interface*.

What that means is that if you plan to add a "login via Epic" functionality to your game for players having an *Epic Account*, you will need to log them in twice, once for each interface (in code only, the player doesn't know). It also means that player can have two different Epic identifiers: the *Epic Account ID* for the *Auth interface*, and the *Product User ID (PUID)* for the *Connect interface*.

If this doesn't make sense, try reading my article: [Connect vs Auth in
Epic Online Services](https://unisave.cloud/guides/connect-vs-auth-in-epic-online-services)


### Unisave phase

Once you have your game client logged into EOS, you can use this module to perfom a login inside Unisave. Inside any `MonoBehaviour` you add this using statement:

```cs
using Unisave.EpicAuthentication;
```

And then you call the `LoginUnisaveViaEpic` extension method:

```cs
class MyController : MonoBehaviour
{
    async void OnEosLoginDone()
    {
        await this.LoginUnisaveViaEpic(platformInterface);

        Debug.Log("You are logged in even in Unisave now.");
    }
}
```

The `platformInterface` is the initialized *Platform interface* object from the EOS SDK, specifically the type `Epic.OnlineServices.Platform.PlatformInterface`.

This module also needs to know, how to find and how to create a player document. For that you need to create a backend bootstrapper that configures this behaviour. You add this class to your backend folder and implement as you need:

```cs
using System;
using Unisave.EpicAuthentication.Backend;
using Unisave.Facades;

public class EpicAuthBootstrapper : EpicAuthBootstrapperBase
{
    public override string FindPlayer(
        string epicAccountId,
        string epicProductUserId
    )
    {
        // Find the player document by epicAccountId first,
        // then try epicProductUserId. Return the player's
        // document ID, e.g. "players/123456".
        // If there's no such player, return null
        // and a new player will be registered.
    }

    public override string RegisterNewPlayer(
        string epicAccountId,
        string epicProductUserId
    )
    {
        // Create a new player document and save it
        // to the database. Return its document ID.
        // Don't forget to store the Epic identifiers.
    }
}
```

To see a reasonable initial implementation, take a look at the *SimpleDemo* provided with the module. You can view it online [here](https://github.com/unisave-cloud/epic-authentication/blob/master/Assets/Plugins/UnisaveEpicAuthentication/Examples/SimpleDemo/Backend/EpicAuthBootstrapper.cs).


## Installation

TODO

- You have your game connected with Unisave
- Import this Unity package (this integration asset)
- Set up EOS account via this guide: https://dev.epicgames.com/docs/epic-online-services/eos-get-started/services-quick-start
- Download the latest EOS SDK and put it into your Unity project (https://dev.epicgames.com/en-US/sdk)
    - NOTE: General information on how to use the SDK from Unity: https://dev.epicgames.com/docs/epic-online-services/eos-get-started/eossdkc-sharp-getting-started
    - Put the SDK into the Plugins folder otherwise it won't be seen by this asset (as Plugins are compiled before everything else). If that isn't an option and you need the EOSSDK to be directly in the `Assets` folder, you can move this asset folder outside of the Plugins folder instead.
    - <img src="https://static-assets-prod.epicgames.com/eos-docs/game-services/c-sharp-getting-started/unity_-2.png">
- Open the example scene and try it out
- Now set up your own epic game (https://dev.epicgames.com/docs/epic-account-services/getting-started)
    - Create a "Client" and policy of type "Game Client"
    - Configure an "Application" (link the client to it)
    - Fill out your own keys and tokens
    - Try again


## EOS SDK initialization

## EOS SDK authentication

## Unisave authentication


## FAQ

**Unity Editor freezes when exiting play mode in the SimpleDemo project.**<br>
You have to have all the necessary keys and credentials filled out, then it won't freeze. It's probably an Epic SDK bug. Happened to me on SDK 1.15.5.
