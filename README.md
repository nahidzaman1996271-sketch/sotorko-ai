# Sotorko AI · সতর্ক

**A Bangla dashboard for flood alerts, shelter routing, and rescue triage.**

Sotorko AI is Team Cady Crush’s hackathon prototype for Bangladesh. It turns simulated river readings into officer-approved Bangla alerts, assigns households to shelters with space, and follows up when people ask for help or haven’t replied.

**[Open the live demo](https://sotorko-ai.onrender.com/)**

[Quick start](#quick-start) · [Try the demo](#try-the-demo) · [How it works](#how-it-works) · [Team and materials](#team-and-materials)

![Sotorko AI dashboard at 08:30 showing Sylhet, Chattogram, and Sunamganj on the monitoring graphic, a rising river chart, and an alert awaiting approval](docs/dashboard-preview.webp)

*The 08:30 replay after a Sylhet alert has been sent and a rescue reply has been received.*

## What you can try

- **Monitor changing risk.** Replay fictional readings from Sylhet, Chattogram, and Sunamganj. The river chart and animated monitoring graphic update as the scenario advances.
- **Approve severe alerts.** Review the threshold crossing and approve or reject delivery. The Bangla outbox previews SMS, WhatsApp, and voice calls.
- **Reroute when a shelter fills.** The shelter router reserves space for each household and reassigns it when the original shelter fills.
- **Read Bangla replies.** A keypad reply can mark a household safe. A message like **আমরা আটকে আছি, ৫ জন** (“We’re stranded, five people”) creates a rescue case for officer review.
- **Follow up, escalate and audit.** The orchestrator queues a simulated Bangla voice reminder for households still awaiting a reply, escalates anyone still silent to a ward volunteer, and records each decision in the activity log.
- **Re-raise rejected alerts.** If an officer rejects an alert and the river keeps rising by 0.25 m or more, the alert comes back for review.

## Quick start

Install **Node.js 20 or later**, then run this from the cloned or downloaded project folder.

```sh
npm start
```

Open **[http://127.0.0.1:4173](http://127.0.0.1:4173)**. The demo runs without package installation, API keys, or an external service.

## Try the demo

| Step | What to do | What you should see |
| --- | --- | --- |
| 1 | Select **Advance 15 min**. | At **08:15**, Sylhet’s simulated Surma reading crosses the demo threshold. A severe alert waits for approval. |
| 2 | Approve the **Sylhet** alert. | Three households receive simulated Bangla messages across SMS, WhatsApp, and voice. |
| 3 | Select **Simulate full** on **Sylhet School Shelter**. | The shelter router reassigns households to **Sylhet Community Hall** and adds new delivery previews. |
| 4 | Submit **Safe · ১** for Rahima and **Rescue sample** for Jamal. | Rahima is marked safe. Jamal’s message opens a rescue case for five people. |
| 5 | Advance to **08:30**. | Salma receives a simulated voice follow-up. Chattogram’s severe alert enters its own approval queue. |
| 6 | Advance to **08:45**. | Salma is still silent, so a **No response** case asks the ward volunteer to check in person. If a household later replies safe, its open case closes automatically. |

Use **Reset demo** to return to 08:00. The current run is saved in your browser. Select **Pause motion** for a still graphic, or use your device’s reduced-motion setting.

## How it works

```mermaid
flowchart TD
    Monitor["Monitor reads demo river and rain data"] --> Risk["Risk Assessor evaluates thresholds"]
    Risk -->|Severe| Officer{"Officer review"}
    Officer -->|Reject| Log["Activity log records the decision"]
    Officer -->|Approve| Shelter["Shelter Router reserves available space"]
    Shelter --> Bangla["Bangla Communicator creates simulated deliveries"]
    Bangla --> Reply{"Household response"}
    Reply -->|Safe| Safe["Mark the household safe"]
    Reply -->|Help or unclear| Triage["Rescue Triage queues officer review"]
    Reply -->|No reply| FollowUp["Orchestrator queues a voice follow-up"]
```

The demo uses **Node.js**, **vanilla JavaScript**, **CSS**, and **Canvas**. The orchestrator coordinates deterministic workflow modules and records their actions for review.

| File | Role |
| --- | --- |
| [simulation.js](simulation.js) | Readings, risk assessment, approvals, shelter reservations, delivery simulation, and Bangla reply triage |
| [dashboard.js](dashboard.js) | Dashboard controls, chart rendering, and browser storage |
| [basin.js](basin.js) | Animated monitoring illustration and risk markers |
| [server.mjs](server.mjs) | Local HTTP server |
| [simulation.test.js](simulation.test.js) | Tests for approval, rejection and re-raising, shelter rerouting, Bangla and English reply triage, follow-ups, and escalation |

Run the workflow tests with `npm test`.

### Prototype scope

All readings, thresholds, shelter locations, capacities, households, and deliveries are simulated. The monitoring illustration is schematic. Voice previews use a local Bangla browser voice when available, with the call script shown in the outbox. Rescue cases stay in the dashboard.

The proposal describes a future field pilot with live data, trained flood-risk and Bangla language models, verified shelter routes, and delivery providers. River names follow the [Flood Forecasting & Warning Centre bulletin](https://ffwc.gov.bd/app/flood-bulletin-morning) and [Chattogram District’s river listing](https://chittagong.gov.bd/pages/static-pages/6991007335ce18e1c073288c).

## Team and materials

**Team Cady Crush** · Daffodil International University

24H AI Builders Hackathon · MU CSE FEST 2026 · Agentic AI & Autonomous Systems track

| Team member | Role |
| --- | --- |
| Nahid Ibn Zaman | Team lead, development, and backend |
| Md. Rasel Hasan Sabuj | Agent orchestration and messaging |
| Md Tusher Hossen | Flood-risk modeling and Bangla NLP |
| Md. Ha-Mim Ferdowsh | Data pipeline and river sensors |

[Idea proposal (PDF)](Sotorko-AI_Proposal_CadyCrush.pdf) · [Proposal source](docs/proposal.html) · [Pitch script](docs/video-script.md)
