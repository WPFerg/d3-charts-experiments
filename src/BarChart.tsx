import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

// Hard coding the x axis height - without line breaks, this
// is probably ok
const X_AXIS_HEIGHT = 30;

const validateExtent = (
  result: [undefined, undefined] | [number, number]
): result is [number, number] =>
  Number.isFinite(result[0]) && Number.isFinite(result[1]);

interface Props {
  data: number[];
}

const BarChart: React.FC<Props> = ({ data }) => {
  const [, setStateToggle] = useState(false);
  const svgRoot = useRef<SVGSVGElement | null>(null);
  const xAxisElement = useRef<SVGGElement | null>(null);
  const yAxisElement = useRef<SVGGElement | null>(null);
  const plotAreaElement = useRef<SVGGElement | null>(null);

  const xScale = useMemo(() => scalePoint<number>(), []);
  const yScale = useMemo(() => scaleLinear(), []);
  const xAxis = useMemo(() => axisBottom(xScale), [xScale]);
  const yAxis = useMemo(() => axisLeft(yScale), [yScale]);

  // Update scales as required
  useLayoutEffect(() => {
    xScale.domain(
      Array(data.length + 1)
        .fill(0)
        .map((d, i) => i)
    );

    const yExtent = extent(data);
    if (validateExtent(yExtent)) {
      yScale.domain([Math.min(0, yExtent[0]), yExtent[1]]);
    }
  }, [data, xScale, yScale, xAxis, yAxis]);

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

    yScale.range([height - X_AXIS_HEIGHT, 0]);

    // Render the Y axis, measure it, and resize the X axis accordingly
    const yAxisG = select(yAxisElement.current).call(yAxis);
    const yAxisWidth = yAxisElement.current.getBBox().width;
    const plotAreaWidth = width - yAxisWidth;

    yAxisG.attr("transform", `translate(${yAxisWidth} 0)`);
    xScale.range([0, plotAreaWidth]);

    // Reduce the number of tick labels to 1 per 100px
    const tickWidth = plotAreaWidth / data.length;
    const tickLabelFrequency = tickWidth < 100 ? Math.ceil(100 / tickWidth) : 1;
    xAxis.tickFormat((d, i) =>
      i % tickLabelFrequency === 0 ? i.toString() : ""
    );

    const xOrigin = yScale(0);
    const xAxisG = select(xAxisElement.current)
      .call(xAxis)
      .attr("transform", `translate(${yAxisWidth} ${xOrigin})`);

    xAxisG
      .selectAll(".tick text")
      .attr("transform", `translate(${tickWidth / 2} 0)`);

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
      .attr("shape-rendering", "crispEdges")
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
