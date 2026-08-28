# kanchhi_project_phase4

KANCHHI — Beginner Setup & Development Guide

KANCHHI is a smart information hub that combines weather, news, search, AI assistance, memory, notifications, analytics, system monitoring, personalization, code intelligence, scheduled tasks, watchlists, mobile/PWA support, and push notifications.

This guide is written for beginners. Follow the steps from top to bottom.

1. KANCHHI Project Overview

KANCHHI is divided into a frontend and backend:

kanchhi-assistant/
│
├── backend/
│   ├── main.py
│   ├── ai.py
│   ├── ai_weather.py
│   ├── ai_news.py
│   ├── ai_search.py
│   ├── ai_code.py
│   ├── search.py
│   ├── weather.py
│   ├── news.py
│   ├── notifications.py
│   ├── preferences.py
│   ├── memory.py
│   ├── system_monitoring.py
│   ├── intelligence.py
│   ├── smart_notifications.py
│   ├── scheduled_tasks.py
│   ├── watchlists.py
│   ├── smart_news.py
│   ├── code_intelligence.py
│   ├── unified_search.py
│   ├── push_notifications.py
│   ├── .env
│   └── ...
│
├── frontend/
│   ├── app/
│   │   ├── page.tsx
│   │   ├── layout.tsx
│   │   └── manifest.ts
│   │
│   ├── components/
│   │   ├── dashboard/
│   │   ├── weather/
│   │   ├── news/
│   │   ├── search/
│   │   ├── assistant/
│   │   ├── notifications/
│   │   ├── preferences/
│   │   ├── memory/
│   │   ├── analytics/
│   │   ├── system/
│   │   ├── briefing/
│   │   ├── smart-notifications/
│   │   ├── scheduled-tasks/
│   │   ├── watchlists/
│   │   ├── smart-news/
│   │   ├── unified-search/
│   │   ├── code-intelligence/
│   │   ├── security/
│   │   └── auth/
│   │
│   ├── lib/
│   │   ├── kanchhiCache.ts
│   │   ├── kanchhiAnalytics.ts
│   │   ├── kanchhiContext.ts
│   │   ├── kanchhiSecurity.ts
│   │   ├── phase7Search.ts
│   │   └── ...
│   │
│   ├── public/
│   │   ├── icons/
│   │   └── ...
│   │
│   ├── package.json
│   └── ...
│
└── README.md
2. What You Need Before Starting

Install the following:

Python 3.11+
Node.js 18+
npm
Git

Check your versions:

python --version
node --version
npm --version
git --version

Recommended:

Python 3.13+
Node.js 20+
3. Download or Clone the Project

Example:

git clone YOUR_REPOSITORY_URL
cd kanchhi-assistant

If you already have the project:

cd kanchhi-assistant
4. Backend Setup

Open a terminal:

cd backend

Create a Python virtual environment:

python -m venv .venv

Activate it.

macOS/Linux
source .venv/bin/activate
Windows
.venv\Scripts\activate

Install dependencies:

pip install -r requirements.txt

If there is no requirements.txt, install the main packages:

pip install fastapi uvicorn requests python-dotenv pydantic google-genai web-push
5. Backend Environment Variables

Create:

backend/.env

Example:

# ============================================================
# GOOGLE SEARCH
# ============================================================

GOOGLE_API_KEY="YOUR_GOOGLE_API_KEY"
GOOGLE_CSE_ID="YOUR_GOOGLE_CSE_ID"


# ============================================================
# GEMINI
# ============================================================

GEMINI_API_KEY="YOUR_GEMINI_API_KEY"
GEMINI_API_KEY_1="YOUR_GEMINI_API_KEY_1"
GEMINI_API_KEY_2="YOUR_GEMINI_API_KEY_2"
GEMINI_API_KEY_3="YOUR_GEMINI_API_KEY_3"

GEMINI_KEY_FLASH="YOUR_GEMINI_FLASH_KEY"
GEMINI_KEY_PRO="YOUR_GEMINI_PRO_KEY"
GEMINI_KEY_LITE="YOUR_GEMINI_LITE_KEY"


