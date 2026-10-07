# AssetTrust — AI-Verified Real-World Asset Tokenization & Settlement Platform

> **Hackathon MVP Prototype**  
> AI Document Verification + 100-Point Asset Health Score + Regulatory Compliance Gating + NPCI DRUNIX Permissioned DLT Adapter + Secondary Transfers + Delivery-versus-Payment (DvP) Settlement + Immutable Audit Trail.

---

## 🏛️ Executive Summary

**AssetTrust** bridges physical real-world assets (RWAs)—such as residential properties, commercial complexes, and infrastructure titles—into compliant, fractional digital tokens on enterprise-grade distributed ledger technology.

Traditional tokenization platforms assume asset validity upfront. **AssetTrust introduces algorithmic verification and continuous risk monitoring:**
1. **AI Document Intelligence:** Cross-checks Sub-Registrar Deeds, Municipal Tax Clearances, and IBBI Registered Valuer reports to detect identity mismatches, counterfeit claims, and undisclosed liens.
2. **Transparent 100-Point Asset Health Score:** A weighted, dynamic index across 7 dimensions (Ownership, Documents, Valuation, KYC, Insurance, Encumbrance, Legal Title).
3. **Smart Compliance Gating:** Assets cannot be minted or traded until certified by a Compliance Officer and cleared of conflicting liens.
4. **NPCI DRUNIX Permissioned DLT Integration:** Implements official Hyperledger Fabric v2.5.x smart contract APIs using a development ledger adapter.
5. **Encumbrance & Lien Enforcement:** Registering an active mortgage immediately downgrades the asset health score (e.g., **91 → 68**) and enforces transfer restrictions on secondary markets.
6. **Delivery-versus-Payment (DvP) Settlement:** Atomic token-for-cash exchange utilizing simulated institutional escrow.

---

## ⚡ Quick Start (Windows)

All 3 microservices are pre-configured to run out of the box.

### One-Click Launch (PowerShell)
```powershell
.\start.ps1
```
Or double-click `start.bat`.

### Manual Step-by-Step
```powershell
# 1. Start AI Verification Service (Port 8001)
cd ai-service
python -m uvicorn main:app --host 127.0.0.1 --port 8001

# 2. Start Backend API (Port 5000)
cd backend
npm run build
node dist/index.js

# 3. Start Frontend (Port 3000)
cd frontend
npm run dev -- --port 3000
```

Access the web interface at **`http://localhost:3000`**.

---

## 👥 Demo Accounts (Credentials & Roles)

For judges, the application includes a **One-Click Role Switcher** at the top of the screen to switch identities without re-entering credentials.

| Role | Email | Name | Default Password | Demo Persona |
| :--- | :--- | :--- | :--- | :--- |
| **Asset Owner** | `owner@assettrust.demo` | Rahul Sharma | `Password123!` | Registers properties, uploads deeds, configures tokens |
| **Investor** | `investor@assettrust.demo` | Priya Deshmukh | `Password123!` | Holds fractional tokens, trades on secondary market |
| **Compliance Officer** | `compliance@assettrust.demo` | Ananya Roy | `Password123!` | Audits AI discrepancies, grants tokenization sign-off |
| **Bank / Custodian** | `bank@assettrust.demo` | HDFC Escrow | `Password123!` | Registers mortgages/liens, clears DvP settlement funds |
| **Admin** | `admin@assettrust.demo` | Vikramaditya | `Password123!` | Inspects DRUNIX ledger blocks, system audit streams |

---

## 🏢 Pre-Seeded Demo Assets

The database is pre-seeded with the three exact assets requested:

### 1. Sunrise Residency (`PROP-PUN-001`) — *Clean Verified Asset*
- **Location:** Kalyani Nagar, Pune (Residential 4BHK Penthouse)
- **Owner:** Rahul Sharma
- **Declared Value:** ₹1,00,00,000 (1 Crore INR)
- **Token Supply:** 100,000 SRT Tokens @ ₹1,000/token
- **Status:** `VERIFIED`, `APPROVED`, `TOKENIZED`, `ACTIVE`
- **Asset Health Score:** **91 / 100** (Low Risk / Investment Grade)
  - Ownership: 100% (20/20)
  - Documents: 95% (19/20)
  - Valuation: 90% (14/15)
  - KYC: 100% (15/15)
  - Insurance: 90% (9/10)
  - Encumbrance: 100% (10/10 — Lien free)
  - Legal Review: 80% (8/10)
