import { EChartWrapper } from "./EChartWrapper";
import { meetingsPerWeek } from "@/data/charts";
import type { EChartsOption } from "echarts";

export function BarChart() {
  const option: EChartsOption = {
    tooltip: {
      trigger: "axis",
      axisPointer: { type: "shadow" },
    },
    legend: {
      data: ["Möten", "Mål"],
      bottom: 0,
    },
    grid: {
      left: "3%",
      right: "4%",
      bottom: "12%",
      top: "8%",
      containLabel: true,
    },
    xAxis: {
      type: "category",
      data: meetingsPerWeek.map((d) => d.week),
    },
    yAxis: {
      type: "value",
      minInterval: 1,
    },
    series: [
      {
        name: "Möten",
        type: "bar",
        data: meetingsPerWeek.map((d) => d.meetings),
        barWidth: "50%",
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: "#03A48D",
        },
      },
      {
        name: "Mål",
        type: "line",
        data: meetingsPerWeek.map((d) => d.target),
        lineStyle: { width: 2, type: "dashed" },
        itemStyle: { color: "#FC4832" },
        symbol: "none",
      },
    ],
  };

  return <EChartWrapper option={option} height="280px" />;
}
