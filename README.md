<a href="https://www.npmjs.com/package/discord-tsx-factory"><img src="https://img.shields.io/npm/v/discord-tsx-factory.svg?maxAge=3600" alt="npm version" /></a>

# About

Write Discord.js component in tsx.

`discord-tsx-factory` is compatible with `discord.js` version `14.7.0`. (See `peerDependencies`)

```tsx
import { createElement, Fragment, Client } from "discord-tsx-factory";
import * as Discord from "discord.js";

const client = new Client(...);

// Go to documents/EXAMPLES.md (visit GitHub) to check out example usages.
```

# Installation

Using npm

```bash
$ npm install --save discord.js@14.7.0 discord-tsx-factory
```

Using yarn

```bash
$ yarn add discord.js@14.7.0 discord-tsx-factory
```

You need to modify your tsconfig.json to use discord-tsx-factory:

```json
{
  "compilerOptions": {
    ...
    "jsx": "react",
    "jsxFactory": "createElement",
    "jsxFragmentFactory": "Fragment",
    ...
  },
  ...
}
```

# Example usage

Go to [EXAMPLES.md](https://github.com/lshqqytiger/discord-tsx-factory/blob/main/documents/EXAMPLES.md).

# Listening and Handling interactions

Go to [HANDLING_INTERACTIONS.md](https://github.com/lshqqytiger/discord-tsx-factory/blob/main/documents/HANDLING_INTERACTIONS.md).

## Command

~~I recently thought it was useless and removed it from 0.2.0.~~

~~To register Command, use other cool modules or methods together. (e.g. `SlashCommandBuilder`)~~

I'm currently working on `discord-tsx-commands`, which is a extension package for `discord-tsx-factory` to handle commands using tsx.

You can use other cool modules or methods together. (e.g. `SlashCommandBuilder`)

# Special Thanks

- [Lotinex](https://github.com/Lotinex)
- [Daldalso](https://discord.com/invite/F6Epqzyf) Discord Members

# License

MIT License

Copyright (c) 2022 이승훈
