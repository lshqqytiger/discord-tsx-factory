# About

Write Discord.js component in tsx.

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
$ npm install --save discord.js@14.0.3 discord-tsx-factory
```

Using yarn

```bash
$ yarn add discord.js@14.0.3 discord-tsx-factory
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
        footer="footer text" // or footer={<footer {...}>...</footer>}
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

If `description` property is specified, its children will be ignored.

```tsx
message.channel.send({
  embeds: (
    <>
      <embed title="title" color="Orange" description="description" />
      <embed title="title" color="Orange" description="description">
        It will be ignored.
      </embed>
    </>
  ),
});
```

## Button

`onClick` is optional.

You can handle button interaction using `client.on("interactionCreate", ...);`.

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

If `label` property is specified, its children will be ignored.

```tsx
message.channel.send({
  content: "message",
  components: (
    <>
      <row>
        <button
          customId="button1"
          label="primary button"
          onClick={(event) => {
            event.reply("button1 clicked");
          }}
        >
          It will be ignored
        </button>
        <linkbutton label="link button" url="https://github.com">
          It will be ignored
        </linkbutton>
      </row>
    </>
  ),
});
```

## Select & Option

`onChange` is optional.

You can handle select interaction using `client.on("interactionCreate", ...);`.

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

`onSubmit` is optional.

You can handle modal interaction using `client.on("interactionCreate", ...);`.

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

## [Experimental] Custom Class Component

```tsx
import {
  createElement,
  Fragment,
  DiscordNode,
  DiscordComponent,
} from "discord-tsx-factory";

interface Props {
  customProp1: string;
  customProp2?: number;
  children?: DiscordNode[];
}
class CustomEmbed extends DiscordComponent<Props> {
  tag = "embed"; // You must specify tag name.
  constructor(props: Props, children: DiscordNode[]) {
    super(props, children); // You must call super with props and children.

    this.children.push(
      <field name={this.props.customProp1}>{this.props.customProp2}</field>
    );
  }
}

message.channel.send({
  embeds: (
    <>
      <CustomEmbed customProp1="custom prop1" customProp2={123}>
        <field name="field 1">field 1</field>
      </CustomEmbed>
    </>
  ),
});
```

# Special Thanks

- [Lotinex](https://github.com/Lotinex)
- [Daldalso](https://discord.com/invite/F6Epqzyf) Discord Members

# License

MIT License

Copyright (c) 2022 이승훈
