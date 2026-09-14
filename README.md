# Smaran (स्मरण)

**AI-Based Cognitive Gaming and Memory Assistance Platform for Elderly Dementia Patients in North Eastern Region (NER)**

Built for **Smart India Hackathon 2026** • Problem Statement **SIH26003**

---

## 📌 Project Overview

Elderly dementia patients in India's North Eastern Region (NER) face distinct barriers: limited geriatric healthcare facilities, digital literacy constraints, intermittent internet connectivity, and linguistic diversity (Assamese, Bodo, Khasi, and more) rarely supported by mainstream cognitive apps.

**Smaran** bridges this gap with:
1. **Voice-First, Regional-Language Patient Experience**: Designed for low-literacy elders with high-contrast UI (60px+ tap targets, WCAG AAA contrast, warm earth tones), regional speech-to-speech interaction via Bhashini API, and 5 clinically-grounded mini-games.
2. **Offline-First Resilience**: All core games function seamlessly without an internet connection using browser IndexedDB storage and automatic two-way background sync whenever connectivity is restored.
3. **Caregiver & Community Health Worker (ASHA) Loop**: A dedicated dashboard tracking longitudinal cognitive trends across 4 clinical domains, early decline alerts, daily routine reminders, and zero-cost family memory albums.

---

## ⚖️ Non-Negotiable Clinical & Ethical Position

> **"We are not diagnosing dementia — this is cognitive engagement, monitoring & assistance"**

Smaran explicitly disclaims any diagnostic authority. The platform is an engagement and monitoring tool designed to assist caregivers and clinicians in observing longitudinal behavioral shifts. It does not replace formal clinical assessment (e.g., HMSE, MoCA).

---

## 🎮 5 Clinically-Grounded Mini-Games

| Game | Clinical Domain | Description | Regional Context |
| :--- | :--- | :--- | :--- |
| **Memory Match** | Short-Term Memory | 4-pair (8 cards) visual card matching | Assamese Dhol, Lotus, Hornbill, Tea Leaf |
| **Spot & Tap** | Sustained Attention | Target identification among distractors (reaction time & errors) | Kaziranga One-Horned Rhinoceros |
| **Sequence Recall** | Working Memory | Simon-style pattern repetition with visual cues and Web Audio tones | 4 melodic tones & vibrant visual pads |
| **Routine Recall** | Executive Function | Chronological ordering of daily living activities (morning to night) | Daily bathing, Assam tea, meals, rest |
| **Family Faces** | Emotional Comfort | Photo recognition of loved ones with spoken identity reveal | Family photos, relationship titles (বৰ ল'ৰা, etc.) |

---

## 🏗️ Architecture & Technology Stack

- **Framework**: Next.js 14 (App Router, pinned to 14.2.35)
- **Styling**: Tailwind CSS v3 with custom palette (`sand-50`, `navy-900`, `coral-500`, `teal-500`, `amber-500`, `sage-500`)
- **Typography**: Atkinson Hyperlegible (high legibility for low-vision and elderly users)
- **Offline Storage**: Client-side IndexedDB via `idb` with automatic batch sync
- **Cloud Database & Auth**: Firebase Firestore (Spark zero-cost tier) & Firebase Auth (anonymous patient pairing)
- **Regional Voice**: Government of India Bhashini ULCA API (TTS & ASR pipeline) with server-side proxy
- **Zero-Cost Storage**: Client-side canvas compression (<500KB) stored directly as Base64 strings in Firestore documents (NO Firebase Storage, NO Blaze plan required)
- **Notification Loop**: Caregiver decline alerts with pluggable SMS client (console-log mode by default)

---

## 🚀 Getting Started Locally

### 1. Prerequisites
- Node.js 18+ or 20+
- npm 9+

### 2. Installation
```bash
git clone https://github.com/your-username/smaran.git
cd smaran
npm install
```

### 3. Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```
Fill in your Firebase and Bhashini credentials. All secrets default to placeholder strings and the application will gracefully fall back to local offline mode for evaluation.

### 4. Running the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser:
- **Landing Page**: [http://localhost:3000](http://localhost:3000)
- **Patient App**: [http://localhost:3000/patient](http://localhost:3000/patient)
- **Caregiver Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)

---

## 🔒 Zero-Cost Firestore Security Rules

Firestore security rules are provided in `firestore.rules`. Deploy using Firebase CLI:
```bash
firebase deploy --only firestore:rules
```

---

## 📜 License

MIT License. Designed and developed for Smart India Hackathon 2026 (SIH26003).
