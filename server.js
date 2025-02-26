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

// 🟢 Route: Get Current Prices for BTC, ETH, and XRP ✅
app.get("/api/crypto-prices", async (req, res) => {
  try {
    const response = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest",
      {
        params: { symbol: "BTC,ETH,XRP", convert: "USD" },
        headers: { "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY },
      },
    );

    const prices = {
      btc: response.data?.data?.BTC?.quote?.USD?.price ?? null,
      eth: response.data?.data?.ETH?.quote?.USD?.price ?? null,
      xrp: response.data?.data?.XRP?.quote?.USD?.price ?? null,
    };

    if (!prices.btc || !prices.eth || !prices.xrp) {
      return res.status(404).json({ success: false, error: "Price data not found." });
    }

    return res.json({ success: true, prices });
  } catch (error) {
    console.error("Error fetching crypto prices:", error);
    return res
      .status(500)
      .json({ success: false, error: "Failed to fetch cryptocurrency prices." });
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

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
