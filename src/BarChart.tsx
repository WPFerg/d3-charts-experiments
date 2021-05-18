import React, { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { axisBottom, axisLeft, extent, scaleLinear, scalePoint } from "d3";

import styles from "./BarChart.module.css";
import useD3Selection from "./useD3Selection";

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
  const [, renderToggle] = useState(false);

  const [plotAreaWidth, setPlotAreaWidth] = useState(0);
  const [tickWidth, setTickWidth] = useState(0);
  const [yAxisWidth, setYAxisWidth] = useState(0);

  const [svgRootSelection, setSvgRootElement] = useD3Selection<SVGSVGElement>();
  const [xAxisSelection, setXAxisElement] = useD3Selection<SVGGElement>();
  const [yAxisSelection, setYAxisElement] = useD3Selection<SVGGElement>();
  const [plotAreaSelection, setPlotAreaElement] = useD3Selection<SVGGElement>();

  const xScale = useMemo(() => scalePoint<number>(), []);
  const yScale = useMemo(() => scaleLinear(), []);
  const xAxis = useMemo(() => axisBottom(xScale), [xScale]);
  const yAxis = useMemo(() => axisLeft(yScale), [yScale]);

  const { width, height } = svgRootSelection
    ?.node()
    ?.getBoundingClientRect() ?? {
    width: 0,
    height: 0,
  };
  const xOrigin = yScale(0);

  xScale.range([0, plotAreaWidth]);

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
      !svgRootSelection ||
      !xAxisSelection ||
      !yAxisSelection ||
      !plotAreaSelection
    ) {
      return;
    }

    yScale.range([height - X_AXIS_HEIGHT, 0]).nice();

    // Render the Y axis, measure it, and resize the X axis accordingly
    yAxisSelection.call(yAxis);
    const yAxisWidth = yAxisSelection.node()?.getBBox().width ?? 0;
    const plotAreaWidth = width - yAxisWidth;
    const tickWidth = plotAreaWidth / (data.length || 1);

    // Reduce the number of tick labels to 1 per 100px
    const tickLabelFrequency = tickWidth < 100 ? Math.ceil(100 / tickWidth) : 1;
    xAxis.tickFormat((d, i) =>
      i % tickLabelFrequency === 0 ? i.toString() : ""
    );

    xAxisSelection
      .call(xAxis)
      .selectAll(".tick text")
      .attr("transform", `translate(${tickWidth / 2} 0)`);

    // Update react state, triggers re-render if different.
    setYAxisWidth(yAxisWidth);
    setPlotAreaWidth(plotAreaWidth);
    setTickWidth(tickWidth);
  }, [
    width,
    height,
    yScale,
    yAxis,
    xScale,
    xAxis,
    data,
    xAxisSelection,
    yAxisSelection,
    plotAreaSelection,
    svgRootSelection,
  ]);

  useEffect(() => {
    // Update state to trigger a re-render on resize. Will be a better way
    // to handle this, but it's a POC
    const callback = () => renderToggle((value) => !value);

    window.addEventListener("resize", callback);

    return () => window.removeEventListener("resize", callback);
  }, []);

  return (
    <svg
      className={styles.chart}
      ref={setSvgRootElement}
      width={width}
      height={height}
    >
      <g
        className="plot-area"
        ref={setPlotAreaElement}
        transform={`translate(${yAxisWidth} 0)`}
      >
        {data.map((d, i) => (
          <rect
            key={i}
            className={styles.rect}
            width={tickWidth}
            x={xScale(i)}
            y={d < 0 ? xOrigin : yScale(d)}
            height={Math.abs(xOrigin - yScale(d))}
          />
        ))}
      </g>
      <g
        className="x-axis"
        ref={setXAxisElement}
        transform={`translate(${yAxisWidth} ${xOrigin})`}
      />
      <g
        className="y-axis"
        ref={setYAxisElement}
        transform={`translate(${yAxisWidth} 0)`}
      />
    </svg>
  );
};

export default BarChart;
