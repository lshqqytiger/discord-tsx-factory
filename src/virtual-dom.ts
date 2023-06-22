import * as Discord from "discord.js";
import assert from "assert";

import { DiscordNode } from ".";

function getNativeRenderer($: MessageContainer): Function {
  if ($ instanceof Discord.BaseChannel && $.isTextBased())
    return $.send.bind($);
  if ($ instanceof Discord.BaseInteraction && $.isRepliable())
    return ("update" in $ ? $.update : $.reply).bind($);
  if ($ instanceof Discord.Message) return $.edit.bind($);
  throw new Error("Failed to get sender from target.");
}

export class VirtualDOM {
  public static instance: VirtualDOM | null = null;
  protected message?: Discord.Message;
  public topLevelRenderer?: ComponentRenderer;
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
export class IncompleteVirtualDOM extends VirtualDOM {
  protected message: undefined = undefined; // IncompleteVirtualDOM cannot be sent.
  public topLevelRenderer?: ComponentRenderer;
  public async renderAsMessage(
    container: MessageContainer
  ): Promise<Discord.Message> {
    throw new Error("Cannot render incomplete virtual DOM as a message.");
  }
  public render(): DiscordNode {
    assert(this.topLevelRenderer);
    return this.topLevelRenderer();
  }
  public async update(
    interaction?: Discord.ButtonInteraction | Discord.AnySelectMenuInteraction
  ): Promise<Discord.Message> {
    throw new Error("Cannot update a message of incomplete virtual DOM.");
  }
}
