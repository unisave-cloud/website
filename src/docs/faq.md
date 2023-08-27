---
title: "FAQ"
titleHtml: "FAQ"
url: "docs/faq"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: "2020-12-19"
dateUpdated: null
---


Have a question? Search this page with `Ctrl + F`, maybe it is answered somewhere in here.

> Didn't find what you were looking for? Ask your question in our discord server: https://discord.gg/XV696Tp


## Questions

**I cannot save my entity, `.Save()` throws an exception.**<br>
Entities can only be saved in server code (facets). Only the server has access to the database.

**Why can't I access the database from the client code?**<br>
If your client code could access the database, anyone could. Not only could anyone read your entire database but also modify it, possibly destroying your data. Therefore only your server code gets to know the database login and password because nobody can tamper with the server code.

**How do I make my data secure?**<br>
Facets are the key to security. If you don't create any facets, none can access your data and thus it's 100% secure. But the system is useless. If, on the other hand, you make facets that let you read and write entire entities (e.g. `StoreEntity(PlayerEntity e)`), then your clients can do antyhing with the data but the data is effectively public and modifyable by anyone. Keep in mind that if your game can call a facet, anyone with an internet connection in theory also can.

Think of facets like the buttons on an ATM. There's no button labelled "give me X money" that trusts the user will take only as much as they should. Of course, the user has to first provide their credit card - authenticate themselves (see [authentication](authentication)). And even then the ATM will let them withdraw only as much money, as they have on their account.

**Does the player logout when the game exists?**<br>
Yes. The session ID is forgotten by the game when it exists. Which in turn acts like a logout. The session is also forgotten if there are no requests from it for the past 60 minutes.

**What are all the things I can return from a facet?**<br>
A lot of things, you are definitely not constrained to primitives. For full explanation read the [serialization](serialization) page. Everything stated there applies not only to facet return values but also to their arguments, entity fields or broadcasting messages.

**What about GDPR and my game?**<br>
*I'm no lawyer so don't take the following as absolute truth, it's more of an advice to small indie developers:*<br>
GDPR protects mainly personal information - that is any data that can identify a given person (that is an email address but also a SteamID or a combination of other indirect indicators). GDPR gives people certain rights they have over their data (e.g. to request deletion). You also have to state what data you collect, why, and how you process it. But most importantly, who you share that data with - with Unisave. You should state all this information in you privacy policy to which every user of your game should agree. To get an idea of what a privacy policy contains, read [the one Unisave has](/legal/privacy-policy).

How is this translated to actual coding and game development?<br>

- Don't be a dick and don't share personal information publicly (e.g. using [pastebin](https://pastebin.com/) as a database).
- Read about [security](authentication#sensitive-data-leakage) so you don't leak personal information by accident. 
- Make sure you could track down and erase all data about a person if they wished so. This need not be automated but the best way to do this is to give the player a button that deletes their account.

When your game gains traction, you can always pay a professional to refine your law documents and make them bulletproof.

**How should I design my entities? When should I use entity references?**<br>
To learn more about this, read the [section on entity design](entities#designing-entities).
