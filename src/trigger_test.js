const hammingDistance = require("hamming");
const toArray = require("stream-to-array");
const PNG = require("png-js");
const gm = require("gm").subClass({ imageMagick: "7+" });
const fs = require("fs");
const colors = require("colors");
const path = require("path");
const glob = require("glob");

const {
  findMaximumCompatibleCombination,
} = require("./findMaximumCompatibleCombination.js");
const { config } = require("./getConfig.js");

// USE CONFIGURATION VARIABLE

const TRIGGER_TEST_VERBOSE = config.TRIGGER_TEST_VERBOSE;

const PIXEL_LENGTH = 4;
const SIMILARITY_TOLERANCE = 5;

function px(pixels, width, x, y) {
  return pixels[width * PIXEL_LENGTH * y + x * PIXEL_LENGTH];
}

function binaryToHex(s) {
  let output = "";
  for (let i = 0; i < s.length; i += 4) {
    const bytes = s.substr(i, 4);
    const decimal = parseInt(bytes, 2);
    const hex = decimal.toString(16);
    output += hex.toUpperCase();
  }
  return output;
}

const DEFAULT_HASH_SIZE = 8;

async function dhash_gen(_path) {
  return new Promise((resolve, reject) => {
    const height = DEFAULT_HASH_SIZE;
    const width = height + 1;

    gm(_path)
      .colorspace("GRAY")
      .resize(width, height, "!")
      .stream("png", (err, stream) => {
        if (err) {
          reject(err);
        } else {
          toArray(stream, (toArrayErr, arr) => {
            if (toArrayErr) {
              reject(toArrayErr);
            } else {
              const png = new PNG(Buffer.concat(arr));
              png.decode((pixels) => {
                let difference = "";
                for (let row = 0; row < height; row++) {
                  for (let col = 0; col < height; col++) {
                    const left = px(pixels, width, col, row);
                    const right = px(pixels, width, col + 1, row);
                    difference += left < right ? 1 : 0;
                  }
                }
                const hash = binaryToHex(difference);
                resolve(hash);
              });
            }
          });
        }
      });
  });
}

async function findFilesToDelete(files, originalFilePath, fileName) {
  // Create the compatibility map dynamically
  const compatibilityMap = {};

  // Initialize compatibility map entries for each file
  for (const file of files) {
    compatibilityMap[file] = {};
  }

  // Create a set to keep track of checked pairs
  const checkedPairs = new Set();

  for (let i = 0; i < files.length; i++) {
    const file1 = files[i];

    for (let j = i + 1; j < files.length; j++) {
      const file2 = files[j];

      // Check if the pair (file1, file2) or (file2, file1) has already been checked
      const pairKey1 = `${file1},${file2}`;
      const pairKey2 = `${file2},${file1}`;

      if (checkedPairs.has(pairKey1) || checkedPairs.has(pairKey2)) {
        // The pair has been checked, so use the stored value in the compatibility map
        compatibilityMap[file1][file2] = compatibilityMap[file2][file1];
      } else {
        // The pair has not been checked, perform the compatibility check
        const canBeTogetherResult = await trigger_test(file1, file2, fileName);
        compatibilityMap[file1][file2] = canBeTogetherResult;
        compatibilityMap[file2][file1] = canBeTogetherResult;

        // Add the pair to the set of checked pairs
        checkedPairs.add(pairKey1);
      }
    }
  }

  const compatibleCombination = findMaximumCompatibleCombination(
    compatibilityMap,
    files,
    originalFilePath
  );

  var compatibleCombinationSet = new Set(compatibleCombination);
  return files.filter((x) => !compatibleCombinationSet.has(x));
}

function getFiles(folder, originalFilePath) {
  const absolute_files = glob.sync(
    path.join(folder, "*.gif").replace(/\\/g, "/")
  );

  absolute_files.push(originalFilePath);

  return absolute_files;
}

async function trigger_test(path1, path2, fileName) {
  if (TRIGGER_TEST_VERBOSE)
    console.log(
      colors.bgBlue(fileName) +
        colors.gray(
          " : RUN TRIGGER TEST ON : " +
            path1.split(/(\\|\/)/g).pop() +
            " and " +
            path2.split(/(\\|\/)/g).pop()
        )
    );

  const originalHash = await dhash_gen(path1);
  const modifiedHash = await dhash_gen(path2);

  const distance = hammingDistance(modifiedHash, originalHash);

  if (TRIGGER_TEST_VERBOSE)
    console.log(
      colors.bgBlue(fileName) +
        colors.gray(
          " : Generated hashes : " +
            originalHash +
            " / " +
            modifiedHash +
            " | " +
            " Hexes distance : " +
            distance
        )
    );

  if (distance < SIMILARITY_TOLERANCE) {
    if (TRIGGER_TEST_VERBOSE)
      console.log(
        colors.bgBlue(fileName) + colors.red(" : NOT SAFE / Bot trigerred")
      );
    return false;
  } else {
    if (TRIGGER_TEST_VERBOSE)
      console.log(
        colors.bgBlue(fileName) + colors.green(" : SAFE / Bot not triggered")
      );
    return true;
  }
}

async function runTriggerTest(PATH_TO_CHECK, originalFilePath, fileName) {
  const files = getFiles(PATH_TO_CHECK, originalFilePath);

  // Find the files to delete
  const filesToDelete = await findFilesToDelete(
    files,
    originalFilePath,
    fileName
  );
  if (filesToDelete.length === 0)
    console.log(
      colors.bgGreen(
        fileName +
          " : No file to delete. All files are safe to be pushed on reddit."
      )
    );
  else {
    console.log(colors.bgBlue(fileName) + " : File deleted : " + filesToDelete);
    console.log(
      colors.bgGreen(
        fileName + " : All remaining files are safe to be pushed on reddit."
      )
    );
  }

  // Delete the files to delete (if there are ones)
  for (var k = 0; k < filesToDelete.length; k++) {
    const fileToDelete = filesToDelete[k];

    fs.unlinkSync(fileToDelete, (err) => {
      if (err) {
        throw err;
      }

      console.log(
        "Successfully deleted " + fileToDelete.split(/(\\|\/)/g).pop()
      );
    });
  }
}

module.exports = {
  runTriggerTest,
};
