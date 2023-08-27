---
title: "Serialization"
titleHtml: "Serialization"
url: "docs/serialization"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: "2020-09-01"
dateUpdated: null
---


Serialization is the process of converting data inside your game's memory to a format that can be stored or sent over the network. Unisave performs serialization anytime you call a facet or save an entity, so understanding its behaviour will help you get the most out of Unisave.


## Introduction

The most notable usecase of serialization is during facet calling (arguments and returned value) and entity saving (the whole entity), but serialization is also used in broadcasting and session storage - basically anywhere you need to send or store data. Unisave serializes data into the [JSON](https://www.json.org/) format as it's human readable and can be easily produced or consumed outside the world of C#.

Unisave has the `LightJson` library by Marcos López embeded. It's really light-weight and easy to use. Check it out on GitHub: https://github.com/MarcosLopezC/LightJson


## List of supported types

Knowing what types can be serialized by Unisave directly tells you what can be given to a facet as an argument (and it's not just `int` and `string`):

**Primitives**

- `null`
    - nullable types supported (e.g. `int?`, `bool?`)
- `bool`
- `int`, `long`, `short`, `byte`
    - and `ulong`, `uint`, `ushort`, `sbyte`
- `float`, `double`, `decimal`
    - including values like `NaN` and `Infinity`
    - it does NOT use the `LightJson` serialization for floats, as it doesn't support special values
- `string`, `char`
- `DateTime`
    - as an ISO8601 string: `"2021-02-10T11:19:17.394Z"`
    - timezone is not stored, so ideally store all datetimes in UTC
    - it does NOT use the `LightJson` serialization for datetimes
- `enum`
    - stored as an `int`, so make sure you [explicitly specify field values](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/builtin-types/enum)
    - *(it hinders JSON readability, but it's needed in order to support bitwise operations - enums can have values not explicitly listed in the declaration)*
- `LightJson` types (`JsonValue`, `JsonObject`, `JsonArray`)

**Collections**

- arrays (`int[]`, `string[]`)
- collections (`List<T>`, `Dictionary<TKey, TValue>`)
    - also `Query<T>`, `Stack<T>`, `HashSet<T>`, `SortedSet<T>`, `LinkedList<T>`
    - also `SortedDictionary<TKey, TValue>`, `SortedList<TKey, TValue>`

**Exceptions**<br>
Unisave can also serialize exceptions. Most exceptions can be serialized and deserialized easily as they implement the `ISerializable` interface. Those that don't implement the interface will still be serialized, so you can see them in the web console and track down all the bugs. If an exception is really weird, it may fail to deserialize. In such case an instance of `Unisave.Serialization.SerializedException` is created as a placeholder for the original exception and it contains the serialized original exception in a `SerializedValue` property of type `JsonValue`.

**ISerializable**<br>
Unisave supports the `ISerializable` interface of .NET, so types with this interface are also serialized. The only limitation is that Unisave doesn't support cyclic dependencies. If you want to control the serialization process of custom types, implement the `IUnisaveSerializable` interface instead (or in addition), as it provides a more fitting JSON API.

**Unity**<br>
Some types from the Unity engine are also implemented in the server framework to allow you to use them on the server:

- `Vector2`, `Vector3`, `Vector4`
    - also `Vector2Int`, `Vector3Int`
    - *(you can use the `Mathf` class, by the way)*
- `Color`, `Color32`

If you wish to have more types available, ping me on Discord.

**Unisave**<br>
Unisave of course supports serialization of many framework types:

- Entities
- Broadcasting messages, Subscription tickets
- `EntityReference<T>`


## User-defined types

You can create custom classes as data containers and they will serialize well:

```cs
class MyDataContainer
{
    public int foo;
    public string Bar { get; set; }
    private bool baz;
}
```

```json
{
    "foo": 0,
    "Bar": null,
    "baz": false
}
```

The serialization works by going over all the fields (public and private) and recursively serializing its values. The name of the field is taken as is. Properties are not serialized, but auto-properties have an automatically generated (by C#) private backing field. This backing field is serialized with the name of the property (see the `Bar` property in the example above).


### Default values

During deserialization, Unisave creates a new instance of your class. It tries to call the [parameterless constructor](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/constructors#parameterless-constructors) to achieve this. It has the added benefit of initializing your instance with default values. So if you decide to add a new field and give it a default value, then deserializing an old version of your class will set the new field to it's default value:

```cs
class MyDataContainer
{
    public int foo = 42;
    public string Bar { get; set; } = "Default value";
}
```

If you don't provide a parameterless constructor, then Unisave is forced to create an empty instance filled with zeros and nulls and deserialize into that. This means that any fields that are not present in the given JSON will not be filled out in the instance and such fields will be left at zero (regardless of the default value specified in the C# code).


### Attributes

You can easily alter the serialization behaviour by adding special attribtues to fields (or auto-properties).

You can serialize a field under a different name using the `[SerializeAs(...)]` attribute:

```cs
using Unisave;

class MyDataContainer
{
    [SerializeAs("asd")]
    public int foo;
}
```

```json
{
    "asd": 0
}
```

You can also omit a field from serialization by using the `[DontSerialize]` attribute:

```cs
using Unisave;

class MyDataContainer
{
    [DontSerialize]
    public int foo;

    public string bar;
}
```
```json
{
    "bar": null
}
```


### Controlling the serialization

You can take full control of the serialization process by implementing the `Unisave.Serialization.IUnisaveSerializable` interface and providing a deserialization constructor:

```cs
using LightJson;
using Unisave;
using Unisave.Serialization;
using Unisave.Serialization.Context;

class EmailAddress : IUnisaveSerializable
{
    public string name;
    public string domain;

    // deserialization constructor
    protected EmailAddress(
        JsonValue json,
        DeserializationContext context
    )
    {
        if (!json.IsString)
            throw new UnisaveSerializationException(
                "Email address is not a string."
            );

        string[] parts = json.AsString.Split('@');
        
        this.name = parts[0];
        this.domain = parts[1];
    }

    // serialization method
    public JsonValue ToJson(SerializationContext context)
    {
        if (name == null || domain == null)
            return JsonValue.Null;

        return name + "@" + domain;
    }
}
```

> **Note:** If the JSON value was `null`, a `null` would be returned by the serializer and no constructor would be called. If `EmailAddress` was a `struct`, a `default(EmailAddress)` would be returned instead of `null`.

The two methods also get a context object. This object describes the context in which the (de)serialization takes place and you can alter the behaviour based on that (for example, entities, when being sent outside the server, can have certain sensitive attributes stripped).


## Using the serializer directly

You can access the Unisave serializer directly via the `Unisave.Serialization.Serializer` static class. Therefore you can use it to store structured data on your client (say to `PlayerPrefs`) or create JSON payloads for HTTP requests and such.

To serialize data, use the `ToJson` or `ToJsonString` methods:

```cs
var data = new PlayerEntity() {
    name = "John",
    coins = 420
};

JsonValue json = Serializer.ToJson(data);
Debug.Log(json["name"].AsString); // John
Debug.Log(json["coins"].AsInteger); // 420

string jsonString = Serializer.ToJsonString(data);
Debug.Log(jsonString); // {"name":"John","coins":420}
```

To deserialize data, use the `FromJson<T>` or `FromJsonString<T>` methods:

```cs
PlayerEntity p1 = Serializer.FromJson<PlayerEntity>(
    new JsonObject {
        ["name"] = "John",
        ["coins"] = 420
    }
);

PlayerEntity p2 = Serializer.FromJsonString<PlayerEntity>(
    "{\"name\":\"John\",\"coins\":420}"
);
```

> **Note:** You can also specify (de)serialization contexts as an additional argument.


## Serializing third-party types

Sometimes you get a third-party type that you cannot modify and add an interface implementation to. For such cases you can create a dedicated serializer class and plug it into the Unisave serializer.

```cs
using LightJson;
using Unisave;
using Unisave.Serialization;
using Unisave.Serialization.Context;

class EmailAddressSerializer : ITypeSerializer
{
    public JsonValue ToJson(
        object subject,
        Type typeScope,
        SerializationContext context
    )
    {
        EmailAddress email = (EmailAddress) subject;

        if (email.name == null || email.domain == null)
            return JsonValue.Null;

        return email.name + "@" + email.domain;
    }

    public object FromJson(
        JsonValue json,
        Type deserializationType,
        DeserializationContext context
    )
    {
        if (!json.IsString)
            throw new UnisaveSerializationException(
                "Email address is not a string."
            );

        string[] parts = json.AsString.Split('@');
        
        return new EmailAddress {
            name = parts[0],
            domain = parts[1]
        };
    }
}
```

> **Note:** `typeScope` equals `subject.GetType()`, unless you're doing polymorphism, in which case `typeScope` would be set to some "parent" type of `subject`.

To register a specific type serializer, do the following:

```cs
if (!Serializer.HasSerializerFor(typeof(EmailAddress)))
{
    Serializer.SetSerializer<EmailAddress>(
        new EmailAddressSerializer()
    );
}
```

This code snippet needs to be called at least once before you attempt to serialize or deserialize the given type. Since the Unsiave serializer is a static class, you only need to perform the registration once, during startup. But remember that there are two runtimes - the client and the server and both may need to have the serializer registered.


## Polymorphism

Polymorphism is the situation, when you have a variable of type `Animal`, but there's a `Lion` stored in it. The serialization process doesn't care about such situation, as it simply performs `Lion.ToJson(...)`. Deserialization, on the other hand, only sees some JSON and a variable of type `Animal`, but it cannot call `Animal.FromJson(...)`, as it would forget about the lion's data.

This situation has to be recognized when serializing to JSON and a special field `"$type": "Lion"` has to be added to the JSON object. This is performed automatically when the situation is recognized. But if you call the serializer on some variable, and you know it could undergo polymorphism, you need to tell the serializer:

```cs
// polymorphism
Animal myAnimal = new Lion() { ... };

// DON'T
Serializer.ToJson(myAnimal);
// {"limbs":4, "speech:"growl"}

// DO
Serializer.ToJson<Animal>(myAnimal);
// {"limbs":4, "speech:"growl", "$type": "Lion"}
```

This way the serializer recognizes that the lion is in the context of an `Animal`, not in the context of a `Lion`, and adds the `$type` field to the JSON.

> **Note:** This serialization "type context" is in the serializer code called the *Type Scope*.

Be careful with using polymorphism when storing data long-term (say, in the database), as adding the `$type` field couples the data to type names. This prevents you from easily renaming classes and moving them between namespaces later. The `$type` field contains the full type name with namespaces (`"Foo.Bar.Baz.MyType"`).


## Security


### The *don't leave server* attribute

When you create entities or custom data types, they may often contain sensitive data (e.g. password hashes, email addresses), yet you would like to have the ability to send these objects to the client without sending the sensitive data. You can use the `[DontLeaveServer]` attribute to achieve this:

```cs
public class PlayerEntity : Entity
{
    public string name;

    [DontLeaveServer]
    public string password;
}
```

> **How it works?** The serialization context, used during serialization, contains information, that the data is leaving the server. Therefore the entity serializer recognizes fields marked with the `[DontLeaveServer]` attribute and ignores them. The resulting JSON doesn't contain them anymore. When deserializing on the client, these fields are set to their deafult values.

The attribute may be added to entities or custom data types. It is ignored on types that implement `I(Unisave)Serializable` or have a specific serializer registered.


### Insecure deserialization attack

**You should never create a facet method, that takes an `object`, or `dynamic` as its argument.**

Facet methods are the public interface of your backend. It means they can be called by anyone. And since the communication happens via HTTP with serialized JSON data, someone could craft a malicious JSON payload to gain control of your server. It all comes down to polymorphism and the `$type` field.

The problem is, that an `object` variable could contain **anything**. There is a class `System.Windows.Data.ObjectDataProvider`, that when deserialized properly, can in turn start a new process and thus execute anything on your backend (giving the attacker the ability to do as much as you can do with your backend code). Luckily for you, the `ObjectDataProvider` class does not exist on the Unisave server. But it doesn't mean there isn't (or won't be) another class, that could wreak havoc on your application if deserialized.

All you have to do to prevent this, is to provide a specific type to the facet argument, say `MyCoolDataType`. This way if someone tries to sneak an `ObjectDataProvider` through, the serializer will notice that it cannot be assigned to `MyCoolDataType` and will throw an exception.

```cs
public class MyFacet : Facet
{
    // DON'T
    public void MyMethod(object argument)
    { ... }

    // DO
    public void MyMethod(MyCoolDataType argument)
    { ... }
}
```

A more general explanation of this problem can be found in this video by PwnFunction: https://www.youtube.com/watch?v=jwzeJU_62IQ


## Limitations

There are some limitations to the Unisave serializer:

**No cyclic dependencies**<br>
Data structures with cyclic references cannot be serialized, as they cannot be represent by a hierarchical data format, such as JSON.

**Not ideal for binary data**<br>
JSON is not ideal for binary data transfer, since it's a text format. Although a `byte[]` variable could be serialized, it's not ideal to serialize large amounts of data.

**Not ideal for speed**<br>
The (de)serialization process involves a lot of reflection and complex parsing, therefore it's relatively slow. It's definitely not designed to be called each frame in the `Update()` function. If you do so, exepect it to slow your game down.

**Not ideal for large volume data**<br>
The serializer is not pipelined, so the entire JSON is first built up in memory, before being converted to a string, then again, the string is in the memory as one object. For this reason, expect the serializer to consume an order of magnitude more memory, than the size of the data it serializes.

**It may throw an exception**<br>
For most data types, the serializer works perfectly fine. But if an exceptional situation occurs, the serializer will throw a `Unisave.Serialization.UnisaveSerializationException`.
