# Example usage

## Embed

```tsx
channel.send({
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

If `description` property is specified, the children of `embed` element will be ignored.

```tsx
channel.send({
  embeds: (
    <>
      <embed title="title" color="Orange" description="description" />
      <embed title="title" color="Orange">
        description
      </embed>
    </>
  ),
});
```

## Button

```tsx
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
        >
          primary button
        </button>
        <button url="https://github.com">link button</button>
      </row>
    </>
  ),
});
```

If `label` property is specified, the children of `button` element will be ignored.

```tsx
channel.send({
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
        />
        <button label="link button" url="https://github.com" />
      </row>
    </>
  ),
});
```

## Select & Option

### StringSelectMenu

```tsx
channel.send({
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

### Other SelectMenus

```tsx
channel.send({
  content: "message",
  components: (
    <>
      <row>
        <select
          type={Discord.ComponentType.UserSelect}
          customId="select1"
          onChange={(event) => {
            event.reply(`${event.values[0]} selected`);
          }}
        />
      </row>
    </>
  ),
});
```

## Modal

```tsx
channel.send({
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
channel.send(<message content="content" />);
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
channel.send({
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
channel.send({
  embeds: (
    <>
      <CustomEmbed customProp1="custom prop1" customProp2="custom prop2">
        Custom Component
      </CustomEmbed>
    </>
  ),
});
```

## State

With discord-tsx-factory, all classes that extend `BaseChannel` or `BaseInteraction` have `useState` method.

```tsx
import {
  createElement,
  Fragment,
  DiscordStateComponent,
  useState,
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
                  // interaction is not essential, but it calls interaction.update instead of message.edit.
                  this.setState({ page: this.state.page - 1 }, interaction)
                }
              >
                prev
              </button>
              <button
                customId="button_next"
                onClick={async (interaction) => {
                  this.setState({ page: this.state.page + 1 }, interaction);

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
  <CustomMessage contents={["page0", "page1"]} />, { page: 0 } // Initial state is optional. It will overwrite pre-defined state (in class).
);
// or
const [message, setState] = await useState(
  channel,
  <CustomMessage contents={["page0", "page1"]} />,
  { page: 0 }
);
```