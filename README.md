# ⚡ ZELUS: Hyperlocal Civic Automation Platform

> **A Multi-Agent Autonomous GovTech Ecosystem for Triage, Cost Estimation, and Rapid Infrastructure Deployment.**

---

## 📌 Project Overview
ZELUS is a next-generation GovTech platform designed to bridge the gap between chaotic community complaints, sluggish municipal processing, and delayed contractor execution. Built for rapid prototyping in **Antigravity**, ZELUS functions as a unified, single-page application orchestrating three vital roles: **Citizens**, **Municipal Authorities**, and **Field Contractors** through a real-time reactive data pipeline and an autonomous AI agent swarm.

---

## 🚨 The Problem Statement
Traditional civic complaint platforms are fundamentally broken. They function as passive digital suggestion boxes rather than active resolution pipelines. 
* **The Triage Bottleneck:** Municipalities are overwhelmed by unstructured, multi-lingual data, leading to delayed categorization and prioritization.
* **The Procurement Vacuum:** Generating accurate itemized bills of materials (BOM) and budget estimates for field infrastructure repairs takes weeks of manual processing.
* **The Feedback Loop Failure:** Citizens lack visibility into resolution timelines, while contractors struggle to find, claim, and verify local public works projects instantly.

## 💡 The Solution
ZELUS transforms civic management into an automated, self-sustaining marketplace:
1. **AI-Enhanced Citizen Reporting:** Citizens submit reports via a simulated mobile interface featuring real-time geolocation capturing and **Gemini-powered acoustic translation/structuring** for unstructured multi-lingual voice notes.
2. **Multi-Agent Swarm Triage:** Once reported, incidents trigger a sequential autonomous workflow (`Aegis`, `Atlas`, `Helios`, and `Mercury` Agents) that validates the issue, maps route logistics, generates an accurate budget matrix, and opens a public civic bounty.
3. **Contractor Field Grid:** Authorized contractors claim open bounties, view automatically compiled Bills of Materials (BOM), trace optimized routing grids, and upload simulated physical verification proofs to complete the feedback loop.

---

## 🛠️ Tech Stack & Ecosystem

| Layer | Technology | Purpose / Implementation |
| :--- | :--- | :--- |
| **Frontend Framework** | `React.js` (v19) | Component-driven declarative UI architecture |
| **Styling Engine** | `Tailwind CSS` | Utility-first design with complex dark/light palette inversion |
| **State Engine** | `React Context + LocalStorage` | Persistent, reactive single-source-of-truth across all roles |
| **AI Orchestration** | `Gemini API Wrappers` | Multilingual acoustic conversion and predictive material matrixing |
| **Prototyping Sandbox**| `Antigravity` | Environment for rapid full-stack canvas construction |

---

## 🏗️ System Architecture & Agent Swarm

The platform operates on a circular reactive data loops fueled by a **4-Agent Swarm Pipeline**:
```
[ Citizen App ] ──(Incident Ingestion)──> [ LocalStorage Matrix ]
                                │
                          (Triggers Swarm)
                                ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                           MUNICIPAL AGENT SWARM                                         │
│                                                                                         │
│  🛡️ [Aegis-Agent]   ──>  🗺️ [Atlas-Agent]   ──>  ☀️ [Helios-Agent]  ──>  🚀 [Mercury] │
│   Fraud & Verification    Geospatial Routing      Material/Cost Matrix   Fleet Dispatch │
└─────────────────────────────────────────────────────────────────────────────────────────┘
                                  │
                            (Posts Bounty)
                                  ▼
                        [ Contractor Grid ] <──(Claim / Prove Work)  ───────┘
```
---

### The Autonomous Agent Matrix:
* **🛡️ Aegis-Agent (Fraud & Verification):** Simulates cross-reference parsing of image data and logs structural anomaly validations.
* **🗺️ Atlas-Agent (Geospatial Router):** Evaluates coordinate arrays (`[latitude, longitude]`) to prioritize dense impact zones.
* **☀️ Helios-Agent (Material & Cost Matrix):** Dynamically processes incident categories to output itemized material quantities (e.g., *PVC Clamps, Cold-mix asphalt tons*) and workforce financial projections.
* **🚀 Mercury-Agent (Outbound Fleet Dispatch):** Generates active transaction logs verifying contractor dispatch broadcast signals.
---

## 📂 Project Structure

```text
zelus-civic-automation/
├── public/
│   └── favicon.ico
├── src/
│   ├── components/
│   │   ├── AccessPortal.jsx       # Split-screen terminal RBAC Gateway
│   │   ├── CitizenMobile.jsx      # Mobile mockup container for citizen tools
│   │   ├── AdminDashboard.jsx     # Desktop municipal command, telemetry & agent stream
│   │   └── ContractorGrid.jsx     # Field assignment tracker and routing grid
│   ├── context/
│   │   └── StateContext.jsx       # Global reactive state matrix & LocalStorage seeding
│   ├── styles/
│   │   └── index.css              # Custom Tailwind configuration & animation primitives
│   ├── App.jsx                    # Root view controller & simulation navigation bar
│   └── main.jsx                   # Application entry point
├── package.json
└── README.md
```
---

### ⚡ Key Hackathon Evaluation Features

1. High-Contrast Contrast Palette Inversion
Unlike native UI libraries that wash out during inversion, ZELUS features custom structural overrides:

Dark Mode: Deep technical layout (#090F10) with glowing toxic teal accents (#00FFCC).

Light Mode: Super high-contrast, clean layout (#F4F6F6) utilizing crisp deep cobalt accents (#0A46E4) and sharp dark typography (#0F172A) for flawless daylight visibility.

2. Device Hardware Isolation Simulation
To ensure absolute reliability during judging without native API blocks:

Simulated Camera & Voice Feeds: Capturing images or recording voice updates triggers fully simulated UI canvas loops, active timing flags, and animated wave visualizers.

Automatic Geolocation Tracking: Programmatically hooks into native browser geolocation arrays, instantly mapping live tracking coordinates to raw text fields.

3. Live Operational Telemetry Drawer
The base of the Municipal dashboard includes a /DEV sliding panel displaying real-time scrolling console logs. This ensures judges can physically witness the Helios-Agent mathematical cost derivations executing step-by-step behind the scenes.
---

### 🚀 Getting Started
Prerequisites
Node.js (v18.0.0 or higher)

npm or yarn

Installation & Local Run
1. Clone the repository:
```
git clone [https://github.com/yourusername/zelus-civic-automation.git](https://github.com/yourusername/zelus-civic-automation.git)
cd zelus-civic-automation
```
2. Install dependencies:
```
npm install
```
3. Boot the local development server:
```
npm run dev
```
4. Open http://localhost:5173 in your browser.
---

## License & Security

License: Distributed under the MIT License.

Security: This repository uses a high-priority .gitignore to prevent the exposure of Google Gemini API keys and sensitive environment variables. 

All previously detected secrets have been fully revoked and rotated.

---

## Developed by Team Zenthra

Focus Theme: Community Hero - Hyperlocal Problem Solver

Project Lead: B.Bhuvana Sarada

Hackathon: Vibe2Ship (2026)

---
