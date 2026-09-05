import { cleanup, render, screen } from "@testing-library/react";
import React from "react";
import { afterEach, expect, it } from "vitest";
import { userEvent } from "vitest/browser";

import { Link } from "./Link";

afterEach(cleanup);

it.each([
  {
    props: {
      target: "_BLANK",
      rel: "Author NOOPENER NoReFeRrEr noopener noreferrer",
    },
    target: "_BLANK",
    rel: "Author NOOPENER NoReFeRrEr",
  },
  {
    props: { target: "_BLANK", rel: "Author" },
    target: "_BLANK",
    rel: "Author noopener noreferrer",
  },
  { props: {}, target: null, rel: null },
  { props: { isExternal: true }, target: "_blank", rel: "noopener noreferrer" },
  { props: { target: "_blank" }, target: "_blank", rel: "noopener noreferrer" },
  { props: { isExternal: true, target: "_self" }, target: "_self", rel: null },
  { props: { isExternal: true, target: "" }, target: "", rel: null },
  {
    props: { isExternal: true, rel: "nofollow noopener noopener" },
    target: "_blank",
    rel: "nofollow noopener noreferrer",
  },
  {
    props: { target: "_blank", rel: "author noreferrer" },
    target: "_blank",
    rel: "author noreferrer noopener",
  },
  {
    props: { isExternal: true, target: "_self", rel: "author" },
    target: "_self",
    rel: "author",
  },
])(
  "renders and activates a link with $props",
  async ({ props, target, rel }) => {
    const activations: Array<{ target: string | null; rel: string | null }> =
      [];
    render(
      <Link
        href="/link-test"
        {...props}
        onClick={(event) => {
          event.preventDefault();
          activations.push({
            target: event.currentTarget.getAttribute("target"),
            rel: event.currentTarget.getAttribute("rel"),
          });
        }}
      >
        Browser link
      </Link>,
    );
    const link = screen.getByRole("link", { name: "Browser link" });
    expect(link.getAttribute("target")).toBe(target);
    expect(link.getAttribute("rel")).toBe(rel);
    await userEvent.click(link);
    expect(activations).toEqual([{ target, rel }]);
  },
);
