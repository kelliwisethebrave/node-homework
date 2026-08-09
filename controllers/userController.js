const { userSchema } = require("../validation/userSchema.js");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

const pool = require("../db/pg-pool.js");

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
  if (!req.body) req.body = {};
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  if (error)
    return res.status(400).json({
      message: "Validation failed",
      details: error.details,
    });

  let user = null;

  //const hashedPassword = await hashPassword(value.password);
  value.hashed_password = await hashPassword(value.password);
  //const newUser = {
  //  name: value.name,
  //  email: value.email,
  //  hashedPassword,
  //};

  //global.users.push(newUser);
  try {
    user = await pool.query(
      `INSERT INTO users (email, name, hashed_password) VALUES ($1, $2, $3) RETURNING id, email, name`,
      [value.email, value.name, value.hashed_password],
    ); //note that you use a parameterized query
  } catch (e) {
    //the email might already be registered
    if (e.code === "23505") {
      // this means the unique constraint for email was violated
      // here you return the 400 and the error message.  Use a return statement, so that
      // you don't keep going in this function
      return res.status(400).json({
        message: "Email already registered with a user.",
      });
    }
    return next(e); // all other errors get passed to the error handler
  } // otherwise user now contains the new user.  You can return a 201 and the appropriate
  // object.  Be sure to also set global.user_id with the id of the user record you just created.

  const newUser = user.rows[0];

  global.user_id = newUser.id;
  res.status(201).json({
    name: newUser.name,
    email: newUser.email,
  });
}

async function logon(req, res) {
  const { email, password } = req.body;
  //find the first user where user.email matches the email from req.body
  //AND user.password matches the password from req.body
  //const matchingUser = global.users.find((user) => {
  //  return user.email === email;
  //});

  //this replaces .find() above
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);

  const matchingUser = result.rows[0];

  const goodCredentials =
    matchingUser &&
    (await comparePassword(password, matchingUser.hashed_password));

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

function logoff(req, res) {
  global.user_id = null;
  res.status(200).json({});
}

module.exports = {
  register,
  logon,
  logoff,
};
