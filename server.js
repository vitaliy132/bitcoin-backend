require("dotenv").config({ path: "./pass.env" });
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.COINAPI_KEY; // Ensure this is set in your .env file

app.use(cors());
app.use(express.json());

// 🚀 NEW ROUTE: Get Daily Bitcoin Price Change
app.get("/api/bitcoin-price-change", async (req, res) => {
  try {
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

    // Fetch today's BTC price
    const todayResponse = await axios.get("https://rest.coinapi.io/v1/exchangerate/BTC/USD", {
      headers: { "X-CoinAPI-Key": API_KEY },
    });

    // Fetch yesterday's BTC price
    const historyResponse = await axios.get(
      `https://rest.coinapi.io/v1/exchangerate/BTC/USD/history?period_id=1DAY&time_start=${yesterday}T00:00:00`,
      {
        headers: { "X-CoinAPI-Key": API_KEY },
      },
    );

    const todayRate = todayResponse.data?.rate ?? null;
    const yesterdayRate = historyResponse.data?.rates?.[0]?.rate_close ?? null;

    if (!todayRate || !yesterdayRate) {
      return res.status(500).json({ success: false, error: "Incomplete data received." });
    }

    const change = todayRate - yesterdayRate;
    const percentChange = ((change / yesterdayRate) * 100).toFixed(2);

    return res.json({
      success: true,
      todayPrice: todayRate.toFixed(2),
      yesterdayPrice: yesterdayRate.toFixed(2),
      change: change.toFixed(2),
      percentChange,
    });
  } catch (error) {
    console.error("Error fetching Bitcoin price change:", error);

    if (error.response?.status === 429) {
      return res.status(429).json({
        success: false,
        error: "Rate limit exceeded. Please wait before trying again.",
      });
    }

    return res.status(500).json({ success: false, error: "Failed to fetch Bitcoin price data." });
  }
});

// Start the server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
