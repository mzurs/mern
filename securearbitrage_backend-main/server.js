const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();
const cors = require("cors");
const path = require("path");
const NodeCache = require("node-cache");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
var cron = require('node-cron');
const port = process.env.PORT || 9096;
const app = express();
const axios = require('axios');
//app.use(express.json());
app.use(cors({ origin: true, credentials: true }));

app.use(cookieParser());
app.use(express.raw({ type: 'text/event-stream' }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.urlencoded({ extended: true }));

global.__basedir = "public/"; // set base directory

// MongoDB configuration
const db = require("./config/db");

mongoose.set("strictQuery", false);

mongoose
  .connect(db.mongoURIDev)
  .then(() => console.log("Mongodb Connected"))
  .catch((err) => console.log(err));
//Use Routes


const BSC_API_KEY = "YMQWA5J4541HGBJU32GGN65EVK6PKIUQAI";
// Store gas fees in memory (or you can use a database for persistence)
let gasFees = null;

// Function to fetch gas fees and calculate
const calculateGasFees = async (bnbAmount) => {
  try {
    // Fetch gas prices from BscScan
    const gasResponse = await axios.get(
      `https://api.bscscan.com/api?module=gastracker&action=gasoracle&apikey=${BSC_API_KEY}`
    );

    if (gasResponse.data.status !== "1") {
      throw new Error("Failed to fetch gas fees from BscScan");
    }

    const { SafeGasPrice, ProposeGasPrice, FastGasPrice } =
      gasResponse.data.result;

    // Fetch BNB USD price from CoinGecko
    const priceResponse = await axios.get(
      "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=usd"
    );

    const bnbUsdPrice =
      priceResponse.data.binancecoin && priceResponse.data.binancecoin.usd;

    if (!bnbUsdPrice) {
      throw new Error("Failed to fetch BNB price from CoinGecko");
    }

    // Define the gas limit for a sample transaction
    const gasLimit = 21000; // Typical gas limit for a standard transaction

    // Gas prices in Gwei
    const gasPrices = {
      safe: parseFloat(SafeGasPrice),
      propose: parseFloat(ProposeGasPrice),
      fast: parseFloat(FastGasPrice),
    };

    // Convert gas price to BNB
    const calculateFee = (gasPrice) =>
      (gasPrice * gasLimit * 1e-9).toFixed(8); // Gas Price in BNB

    const fees = {
      safe: {
        bnb: calculateFee(gasPrices.safe),
        usd: (calculateFee(gasPrices.safe) * bnbUsdPrice).toFixed(2),
      },
      propose: {
        bnb: calculateFee(gasPrices.propose),
        usd: (calculateFee(gasPrices.propose) * bnbUsdPrice).toFixed(2),
      },
      fast: {
        bnb: calculateFee(gasPrices.fast),
        usd: (calculateFee(gasPrices.fast) * bnbUsdPrice).toFixed(2),
      },
    };

    // Total cost for buying `bnbAmount`
    const totalCost = {
      safe: {
        bnb: (parseFloat(fees.safe.bnb) + bnbAmount).toFixed(8),
        usd: (
          parseFloat(fees.safe.usd) +
          bnbAmount * bnbUsdPrice
        ).toFixed(2),
      },
      propose: {
        bnb: (parseFloat(fees.propose.bnb) + bnbAmount).toFixed(8),
        usd: (
          parseFloat(fees.propose.usd) +
          bnbAmount * bnbUsdPrice
        ).toFixed(2),
      },
      fast: {
        bnb: (parseFloat(fees.fast.bnb) + bnbAmount).toFixed(8),
        usd: (
          parseFloat(fees.fast.usd) +
          bnbAmount * bnbUsdPrice
        ).toFixed(2),
      },
    };

    return { fees, totalCost };
  } catch (error) {
    console.error("Error fetching gas fees:", error.message);
    throw error;
  }
};

// Endpoint to calculate fees for a given amount of BNB
app.get("/calculate-gas-fees/:bnbAmount", async (req, res) => {
  const bnbAmount = parseFloat(req.params.bnbAmount); // Amount in BNB

  if (isNaN(bnbAmount) || bnbAmount <= 0) {
    return res
      .status(400)
      .json({ error: "Invalid BNB amount. Provide a positive number." });
  }

  try {
    const result = await calculateGasFees(bnbAmount);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: "Failed to calculate gas fees" });
  }
});


// Initialize the cache
const tokenCache = new NodeCache();

const fetchTopDexTokens = async () => {
  try {
    const response = await axios.get(
      "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=5000",
      {
        headers: {
          "X-CMC_PRO_API_KEY": process.env.CMC_API_KEY,
        },
      }
    );

    const tokenPrices = response.data.data
      .map((token) => ({
        id: token.id, // Include the token's ID
        name: token.name,
        symbol: token.symbol,
        price: token.quote.USD.price,
        marketCap: token.quote.USD.market_cap,
        tags: token.tags,
      }))
      .filter((token) => {
        const price = parseFloat(token.price);
        return (
          price >= 0.000001 &&
          token.tags &&
          token.tags.some((tag) => tag.toLowerCase().includes("-dex-token"))
        );
      })
      .slice(0, 100);
    tokenCache.set("topDexTokens", tokenPrices);

    console.log("Updated top 100 DEX tokens in cache with contract addresses.");
  } catch (error) {
    console.error("Error fetching tokens:", error.message);
  }
};



// Schedule the cron job to update tokens every 4 hours
// Schedule the task
cron.schedule(
  '0 0,4,8,12,16,20 * * *',
  () => {
    console.log("Running scheduled task");
    fetchTopDexTokens(); // Your function to fetch the data
  },
  { timezone: "Asia/Singapore" } // Set the timezone
);

// Fetch data initially on server start
fetchTopDexTokens();

// API endpoint to get token data
app.get("/tokens-coin", (req, res) => {
  const cachedTokens = tokenCache.get("topDexTokens");
  if (!cachedTokens) {
    return res.status(404).json({ message: "Token data not available." });
  }
  res.json(cachedTokens);
});

app.get("/tokens-coin-hit", (req, res) => {
  fetchTopDexTokens();
  res.json(tokenPrices);

});



app.use("/api/v1/arbitrage/user", require("./Routers/arbitrageWalletloginRouter"));
app.use("/api/v1/arbitrage", require("./Routers/arbitrageRoutes"));
app.use("/api/v1/arbitrage/mempool", require("./Routers/arbitrageMemPollRoutes"));
app.use("/api/v1/arbitrage/swap", require("./Routers/arbitragetransactionRouter"));
app.use("/api/v1/securearbitrage", require("./Routers/PastOppertunitiesRouter"));


app.get("/api", (req, res) => {
  res.send("Server Running...");
});
app.get("/", (req, res) => {
  res.send("Server Running...");
});

app.use("/public", express.static(path.join(__dirname, "public")));

// app.use('/public', express.static(path.join(__dirname, 'public'), {
//   setHeaders: function (res, path, stat) {
//       // console.log("ckuck", path)
//       res.set('Access-Control-Allow-Origin', '*');
//     }
//   }));

app.use("/BufferData", express.static(path.join(__dirname, "BufferData")));
app.use("/.well-known", express.static(path.join(__dirname, ".well-known")));

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
