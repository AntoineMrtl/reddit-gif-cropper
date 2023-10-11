const { readFileSync } = require("fs");
const path = require("path");

// import configuration file

const configContent = readFileSync(
  process.pkg
    ? path.join(process.argv[0], "../", "config.json")
    : path.join("config.json"),
  "utf-8"
);

const config = JSON.parse(configContent);

// check for config file integrity

if (config.DEPOSIT_FOLDER_ABSOLUTE === undefined) {
  throw new Error("DEPOSIT_FOLDER_ABSOLUTE not in config file.");
} else if (config.OUTPUT_FOLDER_ABSOLUTE === undefined) {
  throw new Error("OUTPUT_FOLDER_ABSOLUTE not in config file.");
} else if (config.MULTIPLICATION_RATE === undefined) {
  throw new Error("MULTIPLICATION_RATE not in config file.");
} else if (config.TRIGGER_TEST_VERBOSE === undefined) {
  throw new Error("TRIGGER_TEST_VERBOSE not in config file.");
} else if (config.LICENSE_ID === undefined) {
  throw new Error("LICENSE_ID not in config file.");
} else if (config.LICENSE_KEY === undefined) {
  throw new Error("LICENSE_KEY not in config file.");
}

module.exports = { config };
