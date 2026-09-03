<a href="https://www.npmjs.com/package/discord-tsx-factory"><img src="https://img.shields.io/npm/v/discord-tsx-factory.svg?maxAge=3600" alt="npm version" /></a>

# About

Write Discord.js component in tsx.

`discord-tsx-factory` is compatible with `discord.js` version `14.17.0 - 14.18.0`. (See `peerDependencies`)

```tsx
import { createElement, Fragment, Client } from "discord-tsx-factory";
import * as Discord from "discord.js";

const client = new Client(...);

// Go to docs/EXAMPLES.md to check out example usages.
```

# Installation

Using npm

```bash
$ npm install --save discord.js@14.18.0 discord-tsx-factory
```

Using yarn

```bash
$ yarn add discord.js@14.18.0 discord-tsx-factory
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

Go to [docs/EXAMPLES.md](docs/EXAMPLES.md).

# Listening and Handling interactions

Go to [docs/HANDLING_INTERACTIONS.md](docs/HANDLING_INTERACTIONS.md).

For an overview of the runtime model and current revival priorities, see
[docs/README.md](docs/README.md).

## Command

`discord-tsx-commands` is now available on npmjs!

```tsx
import * as Discord from "discord.js";
import { createElement, Fragment } from "discord-tsx-factory";
import "discord-tsx-commands";
```

Check out [discord-tsx-commands on GitHub](https://github.com/lshqqytiger/discord-tsx-commands) for more information.

# Special Thanks

- [Lotinex](https://github.com/Lotinex)
- [Daldalso](https://discord.com/invite/F6Epqzyf) Discord Members

# License

MIT License

Copyright (c) 2022 이승훈
