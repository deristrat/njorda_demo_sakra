import { EChartWrapper } from "./EChartWrapper";
import { aumTrend } from "@/data/charts";
import type { EChartsOption } from "echarts";

export function MultiLineChart() {
  const option: EChartsOption = {
    tooltip: {
      trigger: "axis",
      valueFormatter: (val) => `${val} mkr`,
    },
    legend: {
      data: ["Totalt", "Aktier", "Räntor"],
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
      boundaryGap: false,
      data: aumTrend.map((d) => d.month),
    },
    yAxis: {
      type: "value",
      axisLabel: { formatter: "{value} mkr" },
      min: 200,
    },
    series: [
      {
        name: "Totalt",
        type: "line",
        smooth: true,
        data: aumTrend.map((d) => d.total),
        lineStyle: { width: 3 },
        itemStyle: { color: "#03A48D" },
        areaStyle: {
          color: {
            type: "linear",
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: "rgba(3,164,141,0.15)" },
              { offset: 1, color: "rgba(3,164,141,0)" },
            ],
          },
        },
      },
      {
        name: "Aktier",
        type: "line",
        smooth: true,
        data: aumTrend.map((d) => d.equity),
        lineStyle: { width: 2 },
        itemStyle: { color: "#1B3740" },
      },
      {
        name: "Räntor",
        type: "line",
        smooth: true,
        data: aumTrend.map((d) => d.fixedIncome),
        lineStyle: { width: 2 },
        itemStyle: { color: "#F985A0" },
      },
    ],
  };

  return <EChartWrapper option={option} height="320px" />;
}
