import { InteractionType } from "./enums";
import { Listenable } from "./mixins";

export class Listener implements Listenable {
  public static readonly listeners = new Map<string, Listener>();
  public readonly once?: boolean;
  public readonly listener: Function;
  public readonly type: InteractionType;

  constructor(listener: Function, type: InteractionType, once?: boolean) {
    this.listener = listener;
    this.type = type;
    this.once = once;
  }
}
