const fetch = require("node-fetch");
const { machineId } = require("node-machine-id");
const readline = require("readline").createInterface({
  input: process.stdin,
  output: process.stdout,
});
const chalk = require("chalk");

const KEYGEN_ACCOUNT_ID = "87d7e055-3b10-4ff7-901d-b05239db6163"; // test : b06af86d-31ac-449c-a921-499521f22a2c

function askForToken() {
  return new Promise((resolve) => {
    readline.question(
      chalk.cyan(
        "License is not activated, please enter the activation token : "
      ),
      (token) => {
        readline.close();
        resolve(token);
      }
    );
  });
}

// Validate a license key for the product. Returns the validation result and a license object.
async function validateLicenseKey(license) {
  const fingerprint = await machineId();

  // Attempts to validate the license key with the current machine fingerprint
  const validation = await fetch(
    `https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/licenses/actions/validate-key`,
    {
      method: "POST",
      headers: {
        "content-type": "application/json",
        accept: "application/json",
      },
      body: JSON.stringify({
        meta: {
          key: license.key,
          scope: { fingerprint: fingerprint },
        },
      }),
    }
  );

  const { meta } = await validation.json();

  // If return VALID code, then return success
  if (meta.code === "VALID") {
    console.log(chalk.green("Successfully validate the license."));
    return { success: true };
  }

  // If return NO_MACHINE code, the license cannot be validate because the machine isn't activate for the license
  if (meta.code === "NO_MACHINE") {
    const token = await askForToken();

    // Try to activate machine using token
    await activateMachine(token, license);

    // Try again to validate license
    return await validateLicenseKey(license);
  }

  // Else, log the error and return false
  console.log(chalk.red(validation.status), meta);
  return { success: false };
}

// Activate a machine using a specific token for a given license
async function activateMachine(token, license) {
  const fingerprint = await machineId();

  // Attempt to activate the current machine for the license, using the
  // license ID that we received from the validation response and the
  // current machine's fingerprint.
  const activation = await fetch(
    `https://api.keygen.sh/v1/accounts/${KEYGEN_ACCOUNT_ID}/machines`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/vnd.api+json",
        Accept: "application/vnd.api+json",
      },
      body: JSON.stringify({
        data: {
          type: "machines",
          attributes: {
            fingerprint: fingerprint,
          },
          relationships: {
            license: {
              data: { type: "licenses", id: license.id },
            },
          },
        },
      }),
    }
  );

  // If return the 201 CREATED Code, return true
  if (activation.status === 201) {
    console.log(chalk.green("Successfully activated this machine."));
    return { success: true };
  }

  // Else, log the error and return false
  const { errors } = await activation.json();
  console.log(chalk.red(activation.status), errors);
  return { success: false };
}

module.exports = { validateLicenseKey };
