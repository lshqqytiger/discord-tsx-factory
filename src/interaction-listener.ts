import * as Discord from "discord.js";

import { InteractionType } from "./enums";
import { Listenable } from "./mixins";

export type ListenerCallback = (
  interaction: Discord.Interaction,
  off: () => boolean,
) => void | Promise<void>;

export class Listener implements Listenable {
  public static readonly listeners = new Map<string, Listener>();
  public readonly once?: boolean;
  public readonly listener: ListenerCallback;
  public readonly type: InteractionType;

  constructor(
    listener: ListenerCallback,
    type: InteractionType,
    once?: boolean,
  ) {
    this.listener = listener;
    this.type = type;
    this.once = once;
  }

  public matches(interaction: Discord.Interaction): boolean {
    switch (this.type) {
      case InteractionType.Button:
        return "isButton" in interaction && interaction.isButton();
      case InteractionType.SelectMenu:
        return (
          "isAnySelectMenu" in interaction && interaction.isAnySelectMenu()
        );
      case InteractionType.Modal:
        return "isModalSubmit" in interaction && interaction.isModalSubmit();
      default:
        return false;
    }
  }
}
