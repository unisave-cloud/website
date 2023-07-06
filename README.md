Unisave Website
===============

Notes:

- https://valotas.com/parcel2-as-static-site-generator/
- https://lipanski.com/posts/smallest-docker-image-static-website
- https://betterprogramming.pub/how-to-make-your-static-website-interactively-searchable-ab0091db63b1


## How the building process works

First, take a look at the structure of [Parcel plugin system](https://parceljs.org/plugin-system/overview/).

In `package.json` there is an array `"source"` which specifies all entrypoints. These are the first assets that Parcel load and that bootstrap the entire compilation.


### Building HTML

Let's say `index.html` is one of the entrypoints. To create a link to another HTML file, simply reference the file in file system (say `./foo/other.html`). Parcel will resolve this as a URL dependency and trigger the other file compilation in parallel and in the end replate the path with a proper relative URL.

Similarly, referencing `scss` files, images, and other assets works the same way. They become independent assets that get turned into bundles and the proper URL is inserted isntead of the path at the end.

I also use [`posthtml-include`](https://github.com/posthtml/posthtml-include) package to let me extract HTML partials and include them. This executes even before Parcel has a chance to understand the entrypoint asset, so this system ignores Parcel's asset dependencies. Therefore the `src` attribute of includes needs to always be relative to the project folder (say `src/partials/foo.html`) without leading slash or dot. The included file will get physically included before Parcel has a chance to realize it comes from somewhere else, so any Parcel depencies inside the partial file need to have project-absolute paths in order to work (say `/src/partials/navigation/logo.svg`) and here, a leading slash is needed (Parcel interprets that as the root of the project).


### Creating final URLs

Parcel works by grouping assets into bundles and then naming those bundles. Bundle name is exactly the path of the file the bundle will be written to in the `dist` folder. The bundle name is computed by a namer plugin, which in this case is the `packages/parcel-namer-website/namer.js` namer, that tries to preserve the hierarchical structure of the src directory. Because Parcel by default makes the output directory flat.

When inserting URLs into the bundled files, Parcel computes relative URLs in bundlers. It is difficult to modify this behaviour, so we have an optimizer `package/parcel-optimizer-website/optimizer.js` that runs after all bundlers and it post-processes URLs in HTML files, doing the following:

```
 INPUT: /guides/foo-bar/index.html
OUTPUT: http://localhost:1234/guides/foo-bar
```

Anotherwords, it removes the `/index.html` suffix and prepends the server address, so that `link` tags make crawlers happy that it provides absolute URLs.

> **Note:** Parcel adds hot-reload code to every page, thus spamming the dist folder with lots of additional files during development. If you see some additional files, try doing a production build, it may be the files are dev-only.


### Sitemap

TODO...


### Building markdown pages

TODO...
