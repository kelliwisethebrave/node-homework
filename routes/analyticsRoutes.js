const express = require("express");
const analyticsController = require("../controllers/analyticsController.js");

const analyticsRouter = express.Router();

analyticsRouter.get("/users/:id", analyticsController.getUserAnalytics);
analyticsRouter.get("/users", analyticsController.getUsersWithStats);
analyticsRouter.get("/tasks/search", analyticsController.searchTasks);

module.exports = analyticsRouter;
