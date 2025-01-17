import * as Discord from "discord.js";

export type PartialOf<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;
export type ReplaceWith<T, K extends keyof T, R> = Omit<T, K> & R;

export function getSelectMenuBuilder(type?: Discord.SelectType) {
  switch (type) {
    case Discord.ComponentType.RoleSelect:
      return Discord.RoleSelectMenuBuilder;
    case Discord.ComponentType.UserSelect:
      return Discord.UserSelectMenuBuilder;
    case Discord.ComponentType.ChannelSelect:
      return Discord.ChannelSelectMenuBuilder;
    case Discord.ComponentType.MentionableSelect:
      return Discord.MentionableSelectMenuBuilder;
  }
  return Discord.StringSelectMenuBuilder;
}
export function getNativeRenderer($: MessageContainer): Function {
  if ($ instanceof Discord.BaseChannel && $.isSendable()) {
    return $.send.bind($);
  }
  if ($ instanceof Discord.BaseInteraction && $.isRepliable()) {
    return ("update" in $ ? $.update : $.reply).bind($);
  }
  if ($ instanceof Discord.Message) {
    return $.edit.bind($);
  }
  throw new Error("Failed to get sender from target.");
}
