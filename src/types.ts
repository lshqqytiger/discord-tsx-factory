import * as Discord from "discord.js";

export type StateSetter<S> = (
  state: S,
  interaction?: Discord.ButtonInteraction | Discord.SelectMenuInteraction
) => void;
export type MessageContainer =
  | Discord.BaseChannel
  | Discord.BaseInteraction
  | Discord.Message;
