const express = require("express");
const { fetchPrice } = require("../Controllers/arbitrageController");

const router = express.Router();

// Route to track arbitrage
router.get("/track", fetchPrice);

module.exports = router;
