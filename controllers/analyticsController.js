const prisma = require("../db/prisma.js");

async function getUserAnalytics(req, res) {
  //parse and validate userI D
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    //handle invalid id
    return res.status(400).json({ message: "Invalid user ID" });
  }

  //use group by to count tasks by completion status
  const taskStats = await prisma.task.groupBy({
    by: ["isCompleted"],
    where: { userId },
    _count: {
      id: true,
    },
  });

  // include recent task activity with eager loading
  const recentTasks = await prisma.task.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      craetedAt: true,
      userId: true,
      User: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  //calculate weekly progress using groupBy
  //first, calculate the date from one week ago
  //hint: use new Date() and setDate() to subtract 7 days

  const oneWeekAgo = new Date(); // you need to calculate this
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

  //then use groupBy with a where clause filtering by createdAt >= oneWeekAgo
  const weeklyProgress = await prisma.task.groupBy({
    by: ["createdAt"],
    where: {
      userId,
      createdAt: { gte: oneWeekAgo },
    },
    _count: { id: true },
  });

  //return response with taskStates, recentTasks, and weeklyProgress
  res.status(200).json({
    taskStats,
    recentTasks,
    weeklyProgress,
  });
}

function getUsersWithStats() {}

function searchTasks() {}
