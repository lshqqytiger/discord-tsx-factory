# Architecture

## Runtime pipeline

```text
TSX source
  -> TypeScript createElement / Fragment calls
  -> ElementBuilder or custom component execution
  -> discord.js builders and message options
  -> channel.send, interaction.reply/update, message.edit, or showModal
```

The implementation is a renderer, not a virtual DOM. `createElement` resolves
each intrinsic element immediately. For example, `embed` becomes an
`EmbedBuilder`, `row` becomes an `ActionRowBuilder`, and `button` becomes a
`ButtonBuilder`. `br` becomes a newline and `field` becomes an embed field
object.

The supported intrinsic elements are `message`, `embed`, `footer`, `field`,
`emoji`, `row`, `button`, `select`, `option`, `modal`, and `input`.

## Components

There are two component forms:

- `Component<P, S>` is a class component. It stores `props` and mutable `state`,
  exposes `setState` and `forceUpdate`, and must implement `render()`.
- `FunctionComponent<P>` is a function returning a `DiscordNode`. `useState`
  stores state in an `FCNode`; hook calls must remain in the same order on every
  render.

When a component is sent, a `Node` stores the top-level renderer and the native
Discord message. A later update renders the component again and calls
`message.edit()` or the interaction's `update()` method. Passing the active
button/select interaction to `setState` selects the latter path.

## Interaction listeners

An element with `onClick`, `onChange`, or `onSubmit` registers a `Listener` in
the process-wide `Listener.listeners` map. The key is the element's
`customId`. The factory `Client` installs a default `interactionCreate` handler
that looks up the key, invokes the callback, and applies `once` rules.

The exported `getListener`, `setListener`, and `deleteListener` functions are
bound directly to that map. This is useful for integration code, but it also
means listener registration is global rather than scoped to a client or
message.

## discord.js integration

Importing the package runs `wrapDiscordJS()`. It wraps supported channel
`send`, message and interaction reply/edit/update methods, interaction
`showModal`, and component-builder `toJSON`. These wrappers recognize JSX and
`Component` instances, render them, and otherwise delegate to discord.js.

The wrappers are installed by prototype mutation. Applications should import
the package once and should avoid loading multiple incompatible copies of the
package or discord.js.

## Important rendering rules

- An embed with `description` does not derive a description from children.
- Without `description`, child text is concatenated into the description and
  child `field` objects are collected into `fields`.
- A button with `label` ignores child text. A button callback requires
  `customId` and cannot be combined with `url`.
- A string select uses child `option` values. Other select types use the
  corresponding discord.js select builder and do not use string options in the
  same way.
- A modal callback is registered by `customId`; modal submissions are treated
  as one-shot by the default client configuration.
