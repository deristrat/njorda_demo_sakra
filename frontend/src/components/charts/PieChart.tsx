import { EChartWrapper } from "./EChartWrapper";
import { portfolioAllocation } from "@/data/charts";
import type { EChartsOption } from "echarts";

export function PieChart() {
  const option: EChartsOption = {
    tooltip: {
      trigger: "item",
      formatter: "{b}: {c}% ({d}%)",
    },
    legend: {
      orient: "vertical",
      right: "5%",
      top: "center",
      itemGap: 12,
    },
    series: [
      {
        name: "Tillgångsslag",
        type: "pie",
        radius: ["45%", "75%"],
        center: ["35%", "50%"],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 6,
          borderColor: "#fff",
          borderWidth: 2,
        },
        label: { show: false },
        emphasis: {
          label: { show: true, fontSize: 14, fontWeight: 600 },
        },
        data: portfolioAllocation.map((item) => ({
          value: item.value,
          name: item.name,
          itemStyle: { color: item.color },
        })),
      },
    ],
  };

  return <EChartWrapper option={option} height="320px" />;
}
