const prompt = require("prompt-sync")();
const fs = require("fs");
const path = require("path");
const chalk = require("chalk");
const xlsx = require("xlsx");
const { vendorList } = require("./reportsColumns")

//date creation
function getTodayDate() {
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = months[today.getMonth()];
    const year = today.getFullYear();
    return `${day}-${month}-${year}`;
}


//oracle rows --> json convertor
function oracleToJson(metaData, rows) {
    return rows.map(row => {
        const obj = {};
        metaData.forEach((col, idx) => {
            obj[col.name] = row[idx];
        });
        return obj;
    });
}



// date checker
function getValidDate(promptText) {
    const monthAbbr = [
        "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
        "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"
    ];

    const regex = /^(\d{1,2})-([A-Z]{3})-(\d{2}|\d{4})$/; // allow 2 or 4 digit year

    while (true) {
        let input = prompt(promptText).toUpperCase().trim();

        // If user presses Enter, take today's date
        if (!input) {
            const today = new Date();
            const day = today.getDate().toString().padStart(2, "0");
            const month = monthAbbr[today.getMonth()]; // 0-indexed
            const year = today.getFullYear(); // full 4-digit year
            input = `${day}-${month}-${year}`;
            console.log(`➡ Using today's date by default: ${input}`);
            return input;
        }

        const match = input.match(regex);

        if (match) {
            let day = parseInt(match[1]);
            const month = match[2];
            let year = match[3];

            if (!monthAbbr.includes(month)) {
                console.log("❌ Invalid month abbreviation. Use JAN, FEB, ..., DEC.");
                continue;
            }

            if (day < 1 || day > 31) {
                console.log("❌ Invalid day. Enter a value between 1 and 31.");
                continue;
            }

            // Normalize year to 4 digits
            if (year.length === 2) {
                year = `20${year}`; // Convert 25 -> 2025
            }

            // Validate year range (reasonable range)
            const yearNum = parseInt(year);
            if (yearNum < 2000 || yearNum > 2100) {
                console.log("❌ Invalid year. Enter a year between 2000 and 2100.");
                continue;
            }

            // Pad day to 2 digits
            day = day.toString().padStart(2, "0");

            // Return in DD-MON-YYYY format
            return `${day}-${month}-${year}`;
        } else {
            console.log("❌ Invalid format. Use DD-MON-YYYY (e.g., 13-NOV-2025) or DD-MON-YY (e.g., 13-NOV-25)");
        }
    }
}


// Convert JS date → Oracle DD-MON-YYYY
function formatOracleDate(dateObj) {
    const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = months[dateObj.getMonth()];
    const year = dateObj.getFullYear();
    return `${day}-${month}-${year}`;
}

// Yesterday date (auto)
function getYesterday() {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return formatOracleDate(d);
}


