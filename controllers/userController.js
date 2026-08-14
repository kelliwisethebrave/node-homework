const { userSchema } = require("../validation/userSchema.js");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

const prisma = require("../db/prisma.js");

//helper functions

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function comparePassword(inputPassword, storedHash) {
  const [salt, key] = storedHash.split(":");
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = await scrypt(inputPassword, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}

async function register(req, res, next) {
  // Do the Joi validation, so that value contains the user entry you want.
  if (!req.body) req.body = {};
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  if (error)
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });

  // hash the password, and put it in value.hashedPassword
  //const hashedPassword = await hashPassword(value.password);
  value.hashedPassword = await hashPassword(value.password);
  // delete value.password as that doesn't get stored
  delete value.password; // not necessary since the provided code "deletes" it from what Prisma gets

  const { name, email, hashedPassword } = value;

  let user = null;
  try {
    user = await prisma.user.create({
      data: { name, email, hashedPassword },
      select: { name: true, email: true, id: true }, //specify the column values to return
    });
  } catch (err) {
    if (err.name === "PrismaClientKnownRequestError" && err.code === "P2002") {
      return res.status(400).json({
        message: "Email already registered with a user.",
      });
    } else {
      return next(err); //the error handler takes care of other errors
    }
  }

  // otherwise register succeeded, so set global.user_id with user.id, and do the
  // appropriate res.status().json().

  const newUser = user;

  global.user_id = newUser.id;
  res.status(201).json({
    name: newUser.name,
    email: newUser.email,
  });
}

async function logon(req, res) {
  let { email, password } = req.body;

  if (!email || !password) {
    return res.status(401).json({ message: "Authentication required." });
  }

  email = email.toLowerCase(); // Joi validation always converts the email to lowercase
  //but you don't want logon to fail if the user types mixed case
  const user = await prisma.user.findUnique({ where: { email } });
  // also Prisma findUnique can't do a case insensitive search

  //find the first user where user.email matches the email from req.body
  //AND user.password matches the password from req.body
  //const matchingUser = global.users.find((user) => {
  //  return user.email === email;
  //});

  const matchingUser = user;

  const goodCredentials =
    matchingUser &&
    (await comparePassword(password, matchingUser.hashedPassword));

  // replace matchingUser below with goodCredentials
  if (goodCredentials) {
    global.user_id = matchingUser.id;

    res.status(200).json({
      name: matchingUser.name,
      email: matchingUser.email,
    });
  } else {
    res.status(401).json({ message: "Authentication required." });
  }
}

async function show(req, res) {
  const userId = parseInt(req.params.id);

  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      Task: {
        where: { isCompleted: false },
        select: {
          id: true,
          title: true,
          priority: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  res.status(200).json(user);
}

function logoff(req, res) {
  global.user_id = null;
  res.status(200).json({});
}

module.exports = {
  register,
  logon,
  show,
  logoff,
};
