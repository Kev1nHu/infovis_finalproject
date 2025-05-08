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

    const container = d3.select(ref.current)
      .style("position", "relative");

    const tooltip = container.append("div")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("padding", "6px 10px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
      .style("box-shadow", "0 2px 6px rgba(0,0,0,0.2)")
      .style("font-size", "13px")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("z-index", 10);

    const svg = container.append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const grouped = d3.group(data, d => d.name);

    const companyStats = Array.from(grouped.entries()).map(([name, values]) => {
      const sorted = values.sort((a, b) => new Date(a.date) - new Date(b.date));
      const first = sorted[0].close_price;
      const last = sorted[sorted.length - 1].close_price;
      return {
        name,
        change: isFinite((last - first) / first) ? (last - first) / first : 0,
        market_cap: values[0].market_cap
      };
    });

    const top10 = companyStats
      .filter(d => d.market_cap !== undefined)
      .sort((a, b) => b.market_cap - a.market_cap)
      .slice(0, 10);

    const root = d3.hierarchy({ children: top10 }).sum(d => d.market_cap);
    d3.treemap().size([width, height]).padding(2)(root);

    const color = d3.scaleDiverging()
      .domain([
        d3.min(top10, d => d.change),
        0,
        d3.max(top10, d => d.change)
      ])
      .interpolator(d3.interpolateRdYlGn);

    const nodes = svg.selectAll("g")
      .data(root.leaves())
      .enter()
      .append("g")
      .attr("transform", d => `translate(${d.x0},${d.y0})`);

    nodes.append("rect")
      .attr("width", d => d.x1 - d.x0)
      .attr("height", d => d.y1 - d.y0)
      .attr("fill", d => color(d.data.change) || "#ccc")
      .attr("stroke", "#fff")
      .on("mouseover", (event, d) => {
        tooltip
          .style("opacity", 1)
          .html(`
            <strong>${d.data.name}</strong><br/>
            近十日涨跌幅：${(d.data.change * 100).toFixed(2)}%<br/>
            市值：${(d.data.market_cap / 1e8).toFixed(2)} 亿
          `);
      })
      .on("mousemove", event => {
        tooltip
          .style("left", `${event.offsetX + 15}px`)
          .style("top", `${event.offsetY + 15}px`);
      })
      .on("mouseout", () => {
        tooltip.style("opacity", 0);
      });

    const computeFontSize = (d, scale = 0.15, min = 10, max = 20) => {
      const boxWidth = d.x1 - d.x0;
      const boxHeight = d.y1 - d.y0;
      return Math.max(min, Math.min(max, Math.min(boxWidth, boxHeight) * scale));
    };

    nodes.append("text")
      .attr("x", d => (d.x1 - d.x0) / 2)
      .attr("y", d => (d.y1 - d.y0) / 2 - computeFontSize(d)*0.5)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .style("font-size", d => `${computeFontSize(d)}px`)
      .style("fill", d => {
        const bg = d3.color(color(d.data.change));
        if (!bg) return "#000";
        const brightness = bg.r * 0.299 + bg.g * 0.587 + bg.b * 0.114;
        return brightness > 150 ? "#000" : "#fff";
      })
      .text(d => d.data.name);

    nodes.append("text")
      .attr("x", d => (d.x1 - d.x0) / 2)
      .attr("y", d => (d.y1 - d.y0) / 2 + computeFontSize(d)*0.5)
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .style("font-size", d => `${computeFontSize(d, 0.15)}px`)
      .style("fill", d => {
        const bg = d3.color(color(d.data.change));
        if (!bg) return "#000";
        const brightness = bg.r * 0.299 + bg.g * 0.587 + bg.b * 0.114;
        return brightness > 150 ? "#000" : "#fff";
      })
      .text(d => `${(d.data.change * 100).toFixed(2)}%`);
  }, [data]);

  return <div ref={ref}></div>;
}
