import * as Discord from "discord.js";

type PartialOf<T, K extends keyof T> = Partial<Pick<T, K>> & Omit<T, K>;
type StateSetter<S> = (
  state: S,
  interaction?: Discord.ButtonInteraction | Discord.SelectMenuInteraction
) => void;
type StateTuple<S> = [Discord.Message, StateSetter<S>];
interface Listenable {
  once?: boolean;
}
class Listener implements Listenable {
  public once?: boolean;
  public listener: Function;
  public type: InteractionType;
  constructor(listener: Function, type: InteractionType, once?: boolean) {
    this.listener = listener;
    this.type = type;
    this.once = once;
  }
}

export enum InteractionType {
  BUTTON,
  SELECT_MENU,
  MODAL,
}
export type DiscordFragment = Iterable<DiscordNode>;
export type DiscordNode = DiscordElement | string | number | DiscordFragment;
export interface DiscordProps<T extends keyof JSX.IntrinsicElements> {
  _tag: T;
  readonly children: DiscordNode[];
}
export interface DiscordElement<P extends {} = {}> {
  readonly props: P;
}
export class DiscordComponent<P extends {} = {}> implements DiscordElement<P> {
  public readonly props: P;
  constructor(props: P) {
    this.props = props;
  }
  public render(): DiscordNode {
    throw new Error("Your component doesn't have 'render' method.");
  }
}
export class DiscordStateComponent<
  P extends {} = {},
  S extends {} = {}
> extends DiscordComponent<P> {
  public props!: P;
  public state: S;
  public message?: Discord.Message;
  constructor(props: P) {
    super(props);

    this.state = {} as S;
  }
  public render(): any {
    throw new Error("Your component doesn't have 'render' method.");
  }
  public setState: StateSetter<S> = (state, interaction) => {
    Object.assign(this.state, state);
    if (interaction) interaction.update(this.render());
    else this.message?.edit(this.render());
  };
  public forceUpdate() {
    this.message?.edit(this.render());
  }
}
async function initializeState<
  T extends DiscordStateComponent,
  S extends {} = {}
>(
  this: Discord.BaseChannel | Discord.BaseInteraction,
  component: T,
  state?: S
): Promise<StateTuple<S>> {
  if (state) component.state = state;
  if (this instanceof Discord.BaseChannel && this.isTextBased())
    return [
      (component.message = await this.send(component.render())),
      component.setState,
    ];
  else if (this instanceof Discord.BaseInteraction && this.isRepliable())
    return [
      (component.message = await this.reply(component.render())),
      component.setState,
    ];
  throw new Error("Invalid this or target. (Interaction or Channel)");
}
export function useState<T extends DiscordStateComponent, S extends {} = {}>(
  target: Discord.BaseChannel | Discord.BaseInteraction,
  component: T,
  state?: S
): Promise<StateTuple<S>> {
  return initializeState.bind(target)(component, state);
}

export type ButtonInteractionHandler = (
  interaction: Discord.ButtonInteraction,
  off: () => boolean
) => any;
export type SelectMenuInteractionHandler = (
  interaction: Discord.SelectMenuInteraction,
  off: () => boolean
) => any;
export type ModalSubmitInteractionHandler = (
  interaction: Discord.ModalSubmitInteraction
) => any;

declare global {
  namespace JSX {
    type Element = any;
    interface IntrinsicElements {
      message: Discord.BaseMessageOptions;
      br: {};
      embed: Omit<Discord.EmbedData, "color" | "footer" | "timestamp"> & {
        color?: Discord.ColorResolvable;
        footer?: IntrinsicElements["footer"];
      };
      footer: PartialOf<Discord.EmbedFooterData, "text"> | string;
      field: PartialOf<Discord.EmbedField, "value" | "inline">;
      emoji: {
        emoji: Discord.Emoji | Discord.EmojiResolvable;
      };
      row: Partial<Discord.ActionRowComponentData>;
      button: Partial<Discord.ButtonComponent> & {
        emoji?: Discord.Emoji | string;
        onClick?: ButtonInteractionHandler;
      } & Listenable;
      select: Partial<Discord.SelectMenuComponentData> & {
        onChange?: SelectMenuInteractionHandler;
      } & Listenable;
      option: Discord.SelectMenuComponentOptionData;
      modal: Omit<Discord.ModalData, "type" | "components"> & {
        type?:
          | Discord.ComponentType.ActionRow
          | Discord.ComponentType.TextInput;
        customId: string;
        title: string;
        onSubmit?: ModalSubmitInteractionHandler;
      } & Listenable;
      input: Omit<Discord.TextInputComponentData, "type">;
    }
    type IntrinsicProps = {
      [T in keyof JSX.IntrinsicElements]: DiscordProps<T> &
        JSX.IntrinsicElements[T];
    };
  }
}
declare module "discord.js" {
  interface BaseChannel {
    useState: typeof initializeState;
  }
  interface BaseInteraction {
    useState: typeof initializeState;
  }
}

