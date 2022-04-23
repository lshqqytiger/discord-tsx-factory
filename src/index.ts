import * as Discord from "discord.js";

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type Overwrite<T, K> = {
  [P in Exclude<keyof T, keyof K>]: T[P];
} & K;

declare global {
  namespace JSX {
    interface IntrinsicElements {
      embed: Discord.MessageEmbedOptions;
      field: PartialBy<Omit<Discord.EmbedFieldData, "value">, "inline">;
      emoji: { name: string };
    }
  }
}

const createElement = (
  tag: keyof globalThis.JSX.IntrinsicElements | Function,
  props: any, // 임시
  ...children: any[]
) => {
  if (typeof tag == "function") return tag(props, children);
  switch (tag) {
    case "embed": {
      const embed = new Discord.MessageEmbed(props);
      embed.addFields(children);
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
    default:
      return {};
  }
};

export { createElement };
