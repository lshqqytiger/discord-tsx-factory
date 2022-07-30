import * as Discord from "discord.js";

type PartialOf<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;
type StateSetter<S> = (
  state: S,
  interaction?: Discord.ButtonInteraction | Discord.SelectMenuInteraction
) => void;
type StateTuple<S> = [Discord.Message, StateSetter<S>];

export type DiscordFragment = Iterable<DiscordNode>;
export type DiscordNode =
  | DiscordElement
  | DiscordPortal
  | string
  | number
  | DiscordFragment;
export interface DiscordElement<P = unknown> {
  props: P;
}
export interface DiscordPortal extends DiscordElement {
  children: DiscordNode;
}
export class DiscordComponent<P = unknown> {
  props: P;
  constructor(props: P) {
    this.props = props;
  }
  render(): DiscordNode {
    throw new Error("Your component doesn't have 'render' method.");
  }
}
export class DiscordStateComponent<
  P = unknown,
  S = unknown
> extends DiscordComponent<P> {
  props!: P;
  state: S;
  message?: Discord.Message;
  constructor(props: P) {
    super(props);

    this.state = {} as S;
  }
  render(): any {
    throw new Error("Your component doesn't have 'render' method.");
  }
  setState: StateSetter<S> = (state, interaction) => {
    this.state = { ...this.state, ...state };
    if (interaction) interaction.update(this.render());
    else this.message?.edit(this.render());
  };
  forceUpdate() {
    this.message?.edit(this.render());
  }
}
export async function useState<T extends DiscordStateComponent>(
  this:
    | Discord.DMChannel
    | Discord.PartialDMChannel
    | Discord.NewsChannel
    | Discord.TextChannel
    | Discord.AnyThreadChannel,
  component: T
): Promise<StateTuple<unknown>> {
  return [
    (component.message = await this.send(component.render())),
    component.setState,
  ];
}

export type ButtonInteractionHandler = (
  interaction: Discord.ButtonInteraction
) => any;
export type SelectMenuInteractionHandler = (
  interaction: Discord.SelectMenuInteraction
) => any;
export type ModalSubmitInteractionHandler = (
  interaction: Discord.ModalSubmitInteraction
) => any;

declare global {
  namespace JSX {
    type Element = any;
    interface IntrinsicElements {
      message: Discord.MessageOptions;
      br: {};
      embed: Omit<Discord.EmbedData, "color" | "footer"> & {
        color?: Discord.ColorResolvable;
        footer?: IntrinsicElements["footer"];
      };
      footer: PartialOf<Discord.EmbedFooterData, "text"> | string;
      field: PartialOf<Discord.EmbedField, "value" | "inline">;
      emoji: { emoji: Discord.Emoji | Discord.EmojiResolvable };
      row: Partial<Discord.ActionRowComponentData>;
      button: Partial<Discord.ButtonComponent> & {
        emoji?: Discord.Emoji | string;
        onClick?: ButtonInteractionHandler;
      };
      linkbutton: Omit<Discord.LinkButtonComponentData, "style" | "type">;
      select: Partial<Discord.SelectMenuComponentData> & {
        onChange?: SelectMenuInteractionHandler;
      };
      option: Discord.SelectMenuComponentOptionData;
      modal: Omit<Discord.ModalData, "type" | "components"> & {
        type?:
          | Discord.ComponentType.ActionRow
          | Discord.ComponentType.TextInput;
        customId: string;
        title: string;
        onSubmit?: ModalSubmitInteractionHandler;
      };
      input: Omit<Discord.TextInputComponentData, "type">;
    }
  }
}
declare module "discord.js" {
  interface DMChannel {
    useState<T extends DiscordStateComponent>(
      component: T
    ): Promise<StateTuple<unknown>>;
  }
  interface NewsChannel {
    useState<T extends DiscordStateComponent>(
      component: T
    ): Promise<StateTuple<unknown>>;
  }
  interface TextChannel {
    useState<T extends DiscordStateComponent>(
      component: T
    ): Promise<StateTuple<unknown>>;
  }
}

