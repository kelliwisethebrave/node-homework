const prisma = require("../db/prisma.js");

async function getUserAnalytics(req, res) {
  //parse and validate userI D
  const userId = parseInt(req.params.id);
  if (isNaN(userId)) {
    //handle invalid id
    return res.status(400).json({ message: "Invalid user ID" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found." });
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
      createdAt: true,
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

async function getUsersWithStats(req, res) {
  // parse pagination parameters (similar to how you did the in the task index method)
  // hint: parse page and limit from req.query, calculate skip
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // get users with task counts using _count aggregation
  // note: in Prisma, you need to use include for relations, then transform the result

  const usersRaw = await prisma.user.findMany({
    include: {
      Task: {
        where: { isCompleted: false },
        select: { id: true },
        take: 5,
      },
      _count: {
        select: {
          Task: true,
        },
      },
    },
    skip: skip,
    take: limit,
    orderBy: { createdAt: "desc" },
  });

  // transform to only include the fields we want
  const users = usersRaw.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    createdAt: user.createdAt,
    _count: user._count,
    Task: user.Task,
  }));

  // get total count for pagination

  const totalUsers = await prisma.user.count();

  // build pagination object with page, limit, total, pages, hasNext, hasPrev
  // hint: use Math.ceil() for pages, compare page * limit with total for hasNext
  const pagination = {
    page,
    limit,
    total: totalUsers,
    pages: Math.ceil(totalUsers / limit),
    hasNext: page * limit < totalUsers,
    hasPrev: page > 1,
  };
  // return users and pagination
  return res.status(200).json({
    users,
    pagination,
  });
}

function searchTasks() {}

module.exports = { getUserAnalytics, getUsersWithStats, searchTasks };
