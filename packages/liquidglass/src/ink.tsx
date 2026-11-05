import type { ComponentPropsWithoutRef, ElementType, ReactNode, Ref } from "react";

export interface InkOwnProps<T extends ElementType = "span"> {
  /** Element to render. Defaults to `span`; its props are accepted too. */
  as?: T;
  ref?: Ref<HTMLElement>;
  /**
   * The material's two strengths of ink: `"primary"` for text that leads, `"secondary"`
   * for what sits beside it. Both follow the glass around them, dark on light glass and
   * light on dark glass, and blend into it so they take on its colour.
   */
  tone?: "primary" | "secondary";
  className?: string;
  children?: ReactNode;
}

export type InkProps<T extends ElementType = "span"> = InkOwnProps<T> &
  Omit<ComponentPropsWithoutRef<T>, keyof InkOwnProps<T>>;

/**
 * Text (or icons) in the glass's ink. Use it inside `<Glass>`: it picks up the ink the
 * glass chose for its backdrop, and changes with it.
 */
export function Ink<T extends ElementType = "span">({
  as,
  tone = "primary",
  className,
  ...rest
}: InkProps<T>): ReactNode {
  const As: ElementType = as ?? "span";
  const base = tone === "secondary" ? "liquidglass-sub" : "liquidglass-ink";
  return <As {...rest} className={className ? `${base} ${className}` : base} />;
}
