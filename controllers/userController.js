const { userSchema } = require("../validation/userSchema.js");
const crypto = require("crypto");
const util = require("util");
const scrypt = util.promisify(crypto.scrypt);

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

async function register(req, res) {
  if (!req.body) req.body = {};
  const { error, value } = userSchema.validate(req.body, { abortEarly: false });
  if (error) return res.status(400).json();
  //const { name, email, password } = req.body;
  const hashedPassword = await hashPassword(value.password);
  const newUser = {
    name: value.name,
    email: value.email,
    hashedPassword,
  };
  global.users.push(newUser);
  global.user_id = newUser;
  res.status(201).json({
    name: newUser.name,
    email: newUser.email,
  });
}

async function logon(req, res) {
  const { email, password } = req.body;
  //find the first user where user.email matches the email from req.body
  //AND user.password matches the password from req.body
  const matchingUser = global.users.find((user) => {
    return user.email === email;
  });

  const goodCredentials =
    matchingUser &&
    (await comparePassword(password, matchingUser.hashedPassword));

  // replace matchingUser below with goodCredentials
  if (goodCredentials) {
    global.user_id = matchingUser;

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
