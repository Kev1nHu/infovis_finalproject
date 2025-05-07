// src/components/LineChart.js
import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function LineChart({ data }) {
  const ref = useRef();

  useEffect(() => {
    if (data.length === 0) return;
    d3.select(ref.current).selectAll("*").remove();

    const margin = { top: 30, right: 120, bottom: 30, left: 60 };
    const width = 1200 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = d3.select(ref.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    const grouped = d3.group(data, d => d.name);

    const sortedByMarketCap = Array.from(grouped.entries())
      .map(([name, values]) => ({
        name,
        values: values.sort((a, b) => new Date(a.date) - new Date(b.date)),
        market_cap: values[0].market_cap
      }))
      .sort((a, b) => b.market_cap - a.market_cap)
      .slice(0, 5);

    const allDates = sortedByMarketCap[0].values.map(d => new Date(d.date));

    const x = d3.scaleTime()
      .domain(d3.extent(allDates))
      .range([0, width]);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x));

    // 百分比范围计算
    const allPct = sortedByMarketCap.flatMap(company =>
      company.values.map(d => (d.close_price / company.values[0].close_price) * 100)
    );
    const minY = Math.floor(d3.min(allPct) / 2) * 2;
    const maxY = Math.ceil(d3.max(allPct) / 2) * 2;

    const y = d3.scaleLinear()
      .domain([minY, maxY])
      .range([height, 0]);

    svg.append("g")
      .call(
        d3.axisLeft(y)
          .ticks((maxY - minY) / 2)
          .tickFormat(d => `${d.toFixed(0)}%`)
      );

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    for (const [i, company] of sortedByMarketCap.entries()) {
      // ✅ 添加图示条（Legend）
      const legend = svg.append("g")
      .attr("transform", `translate(${width + 10}, 0)`);

      sortedByMarketCap.forEach((company, i) => {
      legend.append("rect")
        .attr("x", 0)
        .attr("y", i * 20)
        .attr("width", 12)
        .attr("height", 12)
        .attr("fill", color(company.name));

      legend.append("text")
        .attr("x", 18)
        .attr("y", i * 20 + 10)
        .text(company.name)
        .style("font-size", "12px")
        .attr("fill", "#000");
      });

      const basePrice = company.values[0].close_price;
      const values = company.values.map(d => ({
        ...d,
        pct_change: (d.close_price / basePrice) * 100
      }));

      svg.append("path")
        .datum(values)
        .attr("fill", "none")
        .attr("stroke", color(company.name))
        .attr("stroke-width", 2)
        .attr("d", d3.line()
          .x(d => x(new Date(d.date)))
          .y(d => y(d.pct_change))
        );

      }
  }, [data]);

  return <div ref={ref}></div>;
}
