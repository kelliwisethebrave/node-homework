const { userSchema } = require("../validation/userSchema.js");
const { taskSchema, patchTaskSchema } = require("../validation/taskSchema.js");

describe("user object validation tests", () => {
  it("1. doesn't permit a trivial password", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com", password: "password" },
      { abortEarly: false },
    );
    // expect(() statement needed here
    expect(
      error.details.find((detail) => detail.context.key == "password"),
    ).toBeDefined();
  });
  it("2. user schema requires that an email be specified", () => {
    const { error } = userSchema.validate(
      { name: "Bob", password: "Pa$$word20" }, //no email instead of an empty email
      { abortEarly: false },
    );
    // expect(() statement needed here
    expect(
      error.details.find((detail) => detail.context.key == "email"),
    ).toBeDefined();
  });
  it("3. user schema does not accept an invalid email", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob", password: "Pa$$word20" },
      { abortEarly: false },
    );
    // expect(() statement needed here
    expect(
      error.details.find((detail) => detail.context.key == "email"),
    ).toBeDefined();
  });
  it("4. user schema requires a password", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com" },
      { abortEarly: false },
    );
    // expect(() statement needed here
    expect(
      error.details.find((detail) => detail.context.key == "password"),
    ).toBeDefined();
  });
  it("5. user schema requires a name", () => {
    const { error } = userSchema.validate(
      { email: "bob@sample.com", password: "Pa$$word20" },
      { abortEarly: false },
    );
    // expect(() statement needed here
    expect(
      error.details.find((detail) => detail.context.key == "name"),
    ).toBeDefined();
  });
  it("6. name must be valid", () => {
    const { error } = userSchema.validate(
      { name: "B", email: "bob@sample.com", password: "Pa$$word20" },
      { abortEarly: false },
    );
    // expect(() statement needed here
    expect(
      error.details.find((detail) => detail.context.key == "name"),
    ).toBeDefined();
  });
  it("7. if validation is performed on a valid user object, error comes back falsy", () => {
    const { error } = userSchema.validate(
      { name: "Bob", email: "bob@sample.com", password: "Pa$$word20" },
      { abortEarly: false },
    );
    // expect(() statement needed here
    expect(error).toBeFalsy();
  });
});

describe("taskSchema validation tests", () => {
  it("8. task schema requires a title", () => {
    const { error } = taskSchema.validate(
      { isCompleted: false },
      { abortEarly: false },
    );
    // expect(() statement needed here
    expect(
      error.details.find((detail) => detail.context.key == "title"),
    ).toBeDefined();
  });
  it("9. if an isCompleted value is specified, it must be valid", () => {
    const { error } = taskSchema.validate(
      { title: "A sample task", isCompleted: "bob" },
      { abortEarly: false },
    );
    expect(
      error.details.find((detail) => detail.context.key == "isCompleted"),
    ).toBeDefined();
  });
  it("10. if an isCompleted value is not specified, but the rest of the object is valid, a default of false is provided by validation", () => {
    const { value } = taskSchema.validate(
      { title: "A sample task" },
      { abortEarly: false },
    );
    expect(value.isCompleted).toBe(false);
  });
  it("11. if isCompleted in the provided object has the value true, it remains true after validation", () => {
    const { value } = taskSchema.validate(
      { title: "A sample task", isCompleted: true },
      { abortEarly: false },
    );
    expect(value.isCompleted).toBe(true);
  });
});

describe("patchTaskSchema validation tests", () => {
  it("12. patchTaskSchema does not require a title", () => {
    const { error } = patchTaskSchema.validate(
      { isCompleted: true },
      { abortEarly: false },
    );
    expect(error).toBeFalsy();
  });
  it("13. if no value is provided for isCompleted, this remains undefined in the returned value", () => {
    const { value } = patchTaskSchema.validate(
      { title: "A sample task" },
      { abortEarly: false },
    );
    expect(value.isCompleted).toBe(undefined);
  });
});
