---
title: "Mail"
titleHtml: "Mail"
url: "docs/mail"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: "2020-09-01"
dateUpdated: null
---


You can send emails via external services, such as [Mailgun](https://www.mailgun.com/), [Mailchimp](https://mailchimp.com/) or [SendGrid](https://sendgrid.com/). Unisave currently has no encapsulating API for all of these services so you need to read through their HTTP API and make requests yourself using the [Unisave HTTP Client](http-client).

The following is a short tutorial on how to send emails via Mailgun:

> **Info:** Mailgun documentation will guide you through the process of setting up a mailgun account, verifying a domain and sending emails via HTTP requests: https://documentation.mailgun.com/en/latest/user_manual.html


## Plain text emails

Before you start making requests towards Mailgun, you need to store API key and other values in your [environment](environments):

```bash
MAILGUN_API_KEY=secret
MAILGUN_API_DOMAIN=api.eu.mailgun.net
MAILGUN_GAME_DOMAIN=my-game.com
```

Now you can load those values from the environment and use them to make an HTTP request towards the Mailgun API:


```cs
var key = Env.GetString("MAILGUN_API_KEY");
var apiDomain = Env.GetString("MAILGUN_API_DOMAIN");
var gameDomain = Env.GetString("MAILGUN_GAME_DOMAIN");

var response = Http.WithBasicAuth("api", key)
    .WithFormBody(new Dictionary<string, string> {
        ["from"] = "My Game <noreply@my-game.com>",
        ["to"] = "some-email@example.com",
        ["subject"] = "Reset password code",
        ["text"] = 
            $"Your code for resetting password is: {code}\n" +
            $"If you didn't want to reset your password, " +
            $"ignore this email."
    })
    .Post($"https://{apiDomain}/v3/{gameDomain}/messages");

response.Throw(); // throws when the response is not "200 OK"
```

> **Warning:** Make sure you use proper Mailgun API domain. Mailgun uses `api.mailgun.net` in their documentation but if you register your game domain to be in the EU, you need to use `api.eu.mailgun.net` instead.


## Email from template

Mailgun lets you create email templates on their website that can be dynamic - they let you to insert dynamic values into the template at the time of sending.

```cs
var key = Env.GetString("MAILGUN_API_KEY");
var apiDomain = Env.GetString("MAILGUN_API_DOMAIN");
var gameDomain = Env.GetString("MAILGUN_GAME_DOMAIN");

var response = Http.WithBasicAuth("api", key)
    .WithFormBody(new Dictionary<string, string> {
        ["from"] = "My Game <noreply@my-game.com>",
        ["to"] = "some-email@example.com",
        ["subject"] = "Reset password code",
        ["template"] = "password-reset",
        ["h:X-Mailgun-Variables"] = new JsonObject {
            ["playerName"] = "John Doe",
            ["resetCode"] = code
        }.ToString()
    })
    .Post($"https://{apiDomain}/v3/{gameDomain}/messages")

response.Throw(); // throws when the response is not "200 OK"
```
