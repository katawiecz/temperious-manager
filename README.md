# Temperious Manager

# 🌡️ Temperious Manager

> *“Where weather meets code, and curiosity meets control.”*  
> — Temperious Team  

---

## 🧭 Overview

**Temperious Manager** is a web-based control panel for managing the cities and temperature thresholds used by the [Temperious](https://github.com/katawiecz/temperious) weather alert system.  

It provides a clean, responsive interface for editing, adding, and deleting locations directly from your GitHub repository — no manual commits required.  

The panel integrates seamlessly with **GitHub Actions**, **OpenWeather**, and **Pushover**, letting you control weather alert logic from your phone or desktop.

---

## ✨ Key Features

🌍 **Multi-location management**  
Easily add and organize multiple cities — from Valenza to Turin and beyond.

📦 **Direct GitHub sync**  
Changes are committed straight to your repository’s `locations.json` via the GitHub API.

🔔 **Automated weather alerts**  
Paired with the main [Temperious](https://github.com/katawiecz/temperious) project, your configured thresholds trigger push notifications via Pushover when the temperature drops below your defined level.

📱 **Mobile-first design**  
Built with responsive layouts, large touch-friendly buttons, and a glassy, minimalist interface.

💾 **Serverless & secure**  
Powered by **Vercel Functions** and **fine-grained GitHub tokens**, ensuring safe commits without exposing credentials.

🎨 **Designed for clarity**  
Dark, atmospheric visuals reflecting the calm before the frost — and the thrill of automation.

---

## 🧩 Architecture

Temperious Manager
├── index.html # Main UI
├── style.css # Responsive glassy design
├── app.js # Frontend logic (fetch, validation, UI state)
└── api/
└── locations.js # Serverless backend (Vercel)


- **Frontend:** HTML + CSS + vanilla JavaScript  
- **Backend:** Node.js (serverless via Vercel)  
- **Hosting:** [Vercel](https://vercel.com)  
- **Data:** GitHub repo (`locations.json`)  
- **Notifications:** [Pushover](https://pushover.net)

---

## ⚙️ Environment Variables

| Variable | Description |
|-----------|-------------|
| `GITHUB_TOKEN` | Fine-grained personal access token (Read/Write to `temperious` repo) |
| `GITHUB_OWNER` | Your GitHub username (e.g. `katawiecz`) |
| `GITHUB_REPO` | Repository containing `locations.json` (e.g. `temperious`) |
| `GITHUB_BRANCH` | Branch to update (e.g. `main`) |
| `GITHUB_FILE_PATH` | Path to the configuration file (e.g. `locations.json`) |

---

## 🚀 Deployment

1. **Clone the repository**
   ```bash
   git clone https://github.com/katawiecz/temperious-manager.git
   cd temperious-manager


Deploy to Vercel

Go to vercel.com/new

Import the repo

Set environment variables

Deploy 🎉

Access your panel
Example: https://temperious.katawiecz.vercel.app

💡 How it Works

The frontend loads the locations.json file from the Temperious repository through the GitHub API.

You can edit cities, thresholds, or add new ones directly in the panel.

When you hit Save to Repo, the backend commits changes securely using your GitHub token.

The Temperious GitHub Action reads those values and triggers Pushover alerts when tomorrow’s minimum temperature is below your threshold.

🧠 Inspiration

Born from a fascination with automation and the quiet poetry of weather.

Temperious Manager is part of the Temperious Ecosystem — a learning-driven project exploring automation, APIs, and creative technology.
It was designed not as a commercial product, but as an experiment in connecting data, design, and personal curiosity.

📱 Roadmap

 Basic CRUD UI for locations

 GitHub API integration

 Mobile-first layout

 Direct workflow trigger button (“Run alert now”)

 Pushover user mapping per location

 Optional Firebase push notifications

 iOS & Android companion app

🧑‍💻 Tech Stack
Layer	Technology
Frontend	HTML5, CSS3 (glassy theme), Vanilla JS
Backend	Node.js (Serverless / Vercel)
Data Source	GitHub REST API
Weather	OpenWeather 5-day/3-hour forecast
Notifications	Pushover API
Hosting	Vercel (Hobby Tier)
🖼️ Preview

(Desktop and mobile view – dark mode)

🧊 Credits

Design & Development: Kasia Wieczorek

Weather Data: OpenWeather

Notifications: Pushover

Hosting: Vercel

🪄 License

This project is intended for personal and educational use.
You may explore, fork, and experiment — but please do not redistribute or use it commercially without permission.

"Made with logic, frost, and curiosity." ❄️
