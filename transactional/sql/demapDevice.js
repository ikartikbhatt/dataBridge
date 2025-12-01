const dbConfig = require("../../config/dbConfig.js");
const oracledb = require("oracledb");
const chalk = require("chalk");
const {getAgentCodes} = require("../helper/userHelper.js");

async function demapDevice() {
  console.log(chalk.green.bold("=== DEMAP AGENT DEVICE ==="));

  try {
    // 1️⃣ CONNECT TO DATABASE
    const connection = await oracledb.getConnection(dbConfig);
    console.log(chalk.blue.bold("=== DATABASE CONNECTED SUCCESSFULLY ==="));

    // 2️⃣ GET AGENT CODES
    const agentCodes = await getAgentCodes();
    console.log(chalk.yellow("\nSTEP 1: Updating status to 5 in USER_MASTER..."));

    // -------------------------------
    // STEP 1 — UPDATE USER_MASTER
    // -------------------------------

    const bindUser = {};
    const placeholdersUser = agentCodes
      .map((code, i) => {
        bindUser[`code${i}`] = code;
        return `:code${i}`;
      })
      .join(",");

    const updateQuery = `
        UPDATE USER_MASTER
        SET STATUS = '5'
        WHERE USERNAME IN (${placeholdersUser})
    `;

    await connection.execute(updateQuery, bindUser, { autoCommit: true });
    console.log(chalk.green("✔ Status updated successfully."));

    // -------------------------------
    // STEP 2 — GET AGENT_USERID
    // -------------------------------

    console.log(chalk.yellow("\nSTEP 2: Fetching AGENT_USERID from AGENT_USER_MASTER..."));

    const bindAgent = {};
    const placeholdersAgent = agentCodes
      .map((code, i) => {
        bindAgent[`code${i}`] = code;
        return `:code${i}`;
      })
      .join(",");

    const agentUserQuery = `
        SELECT AGENT_USERID
        FROM AGENT_USER_MASTER
        WHERE AGENT_CODE IN (${placeholdersAgent})
    `;

    const agentUserResult = await connection.execute(agentUserQuery, bindAgent);

    const agentUserIds = agentUserResult.rows.map(row => row[0]);
    console.log(chalk.green("✔ Agent User IDs:"), agentUserIds);

    if (agentUserIds.length === 0) {
      console.log(chalk.red("No AGENT_USERID found. Exiting."));
      return;
    }

    // -------------------------------
    // STEP 3 — GET DEVICE_ID
    // -------------------------------

    console.log(chalk.yellow("\nSTEP 3: Fetching DEVICE_ID from AGENT_DEVICE_LINK..."));

    const bindIds = {};
    const placeholdersIds = agentUserIds
      .map((id, i) => {
        bindIds[`id${i}`] = id;
        return `:id${i}`;
      })
      .join(",");

    const deviceQuery = `
        SELECT DEVICE_ID
        FROM AGENT_DEVICE_LINK
        WHERE AGENT_USER_ID IN (${placeholdersIds})
    `;

    const deviceResult = await connection.execute(deviceQuery, bindIds);
    const deviceIds = deviceResult.rows.map(row => row[0]);

    console.log(chalk.green("✔ Device IDs:"), deviceIds);

    if (deviceIds.length === 0) {
      console.log(chalk.red("No DEVICE_ID found. Exiting."));
      return;
    }

    // -------------------------------
    // STEP 4 — DELETE FROM DEVICE TABLES
    // -------------------------------

    console.log(chalk.yellow("\nSTEP 4: Deleting records from AGENT_DEVICE_MASTER and AGENT_DEVICE_LINK..."));

    const bindDev = {};
    const placeholdersDev = deviceIds
      .map((d, i) => {
        bindDev[`dev${i}`] = d;
        return `:dev${i}`;
      })
      .join(",");

    // DELETE FROM MASTER
    const deleteMasterQuery = `
        DELETE FROM AGENT_DEVICE_MASTER
        WHERE DEVICE_ID IN (${placeholdersDev})
    `;
    await connection.execute(deleteMasterQuery, bindDev, { autoCommit: true });

    // DELETE FROM LINK
    const deleteLinkQuery = `
        DELETE FROM AGENT_DEVICE_LINK
        WHERE DEVICE_ID IN (${placeholdersDev})
    `;
    await connection.execute(deleteLinkQuery, bindDev, { autoCommit: true });

    console.log(chalk.green("✔ Deleted successfully from both tables."));

    // -------------------------------
    // FINAL CHECK
    // -------------------------------

    console.log(chalk.yellow("\nRunning final confirmation SELECT..."));

    const finalCheck = await connection.execute(
      `SELECT * FROM AGENT_DEVICE_LINK WHERE DEVICE_ID IN (${placeholdersDev})`,
      bindDev
    );

    if (finalCheck.rows.length === 0) {
      console.log(chalk.green.bold("\n🎉 DEMAP COMPLETED SUCCESSFULLY! No records found. ✔"));
    } else {
      console.log(chalk.red.bold("\n⚠ Some records still exist! Please check manually."));
    }

    await connection.close();

  } catch (error) {
    console.log(chalk.red.bold("=== ERROR CONNECTING TO DATABASE >>> ===", error.message));
  }
}

module.exports = { demapDevice };
