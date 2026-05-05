const express = require("express");
const router = express.Router();

const {
  scanUrl,
  explain,
  scanText,
  scanDownload,
  scanFile,
} = require("../controllers/extensionController");

router.post("/scan-url", scanUrl);
router.post("/explain", explain);
router.post("/scan-text", scanText);
router.post("/scan-download", scanDownload);
router.post("/scan-file", scanFile);

module.exports = router;
