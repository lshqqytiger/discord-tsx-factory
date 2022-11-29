# Listening and Handling interactions

You can use default 'interactionCreate' handler by defining client using `Client` constructor derived from `discord-tsx-factory`.

If you want, you can turn off default 'interactionCreate' handler.

(In this case, `onClick`, `onChange`, `onSubmit` will be meaningless)

```tsx
import { Client } from "discord-tsx-factory";

const client = new Client(...);

client.off("interactionCreate", client.defaultInteractionCreateListener);
client.on("interactionCreate", yourOwnHandler);
```

or, more simply, define your client with `Client` constructor from `discord.js`.

```tsx
import { createElement, Fragment } from "discord-tsx-factory";
import { Client } from "discord.js";

const client = new Client(...);

client.on("interactionCreate", yourOwnHandler);

channel.send(<message {...} />);
```

Basically (when you didn't turn off default 'interactionCreate' listener and defined your client object using `Client` constructor from `discord-tsx-factory`), `discord-tsx-factory` creates a handler whenever you call `createElement` function with `onClick`, `onChange`, `onSubmit` properties and the handler will remain in memory.

But with client configuration, component property and method, you can delete handler from memory.

## Once on Client constructor

A client with `once: InteractionType[]` will delete handler for specified interaction from memory after that handler is once called.

```tsx
import { Client, InteractionType } from "discord-tsx-factory";

const client = new Client({ ..., once: [InteractionType.Button] });
```

(You don't need to configure `once` for modal because it is basically always and must be once)

If you want to except a handler from this configuration, you can use `once={false}` property.

```tsx
import { Client, InteractionType } from "discord-tsx-factory";

const client = new Client({ ..., once: [InteractionType.Button] });

channel.send({
  content: "message",
  components: (
    <>
      <row>
        <button
          customId="button1"
          onClick={(event) => {
            event.reply("button1 clicked");
          }}
          once={false}
        >
          primary button
        </button>
      </row>
    </>
  ),
});
```

## Once on Each Component

A component with `once={true}` or `once` property will delete given handler from memory after it is once called.

```tsx
import { Client, InteractionType } from "discord-tsx-factory";

const client = new Client(...);

channel.send({
  content: "message",
  components: (
    <>
      <row>
        <button
          customId="button1"
          onClick={(event) => {
            event.reply("this interaction will be replied only once.");
          }}
          once
          // or
          once={true}
        >
          primary button
        </button>
      </row>
    </>
  ),
});
```

You can manually delete handler from memory by calling `off` function.

```tsx
import { Client, InteractionType } from "discord-tsx-factory";

const client = new Client(...);
let count = 0;

channel.send({
  content: "message",
  components: (
    <>
      <row>
        <button
          customId="button1"
          onClick={(event, off) => {
            if (count === 2) off();
            event.reply(`button1 clicked! count: ${++count}`);
          }}
        >
          You can click this button 3 times
        </button>
      </row>
    </>
  ),
});
```