- **Holdings:** Rahul Sharma holds 98,000 SRT; Priya Deshmukh holds 2,000 SRT.
- **Transfer Status:** `TRANSFERABLE`

### 2. GreenField Commercial Complex (`PROP-COMM-002`) — *Encumbered Asset*
- **Location:** Hinjewadi Phase 1, Pune (Commercial IT Park)
- **Owner:** Rahul Sharma
- **Declared Value:** ₹1,00,00,000
- **Outstanding Loan:** **₹30,00,000** (HDFC Commercial Mortgage)
- **Status:** `ENCUMBERED`
- **Asset Health Score:** **68 / 100** (Moderate Risk)
- **Transfer Status:** **`⚠ RESTRICTED`**
- **Smart Compliance Rule:** Secondary token transfers and settlements are blocked due to an active mortgage charge on title.

### 3. LakeView Property (`PROP-LAKE-003`) — *Ownership Mismatch Discrepancy*
- **Location:** Pashan, Pune (Residential Villa)
- **Declared Value:** ₹75,00,000
- **Status:** `REVIEW`
- **Discrepancy Detected:**
  - Deed Document 1: Registered Owner = `Rahul Sharma`
  - Tax Document 2: Registered Owner = `Rohan Sharma`
- **AI Verification Result:** `REVIEW` (62% confidence, Critical Owner Mismatch Flagged)
- **Asset Health Score:** **52 / 100** (High Risk)
- **Compliance Rule:** Tokenization blocked until owner title discrepancy is rectified.

---

## 🔗 DRUNIX DLT Integration & Transparency Statement

### Transparency Commitment
The National Payments Corporation of India (NPCI) launched **DRUNIX** as an enterprise-grade, permissioned DLT based on an enhanced fork of **Hyperledger Fabric v2.5.x** with SQL database support and stateless validation.

Because the current local environment does not have Docker Desktop running live Fabric peer/orderer containers, AssetTrust integrates via a clean **DRUNIX Development Ledger Adapter**:
- **Status Label:** `"DRUNIX integration pending / development adapter (DRUNIX network not connected)"`
- **No Fabricated Hashes:** Block sequences and SHA-256 state hash trees are logged transparently with clear sequence numbers (`DEV-SEQ-#<n>`).
- **Chaincode Specifications:** Follows the official Fabric v2.5.x contract contract interface (`channel: drunix-rwa-channel`, `chaincode: rwa-token-cc`).

### Implemented Contract Methods
AssetTrust implements all 10 official DLT operations:
1. `CreateAsset`: Anchors initial asset registration metadata.
2. `ReadAsset`: Reads asset title, token, and encumbrance state.
3. `VerifyAsset`: Commits AI verification confidence and report hash.
4. `TokenizeAsset`: Mints token supply with compliance approval proof.
5. `GetTokenBalance`: Queries on-chain investor balances.
6. `TransferToken`: Validates lien freedom and updates investor balances.
7. `FreezeAsset`: Administrative circuit breaker restricting secondary transfers.
8. `AddEncumbrance`: Attaches registered mortgage charges and updates health status.
9. `CreateSettlement`: Anchors delivery-versus-payment agreements.
10. `GetAssetHistory`: Returns the complete chronological block sequence for any asset.

---

## 🎯 Step-by-Step Hackathon Judge Demo Script

### Flow 1: Login & Dashboard Overview
1. Open `http://localhost:3000`.
2. Click **One-Click Hackathon Demo Access: Asset Owner**.
3. View the **Fintech Dashboard**: Total Assets (3), Tokenized Valuation (₹1,00,00,000), Average Health Score (80/100), and Health Score Distribution across low/moderate/high risk tiers.

