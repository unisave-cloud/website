---
title: "Push Notifications"
titleHtml: "Push Notifications"
url: "docs/push-notifications"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: "2020-09-01"
dateUpdated: null
---


Push notifications are a way for mobile devices to receive notifications when they're idle. Unisave does not provide support for push notifications, this page is meant to guide you towards services that do.

> **Note:** There's a lot of vagueness regarding the terminology. A *Notification* is what you see pop up in your smartphone - the UI element. A *Push Message* is a message pushed from the server that wakes up your mobile device and typically triggers a *Notification*, now called a *Push Notification*.

*This documentation page is the result of a discord discussion we had and we thought it might be useful to other people as well.*

**How do I send a push message?**<br>
You need to use a service that has the infrastructure to communicate with mobile network operators that in-turn notify your phone via the cell network, which is picked up by the operating system, which wakes up your application. It's a complicated system, somewhat described [in here](https://developers.google.com/web/fundamentals/push-notifications/how-push-works).

You can use:

- [**Firebase Cloud Messaging**](https://firebase.google.com/docs/cloud-messaging/unity/client) (by Google)
- [**One Signal**](https://onesignal.com/) (third party, also supports SMS and more)

There are definitely more, let me know if you have experience with some.


**How do I display a notification from Unity?**<br>

You can use:

- [**Official Unity package**](https://docs.unity3d.com/Packages/com.unity.mobile.notifications@1.3/manual/index.html)
- [**Third-party asset**](https://assetstore.unity.com/packages/tools/integration/mobile-notifications-156905)


**Will Unisave support push notifications?**<br>
Maybe in the future but it's more on the order of years than months. An integration with a third-party service like One Signal is more likely.
