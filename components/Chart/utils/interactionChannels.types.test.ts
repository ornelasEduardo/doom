import ts from "typescript";
import { expect, it } from "vitest";

import type {
  ChannelReference,
  HoverInteraction,
  InteractionAccess,
  InteractionWriter,
} from "../types/interaction";
import { createInteractionChannel } from "./interactionChannels";

function contracts(
  access: InteractionAccess<number>,
  hover: HoverInteraction<number>,
) {
  const typed = createInteractionChannel<HoverInteraction<number>>("selection");
  const wrong = createInteractionChannel<{ selection: number[] }>("hover");
  const check = (writer: InteractionWriter<number>) => {
    writer.upsertHoverInteraction("primary-hover", hover);
    writer.upsertHoverInteraction("crosshair", hover);
    writer.upsertHoverInteraction("remote-hover", hover);
    writer.upsertHoverInteraction(typed, hover);
    const reference = typed as ChannelReference<HoverInteraction<number>>;
    writer.upsertHoverInteraction(reference, hover);
    const invalidReference = typed as typeof typed | "selection";
    // @ts-expect-error A handle union cannot smuggle in a reserved name.
    writer.upsertHoverInteraction(invalidReference, hover);

    const dynamic: string = "remote-hover";
    writer.upsertHoverInteraction(dynamic, hover);
    // @ts-expect-error Selection cannot contain managed hover.
    writer.upsertHoverInteraction("selection", hover);
    // @ts-expect-error Drag cannot contain managed hover.
    writer.upsertHoverInteraction("drag", hover);
    // @ts-expect-error Cursor configuration cannot contain managed hover.
    writer.upsertHoverInteraction("cursor-config", hover);
    // @ts-expect-error Tooltip configuration cannot contain managed hover.
    writer.upsertHoverInteraction("tooltip-config", hover);
    // @ts-expect-error Owned cursor configuration cannot contain managed hover.
    writer.upsertHoverInteraction("cursor-config:owner", hover);
    // @ts-expect-error Owned tooltip configuration cannot contain managed hover.
    writer.upsertHoverInteraction("tooltip-config:owner", hover);
    const template = "tooltip-config:owner" as `tooltip-config:${string}`;
    // @ts-expect-error A template name must not widen to string to bypass validation.
    writer.upsertHoverInteraction(template, hover);
    const union = "selection" as "selection" | "remote-hover";
    // @ts-expect-error Every member of a channel union must accept hover.
    writer.upsertHoverInteraction(union, hover);
    // @ts-expect-error A handle cannot infer a different payload.
    writer.upsertHoverInteraction(wrong, hover);
    // @ts-expect-error Explicit payload type arguments cannot bypass channel validation.
    writer.upsertHoverInteraction<HoverInteraction<number>>("selection", hover);
  };
  check(access);
  access.batchInteractions(check);
}
void contracts;

it("checks managed hover names and handles for direct and batch writers", () => {
  const file = "components/Chart/utils/interactionChannels.types.test.ts";
  const config = ts.readConfigFile("tsconfig.json", ts.sys.readFile);
  const parsed = ts.parseJsonConfigFileContent(
    config.config,
    ts.sys,
    process.cwd(),
  );
  const program = ts.createProgram(
    [file, "types/css.d.ts", "types/declarations.d.ts"],
    {
      ...parsed.options,
      incremental: false,
      noEmit: true,
    },
  );
  const diagnostics = ts
    .getPreEmitDiagnostics(program)
    .filter((d) =>
      d.file?.fileName.endsWith("utils/interactionChannels.types.test.ts"),
    );
  expect(
    diagnostics.map((d) =>
      ts.flattenDiagnosticMessageText(d.messageText, "\n"),
    ),
  ).toEqual([]);
}, 20000);
