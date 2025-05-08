import { useEffect, useRef } from "react";
import * as d3 from "d3";

export default function LineChart({ data }) {
  const ref = useRef();

  useEffect(() => {
    if (data.length === 0) return;

    const margin = { top: 30, right: 150, bottom: 50, left: 60 };
    const width = 1200 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    d3.select(ref.current).selectAll("*").remove();

    const container = d3.select(ref.current)
      .style("position", "relative");

    const tooltip = container.append("div")
      .style("position", "absolute")
      .style("background", "#fff")
      .style("padding", "6px 10px")
      .style("border", "1px solid #ccc")
      .style("border-radius", "4px")
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

    const sortedByMarketCap = Array.from(grouped.entries())
      .map(([name, values]) => {
        const sorted = values.sort((a, b) => new Date(a.date) - new Date(b.date));
        const base = sorted[0].close_price;
        const valuesWithPct = sorted.map((d, idx) => {
          const prevClose = idx === 0 ? d.close_price : sorted[idx - 1].close_price;
          return {
            ...d,
            date: new Date(d.date),
            pct_change_base: (d.close_price / base) * 100,
            pct_change_prev: (d.close_price / prevClose - 1) * 100  // 增加用于hover，基于前一天收盘价的涨跌幅
          };
        });
        return {
          name,
          values: valuesWithPct,
          market_cap: values[0].market_cap
        };
      })
      .sort((a, b) => b.market_cap - a.market_cap)
      .slice(0, 5);

    const allDates = sortedByMarketCap[0].values.map(d => d.date);
    const x = d3.scalePoint()
      .domain(allDates)
      .range([0, width])
      .padding(0.5);

    svg.append("g")
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisBottom(x).tickFormat(d3.timeFormat("%m-%d")));

    const allPct = sortedByMarketCap.flatMap(c => c.values.map(d => d.pct_change_base));
    const y = d3.scaleLinear()
      .domain([d3.min(allPct) * 0.98, d3.max(allPct) * 1.02])
      .range([height, 0]);

    svg.append("g")
      .call(d3.axisLeft(y).tickFormat(d => `${d.toFixed(0)}%`));

    const color = d3.scaleOrdinal(d3.schemeTableau10);

    sortedByMarketCap.forEach((company, i) => {
      svg.append("path")
        .datum(company.values)
        .attr("fill", "none")
        .attr("stroke", color(company.name))
        .attr("stroke-width", 2)
        .attr("d", d3.line()
          .x(d => x(d.date))
          .y(d => y(d.pct_change_base))
        );

      svg.selectAll(`circle-${i}`)
        .data(company.values)
        .enter()
        .append("circle")
        .attr("cx", d => x(d.date))
        .attr("class", `circle-${i}`)
        .attr("cy", d => y(d.pct_change_base))
        .attr("r", 4)
        .attr("fill", color(company.name))
        .on("mouseover", (event, d) => {
          tooltip
            .style("opacity", 1)
            .html(`
              <strong>${company.name}</strong><br/>
              日期：${d3.timeFormat("%Y-%m-%d")(d.date)}<br/>
              收盘价：${d.close_price.toFixed(2)}<br/>
              日涨跌幅：${d.pct_change_prev.toFixed(2)}%
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
    });

    // ✅ 添加 Legend（图例）
    const legend = svg.append("g")
      .attr("transform", `translate(${width + 10}, 0)`);

    sortedByMarketCap.forEach((company, i) => {
      const lineHeight = 20;
      const yOffset = i * lineHeight;

      legend.append("circle")
        .attr("cx", 36)
        .attr("cy", yOffset)
        .attr("r", 6)
        .style("fill", color(company.name));

      legend.append("text")
        .attr("x", 52)
        .attr("y", yOffset + 4)
        .text(company.name)
        .attr("font-size", "13px")
        .attr("fill", "#000");
    });
  }, [data]);

  return <div ref={ref}></div>;
}
