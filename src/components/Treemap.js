import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function Treemap({ data }) {
  const ref = useRef();

  useEffect(() => {
    if (data.length === 0) return;

    d3.select(ref.current).selectAll("*").remove();

    const margin = { top: 10, right: 10, bottom: 10, left: 10 };
    const width = 1200;
    const height = 600;

    const svg = d3.select(ref.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    // ✅ 分组 + 计算涨跌幅和市值
    const grouped = d3.group(data, d => d.name);

    const companyStats = Array.from(grouped.entries()).map(([name, values]) => {
      const sorted = values.sort((a, b) => new Date(a.date) - new Date(b.date));
      const first = sorted[0].close_price;
      const last = sorted[sorted.length - 1].close_price;
      return {
        name,
        change: (last - first) / first,
        market_cap: values[0].market_cap,
      };
    });

    // ✅ 按市值排序，取前10
    const top10 = companyStats
      .filter(d => d.market_cap !== undefined)
      .sort((a, b) => b.market_cap - a.market_cap)
      .slice(0, 10);

    const root = d3.hierarchy({ children: top10 }).sum(d => d.market_cap);
    d3.treemap().size([width, height]).padding(2)(root);

    const color = d3.scaleDiverging()
      .domain([-0.05, 0, 0.05])
      .interpolator(d3.interpolateRdYlGn);

    const nodes = svg.selectAll("g")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

    // ✅ 矩形
    nodes.append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => color(d.data.change))
      .attr("stroke", "#fff");
  
    // 计算字体大小（取宽度和高度的最小值作为基准）
    const computeFontSize = (d, scale = 0.15, min = 10, max = 20) => {
      const boxWidth = d.x1 - d.x0;
      const boxHeight = d.y1 - d.y0;
      return Math.max(min, Math.min(max, Math.min(boxWidth, boxHeight) * scale));
    };

    // 公司名称
    nodes.append("text")
    .attr("x", d => (d.x1 - d.x0) / 2)
    .attr("y", d => (d.y1 - d.y0) / 2 - computeFontSize(d)*0.5)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .style("font-size", d => `${computeFontSize(d)}px`)
    .style("fill", d => {
      const bgColor = d3.color(color(d.data.change));
      const brightness = bgColor.r * 0.299 + bgColor.g * 0.587 + bgColor.b * 0.114;
      return brightness > 150 ? "#000" : "#fff";
    })
    .text(d => d.data.name);

    // 涨跌幅
    nodes.append("text")
    .attr("x", d => (d.x1 - d.x0) / 2)
    .attr("y", d => (d.y1 - d.y0) / 2 + computeFontSize(d)*0.5)
    .attr("text-anchor", "middle")
    .attr("alignment-baseline", "middle")
    .style("font-size", d => `${computeFontSize(d, 0.15)}px`) // 比公司名称略小
    .style("fill", d => {
      const bgColor = d3.color(color(d.data.change));
      const brightness = bgColor.r * 0.299 + bgColor.g * 0.587 + bgColor.b * 0.114;
      return brightness > 150 ? "#000" : "#fff";
    })
    .text(d => `${(d.data.change * 100).toFixed(2)}%`);

  }, [data]);

  return <div ref={ref}></div>;
}
