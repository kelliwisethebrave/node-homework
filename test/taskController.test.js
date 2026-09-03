require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const prisma = require("../db/prisma.js");
const httpMocks = require("node-mocks-http");

const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion.js");
const { EventEmitter } = require("events");

const {
  index,
  show,
  create,
  update,
  deleteTask,
} = require("../controllers/taskController.js");

// a few useful globals
let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;
let saveTaskId = null;

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
  user1 = await prisma.User.create({
    data: { name: "Bob", email: "bob@sample.com", hashedPassword: "nonsense" },
  });
  user2 = await prisma.User.create({
    data: {
      name: "Alice",
      email: "alice@sample.com",
      hashedPassword: "nonsense",
    },
  });
});

afterAll(() => {
  prisma.$disconnect();
});

describe("testing task creation", () => {
  it("14. cant create a task without a user id", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    // be sure you pass the event emitter class
    expect.assertions(1);
    try {
      await waitForRouteHandlerCompletion(create, req, saveRes);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });
  it("15. cant create a task with a bogus user id", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    req.user = { id: 999999 };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    // be sure you pass the event emitter class
    expect.assertions(1);
    try {
      await waitForRouteHandlerCompletion(create, req, saveRes);
    } catch (e) {
      expect(e.name).toBe("PrismaClientKnownRequestError");
    }
  });
  it("16. if you have a valid user id, create() succeeds and res.StatusCode should be 201", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });
    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    // be sure you pass the event emitter class
    await waitForRouteHandlerCompletion(create, req, saveRes);
    expect(saveRes.statusCode).toBe(201);
  });
  it("17. the object returned from the create() call has the expected title", () => {
    saveData = saveRes._getJSONData();
    expect(saveData.title).toBe("first task");
  });
  it("18. the object has the right value for isCompleted", () => {
    expect(saveData.isCompleted).toBe(false);
  });
  it("19. the object does not have any value for userId", () => {
    saveTaskId = saveData.id;
    expect(saveData.userId).toBeUndefined();
  });
});

describe("test getting created tasks", () => {
  it("20. can't get a list of tasks without a user id", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    // be sure you pass the event emitter class
    expect.assertions(1);
    try {
      await waitForRouteHandlerCompletion(index, req, saveRes);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });
  it("21. if you use user1's id on index(), the call returns a 200 status", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(index, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });
  it("22. The returned object has a tasks array of length 1", async () => {
    saveData = saveRes._getJSONData(); // reusing saveRes
    expect(saveData.tasks).toHaveLength(1);
  });
  it("23. the title in the first array object is as expected", () => {
    expect(saveData.tasks[0].title).toBe("first task");
  });
  it("24. the first array object does not contain a userId", () => {
    expect(saveData.tasks[0].userId).toBeUndefined();
  });
  it("25. if you get the list of tasks using the userId from user2, you get a 404", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.user = { id: user2.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(index, req, saveRes);
    expect(saveRes.statusCode).toBe(404);
  });
  it("26. you can retrieve the created task using show()", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.params = { id: saveTaskId.toString() };
    req.user = { id: user1.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(show, req, saveRes);
    expect(saveRes.statusCode).toBe(200);
  });
  it("27. user2 can't retrieve this task entry. you should get a 404", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });
    req.params = { id: saveTaskId.toString() };
    req.user = { id: user2.id };
    saveRes = httpMocks.createResponse({ eventEmitter: EventEmitter });
    await waitForRouteHandlerCompletion(show, req, saveRes);
    expect(saveRes.statusCode).toBe(404);
  });
});
