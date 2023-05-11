import * as Discord from "discord.js";

export type StateSetter<S> = (
  state: S,
  interaction?: Discord.ButtonInteraction | Discord.SelectMenuInteraction
) => void;
export type Props<P, C = never> = P & {
  children?: C;
};
export type MessageContainer =
  | Discord.BaseChannel
  | Discord.BaseInteraction
  | Discord.Message;
