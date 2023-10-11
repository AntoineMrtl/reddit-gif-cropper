const glob = require("glob");
const path = require("path");
const sharp = require("sharp");

function getFileName(filePath) {
  return path.basename(filePath, path.extname(filePath));
}

function randomUniform(x) {
  return Math.random() * x;
}

async function mirrorGIFs(INPUT_PATH, OUTPUT_PATH) {
  const gifFiles = glob.sync(
    path.join(INPUT_PATH, "*.gif").replace(/\\/g, "/")
  );

  for (const filename of gifFiles) {
    const output_path = path.join(
      OUTPUT_PATH,
      `${getFileName(filename)}_mirrored.gif`
    );
    const gif = await sharp(filename, { animated: true, pages: -1 });

    await gif.flop().toFile(output_path);
  }
}

async function shiftGif(
  fileName,
  filePath,
  OUTPUT_PATH,
  maxCropHorizontal,
  maxCropVertical
) {
  const output_path = path.join(OUTPUT_PATH, `${fileName}.gif`);
  const gif = sharp(filePath, { animated: true, pages: -1 });

  // GET GIF SIZE

  const metadata = await gif.metadata();
  const width = metadata.width;
  const height = metadata.pageHeight;

  // CROP GIF

  const cropX = Math.round(randomUniform(maxCropHorizontal) * width);
  const cropY = Math.round(randomUniform(maxCropVertical) * height);
  const cropWidth =
    width - Math.round(randomUniform(maxCropHorizontal) * width) - cropX;
  const cropHeight =
    height - Math.round(randomUniform(maxCropVertical) * height) - cropY;

  await gif
    .extract({ width: cropWidth, height: cropHeight, left: cropX, top: cropY })
    .toFile(output_path);
}

module.exports = { mirrorGIFs, shiftGif, getFileName };
