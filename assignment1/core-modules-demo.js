const os = require("os");
const path = require("path");
const fs = require("fs");
const { cpuUsage } = require("process");

const sampleFilesDir = path.join(__dirname, "sample-files");
const filePath = path.join(sampleFilesDir, "demo.txt");
const content = "Hello from fs.promises!";

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
