import * as Discord from "discord.js";

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

declare global {
  namespace JSX {
    type Element = any; // 임시
    interface IntrinsicElements {
      embed: Omit<Discord.EmbedData, "color"> & {
        color: Discord.ColorResolvable;
      };
      field: Omit<Discord.EmbedFieldData, "value">;
      emoji: { name: string };
      row: Partial<Discord.ActionRowComponentData>;
      button: RequiredBy<Partial<Discord.ButtonComponent>, "customId"> & {
        emoji?: Discord.Emoji | string;
        onClick?: (interaction: Discord.ButtonInteraction) => void;
      };
      linkbutton: Omit<Discord.LinkButtonComponentData, "style">;
      select: RequiredBy<
        Partial<Discord.SelectMenuComponentData>,
        "customId"
      > & {
        onChange?: (interaction: Discord.SelectMenuInteraction) => void;
      };
      option: Discord.SelectMenuComponentOptionData;
      modal: Omit<Discord.ModalData, "components"> & {
        onSubmit?: (interaction: Discord.ModalSubmitInteraction) => void;
      };
      input: Omit<Discord.TextInputComponentData, "type">;
    }
  }
}

const interactionHandlers = new Map<
  string,
  (interaction: Discord.Interaction) => void
>();
const createElement = (
  tag: keyof globalThis.JSX.IntrinsicElements | Function,
  props: any,
  ...children: any[]
) => {
  const components = children[0] instanceof Array ? children[0] : children;
  if (typeof tag == "function") return tag(props, children);
  if (!props) props = {}; // null
  switch (tag) {
    case "embed": {
      props.fields = [];
      props.description = "";
      children.forEach((v) => {
        if (typeof v == "string") props.description += v;
        else props.fields.push(children);
      });
      return new Discord.EmbedBuilder(props).setColor(props.color);
    }
    case "field":
      return {
        name: props.name,
        value: children.join(""),
        inline: props.inline || false,
      };
    case "emoji":
      return ` :${props.name}:`;
    case "row":
      return new Discord.ActionRowBuilder({
        ...props,
        components,
      });
    case "button": {
      const button = new Discord.ButtonBuilder({
        ...props,
        style: props.style || Discord.ButtonStyle.Primary,
        label: children.join(""),
      });
      interactionHandlers.set(props.customId, props.onClick);
      if (props.emoji) button.setEmoji(props.emoji);
      return button;
    }
    case "linkbutton":
      return new Discord.ButtonBuilder({
        ...props,
        style: Discord.ButtonStyle.Link,
        label: children.join(""),
      });
    case "select": {
      const select = new Discord.SelectMenuBuilder(props);
      select.addOptions(children);
      interactionHandlers.set(props.customId, props.onChange);
      return select;
    }
    case "option":
      return props as Discord.SelectMenuComponentOptionData;
    case "modal":
      interactionHandlers.set(props.customId, props.onSubmit);
      return new Discord.ModalBuilder({ ...props, components });
    case "input":
      return new Discord.TextInputBuilder({ ...props, type: 4 });
  }
};
const Fragment = (props: null, children: JSX.Element[]) => children;

class Client extends Discord.Client {
  constructor(options: Discord.ClientOptions) {
    super(options);
    this.on("interactionCreate", (interaction: Discord.Interaction) => {
      if (interaction.isButton())
        interactionHandlers.get(interaction.customId)?.(interaction);
      if (interaction.isSelectMenu())
        interactionHandlers.get(interaction.customId)?.(interaction);
      if (interaction.isModalSubmit())
        interactionHandlers.get(interaction.customId)?.(interaction);
    });
  }
}

export { createElement, Fragment, Client };
