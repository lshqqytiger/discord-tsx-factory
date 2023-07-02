import * as Discord from "discord.js";
import assert from "assert";

import { VirtualDOM, getNativeRenderer } from "./virtual-dom";

export interface FunctionComponent<P> {
  (props: P): DiscordNode;
}
export type FCStateSetter<S> = (
  state: S,
  interaction?: Discord.ButtonInteraction | Discord.AnySelectMenuInteraction
) => void;
export class FCState<T> {
  private _state: T;
  private readonly virtualDOM: FCVirtualDOM<any>;
  constructor(defaultValue: T) {
    assert(
      VirtualDOM.instance !== null &&
        VirtualDOM.instance instanceof FCVirtualDOM
    );
    this._state = defaultValue;
    this.virtualDOM = VirtualDOM.instance;
  }
  public get state() {
    return this._state;
  }
  public setState: FCStateSetter<T> = (state, interaction) => {
    this._state = state;
    VirtualDOM.instance = this.virtualDOM;
    this.virtualDOM.update(interaction);
  };
}
export class FCVirtualDOM<P> extends VirtualDOM {
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
    VirtualDOM.instance = null;
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
    VirtualDOM.instance = null;
    this.stateId = 0;
    return (this.message = await getNativeRenderer(interaction || this.message)(
      rendered
    ));
  }
}
