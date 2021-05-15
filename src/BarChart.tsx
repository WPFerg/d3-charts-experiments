import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  select,
  axisLeft,
  axisBottom,
  scaleLinear,
  scalePoint,
  extent,
  schemeCategory10,
} from "d3";

import styles from "./BarChart.module.css";

const data = [1, 5, 2, 3, 7, 5, 3, 74];

// Hard coding the axis co-ordinates for now; normally
// would measure their width/height
const X_AXIS_OFFSET = 30;

const validateExtent = (
  result: [undefined, undefined] | [number, number]
): result is [number, number] =>
  Number.isFinite(result[0]) && Number.isFinite(result[1]);

const BarChart: React.FC = () => {
  const [, setStateToggle] = useState(false);
  const svgRoot = useRef<SVGSVGElement | null>(null);
  const xAxisElement = useRef<SVGGElement | null>(null);
  const yAxisElement = useRef<SVGGElement | null>(null);
  const plotAreaElement = useRef<SVGGElement | null>(null);

  useLayoutEffect(() => {
    if (
      !svgRoot.current ||
      !xAxisElement.current ||
      !yAxisElement.current ||
      !plotAreaElement.current
    ) {
      return;
    }

    const { width, height } = svgRoot.current?.getBoundingClientRect();
    const rootSelection = select(svgRoot.current);

    rootSelection.attr("width", width).attr("height", height);

    // Note that a lot about this isn't performant. It's recalculating the domain/range each time and not
    // when the data updates.
    const yExtent = extent(data);

    if (!validateExtent(yExtent)) {
      return;
    }

    const yScale = scaleLinear([height - X_AXIS_OFFSET, 0]).domain([
      Math.min(0, yExtent[0]),
      yExtent[1],
    ]);
    const yAxis = axisLeft(yScale);
    const yAxisG = select(yAxisElement.current).call(yAxis);
    const yAxisWidth = yAxisElement.current.getBBox().width;
    const plotAreaWidth = width - yAxisWidth;

    yAxisG.attr("transform", `translate(${yAxisWidth} 0)`);

    const xScale = scalePoint<number>()
      .domain(
        Array(data.length + 1)
          .fill(0)
          .map((d, i) => i)
      )
      .range([0, plotAreaWidth]);
    const xAxis = axisBottom(xScale);

    const xOrigin = yScale(0);
    select(xAxisElement.current)
      .call(xAxis)
      .attr("transform", `translate(${yAxisWidth} ${xOrigin})`);

    const plotArea = select(plotAreaElement.current).attr(
      "transform",
      `translate(${yAxisWidth} 0)`
    );

    const rect = plotArea
      .selectAll<SVGRectElement, number[]>(".rect")
      .data(data);

    rect
      .enter()
      .append("rect")
      .classed("rect", true)
      .attr("fill", schemeCategory10[0])
      .merge(rect)
      .attr("x", (d, i) => xScale(i) ?? "")
      .attr("width", plotAreaWidth / (data.length || 1))
      .attr("y", (d) => yScale(d))
      .attr("height", (d) => xOrigin - yScale(d));

    rect.exit().remove();
  });

  useEffect(() => {
    // Update state to trigger a re-render on resize. Will be a better way
    // to handle this, but it's a POC
    const callback = () => setStateToggle((value) => !value);

    window.addEventListener("resize", callback);

    return () => window.removeEventListener("resize", callback);
  }, []);

  return (
    <svg className={styles.chart} ref={svgRoot}>
      <g className="x-axis" ref={xAxisElement} />
      <g className="y-axis" ref={yAxisElement} />
      <g className="plot-area" ref={plotAreaElement} />
    </svg>
  );
};

export default BarChart;
