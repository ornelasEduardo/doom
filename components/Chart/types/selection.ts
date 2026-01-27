import * as d3Selection from "d3-selection";

export type D3Selection<
  Datum = unknown,
  PElement extends d3Selection.BaseType = d3Selection.BaseType,
  PDatum = unknown,
> = d3Selection.Selection<SVGGElement, Datum, PElement, PDatum>;

export type SVGSelection<
  Datum = unknown,
  PElement extends d3Selection.BaseType = d3Selection.BaseType,
  PDatum = unknown,
> = d3Selection.Selection<SVGSVGElement, Datum, PElement, PDatum>;
