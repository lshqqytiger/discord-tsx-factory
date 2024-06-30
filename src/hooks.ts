import assert from "assert";

import { Node } from "./node";
import { FCNode, FCStateSetter, FCState } from "./function-component";

export function useState<T>(defaultValue: T): [T, FCStateSetter<T>] {
  assert(Node.instance !== null && Node.instance instanceof FCNode);
  if (Node.instance.isInitialized) {
    const state = Node.instance.nextState<T>();
    return [state.state, state.setState.bind(state)];
  }
  const state = new FCState(defaultValue);
  Node.instance.addState(state);
  return [state.state, state.setState.bind(state)];
}
