function errorHandler(err, req, res, next) {
  res.status(500).json({ message: "Error." });
}

module.exports = errorHandler;
