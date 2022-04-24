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
        color?: Discord.ColorResolvable;
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

const interactionHandlers = {
  button: new Map<string, (interaction: Discord.ButtonInteraction) => void>(),
  select: new Map<
    string,
    (interaction: Discord.SelectMenuInteraction) => void
  >(),
  modal: new Map<
    string,
    (interaction: Discord.ModalSubmitInteraction) => void
  >(),
  command: new Map<string, (interaction: Discord.CommandInteraction) => void>(),
};
const ElementBuilder = {
  embed: (props: JSX.IntrinsicElements["embed"], children: JSX.Element[]) => {
    props.fields = [];
    props.description = "";
    children.forEach((v) => {
      if (typeof v == "string") props.description += v;
      else props.fields?.push(v);
    });
    return new Discord.EmbedBuilder(props as Discord.EmbedData).setColor(
      props.color || null
    );
  },
  field: (props: JSX.IntrinsicElements["field"], children: JSX.Element[]) => ({
    name: props.name,
    value: children.join(""),
    inline: props.inline || false,
  }),
  emoji: (props: JSX.IntrinsicElements["emoji"]) => props,
  row: (props: JSX.IntrinsicElements["row"], children: JSX.Element[]) =>
    new Discord.ActionRowBuilder({
      ...props,
      components: children[0] instanceof Array ? children[0] : children,
    }),
  button: (props: JSX.IntrinsicElements["button"], children: JSX.Element[]) => {
    const button = new Discord.ButtonBuilder({
      ...props,
      style: props.style || Discord.ButtonStyle.Primary,
      label: children.join(""),
    } as Partial<Discord.InteractionButtonComponentData>);
    interactionHandlers.button.set(
      props.customId!,
      props.onClick || ((interaction: Discord.ButtonInteraction) => {})
    );
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
      label: children.join(""),
    }),
  select: (props: JSX.IntrinsicElements["select"], children: JSX.Element[]) => {
    const select = new Discord.SelectMenuBuilder(props);
    select.addOptions(children);
    interactionHandlers.select.set(
      props.customId!,
      props.onChange || ((interaction: Discord.SelectMenuInteraction) => {})
    );
    return select;
  },
  option: (props: JSX.IntrinsicElements["option"], children: JSX.Element[]) =>
    props,
  modal: (props: JSX.IntrinsicElements["modal"], children: JSX.Element[]) => {
    interactionHandlers.modal.set(
      props.customId!,
      props.onSubmit || ((interaction: Discord.ModalSubmitInteraction) => {})
    );
    return new Discord.ModalBuilder({
      ...props,
      components: children[0] instanceof Array ? children[0] : children,
    });
  },
  input: (props: JSX.IntrinsicElements["input"]) =>
    new Discord.TextInputBuilder({ ...props, type: 4 }),
  command: (
    props: JSX.IntrinsicElements["command"],
    children: JSX.Element[]
  ) => ({
    ...props,
    options: children,
  }),
  subcommand: (
    props: JSX.IntrinsicElements["subcommand"],
    children: JSX.Element[]
  ) => ({ ...props, type: 1, options: children }),
  subcommandgroup: (
    props: JSX.IntrinsicElements["subcommandgroup"],
    children: JSX.Element[]
  ) => ({ ...props, type: 2, options: children }),
  string: (
    props: JSX.IntrinsicElements["string"],
    children: JSX.Element[]
  ) => ({ ...props, type: 3, choices: children }),
  integer: (props: JSX.IntrinsicElements["integer"]) => ({ ...props, type: 4 }),
  boolean: (props: JSX.IntrinsicElements["boolean"]) => ({ ...props, type: 5 }),
  user: (props: JSX.IntrinsicElements["user"]) => ({
    ...props,
    type: 6,
  }),
  channel: (
    props: JSX.IntrinsicElements["channel"],
    children: JSX.Element[]
  ) => ({ ...props, type: 7 }),
  role: (props: JSX.IntrinsicElements["role"]) => ({
    ...props,
    type: 8,
  }),
  mentionable: (props: JSX.IntrinsicElements["mentionable"]) => ({
    ...props,
    type: 9,
  }),
  number: (props: JSX.IntrinsicElements["number"]) => ({ ...props, type: 10 }),
  attachment: (props: JSX.IntrinsicElements["attachment"]) => ({
    ...props,
    type: 11,
  }),
  choice: (props: JSX.IntrinsicElements["choice"]) => props,
};
const createElement = (
  tag: keyof JSX.IntrinsicElements | Function,
  props: any,
  ...children: JSX.Element[]
) => {
  if (typeof tag == "function") return tag(props, children);
  if (!props) props = {}; // null
  return ElementBuilder[tag](props, children);
};
const Fragment = (props: null, children: JSX.Element[]) => children;
const deploySlashCommand = async (client: Client, body: JSX.Element) => {
  const res: any = await client.rest.post(
    `/applications/${client.application?.id}/commands`,
    { body }
  );
  interactionHandlers.command.set(res.id, body.onSubmit);
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
  interactionHandlers.command.set(res.id, body.onSubmit);
  console.log(`Slash command ${res.id}(${res.name}) updated`);
};
const registerSlashCommandHandler = (
  ...commands: {
    id: string;
    onSubmit: (interaction: Discord.CommandInteraction) => void;
  }[]
) =>
  commands.forEach((v) => {
    interactionHandlers.command.set(
      v.id,
      v.onSubmit as (interaction: Discord.Interaction) => void
    );
    console.log(`Slash command handler for ${v.id} registered`);
  });

class Client extends Discord.Client {
  constructor(options: Discord.ClientOptions) {
    super(options);
    this.on("interactionCreate", (interaction: Discord.Interaction) => {
      if (interaction.isButton())
        interactionHandlers.button.get(interaction.customId)?.(interaction);
      if (interaction.isSelectMenu())
        interactionHandlers.select.get(interaction.customId)?.(interaction);
      if (interaction.isModalSubmit())
        interactionHandlers.modal.get(interaction.customId)?.(interaction);
      if (interaction.isCommand())
        interactionHandlers.command.get(interaction.commandId)?.(interaction);
    });
  }
  async deploySlashCommand(body: JSX.Element) {
    const res: any = await this.rest.post(
      `/applications/${this.application?.id}/commands`,
      { body }
    );
    interactionHandlers.command.set(res.id, body.onSubmit);
    console.log(`Slash command ${res.id}(${res.name}) deployed`);
  }
  async updateSlashCommand(id: string, body: JSX.Element) {
    const res: any = await this.rest.patch(
      `/applications/${this.application?.id}/commands/${id}`,
      { body }
    );
    interactionHandlers.command.set(res.id, body.onSubmit);
    console.log(`Slash command ${res.id}(${res.name}) updated`);
  }
  registerSlashCommandHandler(
    ...commands: {
      id: string;
      onSubmit: (interaction: Discord.CommandInteraction) => void;
    }[]
  ) {
    commands.forEach((v) => {
      interactionHandlers.command.set(
        v.id,
        v.onSubmit as (interaction: Discord.Interaction) => void
      );
      console.log(`Slash command handler for ${v.id} registered`);
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
