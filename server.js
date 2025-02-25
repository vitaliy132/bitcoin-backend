require("dotenv").config({ path: "./pass.env" });

console.log("Loaded ENV Variables:", process.env);

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

const COINAPI_KEY = process.env.COINAPI_KEY;
const PORTFOLIO_COINAPI_KEY = process.env.PORTFOLIO_COINAPI_KEY;
const NEWSAPI_KEY = process.env.NEWSAPI_KEY;
const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY;

app.use(cors());
app.use(express.json());

// 🟢 Route 4: Get Latest Bitcoin News✅
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

// 🟢 Route 5: Get Bitcoin Price from CoinMarketCap✅
app.get("/api/bitcoin-price", async (req, res) => {
  try {
    const response = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest",
      {
        params: { symbol: "BTC", convert: "USD" },
        headers: { "X-CMC_PRO_API_KEY": COINMARKETCAP_API_KEY },
      },
    );

    const price = response.data?.data?.BTC?.quote?.USD?.price ?? "N/A";
    res.json({ success: true, price });
  } catch (error) {
    console.error("Error fetching Bitcoin price from CoinMarketCap:", error);
    res.status(500).json({ success: false, error: "Failed to fetch Bitcoin price." });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