# ============================================================
# GEMINI MODELS
# ============================================================

MODEL_FLASH="gemini-3.6-flash"
MODEL_PRO="gemini-3.1-pro-preview"
MODEL_LITE="gemini-3.5-flash-lite"


# ============================================================
# PUSH NOTIFICATIONS
# ============================================================

VAPID_PUBLIC_KEY="YOUR_PUBLIC_VAPID_KEY"
VAPID_PRIVATE_KEY="YOUR_PRIVATE_VAPID_KEY"
VAPID_SUBJECT="mailto:your-email@example.com"

Never commit the real .env file.

Add to .gitignore:

.env
.env.*
!.env.example

Create a safe template:

backend/.env.example

with blank values:

GOOGLE_API_KEY=
GOOGLE_CSE_ID=

GEMINI_API_KEY=
GEMINI_API_KEY_1=
GEMINI_API_KEY_2=
GEMINI_API_KEY_3=

GEMINI_KEY_FLASH=
GEMINI_KEY_PRO=
GEMINI_KEY_LITE=

MODEL_FLASH=
MODEL_PRO=
MODEL_LITE=

VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=
6. Generate VAPID Keys

VAPID keys are required for web push notifications.

From the backend directory:

npx web-push generate-vapid-keys --json

You will receive something similar to:

{
  "publicKey": "YOUR_PUBLIC_KEY",
  "privateKey": "YOUR_PRIVATE_KEY"
}

Put them in backend/.env:

VAPID_PUBLIC_KEY="YOUR_PUBLIC_KEY"
VAPID_PRIVATE_KEY="YOUR_PRIVATE_KEY"
VAPID_SUBJECT="mailto:your-email@example.com"

Important:

PUBLIC KEY  → browser may receive it
PRIVATE KEY → backend only

Never put the private key in frontend code.

7. Start the Backend

From:

kanchhi-assistant/backend

run:

uvicorn main:app --reload

Successful startup should look similar to:

Uvicorn running on http://127.0.0.1:8000
Application startup complete.

Keep this terminal open.

8. Test the Backend

Open another terminal.

Test:

curl http://localhost:8000/

Test the general health endpoint:

curl http://localhost:8000/api/health

Test AI:

curl http://localhost:8000/api/ai/health

Test monitoring:

curl http://localhost:8000/api/system/health

Test external services:

curl "http://localhost:8000/api/system/checks?external=true"

A healthy response looks similar to:

{
  "status": "healthy"
}
9. Backend API Groups

KANCHHI's backend provides several groups of APIs.

/api/search
/api/weather
/api/news

/api/ai/chat
/api/ai/weather
/api/ai/news
/api/ai/search
/api/ai/code

/api/notifications
/api/preferences
/api/memory

/api/system/health
/api/system/checks

/api/intelligence/...

/api/smart-notifications
/api/scheduled-tasks
/api/watchlists
/api/smart-news

/api/ai/code/...
/api/unified-search/...

/api/push/...
10. Frontend Setup

Open another terminal:

cd frontend

Install packages:

npm install
11. Frontend Environment Variables

Create:

frontend/.env.local

Only browser-safe values belong here.

Example:

NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_VAPID_PUBLIC_KEY=YOUR_PUBLIC_VAPID_KEY

Never put:

NEXT_PUBLIC_VAPID_PRIVATE_KEY=...

in the frontend.

Never put Gemini private API keys in NEXT_PUBLIC_* variables.

12. Start the Frontend

Run:

npm run dev

Open:

http://localhost:3000

If port 3000 is already being used:

lsof -i :3000

Then terminate the old process:

kill -9 PID

Example:

kill -9 42301

Then start again:

npm run dev
13. KANCHHI Navigation

The main KANCHHI interface contains:

