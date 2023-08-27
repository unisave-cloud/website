---
title: "Steam Microtransactions"
titleHtml: "Steam Microtransactions"
url: "docs/steam-microtransactions"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: "2020-09-01"
dateUpdated: null
---

Steam allows you to make transactions from within your game but it requires you to have a secure backend server to validate and perform the purchases. This template lets you quickly and elegantly integrate Steam microtransactions into your game.


## Prerequisites

You should have a Steam developer account and a basic understanding of how Steam microtransactions work.

> **TL;DR of how Steam microtransactions work**
> 1. Player clicks "buy this gold pack".
> 2. Your *game client* tells your *purchasing server* (part of your backend server) that the Steam user `123` wants to buy the product `xyz` for `$999`.
> 3. Your *purchasing server* tells the same thing to Steam but adds your `App ID` and [publisher key](https://partner.steamgames.com/doc/webapi_overview/auth).
> 4. Steam will perform the checkout process with the player using [Steam overlay](https://partner.steamgames.com/doc/features/overlay) displayed over your running game.
> 5. Steam will notify your *game client* (via a Steamworks callback), that the transaction was authorized / aborted.
> 6. Your *game client* will tell your *purchasing server* to finalize the transaction.
> 7. Your *purchasing server* will finalize the transaction and give the purchased products to the player.
>
> Read more about microtransactions:
> https://partner.steamgames.com/doc/features/microtransactions/implementation
>
> How your backend communicates with Steam:
> https://partner.steamgames.com/doc/webapi/ISteamMicroTxn#InitTxn

Your Unity game needs to communicate with the Steam application. This is done using the library [Steamworks.NET](https://steamworks.github.io/):

1. Install it by downloading the latest `.unitypackage` from https://github.com/rlabrecque/Steamworks.NET/releases
2. Set it up properly (set up the `steam_appid.txt`, and create the `SteamManager`), see https://steamworks.github.io/installation/


## Environment variables

This template requires the following environment variables:

```bash
STEAM_API_URL=https://partner.steam-api.com/
STEAM_APP_ID=480
STEAM_PUBLISHER_KEY=secret
STEAM_USE_MICROTRANSACTION_SANDBOX=false
```

You need to specify your App ID and [publisher web API key](https://partner.steamgames.com/doc/webapi_overview/auth). The Steam API URL is set to a sensible default and the last `STEAM_USE_MICROTRANSACTION_SANDBOX` specifies whether to use the [testing sandbox that Steam provides](https://partner.steamgames.com/doc/webapi/ISteamMicroTxnSandbox) when making transaction requests.


## Instantiating the template

First, you create your purchasing server. Go to your `Backend` folder, right-click and choose `Create > Unisave > Steam microtransactions > Backend`. This will create the following files:

```
Backend/
└── SteamMicrotransactions/
    ├── VirtualProducts/
    │   └── ExampleVirtualProduct.cs
    ├── IVirtualProduct.cs
    ├── SteamPurchasingServerFacet.cs
    └── SteamTransactionEntity.cs
```

- `VirtualProducts/` is where you will put all your virtual products you want to sell.
- `SteamPurchasingServerFacet.cs` is the facet that acts as your *purchasing server*.
- `SteamTransactionEntity.cs` is an entity that is created for each transaction, successful or not.

Next we need a script that will communicate with the *purchasing server* and Steamworks.NET within your game. Go to your `Scripts` folder, right-click and choose `Create > Unisave > Steam microtransactions > Client`. This will create a file named `SteamPurchasingClient.cs` that you will use when making transactions.

> **Info:** The `SteamPurchasingClient` is indeed a client-side script and it does create entities on the client-side. The catch is that they are not saved there. They are saved on the server-side, where the database is accessible.
>
> The virtual products are classes shared by both the client and the server so they need to be placed inside your `Backend` folder to be accessible on the server. But they can still be used and created on the client-side. This is the power of isomorfic code - one code to be used in both contexts.


## Describing products

Before you start making transactions, you have to define the virtual products you are going to sell. Start by reading the `ExampleVirtualProduct.cs`. All you need to do is to rename the file and fill it out. For multiple products simply duplicate and modify the file. Instructions on how to fill the file out are inside the file itself.

A virtual product can define descriptions and prices in multiple languages and currencies. The ones to be used are specified during transaction initiation.

Each product contains a `GiveToPlayer(...)` method. It gets called on the server when a transaction finishes successfully (and the transaction contained this product). It gets called once for each occurence of this product in the transaction (three times, if the product quantity is `3`). Implement this method to make sure the player actually obtains something in return for the payment.

```cs
public class MediumGoldPack : IVirtualProduct
{
    /* ... */

    public void GiveToPlayer(SteamTransactionEntity transaction)
    {
        var player = Auth.GetPlayer<PlayerEntity>();
        player.gold += 5_000;
        player.Save();
    }
}
```


## Making a transaction

Open the `SteamPurchasingClient.cs` file and read through it. The first method you will see is:

```cs
public void PlayerClickedBuy()
{
    var transaction = new SteamTransactionEntity {
        playerSteamId = GetSteamId(),
        language = "en",
        currency = "USD"
    };
    transaction.AddProduct<ExampleVirtualProduct>(quantity: 3);

    SendTransactionProposalToPurchasingServer(transaction);
}
```

This method is an example of transaction initiation. You first create an instance of `SteamTransactionEntity`. You specify the language and currency that will be used within the transaction. You also specify the player that initiated the transaction. These three values are required to start a new transaction but you can add additional data to the transaction if you need.

> **Info:** The order ID, that Steam requires, is generated automatically within the transaction constructor.

Then you need to add at least one product to the transaction using the `AddProduct` method. You can treat the transaction as a shopping cart containing multiple items in some quantity.

Add this script into your scene and hook a button to call the `PlayerClickedBuy` button and you are almost ready to go. The only thing that remains is some feedback to the player.

There are two more methods that you should implement, `TransactionHasBeenSuccessful` and `ReportErrorToThePlayer`. In both of them you should display a corresponding dialog window to the player. See the code inside of them to learn more.

Lastly, when a transaction succeeds and products are given to the player, the player data have been updated only on the server. You should use the `TransactionHasBeenSuccessful` method to load the latest player data from the server so that the player sees the newly purchased items.


## Problems with Unity editor and Steam overlay

When you hit play in your Unity editor and try to make a transaction, it will probably fail with:

    Steam rejected transaction initiation.
    [7] User 123456789 not logged in
    Order ID: 123456789

This is because your Steam client thinks your game isn't running and rejects the transaction. Trying to make a transaction from a build that's launched directly (not via Steam client) might fail even earlier.

**Basically the best thing you can do is to build your game, upload it to Steam, and launch it via the Steam client.** This will make sure Steam client attaches to your running game and all callbacks it sends will be received by your game.

> **Tip:** You can use [Steam branches](https://partner.steamgames.com/doc/store/application/branches) to not interfere with your game client in production.

The process described above should work because it is the same setup that will be used in production. However, if you don't want to wait for a complete build, you can launch your game from Steam (to make Steam think it's running), then hit play in your Unity editor and then make a transaction from the Unity editor. The purchasing overlay should open over your running game. The problem is that the callback with the result will not be received by the Unity editor so the transaction won't be finished. But you can at least test the transaction initiation.


## Staying up-to-date

The latest version of the *Steam microtransactions* template is `0.9.0`.

For instructions on how to update, check out [the changelog and upgrade guide](https://github.com/Jirka-Mayer/UnisaveAsset/blob/master/Assets/UnisaveFixture/TemplateChangelogs/SteamMicrotransactions.md).

You can view the latest template code on Github for [the backend part](https://github.com/Jirka-Mayer/UnisaveAsset/tree/master/Assets/UnisaveFixture/Backend/SteamMicrotransactions) and [the client](https://github.com/Jirka-Mayer/UnisaveAsset/blob/master/Assets/UnisaveFixture/Scripts/SteamMicrotransactions/SteamPurchasingClient.cs).
