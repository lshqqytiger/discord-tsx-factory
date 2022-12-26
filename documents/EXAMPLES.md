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

You can define your own component using class which extends `Component`.

Custom Class Component must have `render` method which returns `DiscordNode`.

```tsx
import {
  createElement,
  Fragment,
  DiscordNode,
  Component,
} from "discord-tsx-factory";

interface Props {
  customProp1: string;
  customProp2: string;
  children?: DiscordNode;
}
class CustomEmbed extends Component<Props> {
  public render(): DiscordNode {
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
import { createElement, Fragment, DiscordNode, FC } from "discord-tsx-factory";

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
  return (
    <embed title="test embed">
      <field name={customProp1}>{children} Test 1</field>
      <field name={customProp2}>{children} Test 2</field>
    </embed>
  );
}
// or
const CustomEmbed: FC = ({ customProp1, customProp2, children }: Props) => {
  return (
    <embed title="test embed">
      <field name={customProp1}>{children} Test 1</field>
      <field name={customProp2}>{children} Test 2</field>
    </embed>
  );
};
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

With discord-tsx-factory, all classes that extend `BaseChannel` have `sendState` method and those that extend `BaseInteraction` have `replyState` method.

```tsx
import { createElement, Fragment, Component } from "discord-tsx-factory";

interface Props {
  contents: string[];
}
interface State {
  page: number;
}
class CustomMessage extends Component<Props, State> {
  public state: State = { page: 0 };
  public render() {
    // 'render' must return 'message' element if you want State.
    // It's because 'discord-tsx-factory' doesn't support 'getDerivedStateFromProps' life cycle yet.
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
                onClick={async (interaction) =>
                  this.setState({ page: this.state.page + 1 }, interaction)
                }
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
// 'sendState' returns [Discord.Message, (state: S) => void].
const [message, setState] = await channel.sendState(
  <CustomMessage contents={["page0", "page1"]} />
);
```

## Message Life Cycle

`constructor` → `shouldComponentUpdate` → `render`

### componentDidMount

```ts
class CustomMessage {
  public componentDidMount(): void | Promise<void>;
}
```

### componentDidUpdate

```ts
class CustomMessage {
  public componentDidUpdate(prevState: Readonly<S>): void | Promise<void>;
}
```

### componentWillUnmount

```ts
class CustomMessage {
  public componentWillUnmount(): void;
}
```

### componentDidCatch

```ts
class CustomMessage {
  public componentDidCatch(error: any): void;
}
```

### shouldComponentUpdate

```ts
class CustomMessage {
  public shouldComponentUpdate(nextState: Readonly<S>): boolean;
}
```
