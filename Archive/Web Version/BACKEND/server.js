import express from "express";
import WebTorrent from "webtorrent";
import cors from "cors";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import chalk from "chalk";
import rateLimit from "express-rate-limit";

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// const tempDir = path.join(process.env.TEMP || "/tmp", "myapp_subtitles");
// const webtDir = path.join(process.env.TEMP || "/tmp", "webtorrent");
// console.log(tempDir);
const downloadsDir = path.join(__dirname, "downloads");
console.log(downloadsDir);
if (!fs.existsSync(downloadsDir)) {
  fs.mkdirSync(downloadsDir, { recursive: true });
}

const app = express();
const client = new WebTorrent();

// ==================== PERFORMANCE OPTIMIZATIONS ====================

// 1. Torrent Metadata Cache
const metadataCache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

function getCachedMetadata(magnet) {
  const cached = metadataCache.get(magnet);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(chalk.green('✓ Cache hit for magnet'));
    return cached.data;
  }
  return null;
}

function setCachedMetadata(magnet, data) {
  metadataCache.set(magnet, {
    data,
    timestamp: Date.now()
  });
  console.log(chalk.blue(`📦 Cached metadata (${metadataCache.size} items in cache)`));
}

// 2. Torrent Activity Tracker
const torrentActivity = new Map();
const INACTIVE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

function updateTorrentActivity(magnetOrInfoHash) {
  torrentActivity.set(magnetOrInfoHash, Date.now());
}

// 3. Automatic Torrent Cleanup
setInterval(() => {
  const now = Date.now();
  const torrentsToRemove = [];

  for (const [magnetOrInfoHash, lastActivity] of torrentActivity.entries()) {
    if (now - lastActivity > INACTIVE_TIMEOUT) {
      torrentsToRemove.push(magnetOrInfoHash);
    }
  }

  torrentsToRemove.forEach(magnetOrInfoHash => {
    const torrent = client.get(magnetOrInfoHash);
    if (torrent) {
      console.log(chalk.yellow(`🧹 Cleaning up inactive torrent: ${torrent.name || magnetOrInfoHash}`));
      torrent.destroy();
      torrentActivity.delete(magnetOrInfoHash);
    }
  });

  if (torrentsToRemove.length > 0) {
    console.log(chalk.green(`✓ Cleaned up ${torrentsToRemove.length} inactive torrents`));
  }
}, 5 * 60 * 1000); // Check every 5 minutes

// 4. Cache Cleanup
setInterval(() => {
  const now = Date.now();
  let removed = 0;

  for (const [magnet, cached] of metadataCache.entries()) {
    if (now - cached.timestamp > CACHE_TTL) {
      metadataCache.delete(magnet);
      removed++;
    }
  }

  if (removed > 0) {
    console.log(chalk.blue(`🗑️  Cleaned up ${removed} expired cache entries`));
  }
}, 10 * 60 * 1000); // Check every 10 minutes

// 5. Rate Limiting
const metadataLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  message: 'Too many metadata requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

const addTorrentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 15, // 15 requests per minute
  message: 'Too many torrent requests, please try again later.',
});

// Log performance stats every 5 minutes
setInterval(() => {
  console.log(chalk.cyan('\n📊 Performance Stats:'));
  console.log(chalk.cyan(`   Active Torrents: ${client.torrents.length}`));
  console.log(chalk.cyan(`   Cached Metadata: ${metadataCache.size}`));
  console.log(chalk.cyan(`   Tracked Activities: ${torrentActivity.size}`));
  console.log(chalk.cyan(`   Memory (Heap): ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB\n`));
}, 5 * 60 * 1000);

// ===================================================================

app.use(cors());

// Ensure the temporary directory exists
// if (!fs.existsSync(tempDir)) {
//   fs.mkdirSync(tempDir, { recursive: true });
// }

/* ------------- CHECK LATEST GITHUB RELEASE ------------ */
const owner = "hitarth-gg"; // Replace with the repository owner
const repo = "zenshin"; // Replace with the repository name
const currentVersion = "v1.0.0"; // Replace with the current version

