import * as Discord from "discord.js";
import assert from "assert";

import { getNativeRenderer } from "./utils";

export class Node {
  public static instance: Node | null = null;
  protected message?: Discord.Message = undefined; // non-message VirtualDOM cannot be sent.

  public topLevelRenderer?: ComponentRenderer;
  public async renderAsMessage(
    container: MessageContainer
  ): Promise<Discord.Message> {
    throw new Error("Cannot render non-message virtual DOM as a message.");
  }
  public render(): DiscordNode {
    assert(this.topLevelRenderer);
    return this.topLevelRenderer();
  }
  public async update(
    interaction?: Discord.ButtonInteraction | Discord.AnySelectMenuInteraction
  ): Promise<Discord.Message> {
    throw new Error("Cannot update a message of non-message virtual DOM.");
  }
}
export class MessageNode extends Node {
  public async renderAsMessage(
    container: MessageContainer
  ): Promise<Discord.Message> {
    return (this.message = await getNativeRenderer(container)(this.render()));
  }
  public render(): DiscordNode {
    assert(this.topLevelRenderer);
    return this.topLevelRenderer();
  }
  public async update(
    interaction?: Discord.ButtonInteraction | Discord.AnySelectMenuInteraction
  ): Promise<Discord.Message> {
    assert(this.message);
    return (this.message = await getNativeRenderer(interaction || this.message)(
      this.render()
    ));
  }
}
