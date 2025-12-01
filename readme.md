📊 DataBridge – Automated Daily Reporting Tool

Version 1.0

<p align="center"> <img src="https://img.shields.io/badge/Status-Active-brightgreen?style=for-the-badge" /> <img src="https://img.shields.io/badge/Version-1.0-blue?style=for-the-badge" /> <img src="https://img.shields.io/badge/Platform-Windows%20%7C%20Linux-lightgrey?style=for-the-badge" /> <img src="https://img.shields.io/badge/Users-7000%2B%20Daily-orange?style=for-the-badge" /> </p>
📘 Overview

DataBridge is an automated reporting solution built using Node.js + OracleDB to streamline daily operational reporting.
It eliminates manual workload by generating accurate Excel reports that are timestamped, archived, and production-validated.

This tool is tested in both UAT and Production environments and currently serves 7,000+ users daily.

⚡ This is Version 1.0 of the tool. Multiple new features, UI enhancements, and automation modules will be added in Version 2.0.

⭐ Key Features (v1.0)
📅 1. Daily Counts Automation

Fetches real-time:

Account opening counts

All EASE service counts

Runs flawlessly without manual input

🧾 2. Vendor-wise Reporting

Generates:

Individual vendor reports

Combined vendor summary

Exports everything into structured Excel files

👥 3. Agent Onboarding Report

Pulls AllAgentOnboarded data

Exports it instantly to Excel

Highly useful for audit and monitoring

💾 4. Auto-Naming + Auto-Archival

Files saved with:

Today’s date

Accurate timestamps

Stored in a destination folder for easy tracking

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

All agent onboarding data

Processes and generates Excel reports

Names each file using:

Date (YYYY-MM-DD)

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

4️⃣ Set Output Directory

destination.json

{
  "outputFolder": "C:/Reports/DataBridge/"
}

5️⃣ Run the Tool
node app.js

🧑‍💻 Available Commands
Command	Description
npm start	Run normal flow
node app.js counts	Fetch daily counts
node app.js vendors	Generate vendor reports
node app.js onboarded	Export onboarding report
🎯 Benefits to Operations Team

Reduces 2–3 hours of daily manual effort

Guarantees accuracy & consistency

Provides early morning ready-to-use reports

Ensures error-free data across teams

📈 Roadmap – Version 2.0 (Upcoming)

🚀 This tool is actively evolving.

Planned Features for v2:

Web UI dashboard

Email auto-delivery of reports

Multi-format export: PDF / CSV

Customizable report scheduler

Enhanced logs & analytics

Role-based access (Admin / Ops)

Auto-notification on failures

✉️ Support

For issues, enhancements, or queries, please contact the Operations or Development team.