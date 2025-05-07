import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const LineChart = dynamic(() => import("../components/LineChart"), { ssr: false });
const Treemap = dynamic(() => import("../components/Treemap"), { ssr: false });

export default function InfovisFinalProject() {
  const [sector, setSector] = useState("ai");
  const [data, setData] = useState([]);

  useEffect(() => {
    const file = sector === "ai"
      ? "/data/Wind集成电路_top5.json"
      : "/data/Wind石油天然气_top5.json";

    fetch(file)
      .then((res) => res.json())
      .then((json) => setData(json));
  }, [sector]);

  return (
    <div style={{ padding: "20px" }}>
      <h1>📊 行业趋势与结构可视化</h1>
      <label>
        选择行业：
        <select value={sector} onChange={(e) => setSector(e.target.value)} style={{ marginLeft: "10px" }}>
          <option value="ai">人工智能</option>
          <option value="oil">石油天然气</option>
        </select>
      </label>

      <h2 style={{ marginTop: "30px" }}>📈 股价趋势图（折线图）</h2>
      <LineChart data={data} />

      <h2 style={{ marginTop: "30px" }}>🟩 公司结构图（Treemap）</h2>
      <Treemap data={data} />
    </div>
  );
}
