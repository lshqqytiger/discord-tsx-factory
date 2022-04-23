import * as Discord from "discord.js";

type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
type RequiredBy<T, K extends keyof T> = Omit<T, K> & Required<Pick<T, K>>;

interface CommandOption {
  name: string;
  description: string;
  required: boolean;
}

declare global {
  namespace JSX {
    type Element = any; // 임시
    interface IntrinsicElements {
      embed: Omit<Discord.EmbedData, "color"> & {
        color: Discord.ColorResolvable;
      };
      field: Omit<Discord.EmbedFieldData, "value">;
      emoji: Discord.Emoji;
      row: Partial<Discord.ActionRowComponentData>;
      button: RequiredBy<Partial<Discord.ButtonComponent>, "customId"> & {
        emoji?: Discord.Emoji | string;
        onClick?: (interaction: Discord.ButtonInteraction) => void;
      };
      linkbutton: Omit<Discord.LinkButtonComponentData, "style" | "type">;
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
      command: {
        name: string;
        description: string;
        onSubmit?: (interaction: Discord.CommandInteraction) => void;
      };
      subcommand: {
        name: string;
        description: string;
      };
      subcommandgroup: {
        name: string;
        description: string;
      };
      string: CommandOption;
      integer: CommandOption;
      boolean: CommandOption;
      user: CommandOption;
      channel: CommandOption;
      role: CommandOption;
      mentionable: CommandOption;
      number: CommandOption;
      attachment: CommandOption;
      choice: { name: string; value: string };
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
      return props as Discord.Emoji;
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
    case "command":
      return {
        ...props,
        options: children,
      };
    case "subcommand":
      return { ...props, type: 1, options: children };
    case "subcommandgroup":
      return { ...props, type: 2, options: children };
    case "string":
      return { ...props, type: 3, choices: children };
    case "integer":
      return { ...props, type: 4 };
    case "boolean":
      return { ...props, type: 5 };
    case "user":
      return { ...props, type: 6 };
    case "channel":
      return { ...props, type: 7 };
    case "role":
      return { ...props, type: 8 };
    case "mentionable":
      return { ...props, type: 9 };
    case "number":
      return { ...props, type: 10 };
    case "attachment":
      return { ...props, type: 11 };
    case "choice":
      return props as { name: string; value: string };
  }
};
const Fragment = (props: null, children: JSX.Element[]) => children;
const deploySlashCommand = async (client: Client, body: JSX.Element) => {
  const res: any = await client.rest.post(
    `/applications/${client.application?.id}/commands`,
    { body }
  );
  interactionHandlers.set(res.id, body.onSubmit);
  console.log(`Slash command ${res.id}(${res.name}) deployed`);
};
const updateSlashCommand = async (
  client: Client,
  id: string,
  body: JSX.Element
) => {
  const res: any = await client.rest.patch(
    `/applications/${client.application?.id}/commands/${id}`,
    { body }
  );
  interactionHandlers.set(res.id, body.onSubmit);
  console.log(`Slash command ${res.id}(${res.name}) updated`);
};
const registerSlashCommandHandler = (
  ...commands: {
    id: string;
    onSubmit: (interaction: Discord.CommandInteraction) => void;
  }[]
) => {
  commands.forEach((v) => {
    interactionHandlers.set(
      v.id,
      v.onSubmit as (interaction: Discord.Interaction) => void
    );
    console.log(`Slash command handler for ${v.id} registered`);
  });
};

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
      if (interaction.isCommand())
        interactionHandlers.get(interaction.commandId)?.(interaction);
    });
  }
}

export {
  createElement,
  Fragment,
  deploySlashCommand,
  updateSlashCommand,
  registerSlashCommandHandler,
  Client,
};
