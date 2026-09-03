const waitForRouteHandlerCompletion = async (func, reg, res) => {
  let next;
  const promise = new Promise((resolve, reject) => {
    next = jest.fn((error) => {
      if (error) return reject(error);
      resolve();
    });
    res.on("finish", () => {
      resolve();
    });
  });
  await func(feq, res, next);
  await promise;
  return next;
};

module.exports = waitForRouteHandlerCompletion;
