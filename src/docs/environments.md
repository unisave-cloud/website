---
title: "Environments"
titleHtml: "Environments"
url: "docs/environments"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: "2020-09-01"
dateUpdated: null
---


## Introduction

An environment is a collection of environment variables which act as a configuration for your backend server. Environment variables tell your backend:

- how to connect to a database
- what secret keys to use when talking with Steam, an email provider, and other external services
- whether to act production-like or development-like
- any additional configuration options you might want to add

An environment variable has a key and a value:

```bash
MY_VARIABLE=some value
```

You can access evironment variables from your backend code:

```cs
Env.GetString("ENV_TYPE"); // "development"
Env.GetInt("SESSION_LIFETIME"); // 3600

if (Env.GetString("ENV_TYPE") == "testing")
    player.gold += 1_000_000;
```


## Using multiple environments

The primary reason why environments exist is to separate different contexts in which your server can run. These contexts will typically be:

**Production:** Your published game uses this context. Here, all the used services and resources are hot, meaning emails get really sent, money gets really transfered, accidentally corrupting a database is a terrible mistake.

**Development:** When you work on your game in Unity editor, you want to use a different database to the production one. Because you will make mistakes and corrupt your data. But you also want to use the same backend code that will eventually run in production. You also don't want to actually send emails and money when in-game transactions are made.

**Testing:** You might want to have a testing server where selected players test your latest version before it goes to production. When a player registers here, you want to give them lots of resources to quickly explore your game.

Your backend server, although it's the same code, should perform differently in these described situations. This is acomplished via environments. Your code reads environment variables and makes decisions and you then specify values of those variables in various environments.

You can specify which build of your game should use which environment in the web application.


## Variable values

All environment variables are considered to have string values. There are just some convenience methods that allow you to cast the value to other types easily.

```bash
FOO=123
BAR=true
```

```cs
Env.GetString("FOO"); // "123"
Env.GetInt("FOO"); // 123
Env.GetBool("BAR"); // true
```

You can also specify a default value to return when the variable is not defined:

```cs
Env.GetString("NON_EXISTING_VARIABLE", "default"); // "default"
```

If the default value argument is not specified, then the respective values of `null`, `0` and `false` are returned.

You can also test, whether a variable has been defined:

```cs
Env.Has("FOO"); // true/false
```


### `$AUTO` value

There are some variables whose value might be automatically infered from values of other varibales. If that's possible, you can use the value `$AUTO` to perform the automatic inferring:

```bash
UNISAVE_DATABASE=zBPg9z2l

ARANGO_BASE_URL=$AUTO
ARANGO_DATABASE=$AUTO
ARANGO_USERNAME=$AUTO
ARANGO_PASSWORD=$AUTO
```

```cs
Env.GetString("ARANGO_PASSWORD"); // "JSmhb08w9fDCweT+ux/CM/Ur"
```


## List of well-known variables

Although you can add any additional variables you might need, there are a set of variables that should be specified for proper function of your backend server.


### General

**ENV_TYPE** Type of the environment. Used by the Unisave web application to highlight production builds. You can use this to determine the context in which your code runs, e.g. give new testing players unlimited resources:

```cs
// during player registration
if (Env.GetString("ENV_TYPE") == "testing")
    player.gold += 1_000_000;
```

It should be one of: `production`, `development`, `testing`, `other`

**BACKEND_DEFAULT** and **BACKEND_DEFAULT_AUTO_UPDATE** will be used in the future to determine what backend should be used for requests comming in through the web API, scheduler and commands.


### Database

**UNISAVE_DATABASE** ID of the target database. This value is the basis on which `$AUTO` values get resolved for *ARANGO_\** variables. You can omit this value and specify *ARANGO_\** variables yourself, which lets you point your backend to your own, external database (e.g. [ArangoDB Oasis](https://cloud.arangodb.com/)).

**ARANGO_BASE_URL** Base URL of the ArangoDB service, e.g. `https://my-game.com:8529/`.

**ARANGO_DATABASE** Name of the database, e.g. `_system`.

**ARANGO_USERNAME** Username, e.g. `root`.

**ARANGO_PASSWORD** Password for the user.


### Session

**SESSION_DRIVER** How should sessions be stored. It can be one of `arango`, `memory`, and `null`. Arango is the recommended default, `null` can be used to disable sessions. You shouldn't really change this unless you are doing something very specific since it might cause other systems to not function properly (e.g. authentication).

**SESSION_LIFETIME** After how many seconds does a session expire. The default is `3600`. Again, don't change this unless you know what you're doing.
