import { defineBrowserCommand } from "@vitest/browser-playwright";

export const chartViewportPoint = defineBrowserCommand(
  async ({ frame }, clientX: number, clientY: number) => {
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
    return {
      x: box.x + (clientX + metrics.left) * (box.width / metrics.width),
      y: box.y + (clientY + metrics.top) * (box.height / metrics.height),
    };
  },
);

export const moveChartPointer = defineBrowserCommand(
  async (context, clientX: number, clientY: number) => {
    const point = await chartViewportPoint(context, clientX, clientY);
    await context.page.mouse.move(point.x, point.y);
  },
);

declare module "vitest/browser" {
  interface BrowserCommands {
    chartViewportPoint: (
      clientX: number,
      clientY: number,
    ) => Promise<{ x: number; y: number }>;
    moveChartPointer: (clientX: number, clientY: number) => Promise<void>;
  }
}
