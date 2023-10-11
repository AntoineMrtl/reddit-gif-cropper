const fs = require("fs");
const path = require("path");
const watch = require("node-watch");
const colors = require("colors");

const { mirrorGIFs, shiftGif, getFileName } = require("./utils.js");
const { runTriggerTest } = require("./trigger_test.js");
const { config } = require("./getConfig.js");
const { validateLicenseKey } = require("./license.js");

// USE CONFIGURATION VARIABLE

const DEPOSIT_FOLDER_ABSOLUTE = config.DEPOSIT_FOLDER_ABSOLUTE;
const MULTIPLICATION_RATE = config.MULTIPLICATION_RATE;
const OUTPUT_FOLDER_ABSOLUTE = config.OUTPUT_FOLDER_ABSOLUTE;

const MAX_CROP_VERTICAL = config.MAX_CROP_VERTICAL;
const MAX_CROP_HORIZONTAL = config.MAX_CROP_HORIZONTAL;

const LICENSE_ID = config.LICENSE_ID;
const LICENSE_KEY = config.LICENSE_KEY;

const license = { id: LICENSE_ID, key: LICENSE_KEY };

// MAIN HANDLE FUNCTION

var processingImages = [];

async function handleGIFImport(gifPath) {
  let base_directory_name = getFileName(gifPath);
  let fileName = base_directory_name;

  // Try to create a directory
  let destinationPath = path.join(OUTPUT_FOLDER_ABSOLUTE, base_directory_name);
  let i = 0;
  let directory_name = base_directory_name;

  while (fs.existsSync(destinationPath)) {
    destinationPath = path.join(
      OUTPUT_FOLDER_ABSOLUTE,
      base_directory_name + i
    );
    directory_name = base_directory_name + i.toString();
    i += 1;
  }

  fs.mkdirSync(destinationPath);

  console.log(
    colors.bgBlue(fileName) +
      ` : New directory '${directory_name}' created. Starting shifting ${MULTIPLICATION_RATE} copies`
  );

  for (let gif = 0; gif < MULTIPLICATION_RATE; gif++) {
    // Create a cropped gif
    await shiftGif(
      gif,
      gifPath,
      destinationPath,
      MAX_CROP_HORIZONTAL,
      MAX_CROP_VERTICAL
    );
    console.log(
      colors.bgBlue(fileName) + ` : New gif successfully created (${gif}.gif)`
    );
  }
  console.log(
    colors.bgBlue(fileName) +
      " : Successfully created gifs. Starting mirroring."
  );

  await mirrorGIFs(destinationPath, destinationPath);
  console.log(
    colors.bgBlue(fileName) +
      " : Successfully mirrored gifs. Starting trigger test."
  );

  await runTriggerTest(destinationPath, gifPath, fileName);
  console.log(
    colors.bgBlue(fileName) + " : Successfully ran trigger test. End of task."
  );

  processingImages = processingImages.filter((element) => element !== gifPath);
}

function onFileDeposited(event, filename) {
  try {
    if (fs.existsSync(filename) && !processingImages.includes(filename)) {
      // handle gif deposit
      if (path.extname(filename).toLowerCase() === ".gif") {
        console.log("New gif detected at: " + filename);
        processingImages.push(filename);
        handleGIFImport(filename);
      }
    }
  } catch (error) {
    setTimeout(() => console.log(error), 100000);
  }
}

async function main() {
  // validate the license
  const licenseResult = await validateLicenseKey(license);
  if (!licenseResult.success) throw new Error("License cannot be verified.");

  console.log("Start looking for gifs in " + DEPOSIT_FOLDER_ABSOLUTE);
  watch(DEPOSIT_FOLDER_ABSOLUTE, { recursive: true }, onFileDeposited);
}

main();
// TOKEN TO DELETE : activ-735c89f8300c8857817ce5f675e1602av3
