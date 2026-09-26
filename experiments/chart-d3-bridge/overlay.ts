import { select } from "d3-selection";

import { Behavior, Chart } from "../../components/Chart/Chart";
import styles from "./Proof.module.scss";

export function separateMarkers<T>(): Behavior<T> {
  return (context) => {
    const current = context.getChartContext();
    const base = current.g?.node()?.ownerSVGElement;
    const parent = base?.parentElement;
    if (!base || !parent) {
      return;
    }
    const overlay = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    );
    overlay.setAttribute("data-proof-overlay", "");
    overlay.setAttribute("aria-hidden", "true");
    overlay.classList.add(styles.overlay);
    parent.append(overlay);
    const g = select(overlay).append("g");
    const resize = () => {
      const { width, height, margin } =
        current.chartStore.getState().dimensions;
      overlay.setAttribute("width", String(width));
      overlay.setAttribute("height", String(height));
      g.attr("transform", `translate(${margin.left},${margin.top})`);
    };
    resize();
    const unsubscribe = current.chartStore.subscribe(resize);
    const cleanup = Chart.behaviors.Markers({ radius: 10 })({
      ...context,
      getChartContext: () => ({ ...current, g }),
    });
    return () => {
      unsubscribe();
      cleanup?.();
      overlay.remove();
    };
  };
}
