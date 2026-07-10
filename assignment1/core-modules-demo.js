const os = require("os");
const path = require("path");
const fs = require("fs");
const { cpuUsage } = require("process");

const sampleFilesDir = path.join(__dirname, "sample-files");
const filePath = path.join(sampleFilesDir, "demo.txt");
const content = "Hello from fs.promises!";

const largeFilePath = path.join(sampleFilesDir, "largefile.txt");

if (!fs.existsSync(sampleFilesDir)) {
  fs.mkdirSync(sampleFilesDir, { recursive: true });
}

// OS module (//platform, cpu, memory) //os.platform is function
console.log("Platform:", os.platform());
console.log("CPU:", os.cpus()[0].model);
console.log("Total Memory:", os.totalmem());

// Path module
console.log("Joined path:", filePath);

// fs.promises API

async function writeReadDemo() {
  try {
    await fs.promises.writeFile(filePath, content, "utf-8");
    const data = await fs.promises.readFile(filePath, "utf-8");
    console.log("fs.promises read:", data);
  } catch (error) {
    console.error("Read/write error:", error);
    return;
  }
}

writeReadDemo();

// Streams for large files- log first 40 chars of each chunk

async function createAndStreamLargeFile() {
  try {
    let largeFileContent = "";
    for (let i = 1; i <= 100; i++) {
      largeFileContent += `This is a line in a large file. Line ${i}\n`;
    }

    await fs.promises.writeFile(largeFilePath, largeFileContent, "utf-8");
    const readStream = fs.createReadStream(largeFilePath, {
      encoding: "utf8",
      highWaterMark: 1024,
    });

    readStream.on("data", (chunk) => {
      console.log("Read chunk:", chunk.slice(0, 40));
    });

    readStream.on("end", () => {
      console.log("Finished reading large file with streams.");
    });

    readStream.on("error", (error) => {
      console.error("Stream error:", error);
    });
  } catch (error) {
    console.error("Large file setup error:", error);
  }
}
createAndStreamLargeFile();
