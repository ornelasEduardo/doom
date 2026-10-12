import { registerGpuMark } from "./scene";
import type { Point } from "./vector-path";

// D3 axis domains contain only absolute move, horizontal, and vertical commands.
function domainPoints(path: string): Point[] {
  const commands = path.match(/[MHV][^MHV]*/g) ?? [];
  if (
    commands.join("") !== path ||
    (commands.length && commands[0]?.[0] !== "M")
  ) {
    throw new Error("Unsupported D3 axis domain geometry");
  }
  let x = 0,
    y = 0;
  return commands.map((command) => {
    const values = command.slice(1).split(",").map(Number);
    if (
      values.some((value) => !Number.isFinite(value)) ||
      values.length !== (command[0] === "M" ? 2 : 1)
    ) {
      throw new Error("Invalid D3 axis domain geometry");
    }
    if (command[0] === "M") {
      [x, y] = values;
    } else if (command[0] === "H") {
      [x] = values;
    } else {
      [y] = values;
    }
    return { x, y };
  });
}

export function registerAxisStrokes(root: SVGGElement) {
  const releases = Array.from(
    root.querySelectorAll<SVGGraphicsElement>("line, path.domain"),
    (node) => {
      const coordinate = (name: string) => Number(node.getAttribute(name) ?? 0);
      const points =
        node.tagName === "line"
          ? [
              { x: coordinate("x1"), y: coordinate("y1") },
              { x: coordinate("x2"), y: coordinate("y2") },
            ]
          : domainPoints(node.getAttribute("d") ?? "");
      const opacity = node.getAttribute("stroke-opacity");
      node.setAttribute("data-chart-gpu-mark", "path");
      node.setAttribute("stroke-opacity", "0");
      const release = registerGpuMark(node, {
        kind: "path",
        contours: [{ points, closed: false }],
      });
      return () => {
        release();
        node.removeAttribute("data-chart-gpu-mark");
        if (opacity === null) {
          node.removeAttribute("stroke-opacity");
        } else {
          node.setAttribute("stroke-opacity", opacity);
        }
      };
    },
  );
  return () => releases.forEach((release) => release());
}
