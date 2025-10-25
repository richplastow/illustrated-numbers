# CSS: Common adaptive system colors

- **Canvas:** Default window background (like the page surface)
- **CanvasText:** Default text color on the page
- **LinkText:** Standard link color
- **VisitedText:** Visited link color
- **ActiveText:** Active link color
- **ButtonFace:** Button background
- **ButtonText:** Button label color
- **ButtonBorder:** Button border color
- **Field:** Input / textarea background
- **FieldText:** Text color inside input/textarea
- **Highlight:** Selection highlight color (e.g. when text is selected)
- **HighlightText:** Text color of selected content
- **Mark:** mark> element background color
- **MarkText:** mark> element text color
- **GrayText:** Disabled control text (grayed out)
- **AccentColor:** User’s accent color (OS/system preference)
- **AccentColorText:** Text color that appears on top of accent-colored areas

## Notes & tips

- AccentColor and AccentColorText are relatively new — Chrome 111+, Safari 16.4+, Firefox 117+ — and map to the OS highlight/accent (like the blue in macOS buttons).
- All these keywords respond automatically to `color-scheme: light dark;`.
- They’re contextual — so ButtonFace inside a <button> may look subtly different than on a plain div, depending on the UA.
- You can preview current computed values in DevTools → “Computed” → search for the property → hover over the color swatch.
- Great for building accessible, theme-aware components without managing your own color tokens yet.