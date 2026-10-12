import { cdp, commands } from "vitest/browser";

type Point = { x: number; y: number };

export async function dispatchChartTouch(params: {
  type: "touchStart" | "touchMove" | "touchEnd" | "touchCancel";
  touchPoints: (Point & { id: number })[];
}) {
  const touchPoints = await Promise.all(
    params.touchPoints.map(async (point) => ({
      ...point,
      ...(await commands.chartViewportPoint(point.x, point.y)),
    })),
  );
  await cdp().send("Input.dispatchTouchEvent", { ...params, touchPoints });
}

export async function dispatchChartMouse(
  params: Point & {
    type: "mousePressed" | "mouseMoved" | "mouseReleased";
    button: "left";
    buttons: number;
    clickCount?: number;
  },
) {
  const point = await commands.chartViewportPoint(params.x, params.y);
  await cdp().send("Input.dispatchMouseEvent", { ...params, ...point });
}
