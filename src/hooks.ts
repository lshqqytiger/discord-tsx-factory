import assert from "assert";

import { VirtualDOM } from "./virtual-dom";
import { FCVirtualDOM, FCStateSetter, FCState } from "./function-component";

export function useState<T>(defaultValue: T): [T, FCStateSetter<T>] {
  assert(
    VirtualDOM.instance !== null && VirtualDOM.instance instanceof FCVirtualDOM
  );
  if (VirtualDOM.instance.isInitialized) {
    const state = VirtualDOM.instance.nextState<T>();
    return [state.state, state.setState.bind(state)];
  }
  const state = new FCState(defaultValue);
  VirtualDOM.instance.addState(state);
  return [state.state, state.setState.bind(state)];
}