Dashboard
Search
Weather
News
Code Environment
AI Assistant
Notifications
Preferences
KANCHHI Memory
Analytics
System Monitoring
AI Briefings
Smart Notifications
Scheduled Tasks
Watchlists
Smart News
Unified Search
Code Intelligence
Security
Authentication
Push Notifications
14. Phase Development Roadmap
Phase 1 — Core KANCHHI

Initial foundation:

1  Project foundation
2  FastAPI backend
3  Next.js frontend
4  AI integration
5  Search integration
6  Weather
7  News
8  Basic dashboard
15. Phase 2 — Core Features
9   Weather intelligence
10  News aggregation
11  Search
12  AI assistant
13  Code environment
16. Phase 3 — Personal Information
14  Notifications
15  Preferences
16  Memory

These became the foundation for personalization.

17. Phase 4 — Advanced KANCHHI
17  Notifications                         ✅
18  User Preferences                      ✅
19  KANCHHI Memory                           ✅
20  Personalized Dashboard                ✅
21  PWA / Mobile Support                  ✅
22A Weather cache                         ✅
22B News cache                            ✅
22C Search/cache behavior                 ✅
22D Dashboard cached snapshot             ✅
22E Global offline status                 ✅
22F App-shell/service worker              ✅
22G Final offline testing                 ✅
23A Analytics foundation                 ✅
23B Analytics event tracking             ✅
23C Session/usage statistics             ✅
23D Analytics dashboard                  ✅
23E Offline analytics                    ✅
23F Privacy controls                     ✅
23G Final analytics testing              ✅
24A System monitoring foundation         ✅
24B Health monitoring                    ✅
24C External service checks              ✅
24D Final monitoring validation          ✅
18. Phase 5 — Intelligence
25  Unified Context Engine
26  Intelligent AI Routing
27  Personal AI Memory
28  AI Morning Briefing
29  AI Evening Summary

KANCHHI can combine:

Weather
News
Memory
Preferences
Notifications
Analytics
Search
User context

to produce personalized intelligence.

19. Phase 6 — Automation
30  Smart Notifications
31  Scheduled Tasks
32  Watchlists
33  Smart News Ranking

Examples:

Weather alert
Watch a topic
Scheduled reminder
News ranking
Keyword monitoring
20. Phase 7 — Search Intelligence
34  Unified Search
35  Conversational Search
36  Semantic Memory Search

Unified search brings multiple data sources together.

Conversational search lets KANCHHI understand follow-up questions.

Semantic memory search allows KANCHHI to search remembered information based on meaning rather than exact keywords.

21. Phase 8 — AI Coding
37  AI Code Review
38  Project-Aware Code Assistant
39  Project Documentation

Examples:

Review TypeScript
Find bugs
Explain a project
Answer questions about project files
Generate documentation
Suggest fixes
22. Phase 9 — Full Personalization
40  Fully Personalised Dashboard

The dashboard can prioritize content using:

User preferences
KANCHHI memory
Current weather
Smart news
Notifications
Watchlists
Analytics
Morning intelligence
Evening intelligence
Usage patterns
23. Phase 10 — Security
41  Security hardening
42  Authentication
43  Data export/import

Security should protect:

Accounts
Sessions
Stored preferences
Memory
Analytics
Push subscriptions
Private data
24. Phase 11 — Voice
44  Voice input
45  Voice output

Voice input:

Speak → KANCHHI understands → response

Voice output:

KANCHHI response → speech

The browser's speech capabilities can be used where supported.

25. Phase 12 — Mobile & Notifications
46  Push notifications
47  Advanced mobile UI

Push notification flow:

Browser
   ↓
Service Worker
   ↓
Push Subscription
   ↓
Backend
   ↓
VAPID
   ↓
Push Service
   ↓
Device
26. PWA Support

KANCHHI includes:

manifest
icons
standalone display
service worker
offline cache
app shell

The manifest is located at:

frontend/app/manifest.ts

Icons:

frontend/public/icons/
├── icon-192.png
└── icon-512.png
27. Offline Mode

KANCHHI should continue working when the network disappears.

Offline systems include:

