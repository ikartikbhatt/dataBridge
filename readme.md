📊 DataBridge – Automated Daily Reporting Tool
Version 1.0
<p align="center"> <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" /> <img src="https://img.shields.io/badge/Version-1.0-blue?style=for-the-badge" /> <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-lightgrey?style=for-the-badge" /> <img src="https://img.shields.io/badge/Users-7000%2B%20Daily-orange?style=for-the-badge" /> </p>
📘 Overview

DataBridge is an automated reporting and operations solution built using Node.js + OracleDB to streamline daily backend reporting and database operations.

It eliminates manual workload by generating accurate Excel reports that are timestamped, archived, and production-validated.

This tool has been tested in both UAT and Production environments and currently serves 7,000+ users daily.

⚡ This is Version 1.0 of the tool.
More features, UI enhancements, and automation modules will be added in Version 2.0.

🖥️ CLI Screenshot

<p align="center">
  <img src="./assets/dataBridge.png" width="600" />
</p>


⭐ Key Features (v1.0)
📅 1. Daily Counts Automation

Fetches real-time:

Account opening counts

All EASE service counts
Runs flawlessly without manual input.

🧾 2. Vendor-wise Reporting

Generates:

Individual vendor Excel reports

Combined vendor summary
Exports everything into structured Excel files.

👥 3. Agent Onboarding Report

Pulls AllAgentOnboarded data

Exports it instantly to Excel

Highly useful for audit and monitoring teams

🔗 4. Map Agent Device

Map device to agent

Ensures accurate field device mapping

Logs all mapping activity

🔁 5. De-map Agent Device

Safely removes existing agent-device link

Used during device replacement, loss, or reassignments

🗺️ 6. Location Creation

Creates new location entries

Validates codes and hierarchy

Saves directly into DB

👤 7. Update Agent/Bank User Status

Update status values like:
Active / Inactive / Locked / Suspended

Supports single & bulk modes

💾 8. Auto-Naming + Auto-Archival

Files saved with:

Today’s date

Accurate timestamps
Stored in a destination folder for easy tracking.

🛠️ Tech Stack
Component	Technology
Backend	Node.js
Language	JavaScript
DB Connectivity	OracleDB
Database Tools	MySQL Developer / SQL Developer
File Output	Excel (.xlsx)
⚙️ How It Works

Scheduler or manual command triggers the task

Tool connects to OracleDB

Fetches:

Daily counts

Vendor-wise data

All Agent Onboarding data

Generates Excel reports

Names files using:

Date (DD-MM-YYYY)

Timestamp

Stores reports in destination folder

Logs everything for debugging/auditing

📦 Installation & Setup
1️⃣ Clone the Repository
git clone "https://github.com/ikartikbhatt/dataBridge.git"
cd DataBridge

2️⃣ Install Packages
npm install

3️⃣ Configure DB

Edit:

/config/dbConfig.js


5️⃣ Run the Tool
node index.js


🎯 Benefits to Operations Team

Reduces 2–3 hours of daily manual effort

Guarantees accuracy & consistency

Ensures early morning ready-to-use reports

Eliminates manual intervention & errors

Provides clean, audit-ready data


✉️ Support

For issues, enhancements or queries, please contact the Operations or Development team.