const getLatestRelease = async () => {
  try {
    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/releases/latest`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();

    if (data.tag_name !== currentVersion) {
      console.log(chalk.blue("New version available:", data.tag_name));
      console.log("Release notes:", data.body);
      console.log(
        chalk.yellow(
          "Download URL: https://github.com/hitarth-gg/zenshin/releases"
        )
      );
    }
  } catch (error) {
    console.error("Error fetching latest release:", error);
  }
};
getLatestRelease();
/* ------------------------------------------------------ */

/* ----------------- SEED EXISTING FILES ---------------- */
// Seed all existing files on server startup
const seedExistingFiles = () => {
  fs.readdir(downloadsDir, (err, files) => {
    if (err) {
      console.error("Error reading downloads directory:", err);
      return;
    }

    files.forEach((file) => {
      const filePath = path.join(downloadsDir, file);

      if (fs.lstatSync(filePath).isFile()) {
        client.seed(filePath, { path: downloadsDir }, (torrent) => {
          // console.log(`Seeding file: ${filePath}`);
          // console.log(`Magnet URI: ${torrent.magnetURI}`);
          console.log(
            chalk.bgBlue("Seeding started: "),
            chalk.cyan(torrent.name)
          );
          torrent.on("error", (err) => {
            console.error(chalk.bgRed("Error seeding file:"), err);
          });
        });
      }
    });
  });
};

// Call the function to start seeding existing files
seedExistingFiles();
/* ------------------------------------------------------ */

app.get("/add/:magnet", addTorrentLimiter, async (req, res) => {
  let magnet = req.params.magnet;

  /* ------------------------------------------------------ */
  // Check if the torrent is already added
  let existingTorrent = await client.get(magnet);
  console.log("Existing torrent:", existingTorrent);

  if (existingTorrent) {
    // Update activity
    updateTorrentActivity(magnet);

    // If torrent is already added, return its file information
    let files = existingTorrent.files.map((file) => ({
      name: file.name,
      length: file.length,
    }));
    // console.log("Existing torrent files:", files);

    return res.status(200).json(files);
  }
  /* ------------------------------------------------------ */

  client.add(magnet, function (torrent) {
    // Track activity
    updateTorrentActivity(magnet);

    let files = torrent.files.map((file) => ({
      name: file.name,
      length: file.length,
    }));
    // console.log(files);

    res.status(200).json(files);
  });
});

/* -------------------- GET METADATA -------------------- */
app.get("/metadata/:magnet", metadataLimiter, async (req, res) => {
  let magnet = req.params.magnet;

  // Check cache first
  const cachedData = getCachedMetadata(magnet);
  if (cachedData) {
    return res.status(200).json(cachedData);
  }

  /* ------------------------------------------------------ */
  // Check if the torrent is already added
  let existingTorrent = await client.get(magnet);
  console.log("Existing torrent:", existingTorrent);

  if (existingTorrent) {
    // Update activity
    updateTorrentActivity(magnet);

    // If torrent is already added, return its file information
    let files = existingTorrent.files.map((file) => ({
      name: file.name,
      length: file.length,
    }));

    // Cache the result
    setCachedMetadata(magnet, files);

    return res.status(200).json(files);
  }
  /* ------------------------------------------------------ */

  const torrent = client.add(magnet, { deselect: true, path: downloadsDir });

  torrent.on("metadata", () => {
    // Track activity
    updateTorrentActivity(magnet);

    const files = torrent.files.map((file) => ({
      name: file.name,
      length: file.length,
    }));
    console.log(files);

    // Cache the result
    setCachedMetadata(magnet, files);

    res.status(200).json(files);
  });
});

app.get("/streamfile/:magnet/:filename", async function (req, res, next) {
  let magnet = req.params.magnet;
  let filename = req.params.filename;

  console.log(magnet);

  let tor = await client.get(magnet);

  if (!tor) {
    return res.status(404).send("Torrent not found");
  }
  // Track activity
  updateTorrentActivity(magnet);

  let file = tor.files.find((f) => f.name === filename);
  console.log("file :" + file.toString());

  if (!file) {
    return res.status(404).send("No file found in the torrent");
  }
  console.log(file);

  file.select();

  let range = req.headers.range;

  console.log("Range : " + range);

  if (!range) {
    return res.status(416).send("Range is required");
  }

  let positions = range.replace(/bytes=/, "").split("-");
  let start = parseInt(positions[0], 10);
  let file_size = file.length;
  let end = positions[1] ? parseInt(positions[1], 10) : file_size - 1;
  let chunksize = end - start + 1;

  let head = {
    "Content-Range": `bytes ${start}-${end}/${file_size}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunksize,
    "Content-Type": "video/x-matroska",
  };

  res.writeHead(206, head);

  let stream_position = {
    start: start,
    end: end,
  };

  detailsOfEpisode.percentageWatched = (start / end) * 100;
  console.log(detailsOfEpisode);


  let stream = file.createReadStream(stream_position);
  stream.pipe(res);

  stream.on("error", function (err) {
    console.error("Stream error:", err);
    // Only send a response if headers haven't been sent yet
    if (!res.headersSent) {
      return res.status(500).send("Error streaming the video");
    }
  });

  stream.on("close", () => {
    console.log("Stream closed prematurely");
  });
});

// Deselect an episode with the given filename
app.get("/deselect/:magnet/:filename", async (req, res) => {
  let magnet = req.params.magnet;
  let filename = req.params.filename;

  let tor = await client.get(magnet);

  if (!tor) {
    return res.status(404).send("Torrent not found");
  }

  let file = tor.files.find((f) => f.name === filename);

  if (!file) {
    return res.status(404).send("No file found in the torrent");
  }

  console.log(chalk.bgRed("Download Stopped:") + " " + chalk.cyan(file.name));

  file.deselect();

  res.status(200).send("File deselected successfully");
});

// get download details of a file

let detailsOfEpisode = {
  name: "",
  length: 0,
  downloaded: 0,
  progress: 0,
  percentageWatched: 0,
}

