# Netlify Extension

This extension is created using the [Netlify SDK](https://sdk.netlify.com/get-started/introduction/). It is a boilerplate for creating a new extension.

```
> netlify-integrations@1.0.0 npx
> create-sdk

? Where do you want to create the extension? offline-snooty
? What is the slug of the extension? (e.g. my-extension) offline-snooty
? Summarize what your extension does. This will be shown on the extension's card in the extensions directory.  Creates and uploads a zip file containing pure HTML files from a snooty build output.
? Which boilerplate should be included? Build Event Handler
? Are you planning to inject edge functions into the user's site? No
? Which package manager do you want to use? npm
```

## Scripts

These are some common scripts you will use when developing your extension. If you want to know what else is possible, [check out the documentation](https://developers.netlify.com/sdk/netlify-sdk-utility-tools-reference/).

### Build

This builds the extension into a `.ntli` folder. This is the folder that Netlify uses to run the extension.

```bash
npm run build
```


## Publish

Are you ready to deploy and publish your extension? Check out our documentation on [publishing your extension](https://developers.netlify.com/sdk/publish/).