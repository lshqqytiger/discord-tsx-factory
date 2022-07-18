import * as Discord from "discord.js";

type PartialOf<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;

declare global {
  namespace JSX {
    type Element = any; // 임시
    interface IntrinsicElements {
      br: {};
      embed: Omit<Discord.EmbedData, "color" | "footer"> & {
        color?: Discord.ColorResolvable;
        footer?: JSX.IntrinsicElements["footer"];
      };
      footer: PartialOf<Discord.EmbedFooterData, "text"> | string;
      field: PartialOf<Discord.EmbedField, "value" | "inline">;
      emoji: { emoji: Discord.Emoji | Discord.EmojiResolvable };
      row: Partial<Discord.ActionRowComponentData>;
      button: Partial<Discord.ButtonComponent> & {
        emoji?: Discord.Emoji | string;
        onClick?: (interaction: Discord.ButtonInteraction) => void;
      };
      linkbutton: Omit<Discord.LinkButtonComponentData, "style" | "type">;
      select: Partial<Discord.SelectMenuComponentData> & {
        onChange?: (interaction: Discord.SelectMenuInteraction) => void;
      };
      option: Discord.SelectMenuComponentOptionData;
      modal: Omit<Discord.ModalData, "type" | "components"> & {
        type?:
          | Discord.ComponentType.ActionRow
          | Discord.ComponentType.TextInput;
        customId: string;
        title: string;
        onSubmit?: (interaction: Discord.ModalSubmitInteraction) => void;
      };
      input: Omit<Discord.TextInputComponentData, "type">;
    }
  }
}

const interactionHandlers = new Map<string, Function>();
const ElementBuilder = {
  br: () => "\n",
  embed: (props: JSX.IntrinsicElements["embed"], children: JSX.Element[]) => {
    props.fields = [];
    if (!props.description) {
      props.description = "";
      children.forEach((v) => {
        if (v instanceof Array) props.fields?.push(...v);
        else if (typeof v == "object") props.fields?.push(v);
        else props.description += String(v);
      });
    }
    if (props.footer) props.footer = ElementBuilder.footer(props.footer, []);
    return new Discord.EmbedBuilder(props as Discord.EmbedData).setColor(
      props.color || null
    );
  },
  footer: (props: JSX.IntrinsicElements["footer"], children: JSX.Element[]) =>
    typeof props === "string"
      ? { text: props }
      : { ...props, text: props.text || children.join("") },
  field: (props: JSX.IntrinsicElements["field"], children: JSX.Element[]) => ({
    name: props.name,
    value: props.value || children.join(""),
    inline: props.inline || false,
  }),
  emoji: (props: JSX.IntrinsicElements["emoji"]) => props.emoji,
  row: (props: JSX.IntrinsicElements["row"], children: JSX.Element[]) =>
    new Discord.ActionRowBuilder({
      ...props,
      components: children[0] instanceof Array ? children[0] : children,
    }),
  button: (props: JSX.IntrinsicElements["button"], children: JSX.Element[]) => {
    const button = new Discord.ButtonBuilder({
      ...props,
      style: props.style || Discord.ButtonStyle.Primary,
      label: props.label || children.join(""),
    } as Partial<Discord.InteractionButtonComponentData>);
    if (props.onClick && props.customId)
      interactionHandlers.set(props.customId, props.onClick);
    if (props.emoji) button.setEmoji(props.emoji);
    return button;
  },
  linkbutton: (
    props: JSX.IntrinsicElements["linkbutton"],
    children: JSX.Element[]
  ) =>
    new Discord.ButtonBuilder({
      ...props,
      style: Discord.ButtonStyle.Link,
      label: props.label || children.join(""),
    }),
  select: (props: JSX.IntrinsicElements["select"], children: JSX.Element[]) => {
    const select = new Discord.SelectMenuBuilder(props);
    select.addOptions(children[0] instanceof Array ? children[0] : children);
    if (props.onChange && props.customId)
      interactionHandlers.set(props.customId, props.onChange);
    return select;
  },
  option: (props: JSX.IntrinsicElements["option"]) => props,
  modal: (props: JSX.IntrinsicElements["modal"], children: JSX.Element[]) => {
    if (props.onSubmit) interactionHandlers.set(props.customId, props.onSubmit);
    return new Discord.ModalBuilder({
      type: (props.type as any) || 1,
      custom_id: props.customId,
      components: children[0] instanceof Array ? children[0] : children,
    }).setTitle(props.title);
  },
  input: (props: JSX.IntrinsicElements["input"]) =>
    new Discord.TextInputBuilder({ ...props, type: 4 }),
};
const createElement = (
  tag: keyof JSX.IntrinsicElements | Function,
  props: any,
  ...children: JSX.Element[]
) => {
  if (typeof tag == "function") return tag(props, children);
  return ElementBuilder[tag](props || {}, children);
};
const Fragment = (props: null, children: JSX.Element[]) => children;
const deleteHandler = (key: string) => interactionHandlers.delete(key);

class Client extends Discord.Client {
  constructor(options: Discord.ClientOptions) {
    super(options);
    this.on("interactionCreate", (interaction: Discord.Interaction) => {
      if (interaction.isButton())
        return interactionHandlers.get(interaction.customId)?.(interaction);
      if (interaction.isSelectMenu())
        return interactionHandlers.get(interaction.customId)?.(interaction);
      /*if (interaction.())
        interactionHandlers.get(interaction.customId)?.(interaction);*/
      if (interaction.isChatInputCommand())
        return interactionHandlers.get(interaction.commandName)?.(interaction);

      // modal submit (temp)
      // @ts-ignore
      if (interaction.customId && interactionHandlers.get(interaction.customId))
        // @ts-ignore
        interactionHandlers.get(interaction.customId)(interaction);
    });
  }
}

export { createElement, Fragment, Client, deleteHandler };
