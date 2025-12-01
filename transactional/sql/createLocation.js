const dbConfig = require("../../config/dbConfig.js");
const oracledb = require("oracledb");
const chalk = require("chalk");
const { getVillageCode } = require("../helper/userHelper.js");


async function createLocation() {
    console.log(chalk.green.bold("=== CREATE LOCATION ==="));

    try {
        //  CONNECT TO DATABASE
        const connection = await oracledb.getConnection(dbConfig);
        console.log(chalk.blue.bold("=== DATABASE CONNECTED SUCCESSFULLY ===\n"));

        //     // GET VILLAGE CODE
        const villageCode = await getVillageCode();
        console.log(chalk.yellow(`\nVillage Code / Sub-Group Code Provided By User >>> ${villageCode}`));

        // Check Data is present in Sub-Group Master -- if yes stop the process and display the data

        const getSubGroupDataQuery = `SELECT * FROM SUB_GROUP_MASTER WHERE SUB_GROUP_CODE=:subGroupCode`

        const getSubGroupData = await connection.execute(
            getSubGroupDataQuery,
            { subGroupCode: villageCode },
            { outFormat: oracledb.OUT_FORMAT_OBJECT })


        if (getSubGroupData.rows.length > 0) {

            console.log(chalk.blue(`Data Already Found For ${villageCode} Village Code / Sub-Group Code\n`));
            console.log(chalk.blue(`Fetching Data From MIG_HIERARCHY_LOCATION_CENSES For ${villageCode} Village Code / Sub-Group Code\n`));

            const getCensusDataQuery = `SELECT STATE_NAME,DISTRICT_NAME,SUB_DISTRICT_NAME,VILLAGE_NAME,VILLAGE_CODE FROM MIG_HIERARCHY_LOCATION_CENSES WHERE VILLAGE_CODE=:subGroupCode`

            const getCensusData = await connection.execute(
                getCensusDataQuery,
                { subGroupCode: villageCode },
                { outFormat: oracledb.OUT_FORMAT_OBJECT })

            const displayData = getCensusData.rows[0] || {};

            console.log(chalk.green(`Census Data Fetched Successfully\n`));
            console.log(chalk.yellow.bold(JSON.stringify(displayData, null, 2)));

            await connection.close();
            return;
        }

        // // truncating table
        await connection.execute("TRUNCATE TABLE MIG_HIERARCHY_LOCATION;")
        await connection.commit();
        console.log(chalk.green(` MIG_HIERARCHY_LOCATION Table Truncated Successfully\n`));


        // check if data is present in cesnsus master
        const checkCensusDataQuery = 'SELECT STATE_CODE,STATE_NAME,DISTRICT_CODE,DISTRICT_NAME,SUB_DISTRICT_CODE,SUB_DISTRICT_NAME,VILLAGE_CODE,VILLAGE_NAME FROM MIG_HIERARCHY_LOCATION_CENSES WHERE VILLAGE_CODE=:subGroupCode'

        const checkCensusData = await connection.execute(
            checkCensusDataQuery,
            { subGroupCode: villageCode },
            { outFormat: oracledb.OUT_FORMAT_OBJECT })

        if (checkCensusData.rows.length === 0) {
            console.log(chalk.red.bold("\n❌ No Census Data found for this Village Code.\n"));
            return;
        }


        const checkCensusDataObj = checkCensusData.rows[0];


        // 🔍 Validate if ANY field is missing
        for (const [key, value] of Object.entries(checkCensusDataObj)) {
            if (value == null) {
                console.log(chalk.red.bold(`\n❌ Missing required census field: ${key}. Stopping process.\n`));
                await connection.close()
                return;   // stop further execution
            }
        }

        console.log(chalk.green.bold("\n✔ All required census data is available.\n"));

        console.log(chalk.green.bold("\n✔ Inserting Data Into MIG_HIERARCHY_LOCATION\n"));

        const insertDataIntoMigLocationQery = 'INSERT INTO MIG_HIERARCHY_LOCATION (STATE_CODE,STATE_NAME,DISTRICT_CODE,DISTRICT_NAME,SUB_DISTRICT_CODE,SUB_DISTRICT_NAME,VILLAGE_CODE,VILLAGE_NAME) VALUES(:STATE_CODE,:STATE_NAME,:DISTRICT_CODE,:DISTRICT_NAME,:SUB_DISTRICT_CODE,:SUB_DISTRICT_NAME,:VILLAGE_CODE,:VILLAGE_NAME)'

        const insertDataIntoMigLocation = await connection.execute(insertDataIntoMigLocationQery, checkCensusDataObj, { autoCommit: true })

        console.log(chalk.green("\n✔ Inserted Data >>>>\n"));

        console.log(chalk.yellow.bold(JSON.stringify(checkCensusDataObj, null, 2)))

        console.log(chalk.green.bold("\n✔ Calling hierarhy_bulk_upload_main procedure to sync data to sub-group-master...\n"));

        try {
            await connection.execute(`CALL HIERARHY_BULK_UPLOAD_MAIN('LOCATION')`,[] ,{ autoCommit: true });
            console.log(chalk.green("✔ HIERARHY_BULK_UPLOAD_MAIN executed successfully"));
        } catch (procError) {
            console.log(chalk.red(`✖ Error executing procedure: ${procError.message}`));
        }


        console.log(chalk.green("✔ Location Created successfully."));

        console.log(chalk.green.bold("\n🎉 Location Creation COMPLETED SUCCESSFULLY!✔"));

        await connection.close();

    } catch (error) {
        console.log(chalk.red.bold("=== ERROR CONNECTING TO DATABASE>>> ===", error.message));
    }
}

module.exports = { createLocation };