const interactionHandlers = new Map<string, Listener>();
function ElementBuilder(
  props: Exclude<JSX.IntrinsicProps[keyof JSX.IntrinsicProps], string>
) {
  let element: JSX.Element;
  switch (props._tag) {
    case "message":
      {
        element = props;
      }
      break;
    case "br":
      {
        element = "\n";
      }
      break;
    case "embed":
      {
        props.fields = [];
        if (!props.description) {
          props.description = "";
          for (const child of props.children.flat(Infinity))
            if (typeof child === "object" && "name" in child)
              props.fields.push(child);
            else props.description += String(child);
        }
        element = new Discord.EmbedBuilder({
          ...props,
          footer:
            typeof props.footer === "string"
              ? { text: props.footer }
              : (props.footer as Discord.EmbedFooterOptions),
          color: undefined,
        }).setColor(props.color || null);
      }
      break;
    case "footer":
      {
        element =
          typeof props === "string"
            ? { text: props }
            : { ...props, text: props.text || props.children.join("") };
      }
      break;
    case "field":
      {
        element = {
          name: props.name,
          value: props.value || props.children.flat(Infinity).join(""),
          inline: props.inline,
        };
      }
      break;
    case "emoji":
      {
        element = props.emoji;
      }
      break;
    case "row":
      {
        element = new Discord.ActionRowBuilder({
          ...props,
          components: Array.isArray(props.children[0])
            ? props.children[0]
            : props.children,
        });
      }
      break;
    case "button":
      {
        element = new Discord.ButtonBuilder({
          custom_id: props.customId || undefined,
          disabled: props.disabled || undefined,
          emoji: props.emoji,
          label: props.label || props.children.flat(Infinity).join(""),
        }).setStyle(
          props.style ||
            (props.url ? Discord.ButtonStyle.Link : Discord.ButtonStyle.Primary)
        );
        if (props.onClick && props.customId) {
          if (props.url)
            throw new Error("You can't use both customId/onClick and url.");
          interactionHandlers.set(
            props.customId,
            new Listener(props.onClick, InteractionType.BUTTON, props.once)
          );
        }
        if (props.url) element.setURL(props.url);
      }
      break;
    case "select":
      {
        if (props.onChange && props.customId)
          interactionHandlers.set(
            props.customId,
            new Listener(
              props.onChange,
              InteractionType.SELECT_MENU,
              props.once
            )
          );
        element = new Discord.SelectMenuBuilder(props).addOptions(
          Array.isArray(props.children[0]) ? props.children[0] : props.children
        );
      }
      break;
    case "option":
      {
        element = new Discord.SelectMenuOptionBuilder(props);
      }
      break;
    case "modal":
      {
        if (props.onSubmit)
          interactionHandlers.set(
            props.customId,
            new Listener(props.onSubmit, InteractionType.MODAL, props.once)
          );
        element = new Discord.ModalBuilder({
          customId: props.customId,
          title: props.title,
          components: Array.isArray(props.children[0])
            ? props.children[0]
            : props.children,
        });
      }
      break;
    case "input":
      {
        element = new Discord.TextInputBuilder({ ...props, type: 4 });
      }
      break;
  }
  delete element._tag;
  delete element.children;
  return element;
}
export function createElement(
  tag: keyof JSX.IntrinsicElements | Function,
  props: Exclude<JSX.IntrinsicProps[keyof JSX.IntrinsicProps], string>,
  ...children: DiscordNode[]
): JSX.Element {
  props = { ...props, children }; // 'props' is possibly null.
  if (typeof tag == "function") {
    if (
      tag.prototype && // filter arrow function
      "render" in tag.prototype // renderable component
    ) {
      const constructed = Reflect.construct(tag, [props]);
      if (constructed.setState) return constructed;
      return constructed.render();
    }
    return tag(props, children);
  }
  if (typeof props === "string") return props;
  props._tag = tag;
  return ElementBuilder(props);
}
export const Fragment = (
  props: null,
  children: DiscordNode[]
): DiscordFragment => children;
export const setHandler = interactionHandlers.set.bind(interactionHandlers);
export const deleteHandler =
  interactionHandlers.delete.bind(interactionHandlers);

export class Client extends Discord.Client {
  private _once: InteractionType[] = [InteractionType.MODAL];
  public defaultInteractionCreateListener = (
    interaction: Discord.Interaction
  ) => {
    if ("customId" in interaction) {
      const interactionHandler = interactionHandlers.get(interaction.customId);
      if (!interactionHandler) return;
      interactionHandler.listener(interaction, () =>
        interactionHandlers.delete(interaction.customId)
      );
      if (
        (this._once.includes(interactionHandler.type) &&
          interactionHandler.once !== false) ||
        interactionHandler.once
      )
        interactionHandlers.delete(interaction.customId);
    }
  };
  constructor(options: Discord.ClientOptions & { once?: InteractionType[] }) {
    super(options);

    this.on("interactionCreate", this.defaultInteractionCreateListener);
    if (options.once) this._once = [...this._once, ...options.once];
  }
}

Discord.BaseChannel.prototype.useState =
  Discord.BaseInteraction.prototype.useState = initializeState;
