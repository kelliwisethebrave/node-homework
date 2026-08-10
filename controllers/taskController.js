const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const prisma = require("../db/prisma.js");

// const taskCounter = (() => {
//   let lastTaskNumber = 0;
//   return () => {
//     lastTaskNumber += 1;
//     return lastTaskNumber;
//   };
// })();

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
      select: { title: true, isCompleted: true, id: true },
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

async function index(req, res) {
  //find the tasks owned by the logged-in user
  //const userTasks = global.tasks.filter((task) => {
  //  return task.userId === global.user_id.email;
  //});

  const tasks = await prisma.task.findMany({
    where: {
      userId: global.user_id, //only the tasks for this user
    },
    select: { title: true, isCompleted: true, id: true },
  });

  //return 404 if this user has no tasks

  const userTasks = tasks;
  if (userTasks.length === 0) {
    return res.status(404).json({
      message: "User has no tasks.",
    });
  }
  //return those tasks without userId
  //const sanitizedUserTasks = userTasks.map((task) => {
  //  const { userId, ...sanitizedTask } = task;
  //  return sanitizedTask;
  //});

  return res.status(200).json(userTasks);
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
      where: { userId: global.user_id, id: taskId },
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

  const id = parseInt(req.params?.id);

  if (!id) {
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
        id,
        userId: global.user_id,
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
        id: taskId,
        userId: global.user_id,
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

module.exports = { create, index, show, update, deleteTask };
