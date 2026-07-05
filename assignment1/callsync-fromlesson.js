function syncFunc() {
  console.log("In syncFunc. No async operations here.");
  return "Returned from syncFunc.";
}

async function asyncCaller() {
  console.log("About to wait.");
  const result = await syncFunc();
  console.log(result);
  return "asyncCaller complete.";
}

console.log("Calling asyncCaller.");

const promise = asyncCaller();

console.log(`Got back a value of type ${typeof promise}`);

promise.then((resolvedValue) => {
  console.log("The promise resolves to:", resolvedValue);
});

console.log("Finished.");
