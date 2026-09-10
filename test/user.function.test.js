require("dotenv").config();
const request = require("supertest");
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const prisma = require("../db/prisma.js");
let agent;
let saveRes;
const { app, server } = require("../app.js");

beforeAll(async () => {
  //clear database
  await prisma.Task.deleteMany();
  await prisma.User.deleteMany();
  agent = request.agent(app);
});

afterAll(async () => {
  prisma.$disconnect();
  server.close();
});

describe("register a user", () => {
  let saveRes = null; // we'll declare this out here, so that we can reference it in several tests
  it("46. it creates the user entry", async () => {
    const newUser = {
      name: "John Deere",
      email: "jdeere@example.com",
      password: "Pa$$word20",
    };
    saveRes = await agent
      .post("/api/users/register")
      .send(newUser)
      .set("X-Recaptcha-Test", process.env.RECAPTCHA_BYPASS);
    //console.log(saveRes.body);
    expect(saveRes.status).toBe(201);
  });
  it("47. registration returns an object with the expected name", () => {
    expect(saveRes.body.user.name).toBe("John Deere");
  });
  it("48. the returned object includes a csrfToken", () => {
    expect(saveRes.body.csrfToken).toBeDefined();
  });
  it("49. you can logon as the newly registered user", async () => {
    const currentUser = {
      email: "jdeere@example.com",
      password: "Pa$$word20",
    };
    saveRes = await agent.post("/api/users/logon").send(currentUser);
    expect(saveRes.status).toBe(200);
  });
  it("50. verified that you are logged in: /api/tasks should not return a 401", async () => {
    const getReqSaveRes = await agent.get("/api/tasks");
    expect(getReqSaveRes.status).not.toBe(401);
  });
  it("51. verify that you can log out", async () => {
    saveRes = await agent
      .post("/api/users/logoff")
      .set("X-CSRF-TOKEN", saveRes.body.csrfToken)
      .send();
    expect(saveRes.status).toBe(200);
  });
  it("52. make sure that you are really logged out: /api/tasks should now return a 401", async () => {
    saveRes = await agent.get("/api/tasks");
    expect(saveRes.status).toBe(401);
  });
});
