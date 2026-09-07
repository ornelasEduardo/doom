import { defineBrowserCommand } from "@vitest/browser-playwright";

export const moveChartPointer = defineBrowserCommand(
  async ({ page, frame }, clientX: number, clientY: number) => {
    const iframe = await (await frame()).frameElement();
    const box = await iframe.boundingBox();
    const width = await iframe.evaluate(
      (el) => (el as HTMLIFrameElement).clientWidth,
    );
    if (!box || box.width !== width) {
      throw new Error("Exact pointer tests require an unscaled runner iframe");
    }
    // Locator.hover truncates positions; mouse.move retains subpixel boundaries.
    await page.mouse.move(box.x + clientX, box.y + clientY);
  },
);

declare module "vitest/browser" {
  interface BrowserCommands {
    moveChartPointer: (clientX: number, clientY: number) => Promise<void>;
  }
}
