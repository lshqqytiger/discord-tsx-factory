import * as Discord from "discord.js";
import assert from "assert";

import { Node } from "./node";
import { getNativeRenderer } from "./utils";

export interface FunctionComponent<P> {
  (props: P): DiscordNode;
}
export type FCStateSetter<S> = (
  state: S,
  interaction?: Discord.ButtonInteraction | Discord.AnySelectMenuInteraction
) => void;
export class FCState<T> {
  private _state: T;
  private readonly node: FCNode<any>;

  public get state() {
    return this._state;
  }

  constructor(defaultValue: T) {
    assert(Node.instance !== null && Node.instance instanceof FCNode);
    this._state = defaultValue;
    this.node = Node.instance;
  }

  public setState: FCStateSetter<T> = (state, interaction) => {
    this._state = state;
    Node.instance = this.node;
    this.node.update(interaction);
  };
}
export class FCNode<P> extends Node {
  protected message?: Discord.Message;
  public isInitialized: boolean = false;
  public topLevelRenderer = undefined;
  private fc: FunctionComponent<P>;
  private props: P;
  private stateId = 0;
  private states = new Map<number, FCState<any>>();

  constructor(fc: FunctionComponent<P>, props: P) {
    super();

    this.fc = fc;
    this.props = props;
  }

  public addState<T>(state: FCState<T>): void {
    assert(!this.isInitialized);
    this.states.set(this.stateId++, state);
  }
  public nextState<T>(): FCState<T> {
    const state = this.states.get(this.stateId++);
    assert(state);
    return state;
  }
  public initialize() {
    assert(!this.isInitialized);
    this.isInitialized = true;
    this.stateId = 0;
  }
  public async renderAsMessage(
    container: MessageContainer
  ): Promise<Discord.Message> {
    const rendered = this.render();
    Node.instance = null;
    this.stateId = 0;
    return (this.message = await getNativeRenderer(container)(rendered));
  }
  public render(): DiscordNode {
    return this.fc(this.props);
  }
  public async update(
    interaction?: Discord.ButtonInteraction | Discord.AnySelectMenuInteraction
  ): Promise<Discord.Message> {
    assert(this.message);
    const rendered = this.render();
    Node.instance = null;
    this.stateId = 0;
    return (this.message = await getNativeRenderer(interaction || this.message)(
      rendered
    ));
  }
}
