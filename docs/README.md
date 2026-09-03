# Documentation

`discord-tsx-factory` is a small JSX-to-discord.js adapter. JSX is compiled by
TypeScript into calls to `createElement`; those calls immediately produce
discord.js builders, message options, or component instances.

## Start here

- [Examples](EXAMPLES.md): JSX syntax for embeds, buttons, select menus, modals,
  messages, custom components, and state.
- [Handling interactions](HANDLING_INTERACTIONS.md): the built-in interaction
  listener, `once` behavior, and manual listener removal.
- [Architecture](ARCHITECTURE.md): the runtime pipeline, public extension
  points, and state update flow.
- [Revival notes](REVIVAL_NOTES.md): verified caveats and a pragmatic order for
  improving the project.

## Current compatibility

The package declares compatibility with discord.js `14.17.0 - 14.18.0` in
`package.json`. The README and examples describe the intended API, while the
source files are the authority when behavior differs from those examples.

## Compile-time setup

TypeScript must use the library's JSX factory:

```json
{
  "compilerOptions": {
    "jsx": "react",
    "jsxFactory": "createElement",
    "jsxFragmentFactory": "Fragment"
  }
}
```

The library augments discord.js types and patches selected discord.js methods
when its main module is imported. Import it before using JSX with discord.js.
