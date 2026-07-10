const fs = require("fs");
const path = require("path");

const folderPath = path.join(__dirname, "sample-files");
const filePath = path.join(folderPath, "sample.txt");
const fileContent = "Hello, async world!";

fs.mkdirSync(folderPath, { recursive: true });
// Write a sample file for demonstration
fs.writeFileSync(filePath, fileContent);

// 1. Callback style

fs.readFile(filePath, "utf-8", (error, data) => {
  if (error) {
    console.error("Callback error:", error);
    return;
  }

  console.log("Callback read:", data);
});

// Callback hell example (test and leave it in comments):
// Callback hell happens when each async step is nested inside the
// previous callback. This can become hard to read and maintain.

// fs.readFile(filePath, "utf-8", (error, data) => {
//   if (error) {
//     console.error(error);
//     return;
//   }
//
//   fs.writeFile(filePath, data, (error) => {
//     if (error) {
//       console.error(error);
//       return;
//     }
//
//     fs.readFile(filePath, "utf-8", (error, updatedData) => {
//       if (error) {
//         console.error(error);
//         return;
//       }
//
//       console.log(updatedData);
//     });
//   });
// });

// 2. Promise style

fs.promises
  .readFile(filePath, "utf-8")
  .then((data) => {
    console.log("Promise read:", data);
  })
  .catch((error) => {
    console.error("Promise error:", error);
  });

// 3. Async/Await style

async function readFileAsyncAwait() {
  try {
    const data = await fs.promises.readFile(filePath, "utf-8");
    console.log("Async/Await read:", data);
  } catch (error) {
    console.error("Async/Await error:", error);
    return;
  }
}

readFileAsyncAwait();
