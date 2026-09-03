import * as Discord from "discord.js";
import assert from "assert";

import { Component } from ".";
import { Node, MessageNode } from "./node";
import { FCNode } from "./function-component";

type Wrapper = (original: Function) => Function;
let installed = false;
function wrap<T extends string>(
  prototype: { [K in T]: Function },
  method: T,
  wrapper: Wrapper,
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
      Discord.APIActionRowComponent<Discord.APIComponentInMessageActionRow>
    >
  | Discord.ActionRowData<
      | Discord.MessageActionRowComponentData
      | Discord.MessageActionRowComponentBuilder
    >
  | Discord.APIActionRowComponent<Discord.APIComponentInMessageActionRow>
>;

const Wrapper: Wrapper = (original) =>
  async function (
    this: MessageContainer,
    options: JSX.IntrinsicProps["message"] | Component,
  ) {
    let normalizedOptions: JSX.IntrinsicProps["message"] | undefined;
    if (typeof options === "object") {
      if (options instanceof Component) {
        Node.instance = options.node || new MessageNode();
        Node.instance.topLevelRenderer = options.render.bind(options);
        if (options.node === undefined) options.bind(Node.instance);
        const rendered = await Node.instance.renderAsMessage(this);
        Node.instance = null;
        return rendered;
      }
      normalizedOptions = options;
      if ("embeds" in options && options.embeds !== undefined) {
        assert(Array.isArray(options.embeds));
        normalizedOptions = { ...normalizedOptions };
        const node = new Node();
        node.topLevelRenderer = () =>
          (normalizedOptions!.embeds as EmbedsResolvable).map((embed) => {
            if (embed instanceof Component) {
              return embed.render();
            }
            return embed as DiscordNode;
          });
        normalizedOptions.embeds = options.embeds.map((embed) => {
          if (embed instanceof Component) {
            Node.instance = embed.node || node;
            embed.bind(Node.instance);
            const rendered = embed.render();
            Node.instance = null;
            return rendered;
          }
          return embed as DiscordNode;
        });
      }
      if ("components" in options && options.components !== undefined) {
        assert(Array.isArray(options.components));
        normalizedOptions = { ...normalizedOptions };
        const node = new Node();
        node.topLevelRenderer = () =>
          (normalizedOptions!.components as ComponentsResolvable).map(
            (component) => {
              if (component instanceof Component) {
                return component.render();
              }
              return component as DiscordNode;
            },
          );
        normalizedOptions.components = options.components.map((component) => {
          if (component instanceof Component) {
            Node.instance = component.node || node;
            component.bind(Node.instance);
            const rendered = component.render();
            Node.instance = null;
            return rendered;
          }
          return component as DiscordNode;
        });
      }
    }
    if (Node.instance instanceof FCNode) {
      return await Node.instance.renderAsMessage(this);
    }
    return await original.call(this, normalizedOptions ?? options);
  };
const ShowModalWrapper: Wrapper = (original) =>
  async function (
    this: Discord.CommandInteraction | Discord.MessageComponentInteraction,
    options: JSX.Element,
  ) {
    if (options instanceof Component) {
      Node.instance = options.node || new Node();
      Node.instance.topLevelRenderer = options.render.bind(options);
      if (options.node === undefined) {
        options.bind(Node.instance);
      }
      const rendered = Node.instance.render();
      Node.instance = null;
      return rendered;
    }
    if (Node.instance instanceof FCNode) {
      return Node.instance.render();
    }
    return await original.call(this, options);
  };
const ComponentBuilderToJSONWrapper: Wrapper = (original) =>
  function (this: Discord.ComponentBuilder) {
    if (this.data instanceof Component) {
      return (
        this.data.render() as Discord.BaseSelectMenuBuilder<any>
      ).toJSON();
    }
    return original.call(this);
  };

export default function () {
  if (installed) {
    return;
  }
  installed = true;

  wrap(Discord.TextChannel.prototype, "send", Wrapper);
  wrap(Discord.DMChannel.prototype, "send", Wrapper);
  wrap(Discord.NewsChannel.prototype, "send", Wrapper);
  wrap(Discord.StageChannel.prototype, "send", Wrapper);
  wrap(Discord.VoiceChannel.prototype, "send", Wrapper);

  wrap(Discord.Message.prototype, "reply", Wrapper);
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
    ShowModalWrapper,
  );

  wrap(
    Discord.ComponentBuilder.prototype,
    "toJSON",
    ComponentBuilderToJSONWrapper,
  );
}
