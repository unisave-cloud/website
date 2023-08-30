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

First, you should have Unisave installed in you Unity project with backend uploading set up and working. If not, see the [installation instructions](../installation/installation.md).

Then, start by importing this Unisave module as a Unity package into your project:

- via the Unity Asset Store **\[TODO\]**
- or from the `.unitypackage` downloaded from the [GitHub releases page](https://github.com/unisave-cloud/epic-authentication/releases)

Now, create an Epic Games Account, create a Product (your game) and download the C# EOS SDK. You can do so by following [this EOS documentation page](https://dev.epicgames.com/docs/epic-online-services/eos-get-started/services-quick-start).

> **Note:** You don't need to register if you just want to try the demo scene. But you do need it to start integrating your game.

> **Note:** You can download the C# SDK without registration from [the SDK webpage](https://dev.epicgames.com/en-US/sdk).

Extract the downloaded zip file and copy these files and folders to these places in your Unity project:

- `ZIP:/SDK/Bin/EOSSDK-Win64-Shipping.dll` copy to `UNITY:/Assets/Plugins/EOSSDK/EOSSDK-Win64-Shipping.dll` (assuming you target Win64, otherwise you need to use binaries for other platforms)
- `ZIP:/SDK/Source/Core` copy to `UNITY:/Assets/Plugins/EOSSDK/Core`
- `ZIP:/SDK/Source/Generated` copy to `UNITY:/Assets/Plugins/EOSSDK/Generated`

<img src="./sdk-in-unity.png" alt="Unity project view with the SDK files." />

> **Note:** You can also read the [official documentation for the SDK integration with Unity](https://dev.epicgames.com/docs/epic-online-services/eos-get-started/eossdkc-sharp-getting-started) to get a better idea of how it works.


Notice that we place the SDK into the `Assets/Plugins` folder, not directly to `Assets`. This is because this Unisave module is also in the `Plugins` folder and this folder compiles before everything else. Not having the SDK here would mean this module would not see the SDK C# classes. If you need to have the SDK outside the `Plugins` folder, you have to move the `Assets/Plugins/UnisaveEpicAuthentication` folder outside as well.


## Demo project walkthrough

This module comes with an example scene in the folder: `Assets/Plugins/UnisaveEpicAuthentication/Examples/SimpleDemo`

<img src="./demo-files.png" alt="Example project file structure." />

When you open the scene and hit play, you'll see the following screen:

<img src="./demo-started.png" alt="Example project running." />

When you click the orange button, an Epic Account Portal overlay is displayed over your game that asks you to log in. It may also open a browser window with the login portal instead (especially in the Unity Editor the behaviour is iffy - in your final built game the overlay should work fine).

<img src="./demo-portal-overlay.png" alt="Epic login overlay." />

When you follow through, the overlay will close and the authentication will continue. In the end it will display a **Success!** message:

<img src="./demo-success.png" alt="Example project successful login." />

At this point you are logged into Epic in you game (see the *EpicAccountId* `abb69018ac...`) and you are also logged into Unisave via that Epic account as a Unisave player `e_PlayerEntity/8445747209`.

Now, if you make a [facet call](../facets.md) to your backend server, whenever you call `Auth.GetPlayer<T>()`, it will return the document `e_PlayerEntity/8445747209`.

If we open the database and find the player document, we see that it's connected with the Epic Account (see the `epicAccountId` field):

```json
{
    "_id": "e_PlayerEntity/8445747209",
    "_rev": "_giUsKhS---",
    "_key": "8445747209",
    "epicAccountId": "abb69018acbf4772b5e194e85794a0cc",
    "epicProductUserId": null,
    "lastLoginAt": "2023-08-30T09:02:38.557Z",
    "CreatedAt": "2023-08-18T13:11:04.382Z",
    "UpdatedAt": "2023-08-30T09:02:38.576Z"
}
```


### Connecting with your Epic product

- Now set up your own epic game (https://dev.epicgames.com/docs/epic-account-services/getting-started)
    - Create a "Client" and policy of type "Game Client"
    - Configure an "Application" (link the client to it)
    - Fill out your own keys and tokens
    - Try again


### Understanding the code


## EOS SDK initialization

## EOS SDK authentication

## Unisave authentication


## FAQ

**Unity Editor freezes when exiting play mode in the SimpleDemo project.**<br>
You have to have all the necessary keys and credentials filled out, then it won't freeze. It's probably an Epic SDK bug. Happened to me on SDK 1.15.5.
