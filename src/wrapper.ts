import * as Discord from "discord.js";
import assert from "assert";

import { Component } from ".";
import { VirtualDOM, MessageVirtualDOM } from "./virtual-dom";
import { FCVirtualDOM } from "./function-component";

type Wrapper = (original: Function) => Function;
function wrap<T extends string>(
  prototype: { [K in T]: Function },
  method: T,
  wrapper: Wrapper
) {
  const _method = prototype[method];
  prototype[method] = wrapper(_method);
}

type EmbedsResolvable = Array<
  JSX.Element | Discord.APIEmbed | Discord.JSONEncodable<Discord.APIEmbed>
>;
type ComponentsResolvable = Array<
  | JSX.Element
  | Discord.JSONEncodable<
      Discord.APIActionRowComponent<Discord.APIMessageActionRowComponent>
    >
  | Discord.ActionRowData<
      | Discord.MessageActionRowComponentData
      | Discord.MessageActionRowComponentBuilder
    >
  | Discord.APIActionRowComponent<Discord.APIMessageActionRowComponent>
>;

const Wrapper: Wrapper = (original) =>
  async function (
    this: MessageContainer,
    options: JSX.IntrinsicProps["message"] | Component
  ) {
    if (typeof options === "object") {
      if (options instanceof Component) {
        VirtualDOM.instance = options.virtualDOM || new MessageVirtualDOM();
        VirtualDOM.instance.topLevelRenderer = options.render.bind(options);
        if (options.virtualDOM === undefined) options.bind(VirtualDOM.instance);
        const rendered = await VirtualDOM.instance.renderAsMessage(this);
        VirtualDOM.instance = null;
        return rendered;
      }
      if ("embeds" in options && options.embeds !== undefined) {
        assert(Array.isArray(options.embeds));
        const virtualDOM = new VirtualDOM();
        virtualDOM.topLevelRenderer = () =>
          (options.embeds as EmbedsResolvable).map((embed) => {
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
        const virtualDOM = new VirtualDOM();
        virtualDOM.topLevelRenderer = () =>
          (options.components as ComponentsResolvable).map((component) => {
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
    if (VirtualDOM.instance instanceof FCVirtualDOM)
      return await VirtualDOM.instance.renderAsMessage(this);
    return await original.call(this, options);
  };
const ShowModalWrapper: Wrapper = (original) =>
  async function (
    this: Discord.CommandInteraction | Discord.MessageComponentInteraction,
    options: JSX.Element
  ) {
    if (options instanceof Component) {
      VirtualDOM.instance = options.virtualDOM || new VirtualDOM();
      VirtualDOM.instance.topLevelRenderer = options.render.bind(options);
      if (options.virtualDOM === undefined) options.bind(VirtualDOM.instance);
      const rendered = VirtualDOM.instance.render();
      VirtualDOM.instance = null;
      return rendered;
    }
    if (VirtualDOM.instance instanceof FCVirtualDOM)
      return VirtualDOM.instance.render();
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
