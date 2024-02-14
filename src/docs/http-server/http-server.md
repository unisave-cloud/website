---
title: "HTTP Server"
titleHtml: "HTTP Server"
url: "docs/http-server"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: "2024-02-14"
dateUpdated: null
---

This page currently describes how webhooks can be implemented via a hack. This page will evolve into the HTTP Server documentation as the ability to accept any HTTP requests is added to the Unisave backend.

> **🚧 Internal documentation:** This documentation page describes Unisave internals and is meant for Unisave developers and very advanced users. Information here might be incomplete, not yet implemented, deprecated, or changed without notice.


## Understanding facet calls

When you develop a backend in Unisave, you write code in your Unity Editor and when you hit play, the game automatically talks to the just-compiled backend server. This is what happens under the hood:

1. You finish editing the C# code.
2. Unity Editor compilation starts, which triggers backend upload.
    1. Unisave asset gathers all C# backend scripts.
    2. It computes the *backend hash* - a unique string that identifies this specific state of backend files.
    3. It remembers this hash so that it can make facet calls later.
3. You click the play button and make the first facet call.
    1. Unisave asset sends the facet request to the Unisave cloud together with the *backend hash*.
    2. The cloud starts a worker instance with that specific backend version.
    3. The worker handles the facet request.

> **Note:** This means that if more than one person works on a game, they each see their own version of the backend.

When you are ready to release, you make a build in Unity:

1. You click the `[Build]` button in Unity.
2. Unisave asset re-uploads the backend with the current *backend hash*.
3. And it stores the just-generated *build GUID*.
4. It sends a request to Unisave cloud to register the *build GUID*.

With each facet call:

- the *game token* is sent to identify the game
- the *backend hash* is sent to identify what backend version to use
- the *editor key* (for Unity Editor) or *build GUID* (for a built client) is used to allow/deny access to the server and to select the proper [environment](../environments.md)

> **Note:** These are the oldest parts of Unisave and they are in dire need of refactoring. Lots of unused fields, unnecessary complexity, incorrect domain model, improper responsibility assignment...


## Faking a client request

Let's say we have a third server running Node.js, that wants to make requests to your Unisave backend.

First, we need to fake-register a built client:

1. Open the online Unisave console and go to your game, to the *Builds* tab.
2. Click the *Register build manually* button in the top-right corner.
3. Fill out the form:
    1. The game version is only informative to you. You can leave it at `1.0-manual`.
    2. We can make up our own *build GUID*, let's set it to `nodeJsBuildGuid`.
    3. The platform field is also informative, put `Custom` there.
    4. The backend hash here is not actually used, you can set it to `notUsed`
    5. Select the environment you want to route the requests to.

The record we've just created is there only to allow requests with the specific *build GUID* to go through, all the other fields are only informative and thus not necessary (except for the chosen environment).

Now we can start making raw HTTP requests. All the facet calls are sent to `https://unisave.cloud/_api/call-facet` as `POST` HTTP requests. The `Content-Type` header must be set to `application/json`. The request body has the following structure:

```json
{
    // These are the three arguments you actually care about
    // MyFacet.MyMethod(int, string, Vector3)
    "facetName": "MyNamespace.Foo.Bar.MyFacet",
    "methodName": "MyMethod",
    "arguments": [5, "lorem", {"x": 1 , "y": 2, "z": 3}],

    // Null with the first request, then provide the received session ID
    // (or leave at null to not track a session)
    "sessionId": null,

    // This is used to track DAU, but nothing else.
    // For a sever, keep this some constant, like "nodeJsDeviceId"
    "deviceId": "nodeJsDeviceId",
    
    // This is completely ignored. Was meant for analytics that never came.
    // But it is validated, so it has to be present.
    "device": {
        "platform": "Custom",
        "deviceModel": null,
        "graphicsDeviceName": null,
        "graphicsDeviceID": null,
        "graphicsDeviceVendorID": null,
        "graphicsMemorySize": null,
        "graphicsDeviceType": null,
        "systemMemorySize": null,
        "processorCount": null,
        "processorFrequency": null,
        "processorType": null
    },

    // The game token constant you copy from the web dashboard.
    "gameToken": "X6Mn9QTp51GYYfbCACelq9mL",

    // Leave this at null, we will provide build GUID instead.
    "editorKey": null,
    
    "client": {
        // This is important! You need to keep this updated, since it selects,
        // what backend server version will be used to handle the request.
        // (yes, this is a terrible design on my part, that's why I want to redo this)
        // Copy this value from the unity editor or the web "Backends" tab when you want
        // to release a new backend version.
        "backendHash": "220783ec00546c5a9e05585049853e90",

        // we set this to the value we provided in the manually created record
        "buildGuid": "nodeJsBuildGuid",

        // These fields are ignored, but must be present.
        // Again, for future analytics.
        "frameworkVersion": "none",
        "assetVersion": "none",
        "versionString": "none"
    }
}
```

This is how you can send the request via CURL:

