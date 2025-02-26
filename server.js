require("dotenv").config({ path: "./pass.env" });

console.log("Loaded ENV Variables:", process.env);

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;

app.use(cors());
app.use(express.json());

// 🟢 Route: Get Current Bitcoin Price ✅
app.get("/api/bitcoin-price", async (req, res) => {
  try {
    const response = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest",
      {
        params: { symbol: "BTC", convert: "USD" },
        headers: { "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY },
      },
    );

    const price = response.data?.data?.BTC?.quote?.USD?.price ?? null;

    if (!price) {
      return res.status(404).json({ success: false, error: "Bitcoin price not found." });
    }

    return res.json({ success: true, price });
  } catch (error) {
    console.error("Error fetching Bitcoin price:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch Bitcoin price." });
  }
});

// 🟢 Route: Get Bitcoin News ✅
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
    return res.status(500).json({ success: false, error: "Failed to fetch Bitcoin news." });
  }
});

// 🟢 Route: Get 12-Month Bitcoin Price Data ✅
app.get("/api/bitcoin-yearly", async (req, res) => {
  try {
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const timeStart = oneYearAgo.toISOString().split("T")[0];
    const timeEnd = new Date().toISOString().split("T")[0];

    const response = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/historical",
      {
        params: {
          symbol: "BTC",
          convert: "USD",
          time_start: timeStart,
          time_end: timeEnd,
          interval: "1M",
        },
        headers: { "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY },
      },
    );

    const priceData = response.data?.data?.quotes?.map((quote) => ({
      date: quote.timestamp.slice(0, 10),
      price: quote.quote.USD.price,
    }));

    if (!priceData || priceData.length === 0) {
      return res.status(404).json({ success: false, error: "No data available." });
    }

    return res.json({ success: true, data: priceData });
  } catch (error) {
    console.error("Error fetching Bitcoin yearly data:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch Bitcoin data." });
  }
});

// 🟢 Route: Get Fear & Greed Index ✅
app.get("/api/fear-greed", async (req, res) => {
  try {
    const response = await axios.get("https://api.alternative.me/fng/");
    const indexData = response.data.data[0];

    return res.json({
      success: true,
      index: indexData.value,
      classification: indexData.value_classification,
    });
  } catch (error) {
    console.error("Error fetching Fear & Greed Index:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch data." });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
