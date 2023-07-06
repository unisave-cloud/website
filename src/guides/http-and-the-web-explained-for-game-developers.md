---
title: "HTTP and the Web explained for game developers"
titleHtml: "<em>HTTP</em> and <em>the Web</em> explained<br>for game developers"
url: "guides/http-and-the-web-explained-for-game-developers"
tags: ["http"]
author: "Jiří Mayer"
datePublished: null
dateUpdated: null
---


It is not usual for a game developer to be well-versed in the web and its inner workings, but today, games often interact with web services to become more connected with their players. Discord bots, email newsletters, cloud file storage, and in-app purchases are just some of the features that require integration with external web APIs. This article will explain the basics needed to understand such integrations.


## The HTTP protocol

*Hypertext Transfer Protocol* (HTTP) is the communication protocol used by most of the Web (the Web = all the websites out there and their interlinking). It is built on top of a simpler protocol, called TCP. Let's first start with TCP:

*Transmission Control Protocol* (TCP) lets two applications on two different computers communicate, by creating an illusion of a two-way communication channel between them. The communication channel can be viewed as a two-track railway - one in one direction, the other in the other direction. Each of the two applications can send bytes (binary data) out to the other side, while simultaneously listening for incomming data. The technical details of how the data is split up into packets and sent over the network are not important, what is important is that each side can just dump a list of bytes into the connection and it will emerge on the other end, complete, and in the correct order.

HTTP is built on top of TCP and defines that:

1. The binary data will be interpreted as text in the ASCII encoding. Another words, we will think of the connection as sending text, not bytes.
2. The one who initiates the connection (called *the client*, typically your computer) will send data first and this first batch of data is called *the request*.
3. The one who was waiting for connections (called *the server*, say `example.com`) will read the entire *request* and then respond with a block of data, called the *response*.
4. Then the underlying TCP connection is closed by both sides.