```bash
curl -X POST https://unisave.cloud/_api/call-facet \
    -H 'Content-Type: application/json' \
    -d '{
        "facetName": "MyNamespace.Foo.Bar.MyFacet",
        "methodName": "MyMethod",
        "arguments": [5, "lorem", {"x": 1 , "y": 2, "z": 3}],
        "sessionId": null,
        "deviceId": "nodeJsDeviceId",
        "device": {
            "platform": "Custom",
            "deviceModel": null,
            "graphicsDeviceName": null,
            "graphicsDeviceID": null,
            "graphicsDeviceVendorID": null,
            "graphicsMemorySize": null,
            "graphicsDeviceType": null,
            "systemMemorySize": null,
            "processorCount": null,
            "processorFrequency": null,
            "processorType": null
        },
        "gameToken": "X6Mn9QTp51GYYfbCACelq9mL",
        "editorKey": null,
        "client": {
            "backendHash": "220783ec00546c5a9e05585049853e90",
            "buildGuid": "nodeJsBuildGuid",
            "frameworkVersion": "none",
            "assetVersion": "none",
            "versionString": "none"
        }
    }'
```

If you have a malformed request (invalid JSON structure), you will get a response like this one:

```json
{
    "type": "https://tools.ietf.org/html/rfc7231#section-6.5.1",
    "title": "One or more validation errors occurred.",
    "status": 400,
    "traceId": "00-029e7e5516def90870d1c02209863466-10c00f52b4ee7a73-00",
    "errors": {
        "Client": ["The Client field is required."],
        "Device": ["The Device field is required."],
        "DeviceId": ["The DeviceId field is required."],
        "Arguments": ["The Arguments field is required."],
        "FacetName": ["The FacetName field is required."],
        "GameToken": ["The GameToken field is required."],
        "MethodName": ["The MethodName field is required."]
    }
}
```

If you don't register the build or you mis-type the build GUID, you will get this:

```
Build hasn't been registered
```

But if you're successful, you will get a response like this (and the request will show up in the development dashboard online):

```json
{
    "executionResult": {
        "result": "exception", // "ok" or "exception"
        "returned": null, // serialized return value if "ok" and not void
        "exception": { // null if "ok", else the serialized exception
            "ClassName": "Unisave.Facets.FacetSearchException",
            "Message": "Facet 'MyNamespace.Foo.Bar.MyFacet' was not found. ...",
            "Data": null,
            // ...
        },

        // these values are returned always
        "special":{
            // if a session is started (if there wasn't an exception),
            // you'd get your session ID assigned here and you can send
            // it with the next request
            "sessionId": null, // e.g. "12AsdS8ad3ASF5Sd"

            // just info, you can ignore this
            "executionDuration": 1.781 // seconds
        }
    }
}
```

This is an example of a successful response:

```json
{
    "executionResult": {
        "result": "ok",
        "returned": 42,
        "exception": null,
        "special":{
            "sessionId": "12AsdS8ad3ASF5Sd",
            "executionDuration": 0.537
        }
    }
}
```

This is an example of how you can send a request with session tracking from Node.js:

```js
/**
 * Calls a facet method on the backend
 */
async function callFacet({ facetName, methodName, arguments }) {
  const UNISAVE_GAME_TOKEN = env["UNISAVE_GAME_TOKEN"];
  const UNISAVE_BACKEND_HASH = env["UNISAVE_BACKEND_HASH"];
  const UNISAVE_BUILD_GUID = "nodeJsBuildGuid"
  
  const url = "https://unisave.cloud/_api/call-facet";

  const response = await fetch(url, {
    method: "POST",
    mode: "cors",
    cache: "no-cache",
    credentials: "same-origin",
    headers: {
      "Content-Type": "application/json"
    },
    redirect: "follow",
    referrerPolicy: "no-referrer",
    body: JSON.stringify({
      facetName: facetName,
      methodName: methodName,
      arguments: arguments,
      sessionId: loadSessionId(),
      deviceId: loadDeviceId(),
      device: {
        platform: "Custom",
        deviceModel: null,
        graphicsDeviceName: null,
        graphicsDeviceID: null,
        graphicsDeviceVendorID: null,
        graphicsMemorySize: null,
        graphicsDeviceType: null,
        systemMemorySize: null,
        processorCount: null,
        processorFrequency: null,
        processorType: null
      },
      gameToken: UNISAVE_GAME_TOKEN,
      editorKey: null,
      client: {
        backendHash: UNISAVE_BACKEND_HASH,
        frameworkVersion: "none",
        assetVersion: "none",
        buildGuid: UNISAVE_BUILD_GUID,
        versionString: "none"
      }
    })
  });

  const body = await response.json();
  const executionResult = body["executionResult"];

  const result = executionResult["result"];
  const exception = executionResult["exception"];
  const returned = executionResult["returned"];
  const special = executionResult["special"];

  storeSessionId(special["sessionId"]);

  if (result === "exception") {
    throw new Error("[" + exception["ClassName"] + "] " + exception["Message"]);
  }

  return returned;
}
```
