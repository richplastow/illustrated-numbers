# CSS: System font stack

Just like system colors, you can also use system fonts that automatically match the user’s OS and UI theme.

There’s no single keyword for “system sans-serif,” but the widely accepted way is to use the system UI font stack, which maps to each platform’s native UI typeface.

Here’s the canonical CSS snippet 👇

```css
:root {
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 
        "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
}
```

## How this works

| Platform          | Font used                                          |
|-------------------|----------------------------------------------------|
| macOS / iOS       | -apple-system → San Francisco                      |
| Windows           | "Segoe UI"                                         |
| Android           | Roboto                                             |
| Linux (GNOME)     | system-ui (often Cantarell)                        |
| Older systems     | Fallback to Helvetica Neue, Arial, then sans-serif |

This gives you the native sans-serif UI font everywhere, including correct weights, line heights, and emoji rendering per platform.

## Monospace and serif system fonts

If you want a monospace or serif equivalent that also matches system defaults, you can use:

```css
font-family: ui-monospace, monospace;
font-family: ui-serif, serif;
```

These ui-* families are part of the CSS Fonts Level 4 spec and map directly to the user’s preferred system fonts.
