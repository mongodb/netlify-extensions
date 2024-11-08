# MongoDB Documentation Platform Netlify Extensions

This repository contains the integrations/extensions that are used for documentation site builds.

## Project setup

This project uses PNPM to manage dependencies. To install you can run the following the command:

`npm install -g pnpm`

For additional installation methods, follow [this link](https://pnpm.io/installation).

Once installed, dependencies can be installed at the root level of the project by using `pnpm install`.

## Project structure

The project is configured as a monorepo using [PNPM Workspaces](https://pnpm.io/workspaces). This allows us to install dependencies with one command, and to easily share dependencies between individual extensions.

## linting/formatting with Biome

To install the linter, run `npm ci` at the root level of the project. From there, you can install the Biome Extension for VS Code to display linting errors.

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
