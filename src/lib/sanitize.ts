import sanitizeHtml from "sanitize-html";

// Allowlist matches what Tiptap StarterKit + Link + CodeBlockLowlight can produce.
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "hr",
      "h1", "h2", "h3",
      "strong", "em", "s", "code",
      "a",
      "ul", "ol", "li",
      "blockquote",
      "pre",
      "span",
    ],
    allowedAttributes: {
      a: ["href", "rel", "target"],
      code: ["class"],   // lowlight adds language classes
      span: ["class"],   // lowlight syntax highlighting
      pre: ["class"],
    },
    allowedSchemes: ["http", "https", "mailto"],
    disallowedTagsMode: "discard",
  });
}