const interactionHandlers = new Map<string, Function>();
const ElementBuilder = {
  message: (props: JSX.IntrinsicElements["message"]) => props,
  br: () => "\n",
  embed: (props: JSX.IntrinsicElements["embed"], children: DiscordNode[]) => {
    props.fields = [];
    if (!props.description) {
      props.description = "";
      children.forEach((v) => {
        if (v instanceof Array) props.fields?.push(...v);
        else if (typeof v == "object" && "name" in v) props.fields?.push(v);
        else props.description += String(v);
      });
    }
    if (props.footer) props.footer = ElementBuilder.footer(props.footer, []);
    return new Discord.EmbedBuilder(props as Discord.EmbedData).setColor(
      props.color || null
    );
  },
  footer: (props: JSX.IntrinsicElements["footer"], children: DiscordNode[]) =>
    typeof props === "string"
      ? { text: props }
      : { ...props, text: props.text || children.join("") },
  field: (props: JSX.IntrinsicElements["field"], children: DiscordNode[]) => ({
    name: props.name,
    value: props.value || children.flat(10).join(""),
    inline: props.inline || false,
  }),
  emoji: (props: JSX.IntrinsicElements["emoji"]) => props.emoji,
  row: (props: JSX.IntrinsicElements["row"], children: DiscordNode[]) =>
    new Discord.ActionRowBuilder({
      ...props,
      components: children[0] instanceof Array ? children[0] : children,
    }),
  button: (props: JSX.IntrinsicElements["button"], children: DiscordNode[]) => {
    const button = new Discord.ButtonBuilder({
      ...props,
      style: props.style || Discord.ButtonStyle.Primary,
      label: props.label || children.flat(10).join(""),
    } as Partial<Discord.InteractionButtonComponentData>);
    if (props.onClick && props.customId)
      interactionHandlers.set(props.customId, props.onClick);
    if (props.emoji) button.setEmoji(props.emoji);
    return button;
  },
  linkbutton: (
    props: JSX.IntrinsicElements["linkbutton"],
    children: DiscordNode[]
  ) =>
    new Discord.ButtonBuilder({
      ...props,
      style: Discord.ButtonStyle.Link,
      label: props.label || children.flat(10).join(""),
    }),
  select: (props: JSX.IntrinsicElements["select"], children: DiscordNode[]) => {
    const select = new Discord.SelectMenuBuilder(props);
    select.addOptions(children[0] instanceof Array ? children[0] : children);
    if (props.onChange && props.customId)
      interactionHandlers.set(props.customId, props.onChange);
    return select;
  },
  option: (props: JSX.IntrinsicElements["option"]) =>
    new Discord.SelectMenuOptionBuilder(props),
  modal: (props: JSX.IntrinsicElements["modal"], children: DiscordNode[]) => {
    if (props.onSubmit) interactionHandlers.set(props.customId, props.onSubmit);
    return new Discord.ModalBuilder({
      type: (props.type as any) || 1,
      customId: props.customId,
      title: props.title,
      components: children[0] instanceof Array ? children[0] : children,
    });
  },
  input: (props: JSX.IntrinsicElements["input"]) =>
    new Discord.TextInputBuilder({ ...props, type: 4 }),
};
export function createElement(
  tag: keyof JSX.IntrinsicElements | Function,
  props: any,
  ...children: DiscordNode[]
): typeof ElementBuilder[keyof JSX.IntrinsicElements] extends (
  ...args: never[]
) => infer R
  ? R
  : never {
  if (typeof tag == "function") {
    props = { ...props, children }; // 'props' is possibly null.
    if (/^\s*class\s+/.test(tag.toString())) {
      const constructed = Reflect.construct(tag, [props]);
      if (constructed.setState) return constructed;
      return constructed.render();
    }
    return tag(props, children);
  }
  return ElementBuilder[tag](props || {}, children);
}
export const Fragment = (
  props: null,
  children: DiscordNode[]
): DiscordFragment => children;
export const deleteHandler = (key: string) => interactionHandlers.delete(key);

export class Client extends Discord.Client {
  constructor(options: Discord.ClientOptions) {
    super(options);
    this.on("interactionCreate", (interaction: Discord.Interaction) => {
      if (interaction.isButton())
        return interactionHandlers.get(interaction.customId)?.(interaction);
      if (interaction.isSelectMenu())
        return interactionHandlers.get(interaction.customId)?.(interaction);
      if (interaction instanceof Discord.ModalSubmitInteraction)
        interactionHandlers.get(interaction.customId)?.(interaction);
    });
  }
}

Discord.DMChannel.prototype.useState = useState;
Discord.NewsChannel.prototype.useState = useState;
Discord.TextChannel.prototype.useState = useState;
