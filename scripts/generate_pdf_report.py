import os
import subprocess

HTML_CONTENT = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Smaran - Technical Architecture & Tech Stack Specification</title>
<style>
  @page {
    size: A4;
    margin: 18mm 15mm 20mm 15mm;
    @bottom-right {
      content: counter(page);
    }
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #1e293b;
    background-color: #ffffff;
    line-height: 1.55;
    font-size: 13px;
    margin: 0;
    padding: 0;
  }

  .header-card {
    border-radius: 16px;
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0369a1 100%);
    color: #ffffff;
    padding: 28px 32px;
    margin-bottom: 28px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .app-tag {
    display: inline-block;
    background: rgba(255, 255, 255, 0.18);
    backdrop-filter: blur(8px);
    color: #38bdf8;
    font-weight: 800;
    font-size: 11px;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    padding: 4px 12px;
    border-radius: 20px;
    margin-bottom: 10px;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .header-title {
    font-size: 26px;
    font-weight: 900;
    margin: 0 0 6px 0;
    letter-spacing: -0.02em;
    color: #ffffff;
  }

  .header-subtitle {
    font-size: 14px;
    color: #cbd5e1;
    margin: 0 0 16px 0;
    font-weight: 500;
  }

  .meta-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.15);
    padding-top: 14px;
    font-size: 11px;
  }

  .meta-item strong {
    display: block;
    color: #94a3b8;
    text-transform: uppercase;
    font-size: 9.5px;
    letter-spacing: 0.05em;
    margin-bottom: 2px;
  }

  .meta-item span {
    color: #f1f5f9;
    font-weight: 600;
  }

  h2 {
    font-size: 17px;
    font-weight: 800;
    color: #0f172a;
    border-bottom: 2px solid #e2e8f0;
    padding-bottom: 6px;
    margin-top: 26px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  h3 {
    font-size: 14px;
    font-weight: 700;
    color: #0369a1;
    margin-top: 16px;
    margin-bottom: 6px;
  }

  p {
    margin: 0 0 10px 0;
    color: #334155;
  }

  .card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 14px 18px;
    margin-bottom: 14px;
    page-break-inside: avoid;
  }

  .badge {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 6px;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
  }

  .badge-blue { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
  .badge-green { background: #dcfce7; color: #15803d; border: 1px solid #bbf7d0; }
  .badge-purple { background: #f3e8ff; color: #7e22ce; border: 1px solid #e9d5ff; }
  .badge-amber { background: #fef3c7; color: #b45309; border: 1px solid #fde68a; }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0;
    font-size: 11.5px;
    page-break-inside: avoid;
  }

  th {
    background: #f1f5f9;
    color: #334155;
    font-weight: 700;
    text-align: left;
    padding: 8px 12px;
    border: 1px solid #cbd5e1;
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  td {
    padding: 8px 12px;
    border: 1px solid #e2e8f0;
    vertical-align: top;
    color: #334155;
  }

  tr:nth-child(even) td {
    background: #f8fafc;
  }

  .benefit-box {
    background: #ecfdf5;
    border-left: 4px solid #10b981;
    padding: 10px 14px;
    margin: 8px 0 12px 0;
    border-radius: 0 8px 8px 0;
    font-size: 12px;
  }

  .benefit-title {
    font-weight: 700;
    color: #065f46;
    margin-bottom: 3px;
  }

  .diagram-box {
    background: #0f172a;
    color: #f8fafc;
    border-radius: 10px;
    padding: 14px;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11px;
    line-height: 1.4;
    overflow-x: auto;
    margin: 12px 0;
    page-break-inside: avoid;
  }

  .grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
    page-break-inside: avoid;
  }

  .footer-note {
    text-align: center;
    font-size: 10.5px;
    color: #64748b;
    border-top: 1px solid #e2e8f0;
    padding-top: 12px;
    margin-top: 28px;
    page-break-inside: avoid;
  }

  .page-break {
    page-break-before: always;
  }
</style>
</head>
<body>

  <!-- EXECUTIVE COVER HEADER -->
  <div class="header-card">
    <span class="app-tag">Clinical & Technical Specification</span>
    <h1 class="header-title">Smaran (স্মৰণ) — Technical Stack & Architecture Report</h1>
    <p class="header-subtitle">Full-Stack Offline-First Cognitive Wellness, Bhashini AI Multilingual Voice & GPS Geofencing System for Dementia & Alzheimer’s Care</p>
    
    <div class="meta-grid">
      <div class="meta-item">
        <strong>Platform</strong>
        <span>Web, Mobile PWA, Tablet</span>
      </div>
      <div class="meta-item">
        <strong>Languages Supported</strong>
        <span>Assamese, Bodo, English, Hindi</span>
      </div>
      <div class="meta-item">
        <strong>Target Condition</strong>
        <span>Early to Moderate Dementia</span>
      </div>
      <div class="meta-item">
        <strong>Repository / Branch</strong>
        <span>imaritradas/smaran (main)</span>
      </div>
    </div>
  </div>

  <!-- SECTION 1: SYSTEM OVERVIEW -->
  <h2>1. System Architecture Overview</h2>
  <p>
    Smaran is engineered as a resilient, dual-portal digital companion comprising an accessible patient interface and a clinical caregiver monitoring console. The system bridges severe infrastructural gaps in elderly dementia management: <strong>offline rural resilience</strong>, <strong>indigenous North-Eastern dialect communication</strong>, and <strong>active wandering prevention</strong>.
  </p>

  <div class="diagram-box">
+-----------------------------------------------------------------------------------+
|                            PATIENT DEVICE (PWA / BROWSER)                         |
|  [Daily Activities & Games]    [Take Me Home SOS]    [Bhashini Multilingual Voice]|
|            |                           |                           |              |
|   +-------------------+       +-------------------+       +-------------------+   |
|   | IndexedDB Store   |       | HTML5 Geolocation |       | Web Speech Queue  |   |
|   | (idb v8 - Offline)|       | (45s Throttled)   |       | (Offline Fallback)|   |
|   +-------------------+       +-------------------+       +-------------------+   |
+------------------------------------------|----------------------------------------+
                                           | Background Sync & Rest API
                                           v
+-----------------------------------------------------------------------------------+
|                            SMARAN BACKEND ENGINE (Next.js 14)                     |
|  - Next.js Route Handlers (/api/bhashini, /api/location, /api/trends, /api/sync)  |
|  - Mathematical Geofence Engine (Haversine Distance & Azimuth Bearing)            |
|  - Longitudinal Cognitive Trend Engine (Intake Baseline & 14-Day Rolling Window)   |
|  - Dual-Mode Storage Layer (Atomic JSON Store & Cloud Firestore)                  |
+------------------------------------------|----------------------------------------+
                                           v
+-----------------------------------------------------------------------------------+
|                            CAREGIVER DASHBOARD PORTAL                             |
|  [Clinical Longitudinal Verdict]   [Live Geofence Radar]   [Prescriptive Plan]    |
+-----------------------------------------------------------------------------------+
  </div>

  <!-- SECTION 2: CORE FRAMEWORK & RUNTIME -->
  <h2>2. Core Framework, Language & Runtime</h2>
  
  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: baseline;">
      <h3 style="margin-top: 0;">Next.js 14 (App Router & Route Handlers)</h3>
      <span class="badge badge-blue">Framework &bull; v14.2.35</span>
    </div>
    <p>
      <strong>Role in Smaran:</strong> Serves as the full-stack backbone. It powers dynamic patient interfaces, static pages, and protected server-side Route Handlers (such as <code>/api/bhashini/tts</code> and <code>/api/location</code>).
    </p>
    <div class="benefit-box">
      <div class="benefit-title">&check; Architectural Rationale & Advantages over Alternatives:</div>
      <strong>1. Absolute Secret Protection:</strong> Pure client-side apps (Vite, Create-React-App) expose API keys in browser network inspection. Next.js Route Handlers guarantee that government Bhashini tokens, Udyat credentials, and Firebase Admin private keys never leave the server.<br>
      <strong>2. Fast Static & Hybrid Optimization:</strong> Delivers pre-compiled lightweight client assets with a shared JS footprint of only 87.3 kB, ensuring zero lag on budget tablets.<br>
      <strong>3. Unified Codebase:</strong> Eliminates the operational complexity, CORS configuration hurdles, and deployment desynchronization of maintaining separate React and Express/Node repositories.
    </div>
  </div>

  <div class="grid-2">
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h3 style="margin-top: 0;">TypeScript 5</h3>
        <span class="badge badge-blue">Language &bull; v5.x</span>
      </div>
      <p>
        <strong>Role:</strong> Comprehensive static type safety across data contracts (<code>types.ts</code>), GPS coordinates, game metrics, and executive verdicts.
      </p>
      <div class="benefit-box">
        <div class="benefit-title">&check; Benefit over JavaScript:</div>
        Guarantees compile-time validation. Prevents fatal runtime errors such as <code>undefined</code> coordinates during spatial distance calculations or NaN scores in cognitive evaluations.
      </div>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h3 style="margin-top: 0;">React 18</h3>
        <span class="badge badge-blue">UI Runtime &bull; v18.x</span>
      </div>
      <p>
        <strong>Role:</strong> Declarative component system powering games, memory recall, and real-time caregiver monitoring.
      </p>
      <div class="benefit-box">
        <div class="benefit-title">&check; Benefit over Vue / Angular:</div>
        Seamless integration with Next.js Server Components, concurrent rendering hooks, and zero overhead for state updates during SVG radar scanning.
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 3: STYLING & ACCESSIBILITY -->
  <h2>3. Styling, Typography & Dementia Accessibility System</h2>

  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: baseline;">
      <h3 style="margin-top: 0;">Tailwind CSS + CSS Design Tokens</h3>
      <span class="badge badge-purple">Design System &bull; v3.4.1</span>
    </div>
    <p>
      <strong>Role:</strong> Provides utility-first styling with custom CSS variables (<code>--bg-primary</code>, <code>--surface-raised</code>, <code>--text-primary</code>) for instant light and dark theme switching.
    </p>
    <div class="benefit-box">
      <div class="benefit-title">&check; Why Used & Advantages over Component Libraries (MUI, AntD, Chakra):</div>
      <strong>1. Zero Runtime JS Overhead:</strong> UI component libraries ship 200KB-400KB of runtime styling logic, creating noticeable input lag for elderly users on mobile browsers. Tailwind compiles down to a compact, static stylesheet.<br>
      <strong>2. Strict Dementia Accessibility (WCAG AAA):</strong> Allows precise configuration of minimum 48x48px touch targets, high-contrast color ratios, large readable typography, and soft glassmorphic visual cues that avoid sensory overload.
    </div>
  </div>

  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: baseline;">
      <h3 style="margin-top: 0;">Native Vector SVG Visualization (Zero Chart Dependency)</h3>
      <span class="badge badge-purple">Visual Analytics</span>
    </div>
    <p>
      <strong>Role:</strong> Handcrafted mathematical SVG graphics powering the dual-ring dials, baseline needles, sparklines, and GPS scanning radar.
    </p>
    <div class="benefit-box">
      <div class="benefit-title">&check; Benefit over Chart.js / Recharts / D3.js:</div>
      Heavy graphing libraries add 150KB-300KB of bloated JavaScript dependencies and trigger SSR hydration mismatches in Next.js. Custom SVG components render instantaneously, scale to any display resolution, and animate smoothly using hardware-accelerated CSS keyframes.
    </div>
  </div>

  <!-- SECTION 4: STORAGE & OFFLINE ARCHITECTURE -->
  <h2>4. Storage & Offline-First Data Architecture</h2>

  <table style="margin-top: 8px;">
    <thead>
      <tr>
        <th style="width: 25%;">Layer</th>
        <th style="width: 22%;">Technology</th>
        <th style="width: 53%;">Architectural Rationale & Advantage</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Client Database</strong></td>
        <td><code>IndexedDB</code> via <code>idb</code> (v8.0.3)</td>
        <td>
          Dementia patients frequently travel or reside in remote areas with poor internet. IndexedDB stores sessions, game accuracy, and check-ins asynchronously with structured indexing (<code>by-synced</code>, <code>by-patient</code>). Unlike LocalStorage (5MB cap, synchronous blocking), IndexedDB handles hundreds of megabytes without freezing the UI.
        </td>
      </tr>
      <tr>
        <td><strong>Dual-Mode Server Store</strong></td>
        <td>File-backed JSON Store + Cloud Firestore</td>
        <td>
          <code>src/lib/serverStore.ts</code> provides a zero-configuration atomic file database (<code>.data/smaran-db.json</code>) for instant local deployment and hackathons, while seamlessly upgrading to Google Cloud Firestore when cloud credentials are configured.
        </td>
      </tr>
      <tr>
        <td><strong>Cross-Tab Sync</strong></td>
        <td>HTML5 <code>BroadcastChannel</code> API</td>
        <td>
          Instantly synchronizes updates (such as caregiver adding a reminder or changing patient language) across all open tabs and windows in real-time without requiring expensive WebSocket servers or battery-draining polling loops.
        </td>
      </tr>
    </tbody>
  </table>

  <!-- SECTION 5: AI VOICE & NATURAL LANGUAGE -->
  <h2>5. Multilingual AI Voice & Natural Language (Bhashini)</h2>

  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: baseline;">
      <h3 style="margin-top: 0;">Bhashini ULCA & Dhruva Neural Voice Engine (MeitY, Govt. of India)</h3>
      <span class="badge badge-green">Indigenous AI &bull; REST API</span>
    </div>
    <p>
      <strong>Role:</strong> Converts text into natural, native speech and recognizes spoken input for North-Eastern languages: <strong>Assamese (<code>as</code>)</strong>, <strong>Bodo (<code>brx</code>)</strong>, <strong>English (<code>en</code>)</strong>, and <strong>Hindi (<code>hi</code>)</strong>.
    </p>
    <div class="benefit-box">
      <div class="benefit-title">&check; Benefit over Google Cloud Speech & AWS Polly:</div>
      <strong>1. Authentic North-Eastern Dialects:</strong> Western AI platforms lack native conversational models for Bodo and indigenous dialects, producing robotic and misleading pronunciations that disorient dementia patients. Bhashini provides culturally authentic voices.<br>
      <strong>2. National Sovereign Infrastructure:</strong> Built on Digital India public digital infrastructure, respecting privacy and sovereign data protocols.
    </div>
  </div>

  <div class="card">
    <div style="display: flex; justify-content: space-between; align-items: baseline;">
      <h3 style="margin-top: 0;">Web Speech API Fallback & Speech Queue Engine</h3>
      <span class="badge badge-green">Resilience Layer</span>
    </div>
    <p>
      <strong>Role:</strong> Located in <code>src/lib/i18n.ts</code>. If Bhashini network latency exceeds 3 seconds or the device is offline, it instantly routes speech through browser speech synthesis with zero UI hang.
    </p>
    <div class="benefit-box">
      <div class="benefit-title">&check; Solved Engineering Challenges:</div>
      Implements an in-memory speech FIFO queue to prevent overlapping voices, handles Chrome's known 15-second speech synthesis pause bug, and caches base64 audio to minimize network data consumption.
    </div>
  </div>

  <div class="page-break"></div>

  <!-- SECTION 6: GEOLOCATION & GEOFENCING -->
  <h2>6. Geolocation, Safe-Zone Geofencing & 'Take Me Home' SOS</h2>

  <div class="grid-2">
    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h3 style="margin-top: 0;">HTML5 Geolocation API</h3>
        <span class="badge badge-amber">Spatial API</span>
      </div>
      <p>
        <strong>Implementation:</strong> <code>PatientGPSBeacon.tsx</code> uses <code>navigator.geolocation.watchPosition</code> with high accuracy and a 45-second throttling window.
      </p>
      <div class="benefit-box">
        <div class="benefit-title">&check; Advantage:</div>
        Eliminates the requirement for families to purchase expensive proprietary GPS hardware trackers; functions on any smartphone the patient carries.
      </div>
    </div>

    <div class="card">
      <div style="display: flex; justify-content: space-between; align-items: baseline;">
        <h3 style="margin-top: 0;">Haversine & Azimuth Engine</h3>
        <span class="badge badge-amber">Spherical Math</span>
      </div>
      <p>
        <strong>Implementation:</strong> Pure mathematical computation in <code>serverStore.ts</code> for spherical distance and forward azimuth degrees (0&deg;-360&deg;).
      </p>
      <div class="benefit-box">
        <div class="benefit-title">&check; Advantage:</div>
        Instant zero-latency boundary breach detection and real-time rotating compass navigation with zero Google Maps API costs.
      </div>
    </div>
  </div>

  <div class="card">
    <h3 style="margin-top: 0;">Clinical Wandering Prevention & Emergency Assistance Flow</h3>
    <ul style="margin: 0; padding-left: 20px; color: #334155; line-height: 1.6;">
      <li><strong>Automatic Geofence Breach:</strong> If distance to home exceeds the configured safe radius (100m - 2000m), the server automatically dispatches an immediate high-priority wandering advisory alert.</li>
      <li><strong>Compassionate "Take Me Home" Modal:</strong> When a confused patient presses the emergency button, Bhashini speaks reassuring words in their native tongue: <em>"Don't worry, we are helping you get home. Your family has been notified with your exact location."</em></li>
      <li><strong>Visual Orientation:</strong> Displays a high-contrast compass pointer oriented towards home, distance in meters, and a 1-tap phone dialer to call the caregiver.</li>
    </ul>
  </div>

  <!-- SECTION 7: CLINICAL DATA MODEL -->
  <h2>7. Clinical Cognitive Domain Modeling & Verdict</h2>

  <table style="margin-top: 8px;">
    <thead>
      <tr>
        <th style="width: 22%;">Cognitive Domain</th>
        <th style="width: 26%;">Smaran Activity</th>
        <th style="width: 52%;">Clinical Diagnostic Purpose</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Short-Term Memory</strong></td>
        <td>Memory Match (Visual card pairing)</td>
        <td>Assesses hippocampal recall retention and visual memory deterioration.</td>
      </tr>
      <tr>
        <td><strong>Visuomotor Attention</strong></td>
        <td>Spot and Tap (Target detection)</td>
        <td>Monitors reaction latency (ms), visual discrimination, and motor speed.</td>
      </tr>
      <tr>
        <td><strong>Pattern Recognition</strong></td>
        <td>Sequence Recall (Forward color span)</td>
        <td>Evaluates prefrontal working memory capacity and structured logic.</td>
      </tr>
      <tr>
        <td><strong>Procedural Memory</strong></td>
        <td>Routine Recall (Daily task ordering)</td>
        <td>Measures ability to order activities of daily living (brushing, breakfast, medicine).</td>
      </tr>
    </tbody>
  </table>

  <div class="card">
    <h3 style="margin-top: 0;">Longitudinal Assessment & 14-Day Rolling Baseline</h3>
    <p>
      Unlike single-instance tests which are skewed by acute fatigue or dehydration, <code>src/lib/trends.ts</code> computes an <strong>Intake Baseline</strong> and evaluates a <strong>14-day rolling window</strong>. It automatically outputs a unified <strong>Executive Cognitive Verdict</strong> with risk categorization (<em>Optimal</em>, <em>Stable</em>, <em>Moderate Risk</em>, <em>Elevated Risk</em>) and prescriptive care plan recommendations.
    </p>
  </div>

  <!-- SECTION 8: FULL SUMMARY MATRIX -->
  <h2>8. Complete Technology Stack Matrix</h2>

  <table>
    <thead>
      <tr>
        <th>Component</th>
        <th>Technology</th>
        <th>Version</th>
        <th>Key Differentiating Benefit</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Framework</strong></td>
        <td>Next.js (App Router)</td>
        <td>14.2.35</td>
        <td>Server-side secret isolation, unified fullstack repo, fast PWA delivery</td>
      </tr>
      <tr>
        <td><strong>Language</strong></td>
        <td>TypeScript</td>
        <td>5.x</td>
        <td>Guaranteed type safety across medical metrics & spatial coordinates</td>
      </tr>
      <tr>
        <td><strong>Styling</strong></td>
        <td>Tailwind CSS</td>
        <td>3.4.1</td>
        <td>Near-zero runtime styling overhead; WCAG AAA dementia accessibility</td>
      </tr>
      <tr>
        <td><strong>Data Visuals</strong></td>
        <td>Custom Vector SVGs</td>
        <td>Native</td>
        <td>Zero chart library bundle bloat; hardware-accelerated fluid rendering</td>
      </tr>
      <tr>
        <td><strong>Offline Store</strong></td>
        <td>IndexedDB (via <code>idb</code>)</td>
        <td>8.0.3</td>
        <td>Unlimited asynchronous storage; full gameplay without network access</td>
      </tr>
      <tr>
        <td><strong>Server Store</strong></td>
        <td>Dual-Store (JSON + Firestore)</td>
        <td>v12 / v14</td>
        <td>Zero-config file persistence with seamless cloud enterprise upgrade</td>
      </tr>
      <tr>
        <td><strong>Cross-Tab Sync</strong></td>
        <td>BroadcastChannel API</td>
        <td>Native</td>
        <td>Instant zero-battery cross-window synchronization without WebSockets</td>
      </tr>
      <tr>
        <td><strong>Regional AI Voice</strong></td>
        <td>Bhashini Dhruva / ULCA</td>
        <td>v0 Pipeline</td>
        <td>Indigenous North-Eastern language voices (Assamese, Bodo, Hindi)</td>
      </tr>
      <tr>
        <td><strong>Speech Fallback</strong></td>
        <td>Web Speech API + FIFO Queue</td>
        <td>Native</td>
        <td>Zero voice overlap; handles Chrome 15s utterance pause bug smoothly</td>
      </tr>
      <tr>
        <td><strong>Location Sensor</strong></td>
        <td>HTML5 Geolocation</td>
        <td>Native</td>
        <td>Battery-friendly 45s throttled position tracking on any smartphone</td>
      </tr>
      <tr>
        <td><strong>Geofence Math</strong></td>
        <td>Haversine & Azimuth Engine</td>
        <td>Native</td>
        <td>Millisecond spatial boundary checking with zero Google Maps API costs</td>
      </tr>
    </tbody>
  </table>

  <!-- FOOTER -->
  <div class="footer-note">
    <strong>Smaran (স্মৰণ) Cognitive Wellness Platform</strong> &bull; Generated for Technical & Clinical Evaluation &bull; Open-Source Repository: <code>https://github.com/imaritradas/smaran</code>
  </div>

</body>
</html>
"""

def generate_pdf():
    html_path = "/tmp/smaran_tech_stack_report.html"
    pdf_dest_public = "/Users/aritra651/CODING_ENV/Coding_AntiGravity/smaran/public/Smaran_Tech_Stack_and_Architecture_Report.pdf"
    pdf_dest_root = "/Users/aritra651/CODING_ENV/Coding_AntiGravity/smaran/Smaran_Tech_Stack_and_Architecture_Report.pdf"

    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_CONTENT)
    print(f"Generated HTML report at {html_path}")

    chrome_cmd = [
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
        "--headless=new",
        "--disable-gpu",
        f"--print-to-pdf={pdf_dest_public}",
        html_path
    ]

    print("Compiling PDF with Headless Google Chrome...")
    res = subprocess.run(chrome_cmd, capture_output=True, text=True)
    if res.returncode != 0:
        print("Error compiling PDF:", res.stderr)
        return False

    # Copy to root directory as well
    subprocess.run(["cp", pdf_dest_public, pdf_dest_root])
    
    size_bytes = os.path.getsize(pdf_dest_public)
    print(f"Successfully created PDF: {pdf_dest_public} ({size_bytes} bytes)")
    print(f"Successfully copied PDF to root: {pdf_dest_root}")
    return True

if __name__ == "__main__":
    generate_pdf()
