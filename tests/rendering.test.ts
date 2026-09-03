import * as Discord from "discord.js";
import { beforeEach, describe, expect, it } from "vitest";

import { createElement, deleteListener } from "../src/index";

describe("intrinsic element rendering", () => {
  beforeEach(() => {
    for (const customId of ["button-1", "select-1", "modal-1"]) {
      deleteListener(customId);
    }
  });

  it("renders embed text, fields, line breaks, and footer", () => {
    const embed = createElement(
      "embed",
      { title: "Title", color: "Orange", footer: "Footer" },
      "before",
      createElement("br", {}, undefined as never),
      createElement("field", { name: "Name" }, "Value"),
      "after",
    );

    expect(embed).toBeInstanceOf(Discord.EmbedBuilder);
    expect((embed as Discord.EmbedBuilder).toJSON()).toMatchObject({
      title: "Title",
      description: "before\nafter",
      color: Discord.Colors.Orange,
      footer: { text: "Footer" },
      fields: [{ name: "Name", value: "Value", inline: false }],
    });
  });

  it("uses an explicit embed description instead of child content", () => {
    const embed = createElement(
      "embed",
      { description: "Explicit" },
      "Ignored",
      createElement("field", { name: "Ignored field" }, "Value"),
    );

    expect((embed as Discord.EmbedBuilder).toJSON()).toMatchObject({
      description: "Explicit",
    });
    expect((embed as Discord.EmbedBuilder).toJSON().fields).toEqual([]);
  });

  it("renders labels from button children and creates link buttons", () => {
    const button = createElement("button", { customId: "button-1" }, "Click");
    const link = createElement("button", { url: "https://example.com" }, "Go");

    expect((button as Discord.ButtonBuilder).toJSON()).toMatchObject({
      custom_id: "button-1",
      label: "Click",
      style: Discord.ButtonStyle.Primary,
    });
    expect((link as Discord.ButtonBuilder).toJSON()).toMatchObject({
      url: "https://example.com",
      label: "Go",
      style: Discord.ButtonStyle.Link,
    });
  });

  it("renders string select options and modal inputs", () => {
    const select = createElement(
      "select",
      { customId: "select-1" },
      createElement("option", { label: "One", value: "1" }),
    );
    const modal = createElement(
      "modal",
      { customId: "modal-1", title: "Form" },
      createElement(
        "row",
        {},
        createElement("input", {
          customId: "name",
          label: "Name",
          style: Discord.TextInputStyle.Short,
        }),
      ),
    );

    expect((select as Discord.StringSelectMenuBuilder).toJSON()).toMatchObject({
      custom_id: "select-1",
      options: [{ label: "One", value: "1" }],
    });
    expect((modal as Discord.ModalBuilder).toJSON()).toMatchObject({
      custom_id: "modal-1",
      title: "Form",
      components: [
        {
          type: Discord.ComponentType.ActionRow,
          components: [{ custom_id: "name", label: "Name" }],
        },
      ],
    });
  });

  it("rejects a button callback without a custom id or with a URL", () => {
    expect(() =>
      createElement("button", { onClick: () => undefined }, "Click"),
    ).toThrow("must have a customId");
    expect(() =>
      createElement(
        "button",
        {
          customId: "button-1",
          url: "https://example.com",
          onClick: () => undefined,
        },
        "Click",
      ),
    ).toThrow("both customId/onClick and url");
  });
});
