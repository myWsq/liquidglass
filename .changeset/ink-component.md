---
"@myna/liquidglass": minor
---

`<Ink>`: text and icons in the glass's ink, as a component.

- `<Ink>` and `<Ink tone="secondary">` replace writing `className="liquidglass-ink"` / `"liquidglass-sub"` by hand. Polymorphic like `<Glass>` (`as`). The classes still work, for markup outside React.
- **Breaking (types only):** the `"dark" | "light"` type exported as `Ink` is now `InkColor`, so `Ink` can be the component.
