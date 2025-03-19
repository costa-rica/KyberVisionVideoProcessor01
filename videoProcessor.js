require("dotenv").config();
const fs = require("fs");
const path = require("path");
const ffmpeg = require("fluent-ffmpeg");
const { apiPostRequestVideoMontageIsComplete } = require("./apiRequests");
const { writeRequestArgs } = require("./common");

// Function to delete all files in PATH_VIDEOS_MONTAGE_CLIPS
async function cleanupClipsFolder() {
  const clipsPath = process.env.PATH_VIDEOS_MONTAGE_CLIPS;
  if (!clipsPath) {
    console.error("❌ Missing PATH_VIDEOS_MONTAGE_CLIPS environment variable.");
    return;
  }

  try {
    const files = await fs.promises.readdir(clipsPath);
    for (const file of files) {
      const filePath = path.join(clipsPath, file);
      await fs.promises.unlink(filePath);
      console.log(`🗑️ Deleted: ${filePath}`);
    }
    console.log("✅ All temporary clips deleted.");
  } catch (error) {
    console.error("❌ Error cleaning up clips folder:", error);
  }
}

// Function to process the video montage

async function createVideoMontage(
  // videoFilePathAndName,
  filename,
  actionsArray,
  user,
  token
) {
  console.log(
    `- Create video montage step #2: in KV VideoProcessor01 createVideoMontage -`
  );

  // writeRequestArgs(
  //   {
  //     // videoFilePathAndName,
  //     filename,
  //     actionsArray,
  //     user,
  //     token,
  //   },
  //   "-02-createVideoMontage"
  // );
  const videoFilePathAndName = path.join(process.env.PATH_VIDEOS, filename);
  if (!fs.existsSync(videoFilePathAndName)) {
    console.error("❌ Source video file not found.");
    process.exit(1);
  }

  if (!Array.isArray(actionsArray) || actionsArray.length === 0) {
    console.error("❌ No timestamps provided.");
    process.exit(1);
  }

  const clipsPath = process.env.PATH_VIDEOS_MONTAGE_CLIPS;
  const outputPath = process.env.PATH_VIDEOS_MONTAGE_COMPLETE;

  if (!clipsPath || !outputPath) {
    console.error("❌ Missing required environment variables.");
    process.exit(1);
  }

  // Ensure directories exist
  [clipsPath, outputPath].forEach((dir) => {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });

  let clipFilePaths = [];

  // 🔹 Step 1: Create clips
  for (let i = 0; i < actionsArray.length; i++) {
    const timestamp = actionsArray[i].timestamp;
    const clipStart = Math.max(timestamp - 1.5, 0);
    const clipDuration = 3.0;
    const clipFilePath = path.join(clipsPath, `${i + 1}.mp4`);

    // console.log(
    //   `🎬 Creating clip ${
    //     i + 1
    //   }: Start ${clipStart}s, Duration ${clipDuration}s -> ${clipFilePath}`
    // );

    await new Promise((resolve, reject) => {
      ffmpeg(videoFilePathAndName)
        .setStartTime(clipStart)
        .setDuration(clipDuration)
        .output(clipFilePath)
        // .on("start", (cmd) => console.log(`🚀 FFmpeg Command: ${cmd}`))
        .on("end", () => {
          // console.log(`✅ Clip ${i + 1} created: ${clipFilePath}`);
          clipFilePaths.push(clipFilePath);
          resolve();
        })
        .on("error", reject)
        .run();
    });
  }

  // 🔹 Step 2: Merge clips into one video
  const montageVideoFilename = `montage_${Date.now()}.mp4`;
  const finalOutputPath = path.join(outputPath, montageVideoFilename);
  const fileListPath = path.join(clipsPath, "file_list.txt");

  fs.writeFileSync(
    fileListPath,
    clipFilePaths.map((file) => `file '${file}'`).join("\n")
  );

  await new Promise((resolve, reject) => {
    ffmpeg()
      .input(fileListPath)
      .inputOptions(["-f concat", "-safe 0"])
      .outputOptions(["-c copy"])
      .output(finalOutputPath)
      // .on("start", (cmd) =>
      //   console.log(`🚀 Merging clips with FFmpeg Command: ${cmd}`)
      // )
      .on("end", async () => {
        console.log(`✅ Montage created: ${finalOutputPath}`);

        // Send API request to notify completion
        // apiPostRequestVideoMontageIsComplete(finalOutputPath, user, token);
        apiPostRequestVideoMontageIsComplete(montageVideoFilename, user, token);
        await cleanupClipsFolder();
        process.exit(0);
      })
      .on("error", async (err) => {
        console.error("❌ Error merging clips:", err);
        await cleanupClipsFolder(); // 🔥 Still attempt cleanup on error
        process.exit(1);
      })
      .run();
  });
}

// 🔥 **Standalone Execution Mode**
if (require.main === module) {
  const args = process.argv.slice(2); // Skip first two (node, script path)

  if (args.length < 4) {
    console.error(
      "❌ Missing required arguments: videoFilePathAndName, actionsArray, user, token"
    );
    console.error(
      'Usage: node videoProcessor.js "/path/to/video.mp4" "[10.5, 30.2, 45.7]" "{user data}" "tokenString"'
    );
    process.exit(1);
  }

  const videoFilePathAndName = args[0];

  let actionsArray;
  try {
    actionsArray = JSON.parse(args[1]); // Parse JSON array
  } catch (error) {
    console.error("❌ Invalid actionsArray format. Expected a JSON array.");
    process.exit(1);
  }

  let user;
  try {
    user = JSON.parse(args[2]); // Parse user JSON object
  } catch (error) {
    console.error("❌ Invalid user format. Expected a JSON object.");
    process.exit(1);
  }

  const token = args[3]; // Token as a string

  createVideoMontage(videoFilePathAndName, actionsArray, user, token)
    .then(() => process.exit(0))
    .catch(async (error) => {
      console.error("❌ Error:", error);
      await cleanupClipsFolder(); // Ensure cleanup on failure
      process.exit(1);
    });
}

module.exports = { createVideoMontage };
