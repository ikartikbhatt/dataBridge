// index.js
const prompt = require("prompt-sync")({ sigint: true });
const chalk = require("chalk");


// user imports
const { fetchReports } = require("./nonTransactional/sql/report");
const { fetchCounts } = require("./nonTransactional/sql/counts");
const {demapDevice}  = require("./transactional/sql/demapDevice");
const {mapDevice}    = require("./transactional/sql/mapDevice");
const {createLocation}=require("./transactional/sql/createLocation");
const { changeStatus } = require("./transactional/sql/changeStatus");
const displayBanner = require("./helper/displayBanner")

//display banner
displayBanner()


// main menu
console.log(chalk.cyan.bold("\n============ MAIN MENU ============\n"));

console.log(chalk.yellow("1.") + " " + chalk.white("Fetch Reports"));
console.log(chalk.yellow("2.") + " " + chalk.white("Fetch Counts"));
console.log(chalk.yellow("3.") + " " + chalk.white("Demap Agent Device"));
console.log(chalk.yellow("4.") + " " + chalk.white("Map Agent Device"));
console.log(chalk.yellow("5.") + " " + chalk.white("Create Location"));
console.log(chalk.yellow("6.") + " " + chalk.white("Update Agent/Bank User Status\n"));

const option = prompt(chalk.green("Enter your option number: "));

(async () => {
  switch (option.trim()) {
    case "1":
      console.log(chalk.blue.bold("\n👉 Running Reports...\n"));
      await fetchReports();
      break;

    case "2":
      console.log(chalk.blue.bold("\n👉 Running Counts...\n"));
      await fetchCounts();
      break;

     case "3":
      console.log(chalk.blue.bold("\n👉 Running Demap Device...\n"));
      await demapDevice();
      break;

     case "4":
      console.log(chalk.blue.bold("\n👉 Running Map Device...\n"));
      await mapDevice();
      break;

     case "5":
      console.log(chalk.blue.bold("\n👉 Running Create Location...\n"));
      await createLocation();
      break;

     case "6":
      console.log(chalk.blue.bold("\n👉 Running Agent/BankUser Status Change...\n"));
      await changeStatus();
      break;

    default:
      console.log(chalk.red.bold("\n❌ Invalid option. Please run again.\n"));
  }
})();
  