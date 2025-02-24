require("dotenv").config({ path: "./pass.env" });

console.log("Loaded ENV Variables:", process.env);

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

const COINAPI_KEY = process.env.COINAPI_KEY;
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

app.use(cors());
app.use(express.json());

// 🟢 Route 1: Get Bitcoin Yearly Price Change
app.get("/api/bitcoin-yearly", async (req, res) => {
  try {
    const response = await axios.get(
      `https://rest.coinapi.io/v1/exchangerate/BTC/USD?apikey=${COINAPI_KEY}`,
    );
    res.json({ success: true, rate: response.data?.rate ?? "N/A" });
  } catch (error) {
    console.error("Error fetching Bitcoin yearly price:", error);
    res.status(500).json({ success: false, error: "Failed to fetch Bitcoin price data." });
  }
});

// 🟢 Route 2: Get Crypto Exchange Rates (BTC, ETH, XRP)
app.get("/api/exchange-rates", async (req, res) => {
  const assets = ["BTC", "ETH", "XRP"];

  try {
    const responses = await Promise.all(
      assets.map((asset) =>
        axios.get(`https://rest.coinapi.io/v1/exchangerate/${asset}/USD?apikey=${COINAPI_KEY}`),
      ),
    );

    const rates = responses.reduce((acc, response, index) => {
      acc[assets[index]] = response.data?.rate ?? "N/A";
      return acc;
    }, {});

    res.json({ success: true, rates });
  } catch (error) {
    console.error("Error fetching exchange rates:", error);
    res.status(500).json({ success: false, error: "Failed to fetch exchange rates." });
  }
});

// 🟢 Route 3: Get Bitcoin Daily Price Change
app.get("/api/bitcoin-daily-change", async (req, res) => {
  try {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    const todayResponse = await axios.get(
      `https://rest.coinapi.io/v1/exchangerate/BTC/USD?apikey=${COINAPI_KEY}`,
    );

    const historyResponse = await axios.get(
      `https://rest.coinapi.io/v1/exchangerate/BTC/USD/history?period_id=1DAY&time_start=${yesterday}T00:00:00&apikey=${COINAPI_KEY}`,
    );

    const todayRate = todayResponse.data?.rate ?? null;
    const yesterdayRate = historyResponse.data?.rates?.[0]?.rate ?? null;

    if (!todayRate || !yesterdayRate) {
      throw new Error("Incomplete data received.");
    }

    const change = todayRate - yesterdayRate;
    const percentChange = ((change / yesterdayRate) * 100).toFixed(2);

    res.json({
      success: true,
      todayRate,
      yesterdayRate,
      change: change.toFixed(2),
      percentChange: percentChange,
    });
  } catch (error) {
    console.error("Error fetching BTC daily change:", error);
    res.status(500).json({ success: false, error: "Failed to fetch Bitcoin price data." });
  }
});

// 🟢 Route 4: Get Latest Bitcoin News
app.get("/api/bitcoin-news", async (req, res) => {
  try {
    const NEWS_URL = `https://newsapi.org/v2/everything?q=bitcoin&language=en&sortBy=publishedAt&pageSize=5&apiKey=${NEWSAPI_KEY}`;

    const response = await axios.get(NEWS_URL);

    if (!response.data?.articles?.length) {
      return res.status(404).json({ success: false, error: "No recent news available." });
    }

    return res.json({
      success: true,
      news: response.data.articles.map((article) => ({
        title: article.title,
        source: article.source.name,
        url: article.url,
        publishedAt: article.publishedAt,
      })),
    });
  } catch (error) {
    console.error("Error fetching Bitcoin news:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch Bitcoin news. Please try again later.",
    });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
