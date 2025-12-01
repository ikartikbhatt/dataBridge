const dbConfig = require("../../config/dbConfig");
const oracledb = require("oracledb");
const chalk = require("chalk");
const { getTodayDate, oracleToJson, getValidDate, getYesterday, saveToTextFile } = require("../helper/userHelper");

async function fetchCounts() {
    const today = getTodayDate();
    console.log(chalk.green(chalk.bold("=== ORACLE COUNTS GENERATOR ===")));

    try {
        // DB connection
        const connection = await oracledb.getConnection(dbConfig);
        console.log(chalk.blue(chalk.bold("=== DATABASE CONNECTED SUCCESSFULLY ===")));

        // Taking user input
        const startDate = getValidDate("ENTER START DATE (DD-MON-YYYY) (press enter to pass today's date):  ");
        const endDate = getValidDate("ENTER END DATE (DD-MON-YYYY) (press enter to pass today's date) :  ");

        console.log(`START DATE → ${startDate}`);
        console.log(`END DATE   → ${endDate}`);

        const yesterday = getYesterday();      // for previous day count
        const goLiveDate = "30-MAY-2024";      // for SBGEN/PMJDY/PMSBY cumulative

        // 🔹 DAILY query template
        const dailyQueries = [
            {
                name: "SBGEN",
                sql: `SELECT COUNT(*) AS COUNT 
                      FROM IEGS_ACCOUNTOPENING A
                      INNER JOIN IEGS_LOGS L ON A.IEGSTXNID=L.IEGSTXNID
                      WHERE A.ERRORCODE='00' AND A.SCHEMECODE='SBGEN'
                      AND L.FROMCLIENTTIME BETWEEN '{START} 12:00:00.000000000 AM' AND '{END} 11:59:59.999999999 PM'`
            },
            {
                name: "PMJDY",
                sql: `SELECT COUNT(*) AS COUNT 
                      FROM IEGS_ACCOUNTOPENING A
                      INNER JOIN IEGS_LOGS L ON A.IEGSTXNID=L.IEGSTXNID
                      WHERE A.ERRORCODE='00' AND A.SCHEMECODE='PMJDY'
                      AND L.FROMCLIENTTIME BETWEEN '{START} 12:00:00.000000000 AM' AND '{END} 11:59:59.999999999 PM'`
            },
            {
                name: "PMSBY",
                sql: `SELECT COUNT(*) AS COUNT 
                      FROM IEGS_JANSURAKSHA J
                      INNER JOIN IEGS_LOGS L ON J.IEGSTXNID=L.IEGSTXNID
                      WHERE J.ERRORCODE='00' AND J.SCHEME='PMSBY'
                      AND L.FROMCLIENTTIME BETWEEN '{START} 12:00:00.000000000 AM' AND '{END} 11:59:59.999999999 PM'`
            },
            {
                name: "PMJJBY",
                sql: `SELECT COUNT(*) AS COUNT 
                      FROM IEGS_JANSURAKSHA J
                      INNER JOIN IEGS_LOGS L ON J.IEGSTXNID=L.IEGSTXNID
                      WHERE J.ERRORCODE='00' AND J.SCHEME='PMJJBY'
                      AND L.FROMCLIENTTIME BETWEEN '{START} 12:00:00.000000000 AM' AND '{END} 11:59:59.999999999 PM'`
            },
            {
                name: "TPD",
                sql: `SELECT COUNT(*) AS COUNT 
                      FROM TXN_TXNSUMMARY
                      WHERE SERVICENAME='TPD DEPOSIT' 
                      AND RESPTOCLIENT='00'
                      AND SERVERTIME BETWEEN '{START} 12:00:00.000000000 AM' AND '{END} 11:59:59.999999999 PM'`
            },
            {
                name: "REKYC",
                sql: `SELECT COUNT(*) AS COUNT 
                      FROM IEGS_INSERTREKYC
                      WHERE REEKYC_FINAL_SUBMIT_STATUS='00'
                      AND TRANSACTION_DATE BETWEEN '{START} 12:00:00.000000000 AM' AND '{END} 11:59:59.999999999 PM'`
            }
        ];

        // 🔹 CUMULATIVE queries
        const cumulativeQueries = [
            {
                name: "PMSBY",
                sql: `SELECT COUNT(*) AS COUNT 
                      FROM IEGS_JANSURAKSHA 
                      WHERE ERRORCODE='00' AND SCHEME='PMSBY'
                      AND IEGSTXNID IN (SELECT IEGSTXNID FROM IEGS_LOGS)`
            },
            {
                name: "PMJJBY",
                sql: `SELECT COUNT(*) AS COUNT 
                      FROM IEGS_JANSURAKSHA 
                      WHERE ERRORCODE='00' AND SCHEME='PMJJBY'
                      AND IEGSTXNID IN (SELECT IEGSTXNID FROM IEGS_LOGS)`
            },
            {
                name: "PMJDY",
                sql: `SELECT COUNT(*) AS COUNT 
                      FROM IEGS_ACCOUNTOPENING 
                      WHERE ERRORCODE='00' AND SCHEMECODE='PMJDY'
                      AND IEGSTXNID IN (SELECT IEGSTXNID FROM IEGS_LOGS)`
            },
            {
                name: "SBGEN",
                sql: `SELECT COUNT(*) AS COUNT 
                      FROM IEGS_ACCOUNTOPENING 
                      WHERE ERRORCODE='00' AND SCHEMECODE='SBGEN'
                      AND IEGSTXNID IN (SELECT IEGSTXNID FROM IEGS_LOGS)`
            },
            {
                name: "TPD",
                sql: `SELECT COUNT(*) AS COUNT 
                      FROM TXN_TXNSUMMARY 
                      WHERE SERVICENAME='TPD DEPOSIT' 
                      AND RESPTOCLIENT='00'`
            },
            {
                name: "REKYC",
                sql: `SELECT COUNT(*) AS COUNT 
                      FROM IEGS_INSERTREKYC 
                      WHERE REEKYC_FINAL_SUBMIT_STATUS='00'`
            }
        ];

        const outputLines = [];

        // ================================================================
        // --- 1) PREVIOUS DAY COUNTS (YESTERDAY)
        // ================================================================
        console.log(chalk.cyan(`\n=== GENERATING PREVIOUS DAY COUNTS: ${yesterday} ===`));
        outputLines.push(`DATE : ${yesterday}`);

        for (const q of dailyQueries) {
            const sql = q.sql
                .replace("{START}", yesterday)
                .replace("{END}", yesterday);

            const result = await connection.execute(sql);
            const json = oracleToJson(result.metaData, result.rows);
            outputLines.push(`${q.name}-${json[0].COUNT}`);
        }

        console.log(chalk.yellow(`✔ Previous day counts generated`));

        // ================================================================
        // --- 2) USER PROVIDED DATE RANGE COUNTS
        // ================================================================
        console.log(chalk.cyan(`\n=== GENERATING COUNTS FOR DATE RANGE: ${startDate} TO ${endDate} ===`));
        outputLines.push(`\nDATE : ${startDate} TO ${endDate}`);

        for (const q of dailyQueries) {
            const sql = q.sql
                .replace("{START}", startDate)
                .replace("{END}", endDate);

            const result = await connection.execute(sql);
            const json = oracleToJson(result.metaData, result.rows);
            outputLines.push(`${q.name}-${json[0].COUNT}`);
        }

        console.log(chalk.yellow(`✔ Date range counts generated`));

        // ================================================================
        // --- 3) CUMULATIVE COUNTS
        // ================================================================
        console.log(chalk.cyan(`\n=== GENERATING CUMULATIVE COUNTS (${goLiveDate} TO ${endDate}) ===`));
        outputLines.push(`\nDATE : ${goLiveDate} TO ${endDate}`);

        for (const q of cumulativeQueries) {
            const result = await connection.execute(q.sql);
            const json = oracleToJson(result.metaData, result.rows);
            outputLines.push(`${q.name}-${json[0].COUNT}`);
        }

        console.log(chalk.yellow(`✔ Cumulative counts generated`));

        // Print all counts
        console.log(chalk.yellow(chalk.bold("\n" + outputLines.join("\n"))));

        // Save into file using helper function
        saveToTextFile(outputLines, `Daily_counts_${today}.txt`, "counts");

        // DONE
        console.log("\n🎉 All counts generated successfully!\n");
        await connection.close();

    } catch (error) {
        console.log(chalk.red(chalk.bold("=== ERROR CONNECTING TO DATABASE >>> ===", error.message)));
    }
}

module.exports = { fetchCounts };