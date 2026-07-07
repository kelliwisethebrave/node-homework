# Node.js Fundamentals

## What is Node.js?

Node.js is a way to run JavaScript outside the browser, allowing us to write our backend in JavaScript and have it run either locally or on a server.

## How does Node.js differ from running JavaScript in the browser?

Node.js differs from running JavaScript in the browser by allowing us to do things that JavaScript in the browser can't do, such as getting data from files and making changes to them, injecting variables from env files in a secure way, and using backend libraries. JavaScript in the browser is limited to what is directly in the browser, including the DOM and browser APIs.

## What is the V8 engine, and how does Node use it?

The V8 engine is a tool that originated in Google Chrome, which takes JavaScript and translates it into instructions that a computer ounderstands. Node uses it to run JavaScript and add extra functionality like accessing files and networks.

## What are some key use cases for Node.js?

Some of the key use cases for Node.js include interacting with APIs and servers in ways that require authentication, running terminal commands to automate tasks, update real-time applications instantly, and processing files with tools and scripts.

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

The difference between CommonJS and ES Modules is that CommonJS uses require() and module.exports, whereas ES Modules uses import and export. CommonJS loads synchronously, whereas ES Modules loads asynchronously. CommonJS is older, while ES Modules is newer, though both are supported by Node.js.

**CommonJS (default in Node.js):**

```js
subtractfile;
function subtract(a, b) {
  return a - b;
}

module.exports = { subtract };

appfile;
const { subtract } = require("./subtractfile");

console.log(subtract(3, 1));
```

**ES Modules (supported in modern Node.js):**

```js
subtractfile;
export function subtract(a, b) {
  return a - b;
}

appfile;
import { subtract } from "./subtractfile";

console.log(subtract(3, 1));
```
