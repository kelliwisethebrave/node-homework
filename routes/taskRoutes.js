const express = require("express");
const taskController = require("../controllers/taskController.js");

const taskRouter = express.Router();

taskRouter.get("/", taskController.index);
taskRouter.get("/:id", taskController.show);
taskRouter.post("/bulk", taskController.bulkCreate);
taskRouter.post("/", taskController.create);
taskRouter.patch("/:id", taskController.update);
taskRouter.delete("/:id", taskController.deleteTask);

module.exports = taskRouter;
