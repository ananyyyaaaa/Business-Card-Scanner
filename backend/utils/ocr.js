import Tesseract from "tesseract.js";
import sharp from "sharp";
import path from "path";
import fs from "fs";

async function runOCR(imgPath) {
  try {
    const resizedPath = path.join(path.dirname(imgPath), "resized_" + path.basename(imgPath));

    await sharp(imgPath)
      .resize(800)
      .jpeg({ quality: 90 })
      .toFile(resizedPath);

    const result = await Tesseract.recognize(resizedPath, "eng");

    fs.unlinkSync(resizedPath);

    return result.data.text;
  } catch (err) {
    console.error("OCR ERROR:", err);
    throw err;
  }
}

export default runOCR;
