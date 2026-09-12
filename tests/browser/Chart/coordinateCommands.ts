import { defineBrowserCommand } from "@vitest/browser-playwright";

export const moveChartPointer = defineBrowserCommand(
  async ({ page, frame }, clientX: number, clientY: number) => {
    const iframe = await (await frame()).frameElement();
    const box = await iframe.boundingBox();
    const metrics = await iframe.evaluate((element) => {
      const node = element as HTMLIFrameElement;
      return {
        width: node.offsetWidth,
        height: node.offsetHeight,
        left: node.clientLeft,
        top: node.clientTop,
      };
    });
    if (!box || !metrics.width || !metrics.height) {
      throw new Error("Pointer tests require a visible runner iframe");
    }
    // Convert frame viewport coordinates without Locator.hover's automatic scrolling.
    await page.mouse.move(
      box.x + (clientX + metrics.left) * (box.width / metrics.width),
      box.y + (clientY + metrics.top) * (box.height / metrics.height),
    );
  },
);

declare module "vitest/browser" {
  interface BrowserCommands {
    moveChartPointer: (clientX: number, clientY: number) => Promise<void>;
  }
}
