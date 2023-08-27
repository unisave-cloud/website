---
title: "Workflow"
titleHtml: "Workflow"
url: "docs/workflow"
image: NO_IMAGE
tags: []
author: "Jiří Mayer"
datePublished: "2020-07-20"
dateUpdated: null
---


## Backend folder

*Facets* and *entities* are objects that live on the server. Your backend server is represented by a folder called `Backend` located right inside the assets folder. Any code you put into this folder will be executed by Unisave in the cloud.

> **Tip:** To quickly create the `Backend` folder, simply right-click the assets folder and choose `Create > Unisave > Backend folder`.

<img src="backend-folder.png">


## Backend uploading

The `Backend` folder is located inside your Unity project. It needs to get to the cloud to be available to Unisave. This process is called *backend uploading*. When you modify the contents of the `Backend` folder, the changes will be uploaded to the Unisave cloud. This way Unisave always has the latest version of your server code to run.

> **Tip:** Automatic uploading can be disabled in Unisave preferences, which is handy when you lack an internet connection, for example.

<img src="backend-uploading.png">


## Development console

The *development console* in the [web application](https://unisave.cloud/app/) is a useful tool during development.

<img src="development-console.png" class="with-border">

It shows you the most recent requests made so you can inspect them to see what is happening. It also shows the list of uploaded backends so you can diagnose problems with backend uploading and see any server-compilation errors. But most importantly, the green button on the left gives you access to the *editor assigned database* - the database that your Unity editor talks to:

<img src="aardvark.png">

Unisave uses the [ArangoDB](https://www.arangodb.com/) database for storing your game data. The interface in the image above is part of the ArangoDB and it's called Aardvark. You can easily view, modify, query, and delete data using Aardvark. This will help you with debugging your backend logic but it also allows you to extract additional information from the data (like obtaining email addresses of most loyal players).
