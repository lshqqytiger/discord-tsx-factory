import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  Client,
  createElement,
  deleteListener,
  getListener,
} from "../src/index";
import { InteractionType } from "../src/enums";

describe("interaction listeners", () => {
  beforeEach(() => {
    for (const customId of ["button-1", "button-2", "select-1", "modal-1"]) {
      deleteListener(customId);
    }
  });

  it("registers button callbacks and lets the callback remove itself", () => {
    const callback = vi.fn((_interaction, off: () => boolean) => off());
    createElement(
      "button",
      { customId: "button-1", onClick: callback },
      "Click",
    );

    expect(getListener("button-1")?.type).toBe(InteractionType.Button);

    const client = new Client({ intents: [] });
    client.defaultInteractionCreateListener({ customId: "button-1" } as never);

    expect(callback).toHaveBeenCalledOnce();
    expect(getListener("button-1")).toBeUndefined();
  });

  it("applies configured once behavior and allows once=false to override it", () => {
    const callback = vi.fn();
    const persistentCallback = vi.fn();
    createElement("button", { customId: "button-1", onClick: callback });
    createElement("button", {
      customId: "button-2",
      onClick: persistentCallback,
      once: false,
    });

    const client = new Client({ intents: [], once: [InteractionType.Button] });
    const interaction = (customId: string) => ({ customId }) as never;
    client.defaultInteractionCreateListener(interaction("button-1"));
    client.defaultInteractionCreateListener(interaction("button-1"));
    client.defaultInteractionCreateListener(interaction("button-2"));
    client.defaultInteractionCreateListener(interaction("button-2"));

    expect(callback).toHaveBeenCalledOnce();
    expect(persistentCallback).toHaveBeenCalledTimes(2);
  });

  it("replaces an existing listener when custom ids collide", () => {
    const first = vi.fn();
    const second = vi.fn();
    createElement("button", { customId: "button-1", onClick: first });
    createElement("button", { customId: "button-1", onClick: second });

    const client = new Client({ intents: [] });
    client.defaultInteractionCreateListener({ customId: "button-1" } as never);

    expect(first).not.toHaveBeenCalled();
    expect(second).toHaveBeenCalledOnce();
  });

  it("registers select and modal callbacks with their interaction types", () => {
    const selectCallback = vi.fn();
    const modalCallback = vi.fn();

    createElement("select", {
      customId: "select-1",
      onChange: selectCallback,
    });
    createElement("modal", {
      customId: "modal-1",
      title: "Form",
      onSubmit: modalCallback,
    });

    expect(getListener("select-1")?.type).toBe(InteractionType.SelectMenu);
    expect(getListener("modal-1")?.type).toBe(InteractionType.Modal);
  });

  it("removes once listeners even when their callback throws", () => {
    createElement("button", {
      customId: "button-1",
      onClick: () => {
        throw new Error("callback failed");
      },
    });

    const client = new Client({ intents: [], once: [InteractionType.Button] });

    expect(() =>
      client.defaultInteractionCreateListener({ customId: "button-1" } as never),
    ).toThrow("callback failed");
    expect(getListener("button-1")).toBeUndefined();
  });
});
