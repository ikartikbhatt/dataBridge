const dbConfig = require("../../config/dbConfig.js");
const oracledb = require("oracledb");
const chalk = require("chalk");
const prompt = require("prompt-sync")();
const { selectUpdateOption } = require("../helper/userHelper.js");

async function changeStatus() {
    console.log(chalk.green.bold("=== MAP AGENT/USER DEVICE ==="));

    let connection;

    try {
        // CONNECT TO DATABASE
        connection = await oracledb.getConnection(dbConfig);
        console.log(chalk.blue.bold("=== DATABASE CONNECTED SUCCESSFULLY ==="));

        // GET USER INPUT
        const getUserInput = await selectUpdateOption();
        let getStatus = '';

        // ---------------------------------------------------------------------
        // AGENT BLOCK
        // ---------------------------------------------------------------------
        if (getUserInput.message === "changeAgentStatus") {

            console.log(chalk.blue.bold("\n=== Change Agent Status Selected ===\n"));
            console.log(chalk.blue.bold("=== Fetching Existing Agent Status ==="));

            const bindSelect = {};
            const selectPlaceholders = getUserInput.agentCodes
                .map((code, i) => {
                    bindSelect[`code${i}`] = code;
                    return `:code${i}`;
                })
                .join(",");

            const selectQuery = `
                SELECT USERNAME, STATUS 
                FROM USER_MASTER
                WHERE USERNAME IN (${selectPlaceholders})
            `;

            const result = await connection.execute(
                selectQuery,
                bindSelect,
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            console.log(chalk.green("✔ Existing Agent Status fetched successfully.\n"));

            console.log(chalk.yellow("=== Agent Current Status ==="));
            result.rows.forEach(row => {
                console.log(`${chalk.cyan(row.USERNAME)} : ${chalk.magenta(row.STATUS)}`);
            });

            // UPDATE STATUS
            console.log("\n" + chalk.blue.bold("=== Updating Agent Status ==="));
            getStatus = prompt("Enter Agent Status to Update: ").trim();

            const bindUpdate = { agentStatus: getStatus };
            const updatePlaceholders = getUserInput.agentCodes
                .map((code, i) => {
                    bindUpdate[`code${i}`] = code;
                    return `:code${i}`;
                })
                .join(",");

            const updateQuery = `
                UPDATE USER_MASTER
                SET STATUS = :agentStatus
                WHERE USERNAME IN (${updatePlaceholders})
            `;

            await connection.execute(updateQuery, bindUpdate, { autoCommit: true });
            console.log(chalk.green("✔ Agent Status updated successfully."));

            await connection.close();
            return;
        }

        // ---------------------------------------------------------------------
        // USER BLOCK
        // ---------------------------------------------------------------------
        else if (getUserInput.message === "changeUserStatus") {

            console.log(chalk.blue.bold("\n=== Change User Status Selected ===\n"));
            console.log(chalk.blue.bold("=== Fetching Existing User Status ==="));

            const bindSelect = {};
            const selectPlaceholders = getUserInput.userCodes
                .map((code, i) => {
                    bindSelect[`code${i}`] = code;
                    return `:code${i}`;
                })
                .join(",");

            const selectQuery = `
                SELECT USERNAME, STATUS, FAILED_LOGIN_COUNT 
                FROM USER_MASTER
                WHERE USERNAME IN (${selectPlaceholders})
            `;

            const result = await connection.execute(
                selectQuery,
                bindSelect,
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );

            console.log(chalk.green("✔ Existing User Status fetched successfully.\n"));

            console.log(chalk.yellow("=== User Current Status ==="));
            result.rows.forEach(row => {
                console.log(
                    `${chalk.cyan(row.USERNAME)} : ${chalk.magenta(row.STATUS)} : ${chalk.magenta(row.FAILED_LOGIN_COUNT)}`
                );
            });

            // UPDATE STATUS
            console.log("\n" + chalk.blue.bold("=== Updating User Status ==="));
            getStatus = prompt("Enter User Status to Update: ").trim();

            const bindUpdate = { userStatus: getStatus };
            const updatePlaceholders = getUserInput.userCodes
                .map((code, i) => {
                    bindUpdate[`code${i}`] = code;
                    return `:code${i}`;
                })
                .join(",");

            const updateQuery = `
                UPDATE USER_MASTER
                SET STATUS = :userStatus,
                    FAILED_LOGIN_COUNT = 0
                WHERE USERNAME IN (${updatePlaceholders})
            `;

            await connection.execute(updateQuery, bindUpdate, { autoCommit: true });
            console.log(chalk.green("✔ User Status updated successfully."));

            await connection.close();
            return;
        }

        // ---------------------------------------------------------------------
        // INVALID MESSAGE KEY
        // ---------------------------------------------------------------------
        else {
            console.log(chalk.red("No message key received from selectUpdateOption function"));
            await connection.close();
        }

    } catch (error) {
        console.log(chalk.red.bold("=== ERROR CONNECTING TO DATABASE >>> ==="));
        console.log(chalk.red(error.message));
    }
}

module.exports = { changeStatus };