> **Note:** This is a simplification, if you want to be pedantic, [read this instead](https://www.w3.org/Protocols/rfc2616/rfc2616.html).

The most common usecase is to download web pages from web servers. When we enter `https://example.com/` into a web browser (Chrome, Safari, Firefox, ...), this is roughly what happens:

1. The `https://` part is understood as "Open an HTTP connection, that will be encrypted via SSL". I won't go into the encryption part as it's not important for HTTP itself.
2. The `example.com` part is used to find the one computer on the internet that it identifies and the browser opens a TCP connection to it. The other side is already running and waiting for connections. This part of the address is called *the hostname*, because the waiting machine is sometimes called *the host*.
3. The browser sends *the request*, specifying that it wants to view the web page at `/`.
4. The server sends *the response*, containing some metadata and then the web page file.

The CURL command, available in Linux and Mac, can be used to see the sent text.

```bash
curl -v https://example.com/
```

The text of the HTTP request is this:

```
GET / HTTP/1.1
Host: example.com
User-Agent: curl/7.58.0
Accept: */*
                          <- empty line
```

The `GET` keyword specifies the request *method*, i.e. that we want to view the web page (not upload, delete, or modify).

The slash `/` is path to the page to view and it is the part of the URL after the server name.

The text `HTTP/1.1` specifies the protocol version. Version 1.1 is the version desribed in this article and other versions are used very rarely.

Then there is a list of so-called *headers*, one on each line. The `Host` header tells the server that we access the server under the name `example.com` (because there might be multiple websites on one machine and it needs to distinguish somehow). The `User-Agent` header tells the server, what web browser is making the request (Chrome, Firefox, or CURL in our case).

The list of headers is terminated by an empty line. After that line there may be a *body*, but since we aren't uploading anything to the server, the body is empty.

When the server receives this, it sends back *the response*:

```
HTTP/1.1 200 OK
Age: 315842
Cache-Control: max-age=604800
Content-Type: text/html; charset=UTF-8
Date: Mon, 03 Jul 2023 17:22:45 GMT
Etag: "3147526947+ident"
Expires: Mon, 10 Jul 2023 17:22:45 GMT
Last-Modified: Thu, 17 Oct 2019 07:18:26 GMT
Server: ECS (dcb/7F3C)
Vary: Accept-Encoding
X-Cache: HIT
Content-Length: 1256

<!DOCTYPE html>
<html>
<head>
    <title>Example Domain</title>
    ...lots of code here...
</head>
<body>
<div>
    <h1>Example Domain</h1>
    <p>This domain is for ...</p>
</div>
</body>
</html>
```

The first line contains the text `200 OK`. This is the *status code* and *status message*. You may, for example, know the status code `404 Not Found`. It tells the client, whether was the request fulfilled or not.

- `2xx` codes mean success
- `3xx` are redirections to some other URLs that the browser typically follows automatically
- `4xx` are problems with the request (the client is asking for something non-sensical)
- `5xx` are problems with the server (there is some crash/outage on the server-side)

The full list of status codes is available on the [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status).

Then there are response headers, specifying metadata about the requested web page. The two most interesting are the `Content-Type` and `Content-Length`. The `Content-Type` header specifies that the *response body* (the text below the empty line) is a `text/html` file encoded in the UTF-8 text encoding. The `Content-Length` header states the length of the *response body* in bytes (not text characters). When the headers and the empty line are read, the browser reads the specified number of bytes from the underlying TCP connection and then interprets them according to the content type. This way we can send binary data (like images) over HTTP as well.


## URLs

The text you type into a web browser (e.g. `https://example.com/`) is called a *Uniform Resource Locator* (URL). We already talked about it a bit and I would like to explain its structure right of the server name.

When we access a page at `https://example.com/forum/post/42` we call this part *the path*:

```
/forum/post/42
```

It behaves like a path in a file system, but typically does not correspond to any files on the server filesystem. Here, the number `42` is an ID of an article, that is actually stored in some database. But the similarity is exploited in some cases to make URLs easier to understand:

```
/forum/post/42/title-image.jpg
```

The path might also contain something, called *the query*. It starts with the `?` symbol and then contains `key=value` pairs separated by an ampersand `&`:

```
/forum/post?page=2&count=20
```

The URL above displays a dynamic web page, that shows 20 posts at a time and we are looking at the second page out of all the posts.

The URL might also contain a hash `#`, but that is typically used to identify elements inside a web page, to which the browser should scroll after loading the page.

Since the characters `?#&=/` have special meaning, we have to replace them with escape characters when we want to use them in the URL. This process is called *url encoding*, and you might come across terms like a *url-encoded string*. Below is an example of what URL-encoding looks like:

```
RAW TEXT: Marks & Spencer
ENCODED:  Marks%20%26%20Spencer
```

Notice that space is encoded as `%20` and the ampersand as `%26`. Space can also be encoded as `+`, which is more readable.


## Web APIs

So far, we've only seen how the HTTP protocol is used to display web pages. But the web server may send back any data.

If you visit this URL:

```
https://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml
```

you will see the today's exchange rates of EUR to other currencies as announced by the European Central Bank:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<gesmes:Envelope
  xmlns:gesmes="http://www.gesmes.org/xml/2002-08-01"
  xmlns="http://www.ecb.int/vocabulary/2002-08-01/eurofxref"
>
  <gesmes:subject>Reference rates</gesmes:subject>
  <gesmes:Sender>
    <gesmes:name>European Central Bank</gesmes:name>
  </gesmes:Sender>
  <Cube>
    <Cube time="2023-07-04">
      <Cube currency="USD" rate="1.0895"/>
      <Cube currency="JPY" rate="157.34"/>
      <Cube currency="BGN" rate="1.9558"/>
      ...
    </Cube>
  </Cube>
</gesmes:Envelope>
```

The returned text is an XML document and it is easy to read and navigate by a machine. URLs that are designed to be read by a machine instead of humans are called an API (application programming interface). They are an *interface* (a way to communicate), that is designed for someone, who is *programming an application*.

URLs that are a part of some API are usually designed to be flexible and so they often accept lots of query parameters. We could have an API that lets us specify the date for which the exchange rate is returned and the format (other than XML):

```
https://my-bank.com/exchange-rates/eur?date=2023-07-04&format=csv
```


## JSON

While XML is widely used, it's a bit too verbose and complicated for most cases, so many APIs (Facebook's, Twitter's, Discord's, Steam's) use a format called JSON. We could represent the exchange rates above using the following JSON document:

```json
{
  "date": "2023-07-04",
  "rates": {
    "USD": 1.0895,
    "JPY": 157.34,
    "BGN": 1.9558
  }
}
```

JSON stands for *Javascript Object Notation*, so the syntax is quite similar to certain parts of C# (since both languages used C as inspiration). We can represent numbers, booleans, strings, objects (dictionaries), arrays, and the value `null`.

When JSON is transfered over HTTP, the `Content-Type` header is set to `application/json`. Many APIs are designed to send JSON documents as responses to everything, including errors. You might get a `404 Not Found` response, with a JSON body:

```json
{
  "status": 404,
  "message": "The post with ID 42 does not exist."
}
```


## Uploading data

Sometimes you may want to send data to a web server, instead of downloading it. For example, posting a message to Discord via a Discord bot webhook. When you create a webhook bot in Discord, you get a URL similar to this:

```
https://discord.com/api/webhooks/9513435431951/Liaa5j42ei3-4ke39-23
```

The number `9513435431951` is the ID of the webhook and the string `Liaa5j42ei3-4ke39-23` is an authentication token of the webhook (basically a password).

In the beginning of this article I said that the *HTTP request* sent from the client can contain a body. This is true, but only if the *HTTP method* of the request is not `GET`. HTTP protocol provides these methods:

- `GET` is used for getting information about server-side objects. This method is used by the browser every time you enter a URL and hit enter.
- `POST` is used to create a new instance of something (a Discord message in our case). This is typically the method you use when you want to upload some data and are not sure which method to choose.
- `PUT` is used to update something by replacing it completely.
- `PATCH` is used to update something by only modifying specified fields.
- `DELETE` is used to delete stuff.

> **Note:** For more information, see the [Mozilla Developer Network](https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods).

The meaning of these methods is completely up to the web server. You could use the `DELETE` method to create new entities, but it would be confusing. Therefore the meaning I outlined is roughly followed in most cases.

The only technical difference between the methods is that `GET` is not allowed to have a body, while the others may, or may not have a body.

If we look at the documentation of the [Discord API](https://discord.com/developers/docs/resources/webhook#execute-webhook), we see that we should use the `POST` method.

The body of the request will contain the message to create and it will look roughly like this:

```json
{
  "username": "My discord bot",
  "content": "Hello world!"
}
```


## Form URL encoded

Nowadays, most APIs use JSON for both returning and uploading data, but in the early days of the World Wide Web, data uploading was only performed via HTML forms (using the `<form>` tag).

[HTML forms](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form) can be used to create, say a login form, with a username field and a password field. When this form is submitted, the browser sends a `POST` request to a specified URL and sends the form contents in the request body.

To be consistent with the URL query parameters (and reuse the existing encoding logic in browsers), the data encoding designed for this used the same format:

```
username=John%20Doe&password=secret123
```

This format is called the *form URL encoded* format and it is still widely used on the web. Many APIs support this format exclusively, or in addition to JSON. The Discord API also supports this format.

Since the HTTP request contains the `Content-Type` header, it is used by the server to parse the body accordingly:

- `application/json` the body is JSON
- `application/x-www-form-urlencoded` the body is form URL encoded

This format is ideal for the simplicity of integration with HTML forms, but it has difficulties encoding arrays and dictionaries, so it's not ideal for complex data. You will probably not use the format in your game, but you should know it exists.


## REST

We started with URLs that represented web pages. Then we saw a URL that returned some data. Then a URL that represented a Discord webhook. When interacting with an API, you will have lots of "things" like users, messages, addresses, posts. It is common to call these things *resources*.

> **Note:** That's why URL is a *Uniform \*Resource\* Locator*.

APIs are typically structured around these resources in a way that makes sense:

- `GET /users` lists all users
- `GET /users/42` shows the user with ID 42
- `POST /users` creates new user, defined in the request body
- `DELETE /users/42` deletes the user 42
- `PATCH /users/42` modifies the user 42 (say, changing its nickname)

When people talk about a *REST API*, they typically mean the URLs are structured in this way and the meaning of HTTP methods (`GET`, `POST`) is the one explained earlier.

An API that wouldn't be considered REST-like, could look like this:

- `GET /list-users`
- `POST /create-user`
- `GET /show-user?id=42`
- `POST /delete-user?id=42`

REST technically means something greater and more abstract, but most people mean this, when they say the word, so you can start with that.


## Authentication and authorization

So far, we have not considered restricting URL access only to some users. In practise, this happens all the time.

The process of identifying a user is called *authentication*. You probably know authentication by username and password. The username specifies who you are, and the password proves it. When the web server receives the two values, it can be certain it's you, who is making the request.

*Authorization* is then the process of giving access only to some users (and which access to whom).

If you don't have access to a URL, the server will respond with one of these status codes:

- `401 Unauthorized` (the most common one)
- `403 Forbidden`
- `404 Not Found`

When a URL is not available to everyone, there are a few options how the server might want to receive your identity:

- In the URL (tokens and signatures)
- In an HTTP header (basic auth and bearer tokens)
- In a cookie


### URL

The simplest option is to put the identity into the URL. The Discord webhook example used this approach. There, a webhook ID together with a token acted like a username and a password. This is mostly used for singular URLs meant for one purpose.

> **Note:** Since APIs aren't used by humans, we don't use the word "password", but instead the word "token" or "key". Both a token or a key (they mean the same thing) can fulfill the purpose of both the username and password, or just the password alone. You might also stumble on terms like "API key", "access token", "authentication token", which again mean the same thing.

Sometimes an API might give temporary access to a resource in the form of a signed URL. That's a URL that contains a signature and an expiration date. Such URLs can be used by anyone, since they require no authentication and are ideal for:

- sharing an upload link (into a file storage)
- allowing temporary action (like password reset links in email)


### Header

When we interact with APIs that consist of many URLs, a more systematic approach using HTTP headers is used.

Some APIs support the [HTTP Basic Auth](https://datatracker.ietf.org/doc/html/rfc7617) scheme. It works by setting the `Authorization` header to this value:

```
Authorization: Basic am9objpzZWNyZXQxMjM=
```

The `Basic` keyword specifies the scheme to be the *HTTP Basic Auth*. The string is a [base64](https://en.wikipedia.org/wiki/Base64) encoding of the username, colon, and the password:

```
USERNAME: john
PASSWORD: secret123
JOINED:   john:secret123
ENCODED:  am9objpzZWNyZXQxMjM=
```

There is also the [Bearer Token HTTP Auth](https://datatracker.ietf.org/doc/html/rfc6750) scheme, which instead of a username-password pair sends a single token that acts as both:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
```

There are many kinds of tokens that may be used, but one interesting kind is the [JSON Web Token](https://jwt.io/) (JWT). This token contains information about the user that you can decode and use. There might be the user ID and a list of privileges the user has.

The token contains a signature that can be verified and it makes the token secure. Only the web server that generated the token can create the signature and thus the information in the token cannot be faked (because the signature wouldn't match).

The token is generated by the server during login and has and expiration time after which it is no longer valid (effectively acting as the logout). You might request a URL like `POST /login` and provide the username and password, and the server sends back a new JWT token that you can use for further API calls.

Lastly, authentication can be performed via cookies (which are special HTTP headers sent with each request), but this is rarely used in APIs. It's used mostly in human-oriented web pages so I will not cover it here. But also, it's very similar to the bearer token scheme, we just call the token a *session ID*.


## Conclusion

After reading this article you should be able to understand documentation of various web services, like the [Discord API](https://discord.com/developers/docs/reference). While I didn't cover things in great detail, I think I mentioned everything important for a beginner. If you would like to learn more about specific concepts, the [Mozilla Developer Network](https://developer.mozilla.org/) is a great resource to check out.
