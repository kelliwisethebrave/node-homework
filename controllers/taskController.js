const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const prisma = require("../db/prisma.js");

// const taskCounter = (() => {
//   let lastTaskNumber = 0;
//   return () => {
//     lastTaskNumber += 1;
//     return lastTaskNumber;
//   };
// })();

//getOrderBy is a helper function that builds the orderBy object from query parameters
const getOrderBy = (query) => {
  const validSortFields = [
    "title",
    "priority",
    "createdAt",
    "id",
    "isCompleted",
  ];
  const sortBy = query.sortBy || "createdAt";
  const sortDirection = query.sortDirection === "asc" ? "asc" : "desc";

  if (validSortFields.includes(sortBy)) {
    return { [sortBy]: sortDirection };
  }
  return { createdAt: "desc" }; // default fallback
};

//use for functions that use an ID
//const taskId = parseInt(req.params?.id);

// if (!taskId) {
//   return res.status(400).json({
//     message: "The task ID passed is not valid.",
//   });
// }

async function create(req, res, next) {
  //validate the request body
  if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error)
    return res.status(400).json({
      message: error.message,
    });

  // you do your Joi validation, and you have a validated task object. Then:

  let task = null;

  try {
    task = await prisma.task.create({
      data: { ...value, userId: global.user_id },
      select: { title: true, isCompleted: true, id: true, priority: true },
    });
  } catch (err) {
    return next(err);
  }

  // You don't need a try/catch because the global error handler will handle the errors

  //create a task with an ID
  //store the current user's email in userId
  //const newTask = { id: taskCounter(), userId: global.user_id.email, ...value };
  //push the task into global.tasks
  //global.tasks.push(newTask);
  //return status 201
  //return the task without the userId
  //const { userId, ...sanitizedTask } = newTask; //this removes userId from a new object called sanitizedTask
  return res.status(201).json(task);
}

async function bulkCreate(req, res, next) {
  const { tasks } = req.body;

  //validate the tasks array

  if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
    return res.status(400).json({
      error: "Invalid request data. Expected an array of tasks",
    });
  }

  //validate all tasks before insertion

  const validTasks = [];
  for (const task of tasks) {
    const { error, value } = taskSchema.validate(task);
    if (error) {
      return res.status(400).json({
        error: "Validation failed",
        details: error.details,
      });
    }

    validTasks.push({
      title: value.title,
      isCompleted: value.isCompleted || false,
      priority: value.priority || "medium",
      userId: global.user_id,
    });
  }

  //use createMany for batch insertion
  try {
    const result = await prisma.task.createMany({
      data: validTasks,
      skipDuplicates: false,
    });

    res.status(201).json({
      message: "success!",
      tasksCreated: result.count,
      totalRequested: validTasks.length,
    });
  } catch (err) {
    return next(err);
  }
}

async function index(req, res) {
  //pagination
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  // validate page and limit
  if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1 || limit > 100) {
    return res.status(400).json({
      error: "Invalid pagination parameters.",
    });
  }

  const skip = (page - 1) * limit;

  const whereClause = { userId: global.user_id };

  if (req.query.find) {
    whereClause.title = {
      contains: req.query.find, // matches %find% pattern
      mode: "insensitive", // case-insensitive search ILIKE in PostgreSQL
    };
  }

  if (req.query.isCompleted !== undefined) {
    whereClause.isCompleted = req.query.isCompleted === "true";
  }

  if (
    req.query.priority &&
    ["low", "medium", "high"].includes(req.query.priority)
  ) {
    whereClause.priority = req.query.priority;
  }

  if (req.query.min_date || req.query.max_date) {
    whereClause.createdAt = {};

    if (req.query.min_date) {
      whereClause.createdAt.gte = new Date(req.query.min_date);
    }

    if (req.query.max_date) {
      whereClause.createdAt.lte = new Date(req.query.max_date);
    }
  }

  //get tasks with pagination and eager loading

  const tasksRaw = await prisma.task.findMany({
    where: whereClause, //only the tasks for  this user
    select: {
      id: true,
      title: true,
      isCompleted: true,
      priority: true,
      createdAt: true,
      user: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    skip: skip,
    take: limit,
    orderBy: getOrderBy(req.query), // default behavior { createdAt: "desc" }
  });

  const tasks = tasksRaw.map((task) => ({
    // copy the task's fields
    // add User: task.user

    ...task,
    User: task.user,
  }));

  //get total count for pagination metadata
  const totalTasks = await prisma.task.count({
    where: whereClause,
  });

  // Build pagination object with complete metadata
  // Hint: the test expects page, limit, total, pages, hasNext, hasPrev
  // Use Math.ceil() to calculate pages, and compare page * limit with total for hasNext

  const pagination = {
    page,
    limit,
    total: totalTasks,
    pages: Math.ceil(totalTasks / limit),
    hasNext: page * limit < totalTasks,
    hasPrev: page > 1,
  };

  //return tasks with pagination information
  return res.status(200).json({
    // ... you need to return tasks and pagination
    tasks,
    pagination,
  });
}

async function show(req, res, next) {
  //read req.params.id
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  let task = null;
  try {
    task = await prisma.task.findUnique({
      where: {
        id_userId: {
          id: taskId,
          userId: global.user_id,
        },
      },
      select: { title: true, isCompleted: true, id: true },
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    } else {
      return next(err); // pass other errors to the global error handler
    }
  }

  if (!task) {
    return res.status(404).json({
      message: "No matching task exists.",
    });
  }

  return res.status(200).json(task);
}

async function update(req, res, next) {
  //validate the patch body
  if (!req.body) req.body = {};
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(400).json({
      message: error.message,
    });

  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  // assuming that value contains the validated change coming back from Joi, and that
  // you have a valid req.params.id:
  let task = null;
  try {
    task = await prisma.task.update({
      data: value,
      where: {
        id_userId: {
          id: taskId,
          userId: global.user_id,
        },
      },
      select: { title: true, isCompleted: true, id: true },
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    } else {
      return next(err); // pass other errors to the global error handler
    }
  }

  return res.status(200).json(task);
}

async function deleteTask(req, res, next) {
  //read req.params.id (convert req.params.id to a number)
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  let task = null;
  try {
    task = await prisma.task.delete({
      where: {
        id_userId: {
          id: taskId,
          userId: global.user_id,
        },
      },
      select: { title: true, isCompleted: true, id: true },
    });
  } catch (err) {
    if (err.code === "P2025") {
      return res.status(404).json({ message: "The task was not found." });
    } else {
      return next(err); // pass other errors to the global error handler
    }
  }

  return res.status(200).json(task);
}

module.exports = { create, bulkCreate, index, show, update, deleteTask };
