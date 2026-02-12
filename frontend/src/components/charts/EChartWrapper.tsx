import ReactECharts from "echarts-for-react";
import type { EChartsOption } from "echarts";

interface EChartWrapperProps {
  option: EChartsOption;
  height?: string;
  className?: string;
}

export function EChartWrapper({
  option,
  height = "300px",
  className,
}: EChartWrapperProps) {
  return (
    <ReactECharts
      option={option}
      theme="njorda"
      opts={{ renderer: "svg" }}
      style={{ height, width: "100%" }}
      className={className}
    />
  );
}
