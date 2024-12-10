# MongoDB Documentation Platform Netlify Extensions

This repository contains the integrations/extensions that are used for documentation site builds.

## Project setup

This project uses PNPM to manage dependencies. To install you can run the following the command:

`npm install -g pnpm`

For additional installation methods, follow [this link](https://pnpm.io/installation).

Once installed, dependencies can be installed at the root level of the project by using `pnpm install`.

## Project structure

The project is configured as a monorepo using [PNPM Workspaces](https://pnpm.io/workspaces). This allows us to install dependencies with one command, and to easily share dependencies between individual extensions.

```
- extensions/
  - git-changed-files
  - snooty-cache
  - ...
- libs/
  - util/
```

The extensions, unsurprisingly, live under the `extensions/` directory. The libs directory contains projects that are shared. Currently, there is a single project called `util` which contains the custom extension class used in the extension projects. To import a project into another one such as the `util` project in one of the extensions, go to the `package.json` of the extension, and add `"util": "workspace:*"` as a dependency (in this case, as a `devDependency`), and then run `pnpm install`. Make sure there is no `package-lock.json` within your extension. You can then import files from that project like so:

```ts
import { Extension } from "util/extension";
```

If you make changes to the `util` project, the changes will only be reflected on subsequent builds of that project. You can run `pnpm build:util` at the root directory of the repository to rebuild those changes.

## linting/formatting with Biome

To install the linter, run `pnpm i` at the root level of the project. From there, you can install the Biome Extension for VS Code to display linting errors.

For auto-formatting on save, add this configuration to your `settings.json`:

```json
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome",
    "editor.formatOnPaste": true, // required
    "editor.formatOnType": false, // required
    "editor.formatOnSaveMode": "file", // required to format on save
    "files.autoSave": "onFocusChange" // optional but recommended
  },

```

For more information on Biome, check out their [documentation](https://biomejs.dev/guides/getting-started/)
