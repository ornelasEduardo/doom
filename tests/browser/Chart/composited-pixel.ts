import { commands } from "vitest/browser";

/** Read the final browser pixel rather than just an individual GPU texture. */
export async function compositedPixel(clientX: number, clientY: number) {
  const image = new Image();
  const snapshot = await commands.captureChartPixel(clientX, clientY);
  image.src = snapshot.data;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d")!;
  context.drawImage(image, snapshot.x, snapshot.y, 1, 1, 0, 0, 1, 1);
  return Array.from(context.getImageData(0, 0, 1, 1).data);
}
