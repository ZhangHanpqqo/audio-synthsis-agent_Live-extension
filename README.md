# audio-synthsis-agent-live-extension

An Ableton Live extension built with `@ableton-extensions/sdk`.

## Get Started

Learn about building extensions: https://ableton.github.io/extensions-sdk/

## Setup

The path to Ableton Live's Extension Host module is stored in `.env` as
`EXTENSION_HOST_PATH`. The generator filled this in for you; edit it if your
install moves.

Fish Audio settings are entered directly in the extension dialog. The extension
does not read Fish credentials or API settings from `.env`.

Runtime errors are written to `text-to-audio-agent.log` in the extension storage
directory when Ableton provides one, with a project-directory fallback.

## Scripts

```sh
npm start                  # build + run in Live's Extension Host
npm run build              # production bundle of src/extension.ts
npm run build:dev          # dev bundle (sourcemaps, not minified)
npm run package            # build for production + create a .ablx archive
```
