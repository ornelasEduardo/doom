import { states, surfaces } from "./defineTheme";
import type {
  CompiledTheme,
  PartRecipe,
  ResolvedTheme,
  Theme,
  ThemeState,
} from "./types";

const available =
  ":not(:disabled,[aria-disabled=true],[data-disabled],[data-loading])";
const selectors: Record<ThemeState, string> = {
  hover: ":hover" + available,
  pressed: ":is(:active,[aria-pressed=true],[data-pressed])" + available,
  checked: ":is(:checked,[aria-checked=true],[data-checked])",
  selected:
    ':is([aria-selected=true],[aria-current]:not([aria-current=false],[aria-current=""]),[data-selected])',
  expanded: ":is([aria-expanded=true],[data-expanded])",
  invalid: ":is([aria-invalid=true],[data-invalid])",
  loading: "[data-loading]",
  disabled: ":is(:disabled,[aria-disabled=true],[data-disabled])",
  focusVisible: ":is(:focus-visible,[data-focus-visible])",
};
type PartMap = Record<string, PartRecipe>;
type Recipe = {
  parts?: PartMap;
  sizes?: Record<string, PartMap>;
  variants?: Record<string, PartMap>;
  compoundVariants?: { when: Record<string, string>; parts: PartMap }[];
};

const nativeInputs: Record<string, string> = {
  Checkbox: "checkboxInput",
  Switch: "input",
  RadioGroup: "hiddenInput",
};
const nativeStates: Partial<Record<ThemeState, string>> = {
  checked: ":checked",
  focusVisible: ":focus-visible",
  disabled: ":disabled",
  invalid: ":is(:invalid,[aria-invalid=true])",
};
/** Bind indicator parts to their native input, including uncontrolled changes. */
function stateCondition(
  state: ThemeState | undefined,
  component: string,
  id: string,
): string {
  if (!state) {
    return "";
  }
  const nativeState = nativeStates[state];
  const part = nativeInputs[component];
  if (!part || !nativeState) {
    return selectors[state];
  }
  const input = `input.doom-${id}-${component}-${part}${nativeState}`;
  return `:is(${selectors[state]},:has(>${input}),${input}~*,${input}~*>*)`;
}

function rules(theme: ResolvedTheme): string {
  const result: string[] = [];
  for (const [name, recipe] of Object.entries(theme.components) as [
    string,
    Recipe,
  ][]) {
    const groups: { parts: PartMap; conditions: [string, string][] }[] = [];
    if (recipe.parts) {
      groups.push({ parts: recipe.parts, conditions: [] });
    }
    for (const [attr, group] of [
      ["size", recipe.sizes],
      ["variant", recipe.variants],
    ] as const) {
      for (const [key, parts] of Object.entries(group ?? {})) {
        groups.push({ parts, conditions: [[attr, key]] });
      }
    }
    for (const entry of recipe.compoundVariants ?? []) {
      groups.push({
        conditions: Object.entries(entry.when),
        parts: entry.parts,
      });
    }
    for (const state of [undefined, ...states]) {
      for (const { conditions, parts } of groups) {
        for (const [part, recipe] of Object.entries(parts)) {
          const style = state ? recipe.states?.[state] : recipe;
          if (!style) {
            continue;
          }
          const css = Object.entries(style)
            .filter(([k]) => k !== "states")
            .map(
              ([k, v]) =>
                k
                  .replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())
                  .replace(/^ms-/, "-ms-") +
                ":" +
                v,
            )
            .join(";");
          if (css) {
            const baseClass = ".doom-" + theme.id + "-" + name + "-" + part;
            const classes =
              baseClass +
              conditions
                .map(([key, value]) => baseClass + "--" + key + "-" + value)
                .join("");
            const attributes =
              `[data-doom-theme="${theme.id}"][data-doom-component="${name}"][data-doom-part="${part}"]` +
              conditions
                .map(([key, value]) => `[data-doom-${key}="${value}"]`)
                .join("");
            const condition = stateCondition(state, name, theme.id);
            // Keep class and attribute alternatives independently indexable. A
            // mixed :is() inside :where() can make Blink attempt recipe matching
            // broadly instead of rejecting unrelated component classes early.
            result.push(
              `:where(${classes}${condition}),:where(${attributes}${condition}){${css}}`,
            );
          }
        }
      }
    }
  }
  return result.join("\n");
}
function tokenRules(
  contexts: ResolvedTheme[],
  attribute: "data-doom-theme" | "data-doom-scope",
): string[] {
  // A declaration shared by multiple contexts needs only one CSS rule.
  const declarations = new Map<string, number[]>();
  for (const [index, context] of contexts.entries()) {
    for (const key of Object.keys(context.variables).sort()) {
      if (attribute === "data-doom-theme" && key.startsWith("--doom-")) {
        continue;
      }
      const declaration = key + ":" + context.variables[key];
      const owners = declarations.get(declaration);
      if (owners) {
        owners.push(index);
      } else {
        declarations.set(declaration, [index]);
      }
    }
  }
  const groups = new Map<string, string[]>();
  for (const [declaration, owners] of declarations) {
    const key = owners.join(",");
    const group = groups.get(key);
    if (group) {
      group.push(declaration);
    } else {
      groups.set(key, [declaration]);
    }
  }
  const css: string[] = [];
  for (const [owners, group] of groups) {
    const selector = owners
      .split(",")
      .map(
        (i) =>
          `[${attribute}="${contexts[Number(i)].id}"]${attribute === "data-doom-theme" ? ":not([data-doom-legacy-part])" : ""}`,
      )
      .join(",");
    css.push(`:where(${selector}){${group.join(";")}}`);
  }
  return css;
}
// Cache only immutable data. A definition and its compiled asset can be collected together.
const compiledAssets = new WeakMap<Theme, CompiledTheme>();
export function compileTheme(theme: Theme): CompiledTheme {
  const cached = compiledAssets.get(theme);
  if (cached) {
    return cached;
  }
  const contexts = Object.keys(theme.contexts)
    .sort()
    .flatMap((mode) =>
      surfaces.map((surface) => theme.contexts[mode][surface]),
    );
  const aliases = tokenRules(contexts, "data-doom-theme");
  const css = tokenRules(contexts, "data-doom-scope");
  css.push(...contexts.map(rules));
  const result = Object.freeze({
    css:
      "@layer doom.reset, doom.utilities, doom.components, doom.theme;\n" +
      "@layer doom.utilities {\n" +
      aliases.join("\n") +
      "\n}\n" +
      "@layer doom.theme {\n" +
      css.join("\n") +
      "\n}",
    manifest: Object.freeze(contexts.map((context) => context.id)),
  });
  compiledAssets.set(theme, result);
  return result;
}
