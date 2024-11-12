---
title: "How to use UnityWebRequest properly"
url: "guides/how-to-use-unitywebrequest-properly"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: null
dateUpdated: null
---

From simple non-crucial requests to production-level, robust requests.

How to make HTTP requests properly:

- GET small website/data
  - query parameters
- POST small data
  - json
  - form url encoded
- custom headers
- authentication
- error handling
- timeouts
- callbacks, coroutines, async-await
  - mono-behaviour lifetime
- request disposal, memory leaks
- large data volume and streaming
  - downoad
  - upload
  - progress reporting
- HTTPS i.e. SSL
  - depends on the platform
  - works ok, but old devices may have problems