Weather cache
News cache
Search cache
Dashboard cache
Global offline indicator
Service worker
App shell
Offline analytics

When offline:

Use cached data
Avoid unnecessary requests
Show offline status
Do not treat network failure as application failure
28. Weather Offline Behavior

Normal:

Browser
 ↓
Backend
 ↓
Open-Meteo

Offline:

Browser
 ↓
Local weather cache

The latest valid weather result should remain available.

29. News Offline Behavior

Normal:

Browser
 ↓
Backend
 ↓
OnlineKhabar / RONB / Ratopati

Offline:

Browser
 ↓
Cached news
30. Analytics

KANCHHI analytics are local-first.

Tracked information can include:

App opened
Tab opened
Session started
Session ended
Offline
Online
Weather refresh
News refresh
Search used
Assistant used
Notifications opened
Preferences opened
Memory opened
PWA launch

Analytics should not contain:

Passwords
Private conversations
API keys
Sensitive memory contents
Authentication secrets
31. System Monitoring

System monitoring checks:

Backend API
KANCHHI AI
Web Search
Memory
Notifications
Preferences
Weather
News providers

Test:

curl http://localhost:8000/api/system/health

Full external test:

curl "http://localhost:8000/api/system/checks?external=true"

Healthy:

healthy

Partially unavailable:

degraded

Completely unavailable:

offline
32. Smart Notifications

API:

curl http://localhost:8000/api/smart-notifications

Example:

{
  "success": true,
  "count": 0,
  "notifications": []
}

Smart notifications can later be generated from:

Weather
Watchlists
News
Schedules
Preferences
System state
33. Scheduled Tasks

API:

curl http://localhost:8000/api/scheduled-tasks

Scheduled tasks can be used for:

Morning briefing
Reminder
Weather check
Watchlist check
News check
Custom user tasks
34. Watchlists

API:

curl http://localhost:8000/api/watchlists

Watchlists can track:

Topics
Keywords
Companies
Technology
Sports
News subjects
Other user-defined interests
35. Smart News

Smart news ranking takes:

News articles
+
Keywords
+
User preferences
+
Ranking rules

and produces ranked articles.

Example test:

curl -X POST http://localhost:8000/api/smart-news/rank \
  -H "Content-Type: application/json" \
  -d '[
    {
      "title": "Gemini AI development continues",
      "source": "Example"
    },
    {
      "title": "Local weather update",
      "source": "Example"
    }
  ]'
36. Unified Search

Unified search can combine:

Web search
News
Weather
Memory
KANCHHI knowledge

Typical flow:

User asks question
       ↓
Unified Search
       ↓
Determine source
       ↓
Retrieve information
       ↓
Combine results
       ↓
Return answer
37. Conversational Search

Example:

User:
What is today's weather?

KANCHHI:
Current temperature is ...

User:
Will I need an umbrella?

KANCHHI:
Based on today's precipitation probability...

The second question can use context from the first.

38. Semantic Memory Search

Instead of requiring exact words:

"programming language"

KANCHHI can locate related memories such as:

"I prefer TypeScript."
"I am building a Next.js application."

The goal is meaning-based retrieval.

39. AI Code Review

API:

/api/ai/code/review

The user sends:

filename
language
code

KANCHHI can return:

Overall Assessment
Critical Problems
Bugs
Type/Syntax Problems
Security
Performance
Maintainability
Recommended Changes
Corrected Code
40. Project-Aware Code Assistant

API:

/api/ai/code/project

It can receive:

question
project_files

Example:

{
  "question": "Where is the mistake?",
  "project_files": [
    {
      "path": "frontend/app/page.tsx",
      "content": "..."
    }
  ]
}

KANCHHI can reason about relationships between files.

41. Project Documentation

API:

/api/ai/code/documentation

It can generate documentation based on project files.

Possible output:

Overview
Architecture
Frontend
Backend
API Endpoints
Core Features
AI Integration
Memory
Offline / Cache
Analytics
System Monitoring
Code Intelligence
Project Structure
Development Notes
Known Limitations
42. Authentication

