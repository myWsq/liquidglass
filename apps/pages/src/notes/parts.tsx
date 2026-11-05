import { CodeBlock } from "@astryxdesign/core/CodeBlock";
import { Text } from "@astryxdesign/core/Text";
import * as stylex from "@stylexjs/stylex";
import type { ReactNode } from "react";
import { useNarrow } from "../narrow";

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div {...stylex.props(styles.eyebrow)}>{children}</div>;
}

export function Lead({ children }: { children: ReactNode }) {
  return (
    <Text as="p" type="large" display="block" textWrap="pretty" xstyle={styles.lead}>
      {children}
    </Text>
  );
}

export function Hint({ children }: { children: ReactNode }) {
  return (
    <Text as="p" type="supporting" display="block" textWrap="pretty" xstyle={styles.hint}>
      {children}
    </Text>
  );
}

export function Code({ code, language = "css" }: { code: string; language?: string }) {
  // On a phone, long lines scroll sideways instead of breaking mid-word.
  const narrow = useNarrow();
  return (
    <CodeBlock
      code={code}
      language={language}
      size="sm"
      width="100%"
      hasLanguageLabel={false}
      isWrapped={!narrow}
    />
  );
}

/** Label beside the value on wide screens, above it on narrow ones. */
export function useListLabel(): { position: "start" | "top"; width?: number } {
  return useNarrow() ? { position: "top" } : { position: "start", width: 120 };
}

/** Monospace value for readouts. */
export function Mono({ children, dim }: { children: ReactNode; dim?: boolean }) {
  return <span {...stylex.props(styles.mono, dim && styles.dim)}>{children}</span>;
}

const styles = stylex.create({
  eyebrow: {
    fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace",
    fontSize: 11,
    letterSpacing: ".14em",
    textTransform: "uppercase",
    color: "#6f7279",
    marginBottom: 16,
  },
  lead: { maxWidth: "36em", marginBottom: 18 },
  hint: { marginTop: 22, maxWidth: "40em" },
  mono: { fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", fontSize: 12.5 },
  dim: { opacity: 0.45 },
});
