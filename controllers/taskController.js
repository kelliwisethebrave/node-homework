const { taskSchema, patchTaskSchema } = require("../validation/taskSchema");

const taskCounter = (() => {
  let lastTaskNumber = 0;
  return () => {
    lastTaskNumber += 1;
    return lastTaskNumber;
  };
})();

//use for functions that use an ID
//const taskId = parseInt(req.params?.id);

// if (!taskId) {
//   return res.status(400).json({
//     message: "The task ID passed is not valid.",
//   });
// }

function create(req, res) {
  //validate the request body
  if (!req.body) req.body = {};
  const { error, value } = taskSchema.validate(req.body, { abortEarly: false });
  if (error)
    return res.status(400).json({
      message: error.message,
    });
  //create a task with an ID
  //store the current user's email in userId
  const newTask = { id: taskCounter(), userId: global.user_id.email, ...value };
  //push the task into global.tasks
  global.tasks.push(newTask);
  //return status 201
  //return the task without the userId
  const { userId, ...sanitizedTask } = newTask; //this removes userId from a new object called sanitizedTask
  return res.status(201).json(sanitizedTask);
}

function index(req, res) {
  //find the tasks owned by the logged-in user
  const userTasks = global.tasks.filter((task) => {
    return task.userId === global.user_id.email;
  });

  //return 404 if this user has no tasks

  if (userTasks.length === 0) {
    return res.status(404).json({
      message: "User has no tasks.",
    });
  }
  //return those tasks without userId
  const sanitizedUserTasks = userTasks.map((task) => {
    const { userId, ...sanitizedTask } = task;
    return sanitizedTask;
  });

  return res.status(200).json(sanitizedUserTasks);
}

function show(req, res) {
  //read req.params.id
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  //find a task with that ID and the current user's email
  const matchingTask = global.tasks.find((task) => {
    return task.id === taskId && task.userId === global.user_id.email;
  });
  //return 404 if no matching task exists

  if (!matchingTask) {
    return res.status(404).json({
      message: "No matching task exists.",
    });
  }
  //return the task without userId
  const { userId, ...sanitizedTask } = matchingTask; //this removes userId from a new object called sanitizedTask

  return res.status(200).json(sanitizedTask);
}

function update(req, res) {
  //validate the patch body
  if (!req.body) req.body = {};
  const { error, value } = patchTaskSchema.validate(req.body, {
    abortEarly: false,
  });
  if (error)
    return res.status(400).json({
      message: error.message,
    });

  //read req.params.id (convert req.params.id to a number)
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  //find a task with that ID and the current user's email
  const matchingTask = global.tasks.find((task) => {
    return task.id === taskId && task.userId === global.user_id.email;
  });

  //merge the validated patch fields into the stored task
  if (!matchingTask) {
    return res.status(404).json({
      message: "No matching task exists.",
    });
  }

  Object.assign(matchingTask, value);

  //return the updated task without userId
  const { userId, ...sanitizedTask } = matchingTask; //this removes userId from a new object called sanitizedTask

  return res.status(200).json(sanitizedTask);
  //use this pattern to merge patch fields:
  //Object.assign(task, value);
}

function deleteTask(req, res) {
  //read req.params.id (convert req.params.id to a number)
  const taskId = parseInt(req.params?.id);

  if (!taskId) {
    return res.status(400).json({
      message: "The task ID passed is not valid.",
    });
  }

  //find the task index for that ID and the logged-in user's email
  const index = global.tasks.findIndex((task) => {
    return task.id === taskId && task.userId === global.user_id.email;
  });
  //return 404 if no matching task exists
  if (index === -1) {
    return res.status(404).json({
      message: "No matching task exists.",
    });
  }
  //remove that task from global.tasks
  //const removed = global.tasks.splice(index, 1);
  const [deletedTask] = global.tasks.splice(index, 1);
  //return the deleted task with status 200 without userId
  const { userId, ...sanitizedTask } = deletedTask; //this removes userId from a new object called sanitizedTask

  return res.status(200).json(sanitizedTask);
}

module.exports = { create, index, show, update, deleteTask };
