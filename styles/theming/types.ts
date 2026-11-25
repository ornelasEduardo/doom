import type { Properties } from "csstype";

import type { neutral } from "./defaults";
import type { ComponentName, componentRegistry, PartName } from "./registry";

export type SurfaceContext = "default" | "solid" | "inverted";
export type TokenValue = string | number;
type TokenPatch<T> = {
  [K in keyof T]?: T[K] extends object ? TokenPatch<T[K]> : TokenValue;
};
export interface ExtensionTokens {
  [name: string]: TokenValue | ExtensionTokens;
}
export type ThemeState =
  | "hover"
  | "pressed"
  | "checked"
  | "selected"
  | "expanded"
  | "invalid"
  | "loading"
  | "disabled"
  | "focusVisible";
type CSS = Properties<string | 0>;
export type Declarations = {
  [K in keyof CSS]?: string | Extract<CSS[K], number>;
};
export type PartRecipe = Declarations & {
  states?: Partial<Record<ThemeState, Declarations>>;
};
type Registry = typeof componentRegistry;
type Visuals<C extends ComponentName> = {
  size?: Registry[C]["sizes"][number];
  variant?: Registry[C]["variants"][number];
};
type Parts<C extends ComponentName> = Partial<Record<PartName<C>, PartRecipe>>;
export type ComponentRecipe<C extends ComponentName> = {
  replace?: boolean;
  classNames?: Partial<Record<PartName<C>, string>>;
  parts?: Parts<C>;
  sizes?: Registry[C]["sizes"][number] extends never
    ? never
    : Partial<Record<Registry[C]["sizes"][number], Parts<C>>>;
  variants?: Registry[C]["variants"][number] extends never
    ? never
    : Partial<Record<Registry[C]["variants"][number], Parts<C>>>;
  compoundVariants?: readonly { when: Visuals<C>; parts: Parts<C> }[];
};
export interface ThemePatch {
  foundations?: TokenPatch<typeof neutral.foundations> & {
    palette?: Record<string, TokenValue>;
  };
  roles?: TokenPatch<typeof neutral.roles>;
  defaults?: TokenPatch<typeof neutral.defaults>;
  extensions?: ExtensionTokens;
  components?: { [C in ComponentName]?: ComponentRecipe<C> };
}
export interface ThemeInput extends ThemePatch {
  name: string;
  extends?: Theme;
  defaultMode?: string;
  modes?: Readonly<Record<string, ThemePatch>>;
}
export interface ResolvedTheme {
  readonly id: string;
  readonly name: string;
  readonly mode: string;
  readonly surface: SurfaceContext;
  readonly variables: Readonly<Record<string, string>>;
  readonly components: NonNullable<ThemePatch["components"]>;
}
export interface Theme {
  readonly name: string;
  readonly defaultMode: string;
  readonly modes: Readonly<Record<string, ThemePatch>>;
  readonly base: ThemePatch;
  readonly contexts: Readonly<
    Record<string, Readonly<Record<SurfaceContext, ResolvedTheme>>>
  >;
}
export interface CompiledTheme {
  readonly css: string;
  readonly manifest: readonly string[];
}