Authentication protects the application.

General flow:

User
 ↓
Login
 ↓
Authentication
 ↓
Session
 ↓
Protected KANCHHI interface

Authentication-related information should never be placed in analytics or publicly exposed frontend configuration.

43. Data Export / Import

KANCHHI can export user-owned data such as:

Preferences
Memory
Analytics
Watchlists
Scheduled tasks
Notification settings

A typical export format is JSON:

{
  "version": 1,
  "preferences": {},
  "memory": [],
  "analytics": [],
  "watchlists": [],
  "tasks": []
}

Do not export secrets such as:

API keys
VAPID private key
Passwords
Server secrets
44. Voice Input

Typical browser flow:

Click microphone
      ↓
Speak
      ↓
Speech recognition
      ↓
Text
      ↓
KANCHHI Assistant

Always provide a text alternative.

45. Voice Output

Typical flow:

KANCHHI response
      ↓
Speech synthesis
      ↓
Audio

Always provide the text response too.

46. Push Notifications

Push notification setup consists of four parts:

1. VAPID keys
2. Service worker
3. Browser subscription
4. Backend push sender

Never expose:

VAPID_PRIVATE_KEY

to the frontend.

47. Mobile UI

Mobile layout should support:

Phone
Tablet
Laptop
Desktop

Use responsive Tailwind classes:

sm:
md:
lg:
xl:

Prefer:

flex-col

on small screens and:

md:flex-row

on larger screens.

48. Common Development Workflow

Every time you change backend code:

cd backend
uvicorn main:app --reload

Every time you change frontend code:

cd frontend
npm run dev

Then open:

http://localhost:3000
49. If Frontend Has Build Errors

First remove Next.js's development cache:

cd frontend
rm -rf .next
npm run dev

For Windows:

Remove-Item -Recurse -Force .next
npm run dev
50. If Port 3000 Is Busy

Run:

lsof -i :3000

Find the Node PID:

node 42301

Then:

kill -9 42301

Start again:

npm run dev

Do not type:

run kill 42301

Correct:

kill -9 42301
51. If Backend Will Not Start

Run:

cd backend
uvicorn main:app --reload

Read the first Python error carefully.

Common problems:

SyntaxError
ImportError
ModuleNotFoundError
Invalid .env
Port already in use

Fix the first error before fixing later errors.

52. If the Backend Says Gemini API Is Disabled

Example:

403 PERMISSION_DENIED
SERVICE_DISABLED

This means the Google Cloud project associated with the API key does not currently have the required Gemini API service enabled.

Do not change KANCHHI code first.

Check:

Google Cloud project
Gemini API / Generative Language API
API key restrictions
Billing/quota

Then restart the backend.

53. If Gemini Returns 429

Example:

429 RESOURCE_EXHAUSTED

This normally means the configured model/project has exceeded its quota or rate limit.

KANCHHI should:

avoid repeated automatic calls
use cached results where possible
show a friendly unavailable message
retry only when appropriate

Do not repeatedly refresh the page to bypass quota limits.

54. If Weather Returns 503

Example:

Weather API returned 503

Check backend:

curl "http://localhost:8000/api/weather?lat=27.7&lon=85.3"

Check monitoring:

curl http://localhost:8000/api/system/checks/weather

If the external provider is unavailable, KANCHHI should use cached weather where supported.

55. If News Is Offline

Check:

curl http://localhost:8000/api/news

KANCHHI should return cached news when live news sources cannot be reached.

Typical log:

Returning cached news

This is expected offline behavior.

56. If AI Fails While Offline

Messages such as:

nodename nor servname provided

usually mean the backend cannot reach the external AI service.

This is a network problem, not necessarily a frontend problem.

Expected behavior:

AI unavailable
+
cached/local information continues working
57. Hydration Errors

If Next.js displays:

Hydration failed because the server rendered HTML
didn't match the client

Check for client-dependent values such as:

Date.now()
new Date()
Math.random()
navigator
window
localStorage
sessionStorage
navigator.onLine

