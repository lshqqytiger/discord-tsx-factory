import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  Component,
  createElement,
  deleteListener,
  DiscordNode,
} from "../src/index";
import { Node } from "../src/node";
import { FCNode } from "../src/function-component";
import { useState } from "../src/hooks";

describe("class components", () => {
  beforeEach(() => {
    Node.instance = null;
    deleteListener("component-button");
  });

  it("renders and merges partial state during setState", async () => {
    const updated = vi.fn();
    class Counter extends Component<{}, { count: number; label: string }> {
      public state = { count: 0, label: "counter" };

      public render(): DiscordNode {
        return createElement("message", {
          content: `${this.state.label}:${this.state.count}`,
        });
      }

      public componentDidUpdate() {
        updated();
      }
    }

    const counter = new Counter({});
    const node = new Node();
    node.update = vi.fn(async () => undefined as never);
    counter.bind(node);

    await counter.setState({ count: 1 });

    expect(counter.state).toEqual({ count: 1, label: "counter" });
    expect(node.update).toHaveBeenCalledOnce();
    expect(updated).toHaveBeenCalledOnce();
  });

  it("throws when state is changed before the component is bound", async () => {
    class Unbound extends Component {
      public render(): DiscordNode {
        return createElement("message", { content: "unbound" });
      }
    }

    await expect(new Unbound({}).setState({})).rejects.toThrow();
  });

  it("keeps function-component hook state attached to its own node", () => {
    let setCount!: (count: number) => void;
    const render = () => {
      const [count, updateCount] = useState(0);
      setCount = updateCount;
      return createElement("message", { content: String(count) });
    };
    const node = new FCNode(render, {});
    node.update = vi.fn(async () => undefined as never);

    Node.instance = node;
    const first = node.render();
    node.initialize();
    Node.instance = null;

    expect(first).toMatchObject({ content: "0" });
    expect(() => setCount(1)).not.toThrow();
    expect(node.update).toHaveBeenCalledOnce();
  });
});
