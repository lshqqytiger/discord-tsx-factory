import * as Discord from "discord.js";

export type PartialOf<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;
export type ReplaceWith<T, K extends keyof T, R> = Omit<T, K> & R;

export function getBuilder(type?: Discord.SelectType) {
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
