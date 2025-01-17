import * as Discord from "discord.js";
import assert, { AssertionError } from "assert";

import "./declarations";
import { Listener } from "./interaction-listener";
import { getSelectMenuBuilder } from "./utils";
import { ComponentLike, HasChildren } from "./mixins";
import { InteractionType } from "./enums";
import { Node } from "./node";
import { FCNode, FunctionComponent } from "./function-component";
import wrapDiscordJS from "./wrapper";

export type DiscordFragment = Iterable<DiscordNode>;
export class Component<P = {}, S extends {} = {}> extends ComponentLike<P, S> {
  private _node?: Node;
  public get node() {
    return this._node;
  }
  public bind(node: Node) {
    this._node = node;
  }
  public render(): DiscordNode {
    throw new Error("Your component doesn't have 'render' method.");
  }
  public setState: StateSetter<S> = async (state, interaction) => {
    assert(this._node);
    const prevState = { ...this.state };
    const shouldComponentUpdate = this.shouldComponentUpdate({
      ...this.state,
      ...state,
    });
    Object.assign(this.state, state);
    if (shouldComponentUpdate) {
      await this._node.update(interaction);
      this.componentDidUpdate?.(prevState);
    }
  };
  public async forceUpdate() {
    assert(this._node);
    return await this._node.update();
  }
}
export type FC<P = {}> = FunctionComponent<P>;

function ElementBuilder(
  props: JSX.IntrinsicInternalElements[JSX.IntrinsicKeys]
): DiscordNode | undefined {
  switch (props._tag) {
    case "message":
      return props as JSX.Rendered["message"];
    case "br":
      return "\n";
    case "embed":
      props.fields = [];

      if (props.description === undefined) {
        props.description = "";

        for (const child of props.children.flat(Infinity)) {
          const field = child instanceof Component ? child.render() : child;
          if (
            typeof field === "object" &&
            "name" in field &&
            "value" in field
          ) {
            props.fields = [...props.fields, field];
          } else {
            props.description += child.toString();
          }
        }
      }

      return new Discord.EmbedBuilder({
        ...props,
        footer:
          typeof props.footer === "string"
            ? { text: props.footer }
            : (props.footer as Discord.EmbedFooterOptions),
        color: undefined,
      }).setColor(props.color || null);
    case "footer":
      return typeof props.children === "object"
        ? {
            ...props,
            text: props.text || Array.from(props.children).join(""),
          }
        : { text: props.children };
    case "field":
      return {
        name: props.name,
        value:
          props.value ||
          (typeof props.children === "object"
            ? Array.from(props.children).flat(Infinity).join("")
            : props.children),
        inline: Boolean(props.inline),
      };
    case "emoji":
      return props.emoji;
    case "row":
      return new Discord.ActionRowBuilder({
        ...props,
        components: props.children.flat(Infinity),
      });
    case "button": {
      const $ = new Discord.ButtonBuilder({
        customId: props.customId || undefined,
        disabled: props.disabled || undefined,
        emoji: props.emoji,
        label:
          props.label ||
          (typeof props.children === "object"
            ? Array.from(props.children).flat(Infinity).join("")
            : String(props.children)),
      }).setStyle(
        props.style ||
          (props.url ? Discord.ButtonStyle.Link : Discord.ButtonStyle.Primary)
      );
      if (props.onClick) {
        assert(
          props.customId,
          "Button which has onClick property must have a customId."
        );
        assert(!props.url, "You can't use both customId/onClick and url.");
        Listener.listeners.set(
          props.customId,
          new Listener(props.onClick, InteractionType.Button, props.once)
        );
      }
      if (props.url) {
        $.setURL(props.url);
      }
      return $;
    }
    case "select": {
      if (props.onChange && props.customId) {
        Listener.listeners.set(
          props.customId,
          new Listener(props.onChange, InteractionType.SelectMenu, props.once)
        );
      }
      const $ = new (getSelectMenuBuilder(props.type))({
        ...props,
        type: undefined,
      });
      if ($ instanceof Discord.StringSelectMenuBuilder) {
        $.setOptions(...props.children);
      }
      return $;
    }
    case "option":
      return props; // to be internally wrapped later.
    case "modal":
      if (props.onSubmit) {
        Listener.listeners.set(
          props.customId,
          new Listener(props.onSubmit, InteractionType.Modal, props.once)
        );
      }
      return new Discord.ModalBuilder({
        customId: props.customId,
        title: props.title,
        components: props.children.flat(Infinity),
      });
    case "input":
      return new Discord.TextInputBuilder({ ...props, type: 4 });
  }
  // returns undefined if 'props' is not resolvable.
}
export function createElement<T extends JSX.IntrinsicKeys>(
  tag: T | typeof Component | FunctionComponent<JSX.IntrinsicElement<T>>,
  props: JSX.IntrinsicElement<T>,
  ...children: JSX.ChildResolvable[T][]
): DiscordNode | Component | undefined {
  if (!props || !props.children) {
    props = { ...props, children };
  }
  if (typeof tag === "function") {
    if (
      tag.prototype && // filter arrow function
      "render" in tag.prototype // renderable component
    ) {
      const rendered = Reflect.construct(tag, [props]);
      if (rendered instanceof Component && Node.instance !== null) {
        rendered.bind(Node.instance);
      }
      return rendered;
    }
    if (tag === Fragment) {
      return tag(props);
    }
    try {
      tag = tag as FunctionComponent<JSX.IntrinsicElement<T>>; // assert
      const node = new FCNode(tag, props);
      Node.instance = node;
      const rendered = tag(props);
      node.initialize();
      return rendered;
    } catch (e) {
      Node.instance = null;
      throw new AssertionError({
        message: `INTERNAL ASSERTION FAILED! ${tag.name} should extend Component or be a FunctionComponent.`,
      });
    }
  }
  return ElementBuilder({
    ...props,
    _tag: tag,
  } as JSX.IntrinsicInternalElements[T]);
}
export const Fragment = (
  props: Partial<HasChildren<DiscordNode>>
): DiscordFragment => props.children || [];
export const getListener = Listener.listeners.get.bind(Listener.listeners);
export const setListener = Listener.listeners.set.bind(Listener.listeners);
export const deleteListener = Listener.listeners.delete.bind(
  Listener.listeners
);

export class Client extends Discord.Client {
  private _once: InteractionType[] = [InteractionType.Modal];
  public readonly defaultInteractionCreateListener = (
    interaction: Discord.Interaction
  ) => {
    if ("customId" in interaction) {
      const interactionListener = Listener.listeners.get(interaction.customId);
      if (!interactionListener) {
        return;
      }

      interactionListener.listener(interaction, () =>
        Listener.listeners.delete(interaction.customId)
      );
      if (
        (this._once.includes(interactionListener.type) &&
          interactionListener.once !== false) ||
        interactionListener.once
      ) {
        Listener.listeners.delete(interaction.customId);
      }
    }
  };

  constructor(options: Discord.ClientOptions & { once?: InteractionType[] }) {
    super(options);

    this.on("interactionCreate", this.defaultInteractionCreateListener);
    if (options.once) {
      this._once = [...this._once, ...options.once];
    }
  }
}

export { DiscordNode };
export * from "./hooks";

wrapDiscordJS();
