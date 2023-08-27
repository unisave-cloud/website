---
title: "Database"
titleHtml: "Database"
url: "docs/database"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: "2020-09-01"
dateUpdated: null
---


This page talks about the ArangoDB database in more detail. You should already have an idea of how [entities](entities) work before reading this, since this is a lower-level look at the system.


## Limitations of entities

Entities simplify most of the boilerplate a typical game needs. You don't need to worry about serialization, they automatically keep timestamps, you can use entity references. But ArangoDB gives us many more features and sometimes we want to have access to them. Luckily we can talk with the database at a lower level and it will give us what we want.

When you create an entity, say `PlayerEntity`, it corresponds to a database collection called `e_PlayerEntity`. Each entity is then stored in the collection as a JSON document. So in the database lingo we talk about collections and documents. You may have noticed there's a collection called `u_sessions` that is managed by the Unisave Framework. Since you have full access to the database, you can create any additional collections you want, just keep in mind that entity collections have prefix `e_` and Unisave collections have prefix `u_`.


## AQL queries

You know you can query entities like this:

```cs
var premiumPlayers = DB.TakeAll<PlayerEntity>()
    .Filter(p => p.premiumUntil > DateTime.UtcNow)
    .Get();
```

This query under the hood runs the following AQL query on the database:

```aql
FOR doc IN e_PlayerEntity
    FILTER doc.premiumUntil > "2020-12-19T15:58:43.672Z"
    RETURN doc
```

ArangoDB lets us express way more complicated queries than this. We could, for example, go over all players and gift them 1 000 free coins:

```aql
FOR doc IN e_PlayerEntity
    UPDATE doc._key WITH { coins: doc.coins + 1000 } IN e_PlayerEntity
```

Such a query cannot be expressed in C# without first getting a list of all the players and then iterating through it. Which is not possible if you have 100K players as such a list would not fit in memory and then doing 100K requests towards the database would not fit in the time budget of the request. However executing a request like this from aardvark would take less than a second to execute on 100K entities. The performance benefit of executing the update in the database is clear.

Unisave has an API that lets you run raw AQL queries from your C# code:

```cs
List<string> emails = DB.Query(@"
    FOR p IN e_PlayerEntity
        FILTER p.coins >= @threshold
        RETURN p.email
")
    .Bind("threshold", 100_000)
    .GetAs<string>();
```

This query returns a list of email addresses of players, who have more coins than a given threshold. The threshold is given to the query as a bind-variable to protect you from AQL injection.

The query can be finished by:

- `.Run()` to simply execute the query.
- `.Get()` to run the query and return a `List<JsonValue>` of results - the raw JSON data that the query returned.
- `.GetAs<T>()` this method will deseralize each returned item as the type `T` you specify.
- `.First()` returns the first result of the query or `JsonValue.Null` if no results returned.
- `.FirstAs<T>()` same as `.First()` but with deserialization.

You can first craft your query in aardvark and then copy-paste it into C#. Bind-vars will help you separate query paramters from the query logic itself. To learn more about AQL read the [ArangoDB documentation](https://www.arangodb.com/docs/stable/aql/).


### AQL-injection attack

Having the ability to write raw AQL is powerful but also dangerous.

**/!\ Don't ever do the following:**

```cs
public void LoginByEmail(string email, string password)
{
    var player = DB.Query(@"
        FOR p IN e_PlayerEntity
            FILTER p.email == '" + email + @"' // DON'T !!!
            RETURN p
    ")
        .FirstAs<PlayerEntity>();

    // ... check password ...
}
```

What if someone tried to login with this email: `' REMOVE p IN e_PlayerEntity; //`? They would delete all your players!

This is why bind-vars exist. So use them:

```cs
public void LoginByEmail(string email, string password)
{
    var player = DB.Query(@"
        FOR p IN e_PlayerEntity
            FILTER p.email == @email
            RETURN p
    ")
        .Bind("email", email) // DO THIS
        .FirstAs<PlayerEntity>();

    // ... check password ...
}
```

How would an attacker know what code to write there?

- Guess it, it's not that difficult.
- Disassebmle your game - it contains the server-side code otherwise you couldn't use entities in your game client. It's so easy a child could do it, check out [ILDASM](https://docs.microsoft.com/en-us/dotnet/framework/tools/ildasm-exe-il-disassembler) and give it your `Assembly-CSharp.dll` (it's in the build folder of your game).

And destroying your database is the least harm someone could cause you. They could easily steal other players' accounts by changing their password hashes, scraping email addresses, etc... And you wouldn't even notice!


## Indexes

ArangoDB lets you add indexes onto certain fields that speed up many lookup and range queries. For example during login, you try to find a player with a given email. Without an index the database goes through all the players checking them one by one until it finds one matching. If you were to add a persistent index onto the `email` field of the `e_PlayerEntity` collection, the database would use the index to find the player incredibly quickly. Similar situation happens when querying entity references (not following a reference but tracing back all references that point to a given entity).

But unless you have 10K player registered, you don't really need to worry about this. ArangoDB lets you add indices onto existing collections so you can add the index and check analytics to see whether the average request execution duration for the login request went down, and by how much. The disadvantage of indexes is that they take up disk space and slow down writes.

ArangoDB has also some special indexes, like TTL (time-to-live) that automatically delete old documents. Such an index is used in the `u_sessions` collection to automatically delete old sessions.

Read more about indexes in the [ArangoDB documentation](https://www.arangodb.com/docs/stable/indexing.html).


## Multi-model database

> Nice tutorial that quickly shows and explains all the features of ArangoDB:
>
> <iframe width="560" height="315" src="https://www.youtube.com/embed/4C4zqhXwCKs" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

ArangoDB is a multi-model database, which means you can model data in many different ways. So far you've seen entities with references - that is called relational modelling and it is the way you work with traditional database systems ([MySQL](https://www.mysql.com/), [SQLite](https://www.sqlite.org/)).

You can also specify `_key` of a document when you're inserting it. A collection can then be thought of as a key-value store (like enormous `PlayerPrefs` in Unity). Suddenly you have string keys that identify some JSON documents. This modelling could, for example, be used if you wanted to store a 2D world in chunks. Each chunk has coordinates - the key, and is stored in a collection under that key (think of games like [OGame](https://en.wikipedia.org/wiki/OGame)). Other database systems that use this modelling approach are [Redis](https://redis.io/), [Riak](https://riak.com/) or [Memcached](https://memcached.org/).

There is also a special type of collection, called edge-collection. Such a collection is meant to store edges between documents in other collections. An edge is just another document, with mandatory fields `_from` and `_to`. This way we can model graphs - collections of edges and vertices. ArangoDB then gives us interesting tools to query such graphs (like finding the shortest path between two vertices, etc...). You can read the [ArangoDB documentation on graphs](https://www.arangodb.com/docs/stable/graphs.html) to learn more. Another database system focusing on graph modelling is [Neo4j](https://neo4j.com/).

Lastly, ArangoDB lets you create fulltext indexes that are designed to handle text-related queries (searching a documentation for a keyword, searching a blog for a topic, etc...). This lets you build functionality similar to what [Elasticsearch](https://www.elastic.co/elasticsearch/) provides.

As you can see, ArangoDB is a modern and versatile tool that can help you solve many different data-related problems.

> **Foxx microsevices:**<br>
> Although ArangoDB lets you build javascript microservices right on top of the database, Unisave does not provide this functionality to you. This is beacuse the logic you would write into these services is the logic you should place into your game backend. If you know how to write foxx microservices then why use Unisave? Or you can have an on-premise database and link it up with Unisave via environment variables. Also an option.
