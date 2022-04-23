# About

tsx for Discord.js. (XML-like syntax)

```tsx
import { createElement, Fragment, Client } from "discord-tsx";
import * as Discord from "discord.js";

const client = new Client({ intents: [...] });

client.on("ready", () => {
  const channel = client.guilds.cache
    .get("guild id")
    ?.channels.cache.get("channel id") as Discord.TextChannel;

  channel.send({
    embeds: [
      <embed title="title" color="ORANGE">
        <field name="field 1">
          field text 1<emoji name="smiling_imp" />
        </field>
        <field name="field 2">
          field text 2<emoji name="pig" />
        </field>
      </embed>,
    ],
  });
});

client.login("your token");
```

# Installation

Use npm to install discord-tsx

```bash
$ npm install --save discord-tsx
```

or use yarn

```bash
$ yarn add discord-tsx
```

You also need to modify your tsconfig.json to use discord-tsx:

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

### Row

### Embed

### Button

### Select & Option

# License

MIT License

Copyright (c) 2022 이승훈
