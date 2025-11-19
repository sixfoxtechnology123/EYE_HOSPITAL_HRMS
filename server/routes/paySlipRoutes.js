const express = require("express");
const { createPaySlip,
     getAllPaySlips, 
     getPaySlipByEmp,
     updatePaySlip,
     deletePaySlip
     } = require("../controllers/paySlipController");

const router = express.Router();

router.post("/", createPaySlip);
router.get("/", getAllPaySlips);
router.get("/employee", getPaySlipByEmp);
router.put("/:id", updatePaySlip);
router.delete("/:id", deletePaySlip);

module.exports = router; 