function getTimeStamp() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}_${hours}${minutes}${seconds}`;
}

// Global variable to store the timestamp and vendor info for the current report generation session
let currentReportTimestamp = null;
let currentReportVendorList = null;

/**
 * Get or create timestamp for current report generation session
 * This ensures all reports in one run go to the same directory
 */
function getReportSessionTimestamp() {
    if (!currentReportTimestamp) {
        currentReportTimestamp = getTimeStamp();
    }
    return currentReportTimestamp;
}

/**
 * Reset the report session timestamp (call this at the start of report generation)
 */
function resetReportSessionTimestamp() {
    currentReportTimestamp = null;
    currentReportVendorList = null;
}

/**
 * Save text content to a file in timestamped directory
 * @param {Array<string>} lines - Array of lines to write to file
 * @param {string} fileName - Name of the file (e.g., 'oracle_counts_14-NOV-2025.txt')
 * @param {string} dirName - Directory name (e.g., 'counts', 'reports')
 */
function saveToTextFile(lines, fileName, dirName = "counts") {
    try {
        // Base directory path with timestamp
        const baseDir = "/opt/SQL_COUNTS_REPORTS_DATA";
        const timeStamp = getTimeStamp();
        const outputDir = path.join(baseDir, `${dirName}_${timeStamp}`);

        // Create directory if it doesn't exist
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        // Write content to file
        const filePath = path.join(outputDir, fileName);
        fs.writeFileSync(filePath, lines.join("\n"), "utf8");

        console.log(chalk.green(`\n✔ File saved to ${dirName}_${timeStamp}/${fileName}`));

        return filePath;
    } catch (error) {
        console.log(chalk.red(`✖ Error saving file: ${error.message}`));
        throw error;
    }
}

/**
 * Save data to Excel file with headers in timestamped directory
 * Automatically detects vendor context from vendor list
 * @param {Array<Object>} data - Array of data objects
 * @param {Array<string>} headers - Array of header names
 * @param {string} fileName - Name of the file
 */
function saveToExcelWithHeaders(data, headers, fileName) {
    try {
        // Base directory path with session timestamp
        const baseDir = "/opt/SQL_COUNTS_REPORTS_DATA";
        const sessionTimestamp = getReportSessionTimestamp();
        
        // Determine vendor name from current context
        let vendorName = 'ALL';
        if (currentReportVendorList) {
            vendorName = currentReportVendorList.length === 1 ? currentReportVendorList[0] : 'ALL';
        }
        
        const reportsDir = path.join(baseDir, `reports_${vendorName}_${sessionTimestamp}`);

        // Create directory if it doesn't exist
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        // Create worksheet with header row
        const worksheet = xlsx.utils.aoa_to_sheet([headers]);

        // Add data rows matching header order
        const rows = data.map(rowObj => headers.map(h => rowObj[h] ?? ""));
        xlsx.utils.sheet_add_aoa(worksheet, rows, { origin: "A2" });

        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Report");

        const filePath = path.join(reportsDir, fileName);
        xlsx.writeFile(workbook, filePath);

        console.log(chalk.green(`✔ Saved: reports_${vendorName}_${sessionTimestamp}/${fileName}`));

        return filePath;
    } catch (error) {
        console.log(chalk.red(`✖ Error saving Excel file: ${error.message}`));
        throw error;
    }
}

/**
 * Enhanced vendor selection function that stores the selection internally
 */
function getVendorSelection() {
    const { vendorList } = require("./reportsColumns");
    
    console.log(chalk.cyan("\n=== AVAILABLE VENDORS ==="));
    vendorList.forEach((vendor, index) => {
        console.log(chalk.white(`${index + 1}. ${vendor}`));
    });
    console.log(chalk.cyan("========================\n"));

    const prompt = require("prompt-sync")();
    const input = prompt("ENTER VENDOR NAME (press enter for all vendors): ").trim();

    // If empty, return all vendors
    if (!input) {
        console.log(chalk.yellow("➡ Fetching reports for ALL vendors"));
        currentReportVendorList = vendorList; // Store for directory naming
        return vendorList;
    }

    // Convert input to uppercase for case-insensitive comparison
    const inputUpper = input.toUpperCase();

    // Check if vendor exists in the list (case-insensitive)
    const matchedVendor = vendorList.find(vendor => vendor.toUpperCase() === inputUpper);

    if (matchedVendor) {
        console.log(chalk.yellow(`➡ Fetching report for vendor: ${matchedVendor}`));
        currentReportVendorList = [matchedVendor]; // Store for directory naming
        return [matchedVendor];
    } else {
        console.log(chalk.red(`❌ Vendor "${input}" not found in the list.`));
        console.log(chalk.yellow("Available vendors: " + vendorList.join(", ")));
        return getVendorSelection(); // Retry
    }
}




module.exports = { getTodayDate, oracleToJson, getValidDate, saveToExcelWithHeaders, getYesterday, saveToTextFile, getVendorSelection,resetReportSessionTimestamp }