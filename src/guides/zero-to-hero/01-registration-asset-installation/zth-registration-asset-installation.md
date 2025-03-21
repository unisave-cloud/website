---
title: "Registration, Asset, Installation - #1 Zero to Hero"
titleHtml: "<em>Registration</em>, <em>Asset</em>, <em>Installation</em><br>#1 Zero to Hero"
url: "guides/zero-to-hero/registration-asset-installation"
image: "youtube-thumbnail.png"
tags: ["zero-to-hero", "getting-started"]
author: "Jiří Mayer"
datePublished: null
dateUpdated: null
---

<div class="youtube-container">
    <iframe width="560" height="315" src="https://www.youtube.com/embed/fzU233dLWoU?si=NcDrAgrYgJWFvisP" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" referrerpolicy="strict-origin-when-cross-origin" allowfullscreen></iframe>
</div>

This tutorial shows you how to integrate the Unisave cloud backend platform into your Unity project. This is the first step necessary before using the cloud database and writing custom cloud functions.

> 📖 **Navigation**<br>
> [Unisave Zero to Hero](../zero-to-hero.md)<br>
> ⬅️ Previous: [Introduction](../00-introduction/zth-introduction.md)<br>
> ➡️ Next: Backend Folders, Uploading (comming soon)


## Import the Unity asset

Your Unity project will connect with Unisave cloud through an asset distributed via the Unity Asset Store. In order to import it into your project, follow these steps:

1. Go to the [asset store page](https://assetstore.unity.com/packages/slug/142705).
    <img class="with-border" src="../../../docs/installation/asset-store-listing.png" alt="Asset store page for the Unisave asset.">
2. Make sure you are logged into your Unity account and click the **Add to My Assets** button.
3. Back in Unity, make sure you are also logged into your Unity account. Open the **Package Manager** window.
4. In the Package Manager, select the **My Assets** group and search for `Unisave`. Click on the Unisave asset to see its detail.
    <img src="../../../docs/installation/package-manager-listing.png" alt="Unisave asset in the package manager window.">
5. Click on the **Download** button and then the **Import to project** button.
6. In the pop-up dialog, leave all assets checked and click the **Import** button.
    <img src="../../../docs/installation/import-dialog.png" alt="Dialog for importing an asset.">

When the import finishes, the Unisave asset will automatically open the **Unisave Window**. If not, click on the `Tools > Unisave > Unisave Window` menu.

<img src="../../../docs/installation/unisave-window.png" alt="The Unisave Window used to control Unisave from inside the Unity editor.">


## Create a cloud account

Go to the Unisave website (https://unisave.cloud/) and click on the **Create Account** button in the upper right corner of the screen. Fill out the registration form and submit it.

<img src="../../../docs/installation/register-form.png" alt="Form for registering new Unisave accounts.">

You will be redirected to the web dashboard with the list of your games:

<img class="with-border" src="../../../docs/installation/your-games-screen.png" alt="Web dashboard with the list of your games.">

Click on the **Create new game** button and fill out the name of your game. You will be redirected to the *Development Console* of your newly created game:

<img class="with-border" src="../../../docs/installation/development-console-screen.png" alt="The development console is the page you use the most when developing your backend server.">


## Connect Unity with Unisave cloud

In the *Development Console* web page, you have two tokens: the game token and the editor key. They are needed for Unity to communicate with the cloud. Copy these one-by-one and paste them into the **Unisave Window** in Unity, into the **Cloud Connection** tab:

<img class="with-border" src="../../../docs/installation/cloud-connection-tab.png" alt="Cloud Connection tab in the Unisave Window must contain connection tokens.">


## Check that backend uploading works

Now the connection should be established. One way to verify that is to perform backend code uploading and see if it succeeds.

In the **Unisave Window** go to the **Backend Code** tab. Click on the **Upload** button (the manual backend upload trigger):

<img class="with-border" src="../../../docs/installation/backend-upload-success.png" alt="The Backend Code tab controls the backend code uploading process.">

If you don't get any errors, the connection is set up correctly. If you get an error, make sure your tokens are set up properly and that you have internet connection.


## Conclusion

Thank you for reading the tutorial. You can visit the [Installation](../../../docs/installation/installation.md) documentation page and browse the documentation to learn more details.

**You can continue with the next tutorial in the series:**<br>
➡️ Backend Folders, Uploading - #2 Zero to Hero (comming soon)
