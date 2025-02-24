require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.COINAPI_KEY;

app.use(cors());
app.use(express.json());

// 📌 API to fetch Bitcoin's yearly price history
app.get("/api/bitcoin-yearly", async (req, res) => {
  try {
    const yearStart = new Date(new Date().getFullYear(), 0, 1).toISOString().split("T")[0];

    const response = await axios.get(
      `https://rest.coinapi.io/v1/exchangerate/BTC/USD/history?period_id=1DAY&time_start=${yearStart}T00:00:00`,
      {
        headers: { "X-CoinAPI-Key": API_KEY },
      },
    );

    if (response.data?.length > 0) {
      const formattedData = response.data
        .filter((entry) => entry.rate_close)
        .map((entry) => ({
          date: new Date(entry.time_period_start).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
          }),
          price: parseFloat(entry.rate_close.toFixed(2)),
        }));

      return res.json({ success: true, data: formattedData.reverse() });
    }

    return res.status(404).json({ success: false, error: "No data found" });
  } catch (error) {
    console.error("Error fetching Bitcoin yearly data:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch data" });
  }
});

// Start the server
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
