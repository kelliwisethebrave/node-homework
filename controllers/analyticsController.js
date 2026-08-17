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

async function searchTasks(req, res, next) {
  const searchQuery = req.query.q;
  // validate search query
  if (!searchQuery || searchQuery.trim().length < 2) {
    return res.status(400).json({
      error: "Search query must be at least 2 characters long",
    });
  }

  // get limit from query (default to 20)

  const limit = req.query.limit || 20; // ... parse from req.query

  // construct search patterns outside the query for proper parameterization

  const searchPattern = `%${searchQuery}%`;
  const exactMatch = searchQuery;
  const startsWith = `${searchQuery}%`;

  // use raw SQL for complex text search with parameterized queries

  const searchResults = await prisma.$queryRaw`
  SELECT 
    t.id,
    t.title,
    t.is_completed as "isCompleted",
    t.priority,
    t.created_at as "createdAt",
    t.user_id as "userId",
    u.name as "user_name"
  FROM tasks t
  JOIN users u ON t.user_id = u.id
  WHERE t.title ILIKE ${searchPattern} 
     OR u.name ILIKE ${searchPattern}
  ORDER BY 
    CASE 
      WHEN t.title ILIKE ${exactMatch} THEN 1
      WHEN t.title ILIKE ${startsWith} THEN 2
      WHEN t.title ILIKE ${searchPattern} THEN 3
      ELSE 4
    END,
    t.created_at DESC
  LIMIT ${parseInt(limit)}
`;

  // return results with query and count
  // hint: the test expects results array, query string, and count number

  res.status(200).json({
    // ... you need to return the response object
    results: searchResults,
    query: searchQuery,
    count: searchResults.length,
  });
}

module.exports = { getUserAnalytics, getUsersWithStats, searchTasks };
