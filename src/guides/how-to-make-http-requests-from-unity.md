---
title: "How to make HTTP requests from Unity"
url: "guides/how-to-make-http-requests-from-unity"
tags: []
author: "Jiří Mayer"
datePublished: null
dateUpdated: null
---

There are many reasons why you might want to interact with the Web from your Unity game. You may want to redirect your player to your website, download configuration data from your website, create a Discord bot, store user-generated content, or implement a chat or a real-time notification service. Each of these usecases has different requirements and thus should be solved by the best-fitting tool Unity provides. This article helps you with choosing the right tool.


## What is HTTP and what it allows

> **Note:** If you know what the following HTTP terms are, you may skip this section: client, server, request, response, method, status code, request body, URL, query parameters, headers, body, JSON.

...

- tcp
- http
- methods
- browsers, redirects
- APIs
- JSON, query, etc


## Open a website with `Application.OpenURL`

just to open a website in the "default browser"


## Making requests with `UnityWebRequest`

- this is what you want to use most of the time
- show the basic syntax in a coroutine
- link to the advanced article


## The `WWW` class is obsolete

- just don't use it


## The C# .NET ecosystem with `HttpClient` and `HttpWebRequest`

- works only on some platforms, definitely not on WebGL
- use only when you want solid SSE? maybe?????, but it will be used underneath unity anyways
- when you know how to use it or use some library that relies on it


## Asset Store solutions

- most of them are crap, they just polish the API
  - they are just wrappers around `UnityWebRequest`, some good, some bad
- the *Best HTTP/2* is a beast if you are super PRO (socket.io, signalR, SSE)


## For advanced needs

webgl, SSE, ...


### Desktop and mobile

- use TCP, UDP, third-party library that uses those, etc...


### WebGL

- interop with javascript and then use `fetch` (or jQuery, axios, XMLHttpRequest)
  - it is used by `UnityWebRequest` anyways
- useful for SSE or WebSockets, when wanting the native experience


## Things to know about


### CORS on WebGL


### Firewall on desktop platforms

not a problem most of the time, but might be!


### Non-standard ports blocked on public Wi-Fi

might be blocked by the router (in trains, cafes, etc.)


### Android internet access permission

not a problem anymore, but may for old devices

https://stackoverflow.com/questions/2378607/what-permission-do-i-need-to-access-internet-from-an-android-application


## Conclusion

...
