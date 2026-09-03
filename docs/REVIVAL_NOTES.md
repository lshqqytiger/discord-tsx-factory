# Revival Notes

This is a behavioral inventory for improving the project without accidentally
changing its small, useful core. Items below are observations from the current
source, not promises of a future API.

## High-risk behavior

### Listener identity is global

Listeners are stored in one `Map<string, Listener>` keyed only by `customId`.
Creating two messages with the same button or select `customId` replaces the
first callback. There is no client, message, user, or guild scope. A revival
should decide whether IDs are intentionally global or whether listener
ownership needs to be introduced before adding more interaction features.

### Listener cleanup is incomplete

Rendering registers callbacks, but unmount-style cleanup is not wired into the
render/update path. The declared `componentWillUnmount` hook is never called by
the current implementation. Re-rendering can also replace entries in the
global map without tracking which component created them.

The callback `off` function now removes only the listener instance that created
it, so an old callback cannot remove a replacement registered with the same ID.
Ownership and automatic cleanup are still unresolved.

### Function component state depends on call order

`useState` retrieves state by an incrementing numeric slot. Conditional or
reordered hook calls can assert or associate state with the wrong value. This
matches a hook-style API, but it should be documented as a constraint and
covered by tests before changing the state implementation.

### The active node is global mutable state

`Node.instance` is used while a component renders so hooks and class components
can bind to the current message node. Nested or overlapping renders can
overwrite it. Concurrent sends, callbacks, or asynchronous rendering should
be treated as a risk until this context is made explicit.

## Lifecycle reality

`ComponentLike` declares `componentDidMount`, `componentDidUpdate`,
`componentWillUnmount`, and `componentDidCatch`. The current source only calls
`componentDidUpdate` after a class component's successful `setState` update.
The other hooks, including error handling, are not invoked automatically.

Interaction dispatch and function-component state setters now return promises;
async callback and update failures are propagated to their callers.

## API and maintenance notes

- `setState` on class components merges a partial state object. `useState`
  replaces its value rather than merging it.
- `forceUpdate` updates the stored message but does not invoke lifecycle hooks.
- The default `Client` listener is opt-out: removing
  `client.defaultInteractionCreateListener` makes JSX interaction callbacks
  inert unless an application invokes the exported listener map itself.
- `getNativeRenderer` supports sendable channels, repliable interactions, and
  messages. Unsupported containers fail at runtime with an explicit error.
- The package mutates discord.js prototypes at import time. This is convenient
  for JSX overloads, but makes import order, duplicate package copies, and
  discord.js version drift worth testing.
- The current build is a plain TypeScript compilation to `dist`; there is no
  test script, lint script, or bundling step in `package.json`.

## Suggested revival order

1. Add focused tests for each intrinsic renderer and for send, reply, update,
   edit, and modal paths.
2. Add interaction tests covering duplicate IDs, `once`, manual `off`, and
   multiple clients.
3. Decide and document listener ownership and cleanup semantics.
4. Make render context explicit if concurrent rendering is a supported goal.
5. Only then consider lifecycle completion, broader discord.js support, or
   performance work.
