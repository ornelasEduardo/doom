import { expect, it } from "vitest";

import * as publicApi from "../../index";

it("exposes typed interaction channels from the package entry point", () => {
  expect(publicApi).toHaveProperty(
    "createInteractionChannel",
    expect.any(Function),
  );
});
