import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

import { format, resolveConfig } from "prettier";
import ts from "typescript";

// The contract files contain immutable data and types and have no runtime imports.
async function readContract(file) {
  const source = readFileSync(new URL(file, import.meta.url), "utf8");
  const js = ts.transpileModule(source, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  return import(
    "data:text/javascript;base64," + Buffer.from(js).toString("base64")
  );
}
const { neutral, legacyAliases } = await readContract(
  "../styles/theming/defaults.ts",
);
const { componentRegistry } = await readContract(
  "../styles/theming/registry.ts",
);

const root = fileURLToPath(new URL("../", import.meta.url));
const output = join(root, "THEME-REFERENCE.md");
const cell = (text) =>
  String(text).replaceAll("|", "\\|").replaceAll("\n", " ");
const code = (text) => "`" + cell(text) + "`";
const variables = new Map();
const cssName = (path) =>
  "--doom-" +
  path
    .replace(/^foundations\./, "")
    .replaceAll(".", "-")
    .replace(/[A-Z]/g, (x) => "-" + x.toLowerCase());
function visit(path, data) {
  if (typeof data !== "object") {
    variables.set(path, data);
    return;
  }
  for (const [name, value] of Object.entries(data)) {
    visit(path + "." + name, value);
  }
}
for (const group of ["foundations", "roles", "defaults"]) {
  visit(group, neutral[group]);
}
const consumers = new Map();
function scan(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      scan(path);
      continue;
    }
    if (
      !/\.(scss|tsx?)$/.test(path) ||
      /(?:\.test|\.stories| [0-9]+\.)/.test(path)
    ) {
      continue;
    }
    const filename = relative(root, path);
    const family = filename.startsWith("components/")
      ? filename.split("/")[1]
      : filename;
    for (const match of readFileSync(path, "utf8").matchAll(/--[a-z][\w-]*/g)) {
      const key = match[0];
      if (!consumers.has(key)) {
        consumers.set(key, new Set());
      }
      consumers.get(key).add(family);
    }
  }
}
scan(join(root, "components"));
for (const name of ["_mixins.scss", "_utilities.scss"]) {
  const contents = readFileSync(join(root, "styles", name), "utf8");
  for (const [key] of contents.matchAll(/--[a-z][\w-]*/g)) {
    if (!consumers.has(key)) {
      consumers.set(key, new Set());
    }
    consumers.get(key).add("styles/" + name);
  }
}
const lines = [
  "# Theme reference",
  "",
  "Generated from the neutral contract, legacy mappings and recipe registry. Regenerate with `node scripts/generate-theme-reference.mjs`. See the [consumer guide](THEME.md) for scope and cascade semantics.",
  "",
  "## Recipe targets",
  "",
  "| Component | Parts | Variants | Sizes |",
  "| --- | --- | --- | --- |",
];
const names = (group) => group.map(code).join(", ") || "—";
for (const [name, entry] of Object.entries(componentRegistry)) {
  lines.push(
    `| <a id="component-${name.toLowerCase()}"></a>${name} | ${names(entry.parts)} | ${names(entry.variants)} | ${names(entry.sizes)} |`,
  );
}
lines.push(
  "",
  "## Tokens and compatibility aliases",
  "",
  "Neutral values use the reference syntax accepted by defineTheme. Consumer entries list direct static references from component families or shared styles, including use of the corresponding legacy alias. Derived tokens, runtime SVG lookups, generated scale names and application CSS can introduce additional consumers.",
  "",
  "| Token path | CSS variable | Neutral value | Legacy aliases | Direct source consumers |",
  "| --- | --- | --- | --- | --- |",
);
for (const [path, value] of [...variables].sort(([a], [b]) =>
  a.localeCompare(b, "en"),
)) {
  const variable = cssName(path);
  const aliases = Object.keys(legacyAliases)
    .filter((key) => legacyAliases[key] === path)
    .sort();
  const sources = new Set(
    [variable, ...aliases].flatMap((key) => [...(consumers.get(key) || [])]),
  );
  lines.push(
    `| ${code(path)} | ${code(variable)} | ${code(value)} | ${names(aliases)} | ${[...sources].sort().join(", ") || "—"} |`,
  );
}
lines.push(
  "",
  "## Legacy migration categories",
  "",
  "| Category | How to migrate |",
  "| --- | --- |",
  "| Direct token alias | Look up the old CSS name in the token table. The legacy provider reads the old property and object themes emit it as an alias. |",
  "| Split meaning | Select control or surface defaults separately when replacing a global border, radius or shadow rule. Recipes target a single component or part. |",
  "| Changed semantics | A legacy solid or inverted style can affect descendants by CSS inheritance. Use a ThemeScope surface context to carry the same appearance into owned overlays. |",
  "| Removed or unregistered value | A name outside this mapping has no guaranteed object-theme translation. Inspect its CSS usage and choose a public token, a part class, or an extension. |",
  "",
  "Preset-specific extension aliases with no neutral value:",
  "",
);
for (const [alias, path] of Object.entries(legacyAliases)) {
  if (!variables.has(path)) {
    lines.push(`- ${code(alias)} → ${code(path)} (${code(cssName(path))})`);
  }
}
const contents = await format(lines.join("\n") + "\n", {
  ...(await resolveConfig(output)),
  filepath: output,
});
if (process.argv.includes("--check")) {
  if (readFileSync(output, "utf8") !== contents) {
    throw new Error("Theme reference needs regeneration");
  }
} else {
  writeFileSync(output, contents);
}
