// dbConfig.js
const config = require("./config.json");

// Read NODE_ENV value (default to 'PROD' if not set)
const env = process.env.NODE_ENV || "PROD";

console.log(`🔧 Using DB Environment: ${env}\n`);


console.log("CONFIG SELECTED =", config[env]);


module.exports = config[env];
