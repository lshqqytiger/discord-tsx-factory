import * as Discord from "discord.js";

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;
type Overwrite<T, K> = {
  [P in Exclude<keyof T, keyof K>]: T[P];
} & K;

declare global {
  namespace JSX {
    type Element = any; // 임시
    interface IntrinsicElements {
      embed: Discord.MessageEmbedOptions;
      field: PartialBy<Omit<Discord.EmbedFieldData, "value">, "inline">;
      emoji: { name: string };
      row: Partial<Discord.MessageActionRowComponentOptions>;
      button: RequiredBy<
        Partial<Discord.InteractionButtonOptions>,
        "customId"
      > & {
        emoji?: Discord.Emoji | string;
        onClick?: (interaction: Discord.ButtonInteraction) => void;
      };
      linkbutton: RequiredBy<Partial<Discord.LinkButtonOptions>, "url">;
      select: RequiredBy<
        Partial<Discord.MessageSelectMenuOptions>,
        "customId"
      > & { onChange?: (interaction: Discord.SelectMenuInteraction) => void };
      option: Discord.MessageSelectOptionData;
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
  if (typeof tag == "function") return tag(props, children);
  if (!props) props = {}; // null
  switch (tag) {
    case "embed": {
      const embed = new Discord.MessageEmbed(props);
      children.forEach((v) => {
        if (typeof v == "string")
          embed.setDescription(embed.description || "" + v);
        else embed.addFields(children);
      });
      return embed;
    }
    case "field":
      return {
        name: props.name,
        value: children.join(""),
        inline: props.inline || false,
      };
    case "emoji":
      return ` :${props.name}:`;
    case "row": {
      const row = new Discord.MessageActionRow();
      row.addComponents(children);
      return row;
    }
    case "button": {
      const button = new Discord.MessageButton({
        ...props,
        style: props.style || "PRIMARY",
        label: children.join(""),
      });
      interactionHandlers.set(props.customId, props.onClick);
      if (props.emoji) button.setEmoji(props.emoji);
      return button;
    }
    case "linkbutton":
      return new Discord.MessageButton({
        ...props,
        style: "LINK",
        label: children.join(""),
      });
    case "select": {
      const select = new Discord.MessageSelectMenu(props);
      select.addOptions(children);
      interactionHandlers.set(props.customId, props.onChange);
      return select;
    }
    case "option":
      return props as Discord.MessageSelectOptionData;
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
    });
  }
}

export { createElement, Fragment, Client };
