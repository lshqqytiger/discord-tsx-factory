import * as Discord from "discord.js";

import "./declarations";
import { getBuilder } from "./utils";
import { Wrapper, wrap } from "./wrapper";
import { Listenable, ComponentLike, HasChildren } from "./mixins";
import { InteractionType } from "./enums";
import { StateSetter, MessageContainer } from "./types";

export class Listener implements Listenable {
  public readonly once?: boolean;
  public readonly listener: Function;
  public readonly type: InteractionType;
  constructor(listener: Function, type: InteractionType, once?: boolean) {
    this.listener = listener;
    this.type = type;
    this.once = once;
  }
}

export type DiscordFragment = Iterable<DiscordNode>;
export type DiscordNode = string | number | DiscordFragment;
export class Component<P = {}, S extends {} = {}> extends ComponentLike<P, S> {
  private _message?: Discord.Message;
  private deleteMessage?: Discord.Message["delete"];
  public set message(value: Discord.Message | undefined) {
    if (!value) return;
    this._message = value;
    this.deleteMessage = this._message.delete;
    this._message.delete = async () => {
      this.componentWillUnmount?.();
      return await this.deleteMessage!.call(this._message);
    };
  }
  public get message(): Discord.Message | undefined {
    return this._message;
  }
  public render(): JSX.Element {
    throw new Error("Your component doesn't have 'render' method.");
  }
  public setState: StateSetter<S> = (state, interaction) => {
    const prevState = { ...this.state };
    const shouldComponentUpdate = this.shouldComponentUpdate({
      ...this.state,
      ...state,
    });
    Object.assign(this.state, state);
    if (shouldComponentUpdate) {
      const rendered = renderAndCatch(this);
      if (rendered === undefined) return;
      if (interaction) interaction.update(rendered);
      else this.message?.edit(rendered);
      this.componentDidUpdate?.(prevState);
    }
  };
  public forceUpdate() {
    const rendered = renderAndCatch(this);
    if (rendered === undefined) return;
    if (rendered) this.message?.edit(rendered);
  }
}
function getSender(target: MessageContainer): Function {
  if (target instanceof Discord.BaseChannel && target.isTextBased())
    return (rendered: any) => target.send(rendered);
  if (target instanceof Discord.BaseInteraction && target.isRepliable())
    return target.reply.bind(target);
  if (target instanceof Discord.Message) return target.edit.bind(target);
  throw new Error("Failed to get sender from target.");
}
export function render(
  element: unknown,
  container: MessageContainer
): Promise<Discord.Message<boolean>> | undefined {
  if (element instanceof Component) {
    const rendered = renderAndCatch(element);
    if (rendered === undefined) return;
    return getSender(container)(rendered);
  }
  return getSender(container)(element as any);
}
function renderAndCatch(
  component: Component<any, any>
): JSX.Rendered["message"] | undefined {
  try {
    return component.render() as JSX.Rendered["message"];
  } catch (e) {
    if (component.componentDidCatch) component.componentDidCatch(e);
    else throw e;
  }
}
interface FunctionComponent<P = {}> {
  (props: P & HasChildren<DiscordNode[]>): JSX.Element;
}
export type FC<P = {}> = FunctionComponent<P>;

const interactionListeners = new Map<string, Listener>();
function ElementBuilder(
  props: JSX.IntrinsicInternalElements[JSX.IntrinsicKeys]
): JSX.Element | undefined {
  switch (props._tag) {
    case "message":
      return props as JSX.Rendered["message"];
    case "br":
      return "\n";
    case "embed":
      props.fields = [];
      if (!props.description) {
        props.description = "";
        if (props.children instanceof Array)
          for (const child of props.children.flat(Infinity))
            if (typeof child === "object" && "name" in child)
              props.fields.push(child);
            else props.description += String(child);
        else props.description = String(props.children);
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
        if (!props.customId)
          throw new Error(
            "Button which has not url property must have a customId."
          );
        if (props.url)
          throw new Error("You can't use both customId/onClick and url.");
        interactionListeners.set(
          props.customId,
          new Listener(props.onClick, InteractionType.Button, props.once)
        );
      }
      if (props.url) $.setURL(props.url);
      return $;
    }
    case "select": {
      if (props.onChange && props.customId)
        interactionListeners.set(
          props.customId,
          new Listener(props.onChange, InteractionType.SelectMenu, props.once)
        );
      const $ = new (getBuilder(props.type))({
        ...props,
        type: undefined,
      });
      if ($ instanceof Discord.StringSelectMenuBuilder)
        $.setOptions(...props.children);
      return $;
    }
    case "option":
      return props; // to be internally wrapped later.
    case "modal":
      if (props.onSubmit)
        interactionListeners.set(
          props.customId,
          new Listener(props.onSubmit, InteractionType.Modal, props.once)
        );
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
  tag: T | Function,
  props: JSX.IntrinsicElement<T>,
  ...children: JSX.ChildResolvable[T][]
): JSX.Element | Component | undefined {
  if (!props || !props.children) props = { ...props, children };
  if (typeof tag === "function") {
    if (
      tag.prototype && // filter arrow function
      "render" in tag.prototype // renderable component
    )
      return Reflect.construct(tag, [props]);
    return tag(props);
  }
  return ElementBuilder({
    ...props,
    _tag: tag,
  } as JSX.IntrinsicInternalElements[JSX.IntrinsicKeys]);
}
export const Fragment = (props: HasChildren<DiscordNode[]>): DiscordFragment =>
  props.children || [];
export const getListener = interactionListeners.get.bind(interactionListeners);
export const setListener = interactionListeners.set.bind(interactionListeners);
export const deleteListener =
  interactionListeners.delete.bind(interactionListeners);

export class Client extends Discord.Client {
  private _once: InteractionType[] = [InteractionType.Modal];
  public readonly defaultInteractionCreateListener = (
    interaction: Discord.Interaction
  ) => {
    if ("customId" in interaction) {
      const interactionListener = interactionListeners.get(
        interaction.customId
      );
      if (!interactionListener) return;
      interactionListener.listener(interaction, () =>
        interactionListeners.delete(interaction.customId)
      );
      if (
        (this._once.includes(interactionListener.type) &&
          interactionListener.once !== false) ||
        interactionListener.once
      )
        interactionListeners.delete(interaction.customId);
    }
  };
  constructor(options: Discord.ClientOptions & { once?: InteractionType[] }) {
    super(options);

    this.on("interactionCreate", this.defaultInteractionCreateListener);
    if (options.once) this._once = [...this._once, ...options.once];
  }
}

const Wrapper: Wrapper = (original) =>
  function (this: any, options: any) {
    if (options instanceof Component) return render(options, this);
    return original.call(this, options);
  };

wrap(Discord.TextChannel.prototype, "send", Wrapper);
wrap(Discord.DMChannel.prototype, "send", Wrapper);
wrap(Discord.NewsChannel.prototype, "send", Wrapper);
wrap(Discord.StageChannel.prototype, "send", Wrapper);
wrap(Discord.VoiceChannel.prototype, "send", Wrapper);

wrap(Discord.CommandInteraction.prototype, "reply", Wrapper);
wrap(Discord.MessageComponentInteraction.prototype, "reply", Wrapper);
wrap(Discord.ModalSubmitInteraction.prototype, "reply", Wrapper);
