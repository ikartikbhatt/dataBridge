const dbConfig = require("../../config/dbConfig.js");
const oracledb = require("oracledb");
const chalk = require("chalk");
const { getSingleAgentCode, getAgentDetails } = require("../helper/userHelper.js");


async function mapDevice() {
    console.log(chalk.green.bold("=== MAP AGENT DEVICE ==="));

    try {
        //  CONNECT TO DATABASE
        const connection = await oracledb.getConnection(dbConfig);
        console.log(chalk.blue.bold("=== DATABASE CONNECTED SUCCESSFULLY ==="));

        // GET AGENT CODES
        const agentCode = await getSingleAgentCode();
        console.log(chalk.yellow("\nCreating Agent CBS And ATM TERMINAL Id..."));



        // CREATING AGENT TERMINAL ID
        const sortAgentId = agentCode.slice(7)
        const terminalId = `P${sortAgentId}`
        console.log(chalk.green(`✔ ${agentCode} Agent CBS And TERMINAL Id created successfully ${terminalId}.\n`));


        // GET AGENT DETAILS
        const agentDetails = await getAgentDetails()

        console.log(chalk.green(`\n✔ ${agentCode} Agent Details Fetched successfully FROM USER INPUT`), agentDetails);


        // fetch agent mobile number
        const getAgentMobileQuery = `
                                    SELECT MOBILE_NUMBER 
                                    FROM AGENT_USER_MASTER 
                                    WHERE AGENT_CODE = :code
                                    `;

        const getAgentMobile = await connection.execute(
            getAgentMobileQuery,
            { code: agentCode },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        )

        if (getAgentMobile.rows.length === 0) {
            await connection.close();
            return console.log(chalk.red.bold("\nNo record found for this Agent Code."));
        }

        // CREATING BIND VARIABLES
        let agentBind = {
            agentCode: agentCode,
            agentAdhar: agentDetails.agentAdhar,
            mobileNumber: getAgentMobile.rows[0].MOBILE_NUMBER,
            agentPan: agentDetails.agentPan,
            terminalId: terminalId
        }

        console.log(chalk.green(`\n✔ ${agentCode} Agent Details Need(s) To Be Updated`), agentDetails);

        console.log(agentBind)


        // UPDATING USER MASTER
        const updateQuery = `
        UPDATE USER_MASTER SET PHONE_NUMBER=:mobileNumber, AADHAARNUMBER=:agentAdhar,UID_TOKEN=null,USER_TYPE='A',AUTH_TYPE='AO', EKYC_FTYPE='2' , AUTH_FTYPE='2' , TXN_FYTPE='2' , EKYCITYPE='2' , EKYCPTYPE='2' , FINANCIALPTYPE='2', NONFINANCIALPTYPE='2' ,AUTHPTYPE='2' , FINANCIALITYPE='2' , NONFINANCIALITYPE='2' , AUTHITYPE='2' WHERE USERNAME=:agentCode
    `;


        await connection.execute(updateQuery, {mobileNumber:agentBind.mobileNumber,agentAdhar:agentBind.agentAdhar,agentCode:agentBind.agentCode}, { autoCommit: true });

        console.log(chalk.green("✔ User Master updated successfully."));


        // UPDATING AGENT USER MASTER

        console.log(chalk.yellow("\nSTEP 2: Updating PAN, ATM And CBS Terminal Id And Other Details In AGENT_USER_MASTER..."));

        const agentUserQuery = `
        UPDATE AGENT_USER_MASTER SET CBS_TERMINAL_ID=:terminalId,ATM_TERMINAL_ID=:terminalId,PAN_NUMBER=:agentPan,PANCONSENTFLAG='0',NSDLVALIDATED='0',FORMATVALIDATED=null,PANCONSENTMSG=null WHERE AGENT_CODE=:agentCode`;

        await connection.execute(agentUserQuery, {terminalId:agentBind.terminalId,terminalId:agentBind.terminalId,agentPan:agentBind.agentPan,agentCode:agentBind.agentCode}, { autoCommit: true });

        console.log(chalk.green("✔ Agent User Master updated successfully."));

        console.log(chalk.green.bold("\n🎉 MAPPING COMPLETED SUCCESSFULLY!✔"));

        await connection.close();

    } catch (error) {
        console.log(chalk.red.bold("=== ERROR CONNECTING TO DATABASE >>> ===", error.message));
    }
}

module.exports = { mapDevice };
