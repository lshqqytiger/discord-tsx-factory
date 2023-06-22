import * as Discord from "discord.js";
import assert from "assert";

import { Component, DiscordNode } from ".";
import { VirtualDOM, IncompleteVirtualDOM } from "./virtual-dom";

type Wrapper = (original: Function) => Function;
function wrap<T extends string>(
  prototype: { [K in T]: Function },
  method: T,
  wrapper: Wrapper
) {
  const _method = prototype[method];
  prototype[method] = wrapper(_method);
}

const Wrapper: Wrapper = (original) =>
  async function (
    this: MessageContainer,
    options: JSX.IntrinsicProps["message"] | Component
  ) {
    if (typeof options === "object") {
      if (options instanceof Component) {
        VirtualDOM.instance = options.virtualDOM || new VirtualDOM();
        VirtualDOM.instance.topLevelRenderer = options.render.bind(options);
        if (options.virtualDOM === undefined) options.bind(VirtualDOM.instance);
        const rendered = await VirtualDOM.instance.renderAsMessage(this);
        VirtualDOM.instance = null;
        return rendered;
      }
      if ("embeds" in options && options.embeds !== undefined) {
        assert(Array.isArray(options.embeds));
        const virtualDOM = new IncompleteVirtualDOM();
        virtualDOM.topLevelRenderer = () =>
          (options.embeds as _EmbedsResolvable).map((embed) => {
            if (embed instanceof Component) return embed.render();
            return embed as DiscordNode;
          });
        options.embeds = options.embeds.map((embed) => {
          if (embed instanceof Component) {
            VirtualDOM.instance = embed.virtualDOM || virtualDOM;
            embed.bind(VirtualDOM.instance);
            const rendered = embed.render();
            VirtualDOM.instance = null;
            return rendered;
          }
          return embed as DiscordNode;
        });
      }
      if ("components" in options && options.components !== undefined) {
        assert(Array.isArray(options.components));
        const virtualDOM = new IncompleteVirtualDOM();
        virtualDOM.topLevelRenderer = () =>
          (options.components as _ComponentsResolvable).map((component) => {
            if (component instanceof Component) return component.render();
            return component as DiscordNode;
          });
        options.components = options.components.map((component) => {
          if (component instanceof Component) {
            VirtualDOM.instance = component.virtualDOM || virtualDOM;
            component.bind(VirtualDOM.instance);
            const rendered = component.render();
            VirtualDOM.instance = null;
            return rendered;
          }
          return component as DiscordNode;
        });
      }
    }
    return await original.call(this, options);
  };
const ShowModalWrapper: Wrapper = (original) =>
  async function (
    this: Discord.CommandInteraction | Discord.MessageComponentInteraction,
    options: JSX.Element
  ) {
    if (options instanceof Component) {
      VirtualDOM.instance = options.virtualDOM || new IncompleteVirtualDOM();
      VirtualDOM.instance.topLevelRenderer = options.render.bind(options);
      if (options.virtualDOM === undefined) options.bind(VirtualDOM.instance);
      const rendered = VirtualDOM.instance.render();
      VirtualDOM.instance = null;
      return rendered;
    }
    return await original.call(this, options);
  };
const ComponentBuilderToJSONWrapper: Wrapper = (original) =>
  function (this: Discord.ComponentBuilder) {
    if (this.data instanceof Component)
      return (
        this.data.render() as Discord.BaseSelectMenuBuilder<any>
      ).toJSON();
    return original.call(this);
  };

export default function () {
  wrap(Discord.TextChannel.prototype, "send", Wrapper);
  wrap(Discord.DMChannel.prototype, "send", Wrapper);
  wrap(Discord.NewsChannel.prototype, "send", Wrapper);
  wrap(Discord.StageChannel.prototype, "send", Wrapper);
  wrap(Discord.VoiceChannel.prototype, "send", Wrapper);

  wrap(Discord.CommandInteraction.prototype, "reply", Wrapper);
  wrap(Discord.MessageComponentInteraction.prototype, "reply", Wrapper);
  wrap(Discord.ModalSubmitInteraction.prototype, "reply", Wrapper);

  wrap(Discord.CommandInteraction.prototype, "editReply", Wrapper);
  wrap(Discord.MessageComponentInteraction.prototype, "editReply", Wrapper);
  wrap(Discord.ModalSubmitInteraction.prototype, "editReply", Wrapper);

  wrap(Discord.MessageComponentInteraction.prototype, "update", Wrapper);

  wrap(Discord.CommandInteraction.prototype, "showModal", ShowModalWrapper);
  wrap(
    Discord.MessageComponentInteraction.prototype,
    "showModal",
    ShowModalWrapper
  );

  wrap(
    Discord.ComponentBuilder.prototype,
    "toJSON",
    ComponentBuilderToJSONWrapper
  );
}
