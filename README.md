# 🎥 KyberVisionVideoProcessor

**KyberVisionVideoProcessor** is a standalone microservice that generates video montages by extracting clips from a source video based on specified timestamps and merging them into a final video.

## 📌 Overview

- Accepts a **video file path** and a **list of timestamps**.
- Extracts **3-second clips** around each timestamp.
- Merges the clips into a **final montage video**.
- **Automatically deletes temporary clips** after processing.
- Can be triggered via **command-line execution** or by another service using `spawn()`.

## 📂 Folder Structure

```sh
├── README.md
├── package.json
├── videoProcessor.js
└── yarn.lock
```

## ⚙️ Environment Variables

Ensure you have a `.env` file with the following paths:

```sh
PATH_VIDEOS_MONTAGE_CLIPS=/path/to/temp_clips
PATH_VIDEOS_MONTAGE_COMPLETE=/path/to/final_videos
```

- NOTE: when running from API the .env from the API is used.

## 🚀 How to Run

### 1️⃣ **Manually from the Terminal**

You can execute it as a standalone script:

```sh
node videoProcessor.js "/path/to/video.mp4" "[10.5, 30.2, 45.7]"
```

### 2️⃣ **From Another Service**

```js
const { spawn } = require("child_process");

const process = spawn("node", [
  "/Users/nick/Documents/KyberVisionVideoProcessor/videoProcessor.js",
  videoFilePathAndName,
  JSON.stringify(timestampArray),
]);

process.stdout.on("data", (data) => console.log(`Output: ${data}`));
process.stderr.on("data", (data) => console.error(`Error: ${data}`));
```

## 🛠 How It Works

    1.	Extracts 3-second clips (1.5s before and after each timestamp).
    2.	Saves clips in PATH_VIDEOS_MONTAGE_CLIPS.
    3.	Generates a file list for merging.
    4.	Merges clips into a final video in PATH_VIDEOS_MONTAGE_COMPLETE.
    5.	Deletes temporary clips after merging.
