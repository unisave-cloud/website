---
title: "HTTP Client"
titleHtml: "HTTP Client"
url: "docs/http-client"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: "2020-09-01"
dateUpdated: null
---


Unisave provides a thin wrapper around the .NET `HttpClient` that lets you easily make HTTP requests to external web services.


## Making requests

To make requests, you may use the `Get`, `Post`, `Put`, `Patch` and `Delete` methods. An example `GET` request is as easy as:

```cs
using Unisave.Facades;

var response = Http.Get("http://test.com");
```

You can then inspect the response:

```cs
// content
response.Body(); // string
response.Json(); // JsonObject
response.Form(); // Dictionary<string, string>
response.Bytes(); // byte[]

// status
response.Status; // int
response.IsOk; // true when status is 200
response.IsSuccessful; // true when status is 2xx
response.Failed; // true when status is 4xx or 5xx
response.IsClientError; // true when status is 4xx
response.IsServerError; // true when status is 5xx

// headers
response.Header("Content-Type"); // string
```

If the response is `application/json` or `application/x-www-form-urlencoded`, an indexer access can be used:

```cs
// get title of the latest news item for Team Fortress 2
return Http.Get(
    "https://api.steampowered.com/" +
    "ISteamNews/GetNewsForApp/v2/" +
    "?appid=440&count=1"
)["appnews"]["newsitems"][0]["title"];
```


### Request data


#### POST request with JSON body

It's common to send request body with a `POST` request. The most common body type is a JSON object:

```cs
using LightJson;

var response = Http.Post(
    "http://test.com/do-something",
    new JsonObject {
        ["foo"] = "bar",
        ["baz"] = 42
    }
);
```

> **Info:** Methods `PUT`, `PATCH` and `DELETE` also support this approach.



#### GET request with query parameters

Instead of appending the query string directly to the URL (authough you still can), you can pass it as a dictionary via the second argument:

```cs
var response = Http.Get(
    "http://test.com/query-something",
    new Dictionary<string, string> {
        ["foo"] = "bar",
        ["baz"] = "42"
    }
);
```

> **Info:** Giving a `Dictionary<string, string>` as a second argument to other methods (`POST`, `PUT`, `PATCH` and `DELETE`) will send it as an form URL encoded body.


#### Specifying request body in advance

You can specify the request body before you send the request:

```cs
// JSON
var response = Http.WithJsonBody(
    new JsonObject {
        ["foo"] = "bar",
        ["baz"] = 42
    }
).Post("http://test.com/do-something");

// Form URL encoded
var response = Http.WithFormBody(
    new Dictionary<string, string> {
        ["foo"] = "bar",
        ["baz"] = "42"
    }
).Post("http://test.com/do-something");
```


#### Sending raw `HttpContent`

