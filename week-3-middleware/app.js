const express = require("express");
const dogsRouter = require("./routes/dogs");
const path = require("path");

const app = express();

const { randomUUID } = require("crypto");

// Assignment 3b and 3c ask you to add middleware in this file.

app.use((req, res, next) => {
  req.requestId = randomUUID();
  res.setHeader("X-Request-Id", req.requestId);
  next();
});

app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}]: ${req.method} ${req.path} (${req.requestId})`);
  next();
});

app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  next();
});

app.use(express.json({ limit: "1mb" }));

app.use(express.static(path.join(__dirname, "public")));

app.use((req, res, next) => {
  if (req.method === "POST") {
    if (req.is("application/json")) {
      next();
    } else {
      res.status(400).json({
        error: "Content-Type must be application/json",
        requestId: req.requestId,
      });
    }
  } else {
    next();
  }
});

app.use("/", dogsRouter); // Do not remove this line

//notFound
app.use((req, res, next) => {
  res.status(404).json({ error: "Route not found", requestId: req.requestId });
});

//errorHandler - OLD
// app.use((err, req, res, next) => {
//   res
//     .status(500)
//     .json({ error: "Internal Server Error", requestId: req.requestId });
// });

//errorHandler new
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 400 && statusCode < 500) {
    console.warn(`WARN: ${err.name} - ${err.message}`);
  } else {
    console.error(`ERROR: ${err.name} - ${err.message}`);
  }

  res.status(statusCode).json({
    error: statusCode === 500 ? "Internal Server Error" : err.message,
    requestId: req.requestId,
  });
});

if (require.main === module) {
  app.listen(3000, () => {
    console.log("Dog rescue app is listening on port 3000...");
  });
}

module.exports = app;