Do not generate different markup on the server and immediately on the client.

A common fix is:

const [mounted, setMounted] = useState(false);

useEffect(() => {
  setMounted(true);
}, []);

if (!mounted) {
  return null;
}

Use this carefully rather than hiding large application sections unnecessarily.

58. API 404 Errors

If you see:

POST /api/example 404

check:

1. Does the backend router exist?
2. Is it imported in main.py?
3. Is the router included with app.include_router()?
4. Is the URL correct?
5. Is FastAPI running?

For example:

from push_notifications import (
    router as push_notifications_router
)

app.include_router(
    push_notifications_router
)
59. Frontend "Export Does Not Exist"

Example:

Export runUnifiedSearch doesn't exist

Check the corresponding file:

frontend/lib/phase7Search.ts

Make sure it actually exports:

export function runUnifiedSearch() {
  ...
}

If a module has no exports, every imported function will fail.

60. Frontend "Module Not Found"

Example:

Can't resolve '@/components/example/ExamplePanel'

Check:

Does the directory exist?
Does the filename match exactly?
Is capitalization correct?
Does the file export the expected component?

Example:

components/
└── scheduled-tasks/
    └── ScheduledTasksPanel.tsx

Then:

import ScheduledTasksPanel
  from "@/components/scheduled-tasks/ScheduledTasksPanel";
61. Safe API Key Rules

Never commit:

Google API keys
Gemini keys
Private VAPID keys
Passwords
Authentication secrets
Session secrets

Never put them inside:

frontend/public/
frontend components
NEXT_PUBLIC_*
Git repositories
screenshots
README.md

Use:

backend/.env

instead.

62. Security Checklist

Before sharing KANCHHI:

[ ] Rotate exposed API keys
[ ] Rotate exposed Gemini keys
[ ] Protect .env
[ ] Protect VAPID private key
[ ] Configure authentication
[ ] Review CORS
[ ] Remove debug secrets
[ ] Remove sensitive console logging
[ ] Validate API input
[ ] Restrict production origins
[ ] Review export/import security

For production, do not use:

allow_origins=["*"]

with credentials.

63. Development vs Production

Development:

Frontend
http://localhost:3000

Backend
http://localhost:8000

Production should use:

HTTPS
secure cookies
restricted CORS
production secrets
production database/storage
proper logging
monitoring

Push notifications also require secure deployment conditions.

64. Recommended Test Order

After starting both servers, test in this order:

Backend
curl http://localhost:8000/
curl http://localhost:8000/api/health
curl http://localhost:8000/api/ai/health
curl http://localhost:8000/api/system/health
Weather
curl "http://localhost:8000/api/weather?lat=27.7&lon=85.3"
News
curl http://localhost:8000/api/news
Memory
curl http://localhost:8000/api/memory/list
Smart systems
curl http://localhost:8000/api/smart-notifications
curl http://localhost:8000/api/scheduled-tasks
curl http://localhost:8000/api/watchlists
System monitoring
curl "http://localhost:8000/api/system/checks?external=true"
Push
curl http://localhost:8000/api/push/health
65. Frontend Test Order

Open:

http://localhost:3000

Then test:

[ ] Dashboard
[ ] Weather
[ ] News
[ ] Search
[ ] AI Assistant
[ ] Notifications
[ ] Preferences
[ ] Memory
[ ] Analytics
[ ] System Monitoring
[ ] AI Briefings
[ ] Smart Notifications
[ ] Scheduled Tasks
[ ] Watchlists
[ ] Smart News
[ ] Unified Search
[ ] Code Intelligence
[ ] Security
[ ] Authentication
[ ] Export / Import
[ ] Voice
[ ] Push Notifications
66. Offline Test

First make sure the application has loaded successfully while online.

Then:

Browser DevTools
→ Network
→ Offline

Test:

Dashboard
Weather
News
Search
Memory
Analytics

Expected:

Cached information remains available
Offline indicator appears
Live requests fail gracefully
No application crash
67. Push Notification Test

