import { PassThrough } from "node:stream";

import { act } from "@testing-library/react";
import React, { Suspense } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToPipeableStream } from "react-dom/server";
import { expect, it } from "vitest";

import { defineTheme } from "./defineTheme";
import { ThemeScope, useResolvedTheme } from "./ThemeScope";

const theme = defineTheme({ name: "streamed" });

function StreamProbe() {
  const resolved = useResolvedTheme();
  return <output data-probe={resolved.id}>Ready</output>;
}

function stream(tree: React.ReactElement) {
  return new Promise<string>((resolve, reject) => {
    let markup = "";
    const target = new PassThrough();
    target.setEncoding("utf8");
    target.on("data", (chunk: string) => {
      markup += chunk;
    });
    target.on("end", () => resolve(markup));
    const result = renderToPipeableStream(tree, {
      onShellReady() {
        result.pipe(target);
      },
      onError: reject,
    });
  });
}

it("hydrates streamed HTML with a nonced body scope in two independent documents", async () => {
  const tree = (
    <html lang="en">
      <head />
      <ThemeScope withBody nonce="test-nonce" theme={theme}>
        <Suspense fallback="Pending">
          <StreamProbe />
        </Suspense>
      </ThemeScope>
    </html>
  );
  const html = await stream(tree);
  expect(html.indexOf("<style")).toBeLessThan(html.indexOf("<output"));
  for (let i = 0; i < 2; i++) {
    const frame = document.createElement("iframe");
    document.body.append(frame);
    try {
      const doc = frame.contentDocument!;
      doc.open();
      doc.write(html);
      doc.close();
      const output = doc.querySelector("output");
      const errors: unknown[] = [];
      let root!: ReturnType<typeof hydrateRoot>;
      await act(async () => {
        root = hydrateRoot(doc, tree, {
          onRecoverableError: (error) => errors.push(error),
        });
      });
      expect(doc.querySelector("output")).toBe(output);
      expect(doc.querySelectorAll("style")).toHaveLength(1);
      expect(doc.querySelector("style")?.getAttribute("nonce")).toBe(
        "test-nonce",
      );
      expect(errors).toEqual([]);
      await act(async () => {
        root.unmount();
      });
    } finally {
      frame.remove();
    }
  }
});

it("streams a delayed scope's own styles before revealing its content", async () => {
  let resolveGate!: () => void;
  const gate = new Promise<void>((resolve) => {
    resolveGate = resolve;
  });
  let ready = false;
  const lateTheme = defineTheme({ name: "late", roles: { brand: "tomato" } });
  function Delayed() {
    if (!ready) {
      throw gate;
    }
    return (
      <ThemeScope nonce="late-nonce" theme={lateTheme}>
        <span data-late-content="">Loaded</span>
      </ThemeScope>
    );
  }
  const tree = (
    <main>
      <Suspense fallback={<p>Waiting</p>}>
        <Delayed />
      </Suspense>
    </main>
  );
  const chunks: string[] = [];
  await new Promise<void>((resolve, reject) => {
    const destination = new PassThrough();
    destination.setEncoding("utf8");
    destination.on("data", (chunk: string) => {
      chunks.push(chunk);
      if (chunk.includes("Waiting") && !ready) {
        ready = true;
        resolveGate();
      }
    });
    destination.on("end", resolve);
    const result = renderToPipeableStream(tree, {
      onShellReady() {
        result.pipe(destination);
      },
      onError: reject,
    });
  });
  const html = chunks.join("");
  const fallback = html.indexOf("Waiting");
  const style = html.indexOf('nonce="late-nonce"');
  const content = html.indexOf("data-late-content");
  expect(fallback).toBeGreaterThan(-1);
  expect(style).toBeGreaterThan(fallback);
  expect(content).toBeGreaterThan(style);
});
