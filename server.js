import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "fs";
import { PDFDocument } from "pdf-lib";

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend
app.use(cors());
app.use(express.json());

// Multer setup (for uploads)
const upload = multer({ dest: "uploads/" });

// Test route
app.get("/", (req, res) => {
  res.send("✅ PDF Editor API running successfully!");
});

/**
 * POST /merge
 * Upload multiple PDFs and return one merged PDF
 */
app.post("/merge", upload.array("pdfs"), async (req, res) => {
  try {
    const mergedPdf = await PDFDocument.create();

    for (const file of req.files) {
      const pdfBytes = fs.readFileSync(file.path);
      const pdf = await PDFDocument.load(pdfBytes);
      const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
      copiedPages.forEach((page) => mergedPdf.addPage(page));
    }

    const mergedPdfBytes = await mergedPdf.save();

    // Cleanup temporary files
    req.files.forEach((f) => fs.unlinkSync(f.path));

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=merged.pdf");
    res.send(Buffer.from(mergedPdfBytes));
  } catch (err) {
    console.error("❌ Merge Error:", err);
    res.status(500).send("Error merging PDFs");
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
