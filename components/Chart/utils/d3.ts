import * as d3Array from "d3-array";
import * as d3Axis from "d3-axis";
import * as d3Format from "d3-format";
import * as d3Scale from "d3-scale";
import * as d3Selection from "d3-selection";
import * as d3Shape from "d3-shape";

export const d3 = {
  ...d3Scale,
  ...d3Shape,
  ...d3Selection,
  ...d3Axis,
  ...d3Array,
  ...d3Format,
};
