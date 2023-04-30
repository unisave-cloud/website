---
title: "Entities"
url: "docs/entities"
tags: []
author: "Jiří Mayer"
datePublished: "2021-02-12"
dateUpdated: "2021-02-12"
---

## Introduction

An *entity* is a small collection of data that can be stored in the database. It's analogous to a row in a relational database or a document in a NoSQL database, however, it has some additional benefits. Each entity has a type that determines its attributes and each attribute holds the actual data. Entities are designed to interface neatly with the C# source code of your game.


## Declaration

Inside your `Backend/Entities` folder right-click and choose `Create > Unsiave > Entity`. Type in the entity name `PlayerEntity`. A file with the following content will be created:

