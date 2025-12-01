const dbConfig = require("../../config/dbConfig");
const oracledb = require("oracledb");
const chalk = require("chalk");
const { getTodayDate, oracleToJson, getValidDate, saveToExcelWithHeaders,getVendorSelection,resetReportSessionTimestamp } =require("../helper/userHelper");
const { allAgentOnboardedColumns, agentOnboardedColumns, allAepsColumns,} = require("../helper/reportsColumns");


//get daily reports -->
//get daily reports -->
async function fetchReports() {
    const today = getTodayDate();
    console.log(chalk.green(chalk.bold("=== ORACLE REPORTS GENERATOR ===")));

    try {
        // DB connection
        const connection = await oracledb.getConnection(dbConfig);
        console.log(chalk.blue(chalk.bold("=== DATABASE CONNECTED SUCCESSFULLY ===")));

        // ================================================================
        // Execute Oracle Procedures after connection
        // ================================================================
      try {
            await connection.execute(`CALL LOOP_PROCEDURE_UID()`,[], { autoCommit: true });
            console.log(chalk.green("✔ LOOP_PROCEDURE_UID executed successfully"));
        } catch (procError) {
            console.log(chalk.red(`✖ Error executing procedure: ${procError.message}`));
        }

        // Reset timestamp for new report generation session
        resetReportSessionTimestamp();

        // Taking user input
        const startDate = getValidDate("ENTER START DATE (DD-MON-YYYY) (press enter to pass today's date):  ");
        const endDate = getValidDate("ENTER END DATE (DD-MON-YYYY) (press enter to pass today's date) :  ");

        console.log(`START DATE → ${startDate}`);
        console.log(`END DATE   → ${endDate}`);

        // Get vendor selection from user
        const selectedVendors = getVendorSelection();

        // ================================================================
        // --- QUERY 1 (GLOBAL QUERY — NOT vendor-wise)
        // ================================================================
        console.log(chalk.cyan("\n=== GENERATING GLOBAL AGENT ONBOARDED REPORT ==="));
        
        const allAgentOnboardedQuery = `
        SELECT DISTINCT(m.AGENTCODE),m.FIRST_NAME,m.LAST_NAME,
        m.DEVICE_SERIAL_NO,u.STATUS,u.CREATED_ON,m.ADDRESS,
        m.PHONE_NUMBER,m.GENDER,m.DOB,m.PINCODE,m.AADHAARNUMBER,
        m.SETTLEMENT_ACC_NUM,m.PERSONAL_ACC_NUM,m.COMMUNICATION_ADDRESS,
        m.PAN_NUMBER,m.POSTOFFICE_ADDRESS,m.LONGITUDE,m.LATITUDE,
        m.STATE,m.DISTRICT,m.SUBDISTRICT,m.VILLAGENAME,m.ZONALNAME,
        m.ZONALCODE,m.BRANCHNAME,m.BRANCHCODE,m.VENDORNAME,m.VENDORCODE
        FROM MIS_AGENTMASTER m 
        INNER JOIN USER_MASTER u ON m.AGENTCODE=u.USERNAME 
        WHERE u.STATUS!='5' 
        ORDER BY u.CREATED_ON desc`;

        const allAgentOnboarded = await connection.execute(allAgentOnboardedQuery);

        saveToExcelWithHeaders(
            oracleToJson(allAgentOnboarded.metaData, allAgentOnboarded.rows),
            allAgentOnboardedColumns,
            `allAgentOnboardedDetails_${today}.xlsx`
        );

        console.log(chalk.yellow("✔ Global Agent Onboarded Report Generated"));

        // ================================================================
        // --- GENERATE VENDOR-WISE FILES (for selected vendors only)
        // ================================================================
        for (const vendor of selectedVendors) {
            console.log(chalk.cyan(`\n=== GENERATING REPORTS FOR VENDOR: ${vendor} ===`));

            // ------------------------------------------------------------
            // --- QUERY 2 (vendor-based)
            // ------------------------------------------------------------
            const agentOnboardedQuery = `
            SELECT m.AGENTCODE,m.FIRST_NAME,m.LAST_NAME,m.DEVICE_SERIAL_NO,
            u.STATUS,u.CREATED_ON,m.ADDRESS,m.PHONE_NUMBER,m.GENDER,m.DOB,
            m.PINCODE,m.AADHAARNUMBER,m.SETTLEMENT_ACC_NUM,m.PERSONAL_ACC_NUM,
            m.COMMUNICATION_ADDRESS,m.PAN_NUMBER,m.POSTOFFICE_ADDRESS,m.LONGITUDE,
            m.LATITUDE,m.STATE,m.DISTRICT,m.SUBDISTRICT,m.VILLAGENAME,
            m.ZONALNAME,m.ZONALCODE,m.BRANCHNAME,m.BRANCHCODE,m.VENDORNAME,
            m.VENDORCODE 
            FROM MIS_AGENTMASTER m 
            INNER JOIN USER_MASTER u ON m.AGENTCODE=u.USERNAME 
            WHERE m.VENDORNAME='${vendor}' and u.STATUS!='5'
            ORDER BY u.CREATED_ON desc`;

            const agentOnboarded = await connection.execute(agentOnboardedQuery);

            saveToExcelWithHeaders(
                oracleToJson(agentOnboarded.metaData, agentOnboarded.rows),
                agentOnboardedColumns,
                `agentOnboardedDetails_${vendor}_${today}.xlsx`
            );

            console.log(chalk.green(`✔ Agent Onboarded Report for ${vendor} generated`));

            // ------------------------------------------------------------
            // --- QUERY 3 (vendor-based)
            // ------------------------------------------------------------
            const allAepsQuery = `
            WITH TXN_SUMMARY AS (
                SELECT 
                    A.AGENTCODE AS AGENT_CODE,
                    MAX(C.STATE) AS STATE_NAME,
                    MAX(C.STATECODE) AS STATE_CODE,
                    MAX(C.DISTRICT) AS DISTRICT_NAME,
                    MAX(c.FIRST_NAME) || ' ' || MAX(c.LAST_NAME) AS AGENTNAME,
                    MAX(C.BRANCHNAME) AS BRANCHNAME,
                    MAX(c.PHONE_NUMBER) AS CONTACT_NUMBER,
                    NVL(MAX(c.ADDRESS), '-') AS ADDRESS,
                    NVL(MAX(DEVICEID), '-') AS DEVICE_SERIAL_NO,
                    NVL(COUNT(CASE WHEN ONUS='YES' THEN SERIALNO END), '0.00') AS ON_US_TRANSACTION_COUNT,
                    NVL(COUNT(CASE WHEN ONUS='NO' THEN SERIALNO END), '0.00') AS OFFUS_TRANSACTION_COUNT,
                    SUM(CASE WHEN ONUS='YES' THEN amount END) AS ONUS_AMOUNT,
                    SUM(CASE WHEN ONUS='NO' THEN amount END) AS OFFUS_AMOUNT,
                    NVL(COUNT(CASE WHEN RESPTOCLIENT='00' AND AMOUNT>0 THEN SERIALNO END), '0.00') AS FINANCIAL_TXN_COUNT,
                    NVL(COUNT(CASE WHEN RESPTOCLIENT='00' AND SERVICENAME='TPD DEPOSIT' THEN SERIALNO END), '0.00') AS TPD_TXN_COUNT,
                    SUM(CASE WHEN SERVICENAME='TPD DEPOSIT' THEN amount END) AS TPD_AMOUNT,
                    MAX(TO_CHAR(b.CREATED_ON, 'dd-mm-yy')) AS ONBOARDED_DATE,
                    MAX(AGENT_STATUS) AS STATUS,
                    MIN(SERVERTIME) AS FIRST_LOGIN_DAY,
                    MAX(SERVERTIME) AS LAST_TRANSACTION,
                    COUNT(DISTINCT TO_CHAR(SERVERTIME,'DD-MM-YYYY')) AS NO_OF_LOGIN_DAYS
                FROM TXN_TXNSUMMARY A
                INNER JOIN MIS_AGENTMASTER C ON A.AGENTCODE=C.AGENTCODE
                INNER JOIN USER_MASTER b ON c.agentcode=b.username
                WHERE RESPTOCLIENT='00'
                  AND C.VENDORNAME='${vendor}'
                  AND SERVERTIME BETWEEN '${startDate} 12:00:00.000000000 AM' AND '${endDate} 11:59:59.999999999 PM'
                GROUP BY A.AGENTCODE
                ORDER BY A.AGENTCODE
            ),
            JAN_SURAKSHA AS (
                SELECT E.AGENTCODE,
                       NVL(COUNT(DISTINCT CASE WHEN D.ERRORCODE='00' AND D.SCHEME='PMSBY' THEN D.IEGSTXNID END), '0.00') AS PMSBY_SUCCESS,
                       NVL(COUNT(DISTINCT CASE WHEN D.ERRORCODE!='00' AND D.SCHEME='PMSBY' THEN D.IEGSTXNID END), '0.00') AS PMSBY_FAILURE,
                       NVL(COUNT(DISTINCT CASE WHEN D.ERRORCODE='00' AND D.SCHEME='PMJJBY' THEN D.IEGSTXNID END), '0.00') AS PMJJBY_SUCCESS,
                       NVL(COUNT(DISTINCT CASE WHEN D.ERRORCODE!='00' AND D.SCHEME='PMJJBY' THEN D.IEGSTXNID END), '0.00') AS PMJJBY_FAILURE
                FROM IEGS_LOGS E
                INNER JOIN MIS_AGENTMASTER C ON E.AGENTCODE=C.AGENTCODE
                INNER JOIN USER_MASTER b ON c.agentcode=b.username
                INNER JOIN IEGS_JANSURAKSHA D ON E.IEGSTXNID=D.IEGSTXNID
                WHERE D.SCHEME IN ('PMSBY','PMJJBY') AND C.VENDORNAME='${vendor}'
                  AND E.FROMCLIENTTIME BETWEEN '${startDate} 12:00:00.000000000 AM' AND '${endDate} 11:59:59.999999999 PM'
                GROUP BY E.AGENTCODE
            ),
            ACCOUNT_OPENING AS (
                SELECT E.AGENTCODE,
                       NVL(COUNT(DISTINCT CASE WHEN D.ERRORCODE='00' AND D.SCHEMECODE='SBGEN' THEN D.IEGSTXNID END), '0.00') AS SBGEN_SUCCESS,
                       NVL(COUNT(DISTINCT CASE WHEN D.ERRORCODE='00' AND D.SCHEMECODE='PMJDY' THEN D.IEGSTXNID END), '0.00') AS PMJDY_SUCCESS
                FROM IEGS_LOGS E
                INNER JOIN MIS_AGENTMASTER C ON E.AGENTCODE=C.AGENTCODE
                INNER JOIN USER_MASTER b ON c.agentcode=b.username
                INNER JOIN IEGS_ACCOUNTOPENING D ON E.IEGSTXNID=D.IEGSTXNID
                WHERE D.SCHEMECODE IN ('SBGEN','PMJDY') AND C.VENDORNAME='${vendor}'
                  AND E.FROMCLIENTTIME BETWEEN '${startDate} 12:00:00.000000000 AM' AND '${endDate} 11:59:59.999999999 PM'
                GROUP BY E.AGENTCODE
            )
            SELECT
                    T.AGENT_CODE,
                    T.STATE_NAME,
                    T.STATE_CODE,
                    T.DISTRICT_NAME,
                    T.AGENTNAME,
                    T.BRANCHNAME,
                    T.CONTACT_NUMBER,
                    T.ADDRESS,
                    T.DEVICE_SERIAL_NO,
                    T.ON_US_TRANSACTION_COUNT,
                    T.OFFUS_TRANSACTION_COUNT,
                    T.ONUS_AMOUNT,
                    T.OFFUS_AMOUNT,
                    T.FINANCIAL_TXN_COUNT,
                    T.TPD_TXN_COUNT,
                    T.TPD_AMOUNT,
                    T.ONBOARDED_DATE,
                    T.STATUS,
                    T.FIRST_LOGIN_DAY,
                    T.LAST_TRANSACTION,
                    T.NO_OF_LOGIN_DAYS,
                    NVL(J.PMSBY_SUCCESS, 0) AS PMSBY_SUCCESS,
                    NVL(J.PMSBY_FAILURE, 0) AS PMSBY_FAILURE,
                    NVL(J.PMJJBY_SUCCESS, 0) AS PMJJBY_SUCCESS,
                    NVL(J.PMJJBY_FAILURE, 0) AS PMJJBY_FAILURE,
                    NVL(AO.SBGEN_SUCCESS, 0) AS SBGEN_SUCCESS,
                    NVL(AO.PMJDY_SUCCESS, 0) AS PMJDY_SUCCESS
            FROM TXN_SUMMARY T
            LEFT JOIN JAN_SURAKSHA J ON T.AGENT_CODE = J.AGENTCODE
            LEFT JOIN ACCOUNT_OPENING AO ON T.AGENT_CODE = AO.AGENTCODE
            ORDER BY T.AGENT_CODE`;

            const aepsData = await connection.execute(allAepsQuery);

            saveToExcelWithHeaders(
                oracleToJson(aepsData.metaData, aepsData.rows),
                allAepsColumns,
                `allAepsTransactions_${vendor}_${today}.xlsx`
            );

            console.log(chalk.green(`✔ AEPS Report for ${vendor} generated`));
        }

        // DONE
        console.log("\n🎉 All vendor-wise reports generated successfully!\n");
        await connection.close();

    } catch (error) {
        console.log(chalk.red(chalk.bold("=== ERROR CONNECTING TO DATABASE >>> ===", error.message)));
    }
}


module.exports = { fetchReports };