First:

Backend running
Frontend running
HTTPS/secure environment when required
VAPID keys configured
Service worker registered
Browser notification permission granted

Then:

Open Push Notifications
→ Enable notifications
→ Allow browser permission
→ Verify subscription
→ Send test notification
68. Project Development Principle

When adding a new feature:

1. Define the backend API
2. Test the backend with curl
3. Connect frontend
4. Add loading state
5. Add error state
6. Add offline behavior
7. Add analytics event if appropriate
8. Add monitoring
9. Test online
10. Test offline

Do not build the entire frontend first and test the backend later.

69. Recommended Folder Responsibilities
backend/
    API
    AI
    external services
    business logic
    monitoring
    push delivery

frontend/components/
    UI
    panels
    user interactions

frontend/lib/
    client-side utilities
    caching
    analytics
    security helpers
    shared application logic

frontend/app/
    application entry points
    global layout
    manifest
70. Final Startup Procedure

Every normal development session:

Terminal 1
cd kanchhi-assistant/backend

source .venv/bin/activate

uvicorn main:app --reload
Terminal 2
cd kanchhi-assistant/frontend

npm run dev

Then open:

http://localhost:3000
71. Final KANCHHI Architecture
                         ┌────────────────────┐
                         │     KANCHHI USER      │
                         └─────────┬──────────┘
                                   │
                                   ▼
                         ┌────────────────────┐
                         │ Next.js Frontend   │
                         │ Dashboard / PWA    │
                         └─────────┬──────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
                Cache          Analytics       Service
                                                 Worker
                    │
                    ▼
                         ┌────────────────────┐
                         │   FastAPI Backend  │
                         └─────────┬──────────┘
                                   │
              ┌────────────────────┼─────────────────────┐
              │                    │                     │
              ▼                    ▼                     ▼
        Core Services        AI Intelligence       User Systems
              │                    │                     │
       Weather / News       Gemini / Routing      Memory / Preferences
       Search / Code        Briefings              Notifications
              │                    │                     │
              └────────────────────┼─────────────────────┘
                                   │
                                   ▼
                         ┌────────────────────┐
                         │ External Services  │
                         ├────────────────────┤
                         │ Gemini             │
                         │ Google Search      │
                         │ Open-Meteo         │
                         │ News Sources       │
                         │ OpenStreetMap      │
                         │ Push Service       │
                         └────────────────────┘
72. KANCHHI Development Status

The planned system currently spans:

Phase 1   Core Foundation
Phase 2   Core Features
Phase 3   Personal Information
Phase 4   Advanced KANCHHI
Phase 5   Intelligence
Phase 6   Automation
Phase 7   Search Intelligence
Phase 8   AI Coding
Phase 9   Full Personalization
Phase 10  Security & Authentication
Phase 11  Voice
Phase 12  Push & Advanced Mobile

The final objective is:

KANCHHI
│
├── Understands the user
├── Understands the user's context
├── Remembers useful information
├── Retrieves information
├── Reasons with AI
├── Personalizes the dashboard
├── Works offline
├── Monitors its services
├── Automates tasks
├── Sends notifications
├── Searches intelligently
├── Helps with programming
├── Supports voice
└── Works as a mobile/PWA application
73. Beginner Rule

When something breaks, do not immediately replace many files.

Use this order:

1. Read the first error
2. Identify the file
3. Identify the API/function involved
4. Test the backend separately
5. Fix the backend if necessary
6. Test the frontend
7. Clear .next if needed
8. Restart the affected server
9. Test again

The most important commands to remember are:

# Backend
uvicorn main:app --reload

# Frontend
npm run dev

# Clear Next.js cache
rm -rf .next

# Check port
lsof -i :3000

# Kill process
kill -9 PID

# Backend health
curl http://localhost:8000/api/system/health

# Full service check
curl "http://localhost:8000/api/system/checks?external=true"

This README can serve as the main beginner guide for installing, running, testing, developing, troubleshooting, and extending KANCHHI.# kanchhi