### Flow 2: AI Document Verification & Mismatch Detection
1. Click **Asset Registry** in the sidebar.
2. Select **LakeView Property** (`PROP-LAKE-003`).
3. Click **AI Document Audit**.
4. Observe the AI Decision:
   - Status: `REVIEW` (62% Confidence).
   - Detected Issue: `"Owner mismatch detected across documents: 'Rahul Sharma' vs 'Rohan Sharma'"`.
   - Health Score: `52/100`.
5. Switch to **Preset 1 (Title PASS)** to observe clean 98% verification.

### Flow 3: Guided Tokenization
1. Open **Sunrise Residency** (`PROP-PUN-001`).
2. Go to **Tokenize Asset**.
3. Walk through the 6-step checklist:
   - Asset Info ✓
   - Documents Verified ✓
   - AI Audit Passed ✓
   - Compliance Approved ✓
   - Token Supply & Price Configured ✓
4. Click **Mint & Anchor Tokens** &rarr; token status updates to `TOKENIZED` on the DRUNIX development ledger adapter.

### Flow 4: Encumbrance & Dynamic Risk Drop (Key Differentiating Feature)
1. Open **Sunrise Residency** (`PROP-PUN-001`). Current Health Score is **91/100**.
2. Click **Add Encumbrance (Risk Demo)**.
3. Enter Lender: `State Bank of India`, Amount: `₹25,00,000`.
4. Click **Register Lien & Lock Asset**.
5. **Observe immediate dynamic change:**
   - Asset Status becomes `ENCUMBERED`.
   - Health Score drops from **91 → 79/100** (Encumbrance score becomes 0/10).
   - Red Alert appears: `⚠ Transfer Restricted: Outstanding loan / encumbrance detected`.

### Flow 5: Secondary Transfer Rejection vs Success
1. Go to **Token Holdings** (`/portfolio`).
2. Try transferring tokens from an encumbered asset:
   - Click **Transfer** on the encumbered asset.
   - Enter recipient `investor@assettrust.demo`, Amount: `500`.
   - Click **Execute DLT Transfer**.
   - Result: **TRANSFER BLOCKED** with clear compliance explanation.
3. Discharge the encumbrance on the asset detail page &rarr; Health restored &rarr; Transfer succeeds immediately!

### Flow 6: Delivery-versus-Payment (DvP) Settlement
1. Go to **Settlement Engine** (`/settlements`).
2. Select **Sunrise Residency**, 100 tokens (₹1,00,000 total).
3. Click **Create Settlement Order** &rarr; Status becomes `CREATED`.
4. Click **Simulate Payment & Fulfill**:
   - Escrow payment cleared (`Simulated Payment Adapter`).
   - Title freedom confirmed.
   - Tokens delivered atomically to buyer.
   - Status becomes `COMPLETED`.

### Flow 7: Immutable Audit Trail & DRUNIX Block Explorer
1. Navigate to **DRUNIX & Admin** (`/admin`).
2. Inspect the **DRUNIX Ledger Block Explorer**:
   - See sequential block numbers (`Block #1`, `Block #2`...).
   - Review SHA-256 `previous_hash` and `block_hash` chaining.
   - Review transparent status labels.

---

## 🛠️ Technology Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS, Lucide Icons, React Router DOM.
- **Backend API:** Node.js v22/v26, Express, TypeScript, native ACID `node:sqlite` persistence.
- **AI Verification Service:** Python 3.11+, FastAPI, Uvicorn, Pydantic, Regularized Regex & Heuristic Title Parsers.
- **Distributed Ledger:** NPCI DRUNIX Permissioned DLT (Hyperledger Fabric v2.5.x Spec Adapter).
- **Security:** Bcrypt password hashing, JWT session authentication, Role-Based Access Control (RBAC).

---

## 🐳 Docker Deployment (Optional)

```bash
docker-compose up --build
```
This builds and spins up:
- `assettrust-ai`: port 8001
- `assettrust-backend`: port 5000
- `assettrust-frontend`: port 3000

---

## 📜 License
Apache License 2.0. Built for Hackathon Demonstration.
