import Yargs from "yargs/yargs.js";

const yargs = new Yargs()
  .usage("Usage: $0 -x num -y num")
  .describe("help", "Show help.")
  .describe("version", "Show version number.")
  .option("x", {
    alias: "xValue",
    describe: "The x value.",
    demandOption: "The x value is required.",
    type: "number",
    nargs: 1
  })
  .option("y", {
    alias: "yValue",
    describe: "The y value.",
    demandOption: "The y value is required.",
    type: "number",
    nargs: 1
  })
  .example(
    "$0 -x 5 -y 6",
    "Calculates the result of subtracting x from y."
  );

function run(args) {
  const { x, y } = yargs.parse(args);
  console.log(`The result is ${y - x}`);
}

export {
  run
};
