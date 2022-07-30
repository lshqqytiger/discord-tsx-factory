# About

Write Discord.js component in tsx.

```tsx
import { createElement, Fragment, Client } from "discord-tsx-factory";
import * as Discord from "discord.js";

const client = new Client({ intents: [...] });

// ...
```

# Installation

Using npm

```bash
$ npm install --save discord.js@14.1.1 discord-tsx-factory
```

Using yarn

```bash
$ yarn add discord.js@14.1.1 discord-tsx-factory
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

## Message

```tsx
message.channel.send(<message content="content" />);
```

## Custom Components

### Using class

You can define your own component using class which extends `DiscordComponent`.

Custom Class Component must have `render` method which returns `DiscordNode`.

```tsx
import {
  createElement,
  Fragment,
  DiscordNode,
  DiscordComponent,
} from "discord-tsx-factory";

interface Props {
  customProp1: string;
  customProp2: string;
  children?: DiscordNode;
}
class CustomEmbed extends DiscordComponent<Props> {
  constructor(props: Props) {
    super(props);

    // Since discord-tsx-factory is not React, you can do anything with this.props.
    this.props.customProp1 = "field name 1";
  }
  render(): DiscordNode {
    return (
      <embed title="test embed">
        <field name={this.props.customProp1}>
          {this.props.children} Test 1
        </field>
        <field name={this.props.customProp2}>
          {this.props.children} Test 2
        </field>
      </embed>
    );
  }
}
message.channel.send({
  embeds: (
    <>
      <CustomEmbed customProp1="custom prop1" customProp2="custom prop2">
        Custom Component
      </CustomEmbed>
    </>
  ),
});
```

### Using function

You can define your own component using function which returns `DiscordNode`.

```tsx
import {
  createElement,
  Fragment,
  DiscordNode,
  DiscordComponent,
} from "discord-tsx-factory";

interface Props {
  customProp1: string;
  customProp2: string;
  children?: DiscordNode;
}
function CustomEmbed({
  customProp1,
  customProp2,
  children,
}: Props): DiscordNode {
  customProp1 = "field name 1";

  return (
    <embed title="test embed">
      <field name={customProp1}>{children} Test 1</field>
      <field name={customProp2}>{children} Test 2</field>
    </embed>
  );
}
await channel.send({
  embeds: (
    <>
      <CustomEmbed customProp1="custom prop1" customProp2="custom prop2">
        Custom Component
      </CustomEmbed>
    </>
  ),
});
```

## [Experimental] State

I think state is one of the most powerful features of React.

With discord-tsx-factory, all classes that extend `BaseChannel` and `BaseInteraction` have `useState` method.

```tsx
import {
  createElement,
  Fragment,
  DiscordStateComponent,
} from "discord-tsx-factory";

interface Props {
  contents: string[];
}
interface State {
  page: number;
}
class CustomMessage extends DiscordStateComponent<Props, State> {
  state: State = { page: 0 }; // Initial state
  render() {
    return (
      <message
        embeds={
          <>
            <embed>{this.props.contents[this.state.page]}</embed>
          </>
        }
        components={
          <>
            <row>
              <button
                customId="button_prev"
                onClick={(interaction) =>
                  // interaction is not essential, but it will 'update' message with interaction.
                  this.setState({ page: this.state.page - 1 }, interaction)
                }
              >
                prev
              </button>
              <button
                customId="button_next"
                onClick={async (interaction) => {
                  this.setState({ page: this.state.page + 1 }, interaction)

                  // interactions also have 'useState'.
                  const [...] = await interaction.useState(...);
                }}
              >
                next
              </button>
            </row>
          </>
        }
      />
    );
  }
}
// 'useState' returns [Discord.Message, (state: S) => void].
const [message, setState] = await channel.useState(
  <CustomMessage contents={["page0", "page1"]} />
);
```

## Command

I recently thought it was useless and removed it from 0.2.0.

To register Command, use other cool modules or methods together.

# Special Thanks

- [Lotinex](https://github.com/Lotinex)
- [Daldalso](https://discord.com/invite/F6Epqzyf) Discord Members

# License

MIT License

Copyright (c) 2022 이승훈
