function register(req, res) {
  const { name, email, password } = req.body;
  const newUser = { name: name, email: email, password: password };
  global.users.push(newUser);
  global.user_id = newUser;
  res.status(201).json({
    name: newUser.name,
    email: newUser.email,
  });
}

function logon(req, res) {
  const { email, password } = req.body;
  //find the first user where user.email matches the email from req.body
  //AND user.password matches the password from req.body
  const matchingUser = global.users.find((user) => {
    return user.email === email && user.password === password;
  });

  if (matchingUser) {
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
