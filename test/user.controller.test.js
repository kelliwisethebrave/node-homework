require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion.js");
const prisma = require("../db/prisma.js");
const httpMocks = require("node-mocks-http");
const { register, logoff, logon } = require("../controllers/userController.js");
const jwtMiddleware = require("../middleware/jwtMiddleware.js");
const jwt = require("jsonwebtoken");
const { EventEmitter } = require("events");

// a few useful globals
let saveRes = null;
let saveData = null;
let req;

const cookie = require("cookie");

function MockResponseWithCookies() {
  const res = httpMocks.createResponse({ eventEmitter: EventEmitter });
  res.cookie = (name, value, options = {}) => {
    const serialized = cookie.serialize(name, String(value), options);
    let currentHeader = res.getHeader("Set-Cookie");
    if (currentHeader === undefined) {
      currentHeader = [];
    }
    currentHeader.push(serialized);
    res.setHeader("Set-Cookie", currentHeader);
  };
  return res;
}

beforeAll(async () => {
  // clear database
  await prisma.Task.deleteMany(); // delete all tasks
  await prisma.User.deleteMany(); // delete all users
});

afterAll(() => {
  prisma.$disconnect();
});

let jwtCookie;

describe("testing logon, register, and logoff", () => {
  it("33. A user can be registered", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { name: "Bob", email: "bob@sample.com", password: "Pa$$word20" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(register, req, saveRes);
    expect(saveRes.statusCode).toBe(201); // success!
  });
  it("34. the user can logon", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { email: "bob@sample.com", password: "Pa$$word20" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(logon, req, saveRes);
    expect(saveRes.statusCode).toBe(200); // success!
  });
  it("35. a string in the cookie array starts with `jwt=`", () => {
    const setCookieArray = saveRes.get("Set-Cookie");
    const match = setCookieArray.find((str) => str.startsWith("jwt="));
    expect(match).toBeDefined();
  });
  it("36. that string contains HttpOnly", () => {
    const setCookieArray = saveRes.get("Set-Cookie");
    const match = setCookieArray.find((str) => str.startsWith("jwt="));
    //const HttpOnly = "HttpOnly";
    //const result = match.includes(HttpOnly);
    //expect(result).toBeTruthy();
    expect(match).toContain("HttpOnly");
  });
  it("37. the returned data from the register has the expected name", () => {
    saveData = saveRes._getJSONData();
    expect(saveData.name).toBe("Bob");
  });
  it("38. the returned data contains a csrfToken", () => {
    expect(saveData.csrfToken).toBeDefined();
  });
  it("39. you can now logoff", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(logoff, req, saveRes);
    expect(saveRes.statusCode).toBe(200); // success!
  });
  it("40. the logoff clears the cookie", () => {
    const setCookieArray = saveRes.get("Set-Cookie");
    jwtCookie = setCookieArray.find((str) => str.startsWith("jwt="));
    expect(jwtCookie).toContain("Jan 1970");
  });
  it("41. a logon attempt with a bad password returns a 401", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { email: "bob@sample.com", password: "badpassword" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(logon, req, saveRes);
    expect(saveRes.statusCode).toBe(401); // expected authentication failure
  });
  it("42. you can't register with an email that is already registered", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { name: "Bob", email: "bob@sample.com", password: "Pa$$word20" },
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(register, req, saveRes);
    expect(saveRes.statusCode).toBe(400); // expect failure
  });
});

describe("testing JWT middleware", () => {
  it("61. jwtMiddleware returns a 401 if the JWT cookie is not present in the req", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });
    saveRes = MockResponseWithCookies();
    await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes);
    expect(saveRes.statusCode).toBe(401);
  });
  it("62. returns a 401 if the JWT is invalid", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });
    saveRes = MockResponseWithCookies();
    const jwtCookie = jwt.sign({ id: 5, csrfToken: "badToken" }, "badSecret", {
      expiresIn: "1h",
    });
    req.cookies = { jwt: jwtCookie };
    await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes);
    expect(saveRes.statusCode).toBe(401);
  });
  it("63. returns a 401 if the JWT is valid but the CSRF token isn't", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
    });
    saveRes = MockResponseWithCookies();
    const jwtCookie = jwt.sign(
      { id: 5, csrfToken: "badToken" },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );
    if (!req.headers) {
      req.headers = {};
    }
    req.headers["X-CSRF-TOKEN"] = "goodtoken";
    req.cookies = { jwt: jwtCookie };
    await waitForRouteHandlerCompletion(jwtMiddleware, req, saveRes);
    expect(saveRes.statusCode).toBe(401);
  });
  it("64. calls next() if both the token and the jwt are good", async () => {
    req = httpMocks.createRequest({
      method: "POST",
    });
    saveRes = MockResponseWithCookies();
    const jwtCookie = jwt.sign(
      { id: 5, csrfToken: "goodtoken" },
      process.env.JWT_SECRET,
      {
        expiresIn: "1h",
      },
    );
    if (!req.headers) {
      req.headers = {};
    }
    req.headers["X-CSRF-TOKEN"] = "goodtoken";
    req.cookies = { jwt: jwtCookie };
    const next = await waitForRouteHandlerCompletion(
      jwtMiddleware,
      req,
      saveRes,
    );
    expect(next).toHaveBeenCalled();
  });
  it("65. if both the token and the jwt are good, req.user.id has the appropriate value", () => {
    expect(req.user.id).toBe(5);
  });
});
