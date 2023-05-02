---
title: "How to store player data online with Unity"
url: "guides/how-to-store-player-data-online-with-unity"
tags: []
author: "Jiří Mayer"
datePublished: "2022-11-04"
dateUpdated: null
---

## Introduction

Today, most games offer at least some multiplayer features (e.g. leaderboards) and these require storage of data online. The part of a game responsible for online data is called the game backend.

This guide shows you, how to use Unisave (a game backend service) for storing information about your players (inventory, achievements, analytics).


## Prerequisites

In order to follow along with this guide, you'll need to have Unisave set up in your game. You can set up an account and download the open-source Unity asset for free. Read the [installation documentation page](/docs/installation) for more instructions.


## Distinguishing players

Storing player data offline in the [Unity game engine](https://unity.com/) usually involves using [PlayerPrefs](https://docs.unity3d.com/ScriptReference/PlayerPrefs.html). It's a simple solution and we would like to have something similar but instead stored in a cloud database.

```cs
// storing data in Unity's PlayerPrefs
PlayerPrefs.SetInt("player.coins", coins);
```


## TODO, copy the rest and check rendering
