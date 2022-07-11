# About

Write Discord.js component in tsx.

discord-tsx-factory currently requires Discord.js v14-dev.

```tsx
import { createElement, Fragment, Client } from "discord-tsx-factory";
import * as Discord from "discord.js";

const client = new Client({ intents: [...] });

client.on("ready", () => {
  console.log("ready");
});

client.login("your token");
```

# Installation

Using npm

```bash
$ npm install --save discord.js@14.0.0-dev.1657411900-f0b68d5 discord-tsx-factory
```

Using yarn

```bash
$ yarn add discord.js@14.0.0-dev.1657411900-f0b68d5 discord-tsx-factory
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

## Embed

```tsx
message.channel.send({
  embeds: (
    <>
      <embed
        title="title"
        color="Orange"
        footer={<footer>footer text</footer>} // string also works like 'footer="footer text"'
      >
        <field name="field 1">field text</field>
        <field name="field 2">
          multi-lined
          <br />
          text
        </field>
      </embed>
    </>
  ),
});
```

## Button

```tsx
message.channel.send({
  content: "message",
  components: (
    <>
      <row>
        <button
          customId="button1"
          onClick={(event) => {
            event.reply("button1 clicked");
          }}
        >
          primary button
        </button>
        <linkbutton url="https://github.com">link button</linkbutton>
      </row>
    </>
  ),
});
```

## Select & Option

```tsx
message.channel.send({
  content: "message",
  components: (
    <>
      <row>
        <select
          customId="select1"
          onChange={(event) => {
            event.reply(`${event.values[0]} selected`);
          }}
        >
          <option label="option1" description="description1" value="1" />
          <option label="option2" description="description2" value="2" />
        </select>
      </row>
    </>
  ),
});
```

## Modal

```tsx
message.channel.send({
  embeds: <>...</>,
  components: (
    <>
      <row>
        <button
          customId="btn1"
          onClick={async (button) => {
            await button.showModal(
              <modal
                customId="modal1"
                title="modal title"
                onSubmit={(modal) => {
                  modal.reply(modal.fields.getTextInputValue("input1"));
                }}
              >
                <row>
                  <input
                    customId="input1"
                    style={Discord.TextInputStyle.Short}
                    label="input label1"
                  />
                </row>
                <row>
                  <input
                    customId="input2"
                    style={Discord.TextInputStyle.Paragraph}
                    label="input label2"
                  />
                </row>
              </modal>
            );
          }}
        >
          button text
        </button>
      </row>
    </>
  ),
});
```

## Slash Command

I'm not familiar with Slash Command.

I will continue to improve this.

### Register & Update

```tsx
const command = (
  <>
    <command
      onSubmit={(event) => {
        event.reply("reply!");
      }}
      name="command"
      description="description"
    >
      <subcommandgroup name="group" description="group description">
        <subcommand name="subcommand" description="subcommand description">
          <string
            name="param1"
            description="param1 description"
            required={true}
          >
            <choice name="choice1" value="1" />
            <choice name="choice2" value="2" />
          </string>
        </subcommand>
      </subcommandgroup>
    </command>
    <command
      onSubmit={(event) => {
        event.reply("reply!");
      }}
      name="command2"
      description="description"
    >
      <subcommandgroup name="group" description="group description">
        <subcommand name="subcommand" description="subcommand description">
          <attachment
            name="attachment"
            description="attachment description"
            required={true}
          />
        </subcommand>
      </subcommandgroup>
    </command>
  </>
);

/* register or update command.
   you must call initializeSlashCommand at
   client's ready event to use slash commands */
await client.initializeSlashCommand(command);
```

### Delete

```tsx
// description(required), onSubmit, children will be ignored.
await client.deleteSlashCommand(
  // or deleteSlashCommand(client, ...);
  <>
    <command name="command1" description="" />
    <command name="command2" description="" />
  </>
);
// or { name: string }[]
await client.deleteSlashCommand([
  {
    name: "command1",
  },
  {
    name: "command2",
  },
]);
```

# Special Thanks

- [Lotinex](https://github.com/Lotinex)
- [Daldalso](https://discord.com/invite/F6Epqzyf) Discord Members

# License

MIT License

Copyright (c) 2022 이승훈
