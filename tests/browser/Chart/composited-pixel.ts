import { commands } from "vitest/browser";

/** Read the final browser pixel rather than just an individual GPU texture. */
export async function compositedPixel(clientX: number, clientY: number) {
  const image = new Image();
  image.src = await commands.captureChartPixel(clientX, clientY);
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 1;
  const context = canvas.getContext("2d")!;
  context.drawImage(image, 0, 0);
  return Array.from(context.getImageData(0, 0, 1, 1).data);
}
