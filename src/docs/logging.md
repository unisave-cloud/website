---
title: "Logging"
titleHtml: "Logging"
url: "docs/logging"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: "2020-09-01"
dateUpdated: null
---


Unisave lets you log messages on the server-side via the `Log` facade. These messages will be collected and automatically sent to your Unity editor and logged into the Unity console when the request finisehs. Not only that, but you will be able to see them in the request detail in the web development console.


## Writing log messages

You can log information in various importance levels. To log a simple string message, call these methods:

```cs
using Unisave.Facades;

string message = "I am a message!";

Log.Info(message);
Log.Warning(message);
Log.Error(message);
Log.Critical(message);
```


### Context object

You can optionally add a context object to the message with extra information:

```cs
using Unisave.Facades;
using LightJson;

Log.Info("Player purchased an item.", new JsonObject {
    ["playerId"] = player.EntityId,
    ["item"] = itemIdentifier
});
```

The context object can by any `System.Object`, but it has to be serializabe and not all objects are.


### Unity Debug on the server

You can use `Debug.Log(...)` on the server as well, although, it's internally translated to `Log.Info` so it doesn't have many use cases apart from the convenience. The only limitation is that you cannot pass context objects, since the object has to a `UnityEngine.Object` (game object), which cannot exist on the server.

But you can at least easily debug your facets:

```cs
using Unisave.Facets;
using Unisave.Facades;
using UnityEngine;

public class MyFacet : Facet
{
    public void MyMethod()
    {
        Debug.Log("MyMethod has been called!");
    }
}
```
