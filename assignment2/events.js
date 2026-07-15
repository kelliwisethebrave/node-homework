const EventEmitter = require("events");
const emitter = new EventEmitter();

emitter.on("time", (message) => {
  console.log("Time received:", message);
});

// require.main === module lets you run the file directly,
// but it prevents the timer from starting when the test
// imports your file.

if (require.main === module) {
  setInterval(() => {
    const currentTime = new Date().toString();
    emitter.emit("time", currentTime);
  }, 5000);
}

module.exports = emitter;
