import * as Discord from "discord.js";

import { DiscordNode } from "./index";
import { PartialOf, ReplaceWith } from "./utils";
import { HasChildren, HasInternalTag, Listenable } from "./mixins";

declare global {
  namespace JSX {
    type Element = Rendered[IntrinsicKeys];
    type ElementReplacer<T, K extends keyof T> = ReplaceWith<
      T,
      K,
      { [N in K]: Element | Element[] | T[N] }
    >;
    type IntrinsicKeys = keyof IntrinsicProps;
    interface ChildResolvable {
      message: never;
      br: never;
      embed: Discord.APIEmbedField | DiscordNode;
      footer: DiscordNode;
      field: DiscordNode;
      emoji: never;
      row:
        | Discord.ButtonBuilder
        | Discord.BaseSelectMenuBuilder<Discord.APISelectMenuComponent>;
      button: DiscordNode;
      select: Discord.StringSelectMenuOptionBuilder;
      option: DiscordNode;
      modal: Discord.ActionRowData<Discord.ModalActionRowComponentData>;
      input: never;
    }
    interface IntrinsicProps {
      message: ElementReplacer<
        Discord.BaseMessageOptions,
        "embeds" | "components"
      >;
      br: {};
      embed: Omit<Discord.EmbedData, "color" | "footer" | "timestamp"> & {
        color?: Discord.ColorResolvable;
        footer?: IntrinsicProps["footer"] | string;
      };
      footer: PartialOf<Discord.EmbedFooterData, "text">;
      field: PartialOf<Discord.EmbedField, "value" | "inline">;
      emoji: {
        emoji: Discord.Emoji | Discord.EmojiResolvable;
      };
      row: Partial<Discord.ActionRowComponentData>;
      button: Partial<Discord.ButtonComponent> & {
        emoji?: Discord.Emoji | string;
        onClick?: Discord.ButtonInteractionHandler;
      } & Listenable;
      select: Omit<Discord.BaseSelectMenuComponentData, "type"> & {
        type?: Discord.SelectType;
        onChange?: Discord.SelectMenuInteractionHandler;
        channelTypes?: Discord.ChannelType[];
      } & Listenable;
      option: Discord.SelectMenuComponentOptionData;
      modal: Omit<Discord.ModalData, "type" | "components"> & {
        type?:
          | Discord.ComponentType.ActionRow
          | Discord.ComponentType.TextInput;
        customId: string;
        title: string;
        onSubmit?: Discord.ModalSubmitInteractionHandler;
      } & Listenable;
      input: Omit<Discord.TextInputComponentData, "type">;
    }
    interface Rendered {
      message: Discord.BaseMessageOptions & HasInternalTag<"message">;
      br: "\n";
      embed: Discord.EmbedBuilder;
      footer: Discord.EmbedFooterData;
      field: Discord.EmbedField;
      emoji: Discord.Emoji | Discord.EmojiResolvable;
      row: Discord.ActionRowBuilder;
      button: Discord.ButtonBuilder;
      select:
        | Discord.StringSelectMenuBuilder
        | Discord.RoleSelectMenuBuilder
        | Discord.UserSelectMenuBuilder
        | Discord.ChannelSelectMenuBuilder
        | Discord.MentionableSelectMenuBuilder;
      option: Discord.SelectMenuComponentOptionData;
      modal: Discord.ModalBuilder;
      input: Discord.TextInputBuilder;
    }
    type IntrinsicElement<T extends IntrinsicKeys> = Partial<
      HasChildren<ChildResolvable[T]>
    > &
      IntrinsicProps[T];
    type IntrinsicInternalElement<T extends IntrinsicKeys> =
      IntrinsicElement<T> & HasChildren<ChildResolvable[T]> & HasInternalTag<T>;
    type IntrinsicElements = {
      [T in IntrinsicKeys]: IntrinsicElement<T>;
    };
    type IntrinsicInternalElements = {
      [T in IntrinsicKeys]: IntrinsicInternalElement<T>;
    };
  }
}

declare module "discord.js" {
  export type SelectType =
    | Discord.ComponentType.RoleSelect
    | Discord.ComponentType.UserSelect
    | Discord.ComponentType.StringSelect
    | Discord.ComponentType.ChannelSelect
    | Discord.ComponentType.MentionableSelect;
  export type ButtonInteractionHandler = (
    interaction: Discord.ButtonInteraction,
    off: () => boolean
  ) => void;
  export type SelectMenuInteractionHandler = (
    interaction: Discord.SelectMenuInteraction,
    off: () => boolean
  ) => void;
  export type ModalSubmitInteractionHandler = (
    interaction: Discord.ModalSubmitInteraction
  ) => void;
  interface PartialTextBasedChannelFields<InGuild extends boolean = boolean> {
    send(
      options: JSX.Element | JSX.IntrinsicProps["message"]
    ): Promise<Message<InGuild>>;
  }

  type ElementInteractionReplyOptions = JSX.ElementReplacer<
    Discord.InteractionReplyOptions,
    "embeds" | "components"
  >;
  type ElementInteractionEditReplyOptions = JSX.ElementReplacer<
    Discord.InteractionEditReplyOptions,
    "embeds" | "components"
  >;
  interface CommandInteraction<Cached extends CacheType = CacheType> {
    reply(
      options: JSX.Element | ElementInteractionReplyOptions
    ): Promise<Message<BooleanCache<Cached>>>;
    editReply(
      options: JSX.Element | ElementInteractionEditReplyOptions
    ): Promise<Message<BooleanCache<Cached>>>;
    showModal(modal: JSX.Element): Promise<Message<BooleanCache<Cached>>>;
  }
  interface MessageComponentInteraction<Cached extends CacheType = CacheType> {
    reply(
      options: JSX.Element | ElementInteractionReplyOptions
    ): Promise<Message<BooleanCache<Cached>>>;
    editReply(
      options: JSX.Element | ElementInteractionEditReplyOptions
    ): Promise<Message<BooleanCache<Cached>>>;
    showModal(modal: JSX.Element): Promise<Message<BooleanCache<Cached>>>;
  }
  interface ModalSubmitInteraction<Cached extends CacheType = CacheType> {
    reply(
      options: JSX.Element | ElementInteractionReplyOptions
    ): Promise<Message<BooleanCache<Cached>>>;
    editReply(
      options: JSX.Element | ElementInteractionEditReplyOptions
    ): Promise<Message<BooleanCache<Cached>>>;
  }
}