app.get("/detailsepisode/:magnet/:filename", async (req, res) => {
  let magnet = req.params.magnet;
  let filename = req.params.filename;

  let tor = await client.get(magnet);
  if (!tor) {
    return res.status(404).send("Torrent not found");
  }

  let file = tor.files.find((f) => f.name === filename);
  if (!file) {
    return res.status(404).send("No file found in the torrent");
  }

  // let details = {
  detailsOfEpisode = {
    name: file.name,
    length: file.length,
    downloaded: file.downloaded,
    progress: file.progress,
    percentageWatched: detailsOfEpisode.percentageWatched,
  };

  res.status(200).json(detailsOfEpisode);
});

/* ------------------------------------------------------ */

app.get("/stream/:magnet", async function (req, res, next) {
  let magnet = req.params.magnet;
  console.log(magnet);

  let tor = await client.get(magnet);

  if (!tor) {
    return res.status(404).send("Torrent not found");
  }

  let file = tor.files.find((f) => f.name.endsWith(".mkv"));
  console.log("file :" + file.toString());

  if (!file) {
    return res.status(404).send("No MP4 file found in the torrent");
  }

  let range = req.headers.range;
  console.log("Range : " + range);

  if (!range) {
    return res.status(416).send("Range is required");
  }

  let positions = range.replace(/bytes=/, "").split("-");
  let start = parseInt(positions[0], 10);
  let file_size = file.length;
  let end = positions[1] ? parseInt(positions[1], 10) : file_size - 1;
  let chunksize = end - start + 1;

  let head = {
    "Content-Range": `bytes ${start}-${end}/${file_size}`,
    "Accept-Ranges": "bytes",
    "Content-Length": chunksize,
    "Content-Type": "video/x-matroska",
  };

  res.writeHead(206, head);

  let stream_position = {
    start: start,
    end: end,
  };

  let stream = file.createReadStream(stream_position);
  stream.pipe(res);

  stream.on("error", function (err) {
    console.error("Stream error:", err);
    // Only send a response if headers haven't been sent yet
    if (!res.headersSent) {
      return res.status(500).send("Error streaming the video");
    }
  });

  stream.on("close", () => {
    console.log("Stream closed prematurely");
  });
});

app.get("/details/:magnet", async (req, res) => {
  let magnet = req.params.magnet;

  // Find the torrent by magnet link
  let tor = await client.get(magnet);
  if (!tor) {
    return res.status(404).send("Torrent not found");
  }

  // Prepare torrent details
  let details = {
    name: tor.name,
    length: tor.length,
    downloaded: tor.downloaded,
    uploaded: tor.uploaded,
    downloadSpeed: tor.downloadSpeed,
    uploadSpeed: tor.uploadSpeed,
    progress: tor.progress,
    ratio: tor.ratio,
    numPeers: tor.numPeers,
  };

  res.status(200).json(details);
});

/* --------------- Handling VLC streaming --------------- */
import { exec } from "child_process";
import { get } from "http";
// Full path to VLC executable, change it as needed
const vlcPath = '"C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe"'; // Adjust this path as needed

app.get("/stream-to-vlc", async (req, res) => {
  const { url, magnet } = req.query;

  if (!url) {
    return res.status(400).send("URL is required");
  }
  const vlcCommand = `${vlcPath} "${url}"`;

  exec(vlcCommand, (error) => {
    if (error) {
      console.error(`Error launching VLC: ${error.message}`);
      return res.status(500).send("Error launching VLC");
    }
    res.send("VLC launched successfully");
  });
});
/* ------------------------------------------------------ */

app.delete("/remove/:magnet", async (req, res) => {
  let magnet = req.params.magnet;

  // Find the torrent by magnet link
  let tor = await client.get(magnet);
  if (!tor) {
    return res.status(404).send("Torrent not found");
  }

  // Destroy the torrent to stop downloading and remove it from the client
  tor.destroy((err) => {
    if (err) {
      console.error("Error removing torrent:", err);
      return res.status(500).send("Error removing torrent");
    }

    res.status(200).send("Torrent removed successfully");
  });
});

// ping backend
app.get("/ping", (req, res) => {
  res.status(200).send("pong");
});

// app.get("/subtitles/:magnet", (req, res) => {
//   let magnet = req.params.magnet;

//   let tor = client.get(magnet);
//   if (!tor) {
//     return res.status(404).send("Torrent not found");
//   }

//   // Find subtitle file in the torrent
//   let subtitleFile = tor.files.find(f => f.name.endsWith(".srt"));
//   if (!subtitleFile) {
//     return res.status(404).send("No subtitle file found in the torrent");
//   }

//   res.setHeader("Content-Type", "text/vtt");
//   let stream = subtitleFile.createReadStream();
//   stream.pipe(res);

//   stream.on("error", function (err) {
//     console.error("Subtitle stream error:", err);
//     if (!res.headersSent) {
//       return res.status(500).send("Error streaming the subtitle file");
//     }
//   });
// });

const PORT = process.env.PORT || 64621;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
