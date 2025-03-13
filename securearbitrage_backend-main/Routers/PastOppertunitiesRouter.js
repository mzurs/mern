const express = require('express');
const { getAllData, deleteAllData } = require('../Controllers/pastOpportunitiesController');
const router = express.Router(); 

// Route to get all stored data
router.get('/data', getAllData);
router.delete('/data/delete-all', deleteAllData);

module.exports = router;
