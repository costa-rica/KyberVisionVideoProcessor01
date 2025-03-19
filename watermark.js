const ffmpeg = require("fluent-ffmpeg");
const path = require("path");
const fs = require("fs");

const watermarkImage = path.join(__dirname, "images", "KyberV2Shiny.png");

/**
 * Adds a watermark to the final video montage.
 * @param {string} inputVideoPath - The path to the video file.
 * @returns {Promise<string>} - The path to the watermarked video file.
 */
async function addWatermarkToVideo(inputVideoPath) {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(inputVideoPath)) {
      return reject(new Error(`❌ Input video not found: ${inputVideoPath}`));
    }
    if (!fs.existsSync(watermarkImage)) {
      return reject(
        new Error(`❌ Watermark image not found: ${watermarkImage}`)
      );
    }

    const outputVideoPath = inputVideoPath.replace(
      /\.mp4$/,
      "_watermarked.mp4"
    );

    ffmpeg(inputVideoPath)
      .input(watermarkImage)
      .complexFilter(["[0:v][1:v] overlay=10:main_h-overlay_h-10"]) // Position: bottom left
      .output(outputVideoPath)
      .on("start", (cmd) => console.log(`🚀 FFmpeg Command: ${cmd}`))
      .on("end", () => {
        console.log(`✅ Watermarked video created: ${outputVideoPath}`);
        resolve(outputVideoPath);
      })
      .on("error", (err) => {
        console.error("❌ Error adding watermark:", err);
        reject(err);
      })
      .run();
  });
}

module.exports = { addWatermarkToVideo };
