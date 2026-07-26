const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

const taskId = parseInt(req.params?.id);

if (!taskId) {
  return res.status(400).json({
    message: "The task ID passed is not valid.",
  });
}

function create() {}

module.exports = { create, index, show, update, deleteTask };