If you want to send a different body, you can always fallback to the [.NET HttpContent class](https://docs.microsoft.com/en-us/dotnet/api/system.net.http.httpcontent):

```cs
using System.Net.Http;

var response = Http.WithBody(
    new StringContent(
        "Hello!",
        Encoding.UTF8,
        "text/plain"
    )
).Post("http://test.com/do-something");
```


### Headers

You can add additional headers to the request using the `WithHeaders` method:

```cs
var response = Http.WithHeaders(
    new Dictionary<string, string>(
        ["X-First"] = "foo",
        ["X-Second"] = "bar"
    )
).Post("http://test.com/do-something");
```


### Authentication

You may add authentication information via the HTTP basic authentication scheme or the OAuth 2.0 bearer token scheme:

```cs
var response = Http
    .WithBasicAuth("username", "password")
    .Post(...);

var response = Http
    .WithToken("token")
    .Post(...);
```


### Error handling

Unisave HTTP client does not throw exceptions on client or server errors (`4xx` or `5xx` status codes).
You can check for the error using the following properties:

```cs
response.Status; // int
response.IsOk; // true when status is 200
response.IsSuccessful; // true when status is 2xx
response.Failed; // true when status is 4xx or 5xx
response.IsClientError; // true when status is 4xx
response.IsServerError; // true when status is 5xx
```

If you, however, do want to throw an exception in such case, you can call the `Throw` method. This method will, of course, not do anything if the request was successful.

```cs
var response = Http.Post(...);

response.Throw();

return response["foo"]["bar"];
```

The method will throw an instance of `System.Net.HttpRequestException`.

The method also returns the response itself so it can be chained:

```cs
return Http.Post(...).Throw().Json()["foo"]["bar"];
```


### The underlying .NET instance

Whenever you have an instance of a request or a response, you can access the respective `HttpRequestMessage` and `HttpResponseMessage` via the `.Original` property:

```cs
var response = Http.Get(...);

response.Original.StatusCode; // 404
response.Original.ReasonPhrase; // "Not found"
```


## Testing

This section is related to automated testing of your backend. Read the [testing page](testing) to learn more.

The `Http.Fake(...)` method allows you to return dummy responses when requests are made.


### Faking responses

For example you can return an empty `200` status code response for every request made just by calling the `Fake` method without any arguments:

```cs
Http.Fake();

var response = Http.Post(...);
```

You can also fake only a specific URL and specify the response to be returned:

```cs
Http.Fake("github.com/*", Http.Response(new JsonObject {
    ["foo"] = "bar"
}, 200));

Http.Fake(
    "google.com/*",
    Http.Response("Hello!", "text/plain")
);
```

You can also fake response headers:

```cs
Http.Fake("google.com/*",
    Http.Response(
        new JsonObject(),
        200,
        new Dictionary<string, string> {
            ["X-Header"] = "value"
        }
    )
);
```

Again, if you omit the URL address, it will fake all requests:

```cs
Http.Fake(
    Http.Response(...)
);
```


#### Response sequences

Sometimes you want to return a sequence of responses from a URL. You can use the `Http.Sequence()` method for that:

```cs
Http.Fake(
    Http.Sequence()
        .Push("Hello!", "text/plain", 200)
        .Push(new JsonObject {...}, 200, headers)
        .PushStatus(404)
);
```

When all the responses have been consumed, any furter requests will throw an exception. You may, however, specify a default response that should be returned when the sequence is empty, you may use the `WhenEmpty` method:

```cs
Http.Fake(
    Http.Sequence()
        .Push(...)
        .Push(...)
        .WhenEmpty(Http.Response(...))
);
```

But if you want to return just a plain `200` empty response, you can simplify it to:

```cs
Http.Fake(
    Http.Sequence()
        .Push(...)
        .Push(...)
        .DontFailWhenEmpty()
);
```


#### Fake callback

If you require more complicated logic to determine what responses to return, you may pass a callback to the faking method. This callback will receive an instance of `Unisave.Http.Client.Request` and should return a response instance.

```cs
Http.Fake("test.com/*"
    request => {
        string name = request["name"];
        return Http.Response($"Hello {name}!");
    }
);
```

> **Note:** If the callback returns `null`, it will be ignored and the next callback in the row will be called. This continues until there are no more callbacks and then the request gets sent for real. All the faking methods described above actually just register callbacks under the hood.


### Inspecting requests

When faking responses, you may sometimes want to inspect the requests that have been made in order to check that your backend is sending the correct data or headers. You may acomplish this by calling the `Http.AssertSent` method after calling `Http.Fake`.

The `AssertSent` method accepts a callback which will be given an instance of a `Unisave.Http.Client.Request` and it should return a boolean value indicating if the request matches your expectations. In order for the test to pass, at least one request must have been issued matching the given expectations:

```cs
Http.Fake();

Http.WithHeaders(new Dictionary<string, string> {
    ["X-First"] = "foo"
}).Post("http://test.com/players", new JsonObject {
    ["name"] = "Bob",
    ["coins"] = 123
});

Http.AssertSent(request =>
    request.HasHeader("X-First", "foo") &&
    request.Url == "https://test.com/players" &&
    request["name"] == "Bob" &&
    request["coins"] == 123
);
```

You may also assert that a specific request was not sent:

```cs
Http.AssertNotSent(request =>
    request.Url == "http://test.com/foo"
);
```

Or you might want to check that no requests were sent at all:

```cs
Http.AssertNothingSent();
```
