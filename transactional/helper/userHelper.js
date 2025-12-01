const prompt = require("prompt-sync")();
const chalk = require("chalk");

// user input
const config = require("../../config/config.json")


async function getAgentCodes() {
    try {
        //ASK MENU OPTION
        console.log("\nSelect an option:");
        console.log("1. Single Update");
        console.log("2. Bulk Update\n");

        const option = prompt("Enter option (1 or 2): ").trim();

        //  GET AGENT CODE(S)
        let agentCodesInput = "";

        if (option === "1") {
            agentCodesInput = prompt("Enter Agent Code: ").toUpperCase().trim();
        } else if (option === "2") {
            agentCodesInput = prompt("Enter Agent Codes (comma separated): ").toUpperCase().trim();
        } else {
            console.log(chalk.red("Invalid option selected."));
            return getAgentCodes();
        }

        // handle empty input
        if (!agentCodesInput) {
            console.log(chalk.red.bold("\n❌ Agent Code Not Provides. Kindly Provide the Agent Code...!\n"));
            return getAgentCodes()
        }
        // convert input -> array
        const agentCodes = agentCodesInput.split(',').map(c => c.trim());

        return agentCodes


    } catch (error) {
        console.log(chalk.red.bold("\n❌ Error taking agent code. Please run again.\n"), error.message);
    }
}



async function getSingleAgentCode() {
    try {
        //agent code regex
        const agentCodeRegex = new RegExp(config.REGEX.agentCodeRegex)

        while (true) {
            const agentCode = prompt("Enter Agent Code: ").toUpperCase().trim();

            if (agentCodeRegex.test(agentCode)) return agentCode;

            console.log(chalk.red.bold("\n❌ Invalid Input. Please enter 14 uppercase letters & digits.\n"));
        }


    } catch (error) {
        console.log(chalk.red.bold("\n❌ Error taking agent code. Please run again.\n"), error.message);
    }
}



async function getAgentDetails() {
    try {

        //agent details regex
        const agentAdharRegex = new RegExp(config.REGEX.agentAdharRegex)
        const agentPanRegex = new RegExp(config.REGEX.agentPanRegex)

        //  GET AGENT DETAILS
        let agentDetails = {};

        while (true) {
            const agentAdhar = prompt("Enter Agent Aadhaar: ").trim();
            const agentPan = prompt("Enter Agent PAN: ").toUpperCase().trim();

            if (agentAdharRegex.test(agentAdhar) && agentPanRegex.test(agentPan)) {
                agentDetails.agentAdhar = agentAdhar;
                agentDetails.agentPan = agentPan;
                return agentDetails;
            } else {
                console.log(chalk.red.bold("\n❌ Invalid input. Please enter a 12-digit Aadhaar and valid PAN.\n"));
            }
        }


    } catch (error) {
        console.log(chalk.red.bold("\n❌ Error taking agent details. Please run again.\n"), error.message);
    }
}



async function getVillageCode() {
    try {

        //village code regex
        const villageCodeRegex = new RegExp(config.REGEX.villageCodeRegex)

        while (true) {
            const villageCode = prompt("Enter Village Code / SUb-Group Code: ").trim();

            if (villageCodeRegex.test(villageCode)) return villageCode;

            console.log(chalk.red.bold("\n❌ Invalid input. Please enter a 6-digit Numeric Village Code / Sub-Group Code\n"));

        }

    } catch (error) {
        console.log(chalk.red.bold("\n❌ Error taking Village Code / Sub-Group Code. Please run again.\n"), error.message);
    }
}



async function selectUpdateOption() {
    try {
        //ASK MENU OPTION
        console.log("\nSelect an option:");
        console.log("1. Update Agent Status");
        console.log("2. Update User Status\n");

        const updateOption = prompt("Enter option (1 or 2): ").trim();

        //  GET AGENT CODE(S)
        let agentCodesInput = "";
        let userCodesInput = "";
        let message=""

        if (updateOption === "1") {
            //ASK single/bulk MENU OPTION
            console.log("\nSelect an option:");
            console.log("1. Single Update");
            console.log("2. Bulk Update\n");

            //setting message key 
            message="changeAgentStatus"

            const updateAgentOption = prompt("Enter option (1 or 2): ").trim();

            if (updateAgentOption === "1") {
                agentCodesInput = prompt("Enter Agent Code: ").toUpperCase().trim();

            } else if (updateAgentOption === "2") {
                agentCodesInput = prompt("Enter Agent Codes (comma separated): ").toUpperCase().trim();
            }
            else {
                console.log(chalk.red("Invalid option selected."));
                return selectUpdateOption();
            }

            // handle empty input --> agent
            if (!agentCodesInput) {
                console.log(chalk.red.bold("\n❌ Agent Code Not Provides. Kindly Provide the Agent Code...!\n"));
                return selectUpdateOption()
            }


        } else if (updateOption === "2") {
            //ASK single/bulk MENU OPTION
            console.log("\nSelect an option:");
            console.log("1. Single Update");
            console.log("2. Bulk Update\n");

            //setting message key 
            message="changeUserStatus"
            
            const updateUserOption = prompt("Enter option (1 or 2): ").trim();

            if (updateUserOption === "1") {
                userCodesInput = prompt("Enter User Code: ").toUpperCase().trim();

            } else if (updateUserOption === "2") {
                userCodesInput = prompt("Enter User Codes (comma separated): ").toUpperCase().trim();
            }
            else {
                console.log(chalk.red("Invalid option selected."));
                return selectUpdateOption();
            }

            // handle empty input --> user
            if (!userCodesInput) {
                console.log(chalk.red.bold("\n❌ User Code Not Provided. Kindly Provide the User Code...!\n"));
                return selectUpdateOption()
            }



        } else {
            console.log(chalk.red("Invalid option selected."));
            return selectUpdateOption();

        }

        // convert input -> array --> agent
        const agentCodes = agentCodesInput.split(',').map(c => c.trim());


        // convert input -> array --> agent
        const userCodes = userCodesInput.split(',').map(c => c.trim());

        return { agentCodes, userCodes, message }

    } catch (error) {
        console.log(chalk.red.bold("\n❌ Error taking agent code / user code. Please run again.\n"), error.message);
    }
}


module.exports = { getSingleAgentCode, getAgentDetails, getAgentCodes, getVillageCode, selectUpdateOption }


