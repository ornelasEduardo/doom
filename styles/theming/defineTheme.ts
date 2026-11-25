import { legacyAliases, neutral } from "./defaults";
import type { ComponentName } from "./registry";
import {
  componentRegistry,
  cssProperties,
  unitlessProperties,
} from "./registry";
import type {
  ResolvedTheme,
  SurfaceContext,
  Theme,
  ThemeInput,
  ThemePatch,
} from "./types";

export const surfaces = ["default", "solid", "inverted"] as const;
export const states = [
  "hover",
  "pressed",
  "checked",
  "selected",
  "expanded",
  "invalid",
  "loading",
  "disabled",
  "focusVisible",
] as const;
const patchKeys = [
  "foundations",
  "roles",
  "defaults",
  "extensions",
  "components",
];
const forbidden = ["__proto__", "prototype", "constructor"];
type Data = Record<string, unknown>;
function record(value: unknown): value is Data {
  return (
    value !== null &&
    typeof value === "object" &&
    [Object.prototype, null].includes(Object.getPrototypeOf(value))
  );
}
function fail(path: string, message: string): never {
  throw new TypeError(`Theme ${path}: ${message}`);
}
function object(value: unknown, path: string): Data {
  if (!record(value)) {
    fail(path, "expected an object");
  }
  return value;
}
function keys(data: Data, allowed: readonly string[], path: string) {
  for (const key of Object.keys(data)) {
    if (!allowed.includes(key)) {
      fail(path + "." + key, "unknown key");
    }
  }
}
function identifier(key: string, path: string) {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9_-]*$/.test(key) || forbidden.includes(key)) {
    fail(path, "invalid identifier");
  }
}
function merge(base: unknown, patch: unknown, path = "theme"): unknown {
  if (patch === undefined) {
    return base;
  }
  if (patch === null) {
    fail(path, "null is invalid");
  }
  if (Array.isArray(patch)) {
    return patch.map((value, index) =>
      merge(undefined, value, path + "." + index),
    );
  }
  if (!record(patch)) {
    if (
      typeof patch === "object" ||
      !["string", "number", "boolean"].includes(typeof patch)
    ) {
      fail(path, "invalid value");
    }
    return patch;
  }
  const prior = record(base) ? base : {};
  const out: Data = { ...prior };
  for (const [key, value] of Object.entries(patch)) {
    identifier(key, path + "." + key);
    if (value === undefined) {
      continue;
    }
    out[key] = merge(prior[key], value, path + "." + key);
  }
  return out;
}
function apply(
  base: ThemePatch,
  patch: ThemePatch,
  preserveReplace = false,
): ThemePatch {
  const result = merge(base, patch) as ThemePatch;
  for (const key of Object.keys(patch.components ?? {}) as ComponentName[]) {
    const entry = patch.components?.[key];
    if (!entry || !result.components) {
      continue;
    }
    if (entry.replace !== undefined && typeof entry.replace !== "boolean") {
      fail(key + ".replace", "expected a boolean");
    }
    const inherited = base.components?.[key];
    const combined = entry.replace ? merge({}, entry) : result.components[key];
    const data = combined as {
      replace?: boolean;
      classNames?: Record<string, string>;
    };
    if (!preserveReplace) {
      delete data.replace;
    }
    if (!entry.replace && entry.classNames) {
      for (const [part, name] of Object.entries(entry.classNames)) {
        const before = (
          inherited?.classNames as Record<string, string> | undefined
        )?.[part];
        if (before && name !== undefined && data.classNames) {
          data.classNames[part] = before + " " + name;
        }
      }
    }
    Object.assign(result.components, { [key]: data });
  }
  return result;
}
export function tokenVariable(path: string): string {
  return (
    "--doom-" +
    path
      .replace(/^foundations\./, "")
      .replace(/\./g, "-")
      .replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())
  );
}
function safe(value: unknown, path: string): string {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }
  if (
    typeof value !== "string" ||
    !value.trim() ||
    // Reject control characters in inline style assets.
    // eslint-disable-next-line no-control-regex
    /[;{}<>\\\u0000-\u001f]|\/\*|!\s*important/i.test(value)
  ) {
    fail(path, "unsafe CSS value");
  }
  // A closing parenthesis or an unterminated string can swallow the next declaration.
  let quote = "";
  const expected: string[] = [];
  for (const c of value) {
    if (quote) {
      if (c === quote) {
        quote = "";
      }
      continue;
    }
    if (c === "'" || c === '"') {
      quote = c;
    } else if (c === "(" || c === "[") {
      expected.push(c === "(" ? ")" : "]");
    } else if ((c === ")" || c === "]") && expected.pop() !== c) {
      fail(path, "unbalanced CSS");
    }
  }
  if (expected.length || quote) {
    fail(path, "unbalanced CSS");
  }
  return value;
}
function flatten(
  node: unknown,
  shape: unknown,
  path: string,
  values: Map<string, unknown>,
  open = false,
) {
  if (record(shape) || (open && record(node))) {
    const data = object(node, path);
    if (!open) {
      keys(data, Object.keys(shape as Data), path);
    }
    for (const [k, v] of Object.entries(data)) {
      const next = path + "." + k;
      flatten(
        v,
        (shape as Data | undefined)?.[k],
        next,
        values,
        open || next === "foundations.palette",
      );
    }
  } else {
    values.set(path, node);
  }
}
function stable(value: unknown): string {
  if (Array.isArray(value)) {
    return "[" + value.map(stable).join(",") + "]";
  }
  if (record(value)) {
    return (
      "{" +
      Object.keys(value)
        .sort()
        .map((k) => JSON.stringify(k) + ":" + stable(value[k]))
        .join(",") +
      "}"
    );
  }
  return JSON.stringify(value);
}
function hash(value: string): string {
  let a = 2166136261,
    b = 5381;
  for (let i = 0; i < value.length; i++) {
    a = Math.imul(a ^ value.charCodeAt(i), 16777619);
    b = Math.imul(b, 33) ^ value.charCodeAt(i);
  }
  return "dt-" + (a >>> 0).toString(36) + "-" + (b >>> 0).toString(36);
}
function recipes(
  input: unknown,
  transform: (value: unknown, path: string) => string,
): ResolvedTheme["components"] {
  const result = object(merge({}, input), "components");
  keys(result, Object.keys(componentRegistry), "components");
  for (const [name, raw] of Object.entries(result)) {
    const entry = object(raw, name),
      spec = componentRegistry[name as ComponentName];
    keys(
      entry,
      ["parts", "variants", "sizes", "compoundVariants", "classNames"],
      name,
    );
    const declarations = (
      rawStyle: unknown,
      path: string,
      allowStates: boolean,
    ) => {
      const style = object(rawStyle, path);
      for (const [key, value] of Object.entries(style)) {
        if (allowStates && key === "states") {
          const conditions = object(value, path + ".states");
          keys(conditions, states, path + ".states");
          for (const [state, css] of Object.entries(conditions)) {
            declarations(css, path + "." + state, false);
          }
        } else {
          if (!cssProperties.has(key)) {
            fail(path + "." + key, "unknown CSS property");
          }
          if (
            (typeof value === "number" ||
              (typeof value === "string" &&
                /^[-+]?(?:\d+\.?\d*|\.\d+)$/.test(value))) &&
            Number(value) !== 0 &&
            !unitlessProperties.has(key)
          ) {
            fail(path + "." + key, "expected CSS units");
          }
          style[key] = transform(value, path + "." + key);
        }
      }
    };
    const parts = (rawParts: unknown, path: string) => {
      const items = object(rawParts, path);
      keys(items, spec.parts, path);
      for (const [part, style] of Object.entries(items)) {
        declarations(style, path + "." + part, true);
      }
    };
    if (entry.parts !== undefined) {
      parts(entry.parts, name + ".parts");
    }
    for (const prop of ["sizes", "variants"] as const) {
      if (entry[prop] !== undefined) {
        const group = object(entry[prop], name + "." + prop);
        keys(group, spec[prop], name + "." + prop);
        for (const [key, value] of Object.entries(group)) {
          parts(value, name + "." + prop + "." + key);
        }
      }
    }
    if (entry.classNames !== undefined) {
      const classes = object(entry.classNames, name + ".classNames");
      keys(classes, spec.parts, name + ".classNames");
      for (const [part, value] of Object.entries(classes)) {
        if (typeof value !== "string") {
          fail(name + "." + part, "expected class string");
        }
      }
    }
    if (entry.compoundVariants !== undefined) {
      if (!Array.isArray(entry.compoundVariants)) {
        fail(name, "expected compoundVariants array");
      }
      for (const rawCompound of entry.compoundVariants) {
        const compound = object(rawCompound, name);
        keys(compound, ["when", "parts"], name);
        const when = object(compound.when, name + ".when");
        keys(when, ["size", "variant"], name + ".when");
        for (const [key, value] of Object.entries(when)) {
          const allowed: readonly string[] =
            key === "size" ? spec.sizes : spec.variants;
          if (typeof value !== "string" || !allowed.includes(value)) {
            fail(name + ".when." + key, "unknown visual prop value");
          }
        }
        parts(compound.parts, name + ".compoundVariants.parts");
      }
    }
  }
  return result;
}
function resolve(
  base: ThemePatch,
  name: string,
  mode: string,
  surface: SurfaceContext,
): ResolvedTheme {
  const values = new Map<string, unknown>();
  for (const group of [
    "foundations",
    "roles",
    "defaults",
    "extensions",
  ] as const) {
    flatten(base[group], neutral[group], group, values, group === "extensions");
  }
  const variables: Record<string, string> = {},
    visiting = new Set<string>();
  function token(path: string) {
    const key = tokenVariable(path);
    if (variables[key] !== undefined) {
      return;
    }
    if (visiting.has(path)) {
      fail(path, "cyclic reference");
    }
    visiting.add(path);
    variables[key] = transform(values.get(path), path);
    visiting.delete(path);
  }
  function transform(value: unknown, path: string): string {
    if (typeof value !== "string") {
      return safe(value, path);
    }
    return safe(
      value.replace(/\{([\w.-]+)\}/g, (_, ref: string) => {
        const target = values.has(ref) ? ref : "foundations." + ref;
        if (!values.has(target)) {
          fail(path, "unknown reference " + ref);
        }
        token(target);
        return "var(" + tokenVariable(target) + ")";
      }),
      path,
    );
  }
  if (new Set([...values.keys()].map(tokenVariable)).size !== values.size) {
    fail(name, "colliding token names");
  }
  for (const key of values.keys()) {
    token(key);
  }
  for (const [alias, path] of Object.entries(legacyAliases)) {
    if (values.has(path)) {
      variables[alias] = "var(" + tokenVariable(path) + ")";
    }
  }
  if (surface !== "default") {
    // Snapshot base roles in a private namespace before remapping. References between
    // base roles must resolve against the base context, including series palettes.
    const baseVariable = (key: string): string => {
      const snapshot = key.replace("--doom-", "--doom-base-");
      if (!Object.hasOwn(variables, snapshot)) {
        variables[snapshot] = original[key];
        variables[snapshot] = original[key].replace(
          /var\((--doom-[\w-]+)\)/g,
          (value, ref: string) =>
            Object.hasOwn(original, ref)
              ? "var(" + baseVariable(ref) + ")"
              : value,
        );
      }
      return snapshot;
    };
    const original = { ...variables };
    const role = (name: string) =>
      "var(" + baseVariable(tokenVariable("roles." + name)) + ")";
    const bg = role("solid"),
      fg = role("onSolid");
    const panel = "color-mix(in srgb, " + fg + " 95%, " + bg + " 5%)";
    const patch: Record<string, string> =
      surface === "solid"
        ? {
            canvas: bg,
            surface: panel,
            foreground: fg,
            mutedForeground: "color-mix(in srgb, " + fg + " 70%, transparent)",
            surfaceBrand: bg,
            onSurfaceBrand: fg,
            onSurface: bg,
            onSurfaceMuted: bg,
            border: fg,
            strongBorder: fg,
            brand: fg,
            onBrand: bg,
            secondary: "color-mix(in srgb, " + bg + " 90%, transparent)",
            onSecondary: fg,
            success: role("solidSuccess"),
            danger: role("solidDanger"),
            warning: role("solidWarning"),
            onSuccess: fg,
            onDanger: fg,
            onWarning: fg,
            muted: "color-mix(in srgb, " + fg + " 20%, transparent)",
            popover: panel,
            onPopover: bg,
            input: panel,
          }
        : {
            foreground: role("onBrand"),
            brand: role("onBrand"),
            onBrand: role("brand"),
            mutedForeground: role("onBrand"),
          };
    for (let i = 1; i <= 6; i++) {
      patch["chartSeries" + i] = role("chartSeries" + i);
    }
    for (const [key, value] of Object.entries(patch)) {
      variables[tokenVariable("roles." + key)] = value;
    }
  }
  const components = recipes(base.components, transform);
  // Declaration order matters when shorthand and longhand properties overlap.
  const id = hash(
    stable({ name, mode, surface, variables }) + JSON.stringify(components),
  );
  return { id, name, mode, surface, variables, components };
}
function freeze<T>(value: T): T {
  if (value && typeof value === "object" && !Object.isFrozen(value)) {
    Object.freeze(value);
    for (const child of Object.values(value)) {
      freeze(child);
    }
  }
  return value;
}
export function defineTheme(input: ThemeInput): Theme {
  keys(
    object(input, "input"),
    [...patchKeys, "name", "extends", "modes", "defaultMode"],
    "input",
  );
  const { name, extends: parent, modes, defaultMode, ...patch } = input;
  if (typeof name !== "string" || !name.trim()) {
    fail("name", "expected nonempty string");
  }
  if (
    parent !== undefined &&
    (!record(parent) || !record(parent.contexts) || !record(parent.base))
  ) {
    fail("extends", "expected a defined theme");
  }
  if (defaultMode !== undefined && typeof defaultMode !== "string") {
    fail("defaultMode", "expected a mode name");
  }
  const base = apply(parent?.base ?? neutral, patch);
  const modeMap: Record<string, ThemePatch> = { ...parent?.modes };
  if (modes !== undefined) {
    for (const [mode, value] of Object.entries(object(modes, "modes"))) {
      identifier(mode, "modes." + mode);
      if (value === undefined) {
        continue;
      }
      const validated = object(value, "modes." + mode);
      // Merge mode definitions separately; replace markers must survive until the mode is applied.
      modeMap[mode] = apply(
        Object.hasOwn(modeMap, mode) ? modeMap[mode] : {},
        validated,
        true,
      );
    }
  }
  const names = Object.keys(object(modeMap, "modes")).sort();
  const selected =
    defaultMode ??
    (parent && names.includes(parent.defaultMode)
      ? parent.defaultMode
      : names[0]) ??
    "default";
  if (!names.length) {
    names.push("default");
  }
  if (!names.includes(selected)) {
    fail("defaultMode", "unknown mode " + selected);
  }
  const contexts: Record<string, Record<SurfaceContext, ResolvedTheme>> = {};
  for (const mode of names) {
    identifier(mode, "modes." + mode);
    if (mode === "system") {
      fail("modes.system", "reserved name");
    }
    const modePatch = modeMap[mode] ?? {};
    keys(object(modePatch, "modes." + mode), patchKeys, "modes." + mode);
    const effective = apply(base, modePatch);
    contexts[mode] = Object.fromEntries(
      surfaces.map((surface) => [
        surface,
        resolve(effective, name, mode, surface),
      ]),
    ) as Record<SurfaceContext, ResolvedTheme>;
  }
  return freeze({
    name,
    defaultMode: selected,
    modes: modeMap,
    base,
    contexts,
  });
}
export function resolveTheme(
  theme: Theme,
  mode = theme.defaultMode,
  surface: SurfaceContext = "default",
): ResolvedTheme {
  if (!Object.hasOwn(theme.contexts, mode)) {
    fail("mode", "unknown mode " + mode);
  }
  if (!surfaces.includes(surface)) {
    fail("surface", "unknown surface " + surface);
  }
  return theme.contexts[mode][surface];
}
