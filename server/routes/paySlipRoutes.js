const express = require("express");
const { createPaySlip, getAllPaySlips, getPaySlipByEmp } = require("../controllers/paySlipController");

const router = express.Router();

router.post("/", createPaySlip);
router.get("/", getAllPaySlips);
router.get("/employee", getPaySlipByEmp);

module.exports = router; 