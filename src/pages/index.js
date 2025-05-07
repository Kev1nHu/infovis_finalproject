import Head from "next/head";
import Image from "next/image";
import { Geist, Geist_Mono } from "next/font/google";
import styles from "@/styles/Home.module.css";
import { useState, useEffect } from "react";
import LineChart from "../components/LineChart";
import Treemap from "../components/Treemap";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export default function Home() {
  const [sector, setSector] = useState("ai");
  const [data, setData] = useState([]);

  useEffect(() => {
    const file =
      sector === "ai" ? "/data/ai_sector.json" : "/data/oil_gas_sector.json";
    fetch(file)
      .then((res) => res.json())
      .then((json) => setData(json));
  }, [sector]);

  const handleSelectChange = (e) => setSector(e.target.value);

  return (
    <>
      <Head>
        <title>Stock Visualization</title>
        <meta name="description" content="Visualize stock trends with D3 and Next.js" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={`${styles.page} ${geistSans.variable} ${geistMono.variable}`}>
        <main className={styles.main}>
          <h1 className={styles.title}>📈 Stock Market Trends</h1>

          <label style={{ marginBottom: "20px" }}>
            Select Industry:{" "}
            <select value={sector} onChange={handleSelectChange}>
              <option value="ai">集成电路（AI）</option>
              <option value="oil">石油天然气</option>
            </select>
          </label>

          <div
            style={{
              border: "1px solid #ccc",
              padding: "10px",
              marginTop: "20px",
            }}
          >
        
            <LineChart data={data} />
            <Treemap data={data} />
          </div>
        </main>

        <footer className={styles.footer}>
          <a href="https://nextjs.org" target="_blank" rel="noopener noreferrer">
            Powered by Next.js
          </a>
        </footer>
      </div>
    </>
  );
}
