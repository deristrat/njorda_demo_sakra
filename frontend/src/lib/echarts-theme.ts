import * as echarts from "echarts";

const njordaEchartsTheme: Record<string, unknown> = {
  color: [
    "#03A48D",
    "#76C5B9",
    "#B0DED7",
    "#FC4832",
    "#F985A0",
    "#1B3740",
    "#688F9A",
    "#F7EDE2",
    "#D4A574",
    "#BB000C",
  ],
  backgroundColor: "transparent",
  textStyle: {
    fontFamily: "var(--font-primary)",
    color: "#1B3740",
  },
  title: {
    textStyle: {
      fontFamily: "var(--font-primary)",
      color: "#1B3740",
      fontWeight: 600,
      fontSize: 16,
    },
    subtextStyle: {
      fontFamily: "var(--font-primary)",
      color: "#688F9A",
    },
  },
  tooltip: {
    backgroundColor: "#FFFFFF",
    borderColor: "#F7EDE2",
    borderWidth: 1,
    textStyle: {
      color: "#1B3740",
      fontFamily: "var(--font-primary)",
      fontSize: 13,
    },
    extraCssText: "box-shadow: 0 4px 12px rgba(27, 55, 64, 0.1); border-radius: 8px;",
  },
  legend: {
    textStyle: {
      fontFamily: "var(--font-primary)",
      color: "#688F9A",
    },
  },
  categoryAxis: {
    axisLine: { lineStyle: { color: "#F7EDE2" } },
    axisTick: { lineStyle: { color: "#F7EDE2" } },
    axisLabel: { color: "#688F9A", fontFamily: "var(--font-primary)" },
    splitLine: { lineStyle: { color: "#F7EDE2" } },
  },
  valueAxis: {
    axisLine: { lineStyle: { color: "#F7EDE2" } },
    axisTick: { lineStyle: { color: "#F7EDE2" } },
    axisLabel: { color: "#688F9A", fontFamily: "var(--font-primary)" },
    splitLine: { lineStyle: { color: "#F7EDE2", type: "dashed" } },
  },
};

echarts.registerTheme("njorda", njordaEchartsTheme);
