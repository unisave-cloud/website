---
title: "XXX Bonus Codes"
titleHtml: "<em>XXX</em> Bonus Codes"
url: "guides/xxx-bonus-codes"
image: NO_IMAGE
tags: ["photon", "authentication"]
author: "Jiří Mayer"
datePublished: null
dateUpdated: null
---

> **TODO:** figure out a title (and URL); set up tags; prepare media image;
> Edit at: http://localhost:1234/guides/xxx-bonus-codes

A useful tool in marketing your game may be the distribution of bonus codes, say `CHRISTMAS24`. You can hand out these codes physically on leaflets or digitally on social media to attract players to your game. Players can then redeem these codes in your game to receive some bonus in-game content, such as premium equipment or themed skins.

This guide teaches you how to implement a simple bonus code system in Unity using [Unisave](https://unisave.cloud/) as the backend service.


## Setting the scene

You may use bonus codes with two goals in mind:

1. Attract new players to your game.
2. Reward players who participated in some game event (on-site or online).

To achieve the first goal you want to distribute codes indiscriminately, ideally acompanying the release of your game (or a major update). You want the people who receive the code to feel like they already own something in your game even before they've even installed it. This incentivizes them to actually go and try your game out. You could spread these simply by using social media:

```
Hello, the long-awaited *pink spider
update* 🩷🕷️ has just been released!
As a thank you for being patient,
redeem the PINK8 bonus code in-game
to get some fancy spider perks!

Cheers!
```

To reward a smaller group of players it also makes sense to have the code simple and memorable, and to have only a single code for everyone. Bonus codes are meant to spread something positive about your game and make it more hyped. If they leak, it's only better for you since you get double effect - original audience feels rewarded and people who receive the leaked code will go and download your game. It does not make sense to have cryptic long one-time codes for this purpose, say `FPq3-ppQM-2h5v-XrT8`, since it defeats their purpose.


## Database collections

> **Note:** I assume you have Unisave set up in your Unity project. If not, please refer to the documentation: https://unisave.cloud/docs

We will use two database collections for the system:

1. `bonus_codes` List of currently redeemable bonus codes.
2. `bonus_code_redemptions` History of redemptions for auditing and analytics.

Create this [entity class](https://unisave.cloud/docs/entities) to work with documents in the first collection:

```cs
using System;
using System.Collections;
using System.Collections.Generic;
using Unisave;
using Unisave.Entities;

[EntityCollectionName("bonus_codes")]
public class BonusCodeEntity : Entity
{
    // the 'code' itself, e.g. 'PINK8'
    public string code;

    // is the code still active or have we disabled it
    public bool isEnabled = true;

    // how many times has the code been used
    public int usedTimes = 0;
}
```

TODO: first write all of the code and then write the text, since there's interplay you don't see now

TODO: screenshot of the PINK8 code in aardvark


## Code validation

TODO: facet method that checks the code is valid


## Code redemption

TODO: talk about how the items could be given on the server, but since this guide is simple, we will just handle that on the client only

TODO: Conclusion extensions: Limited time window, limited usages, one-time codes etc...
