# Clinic Assistant Feature Suite: Post-Op Care Dispatcher & Live Clinic/Doctor Availability

Empowering the clinic assistant, front-desk reception, and clinical team with high-impact daily operational tools: procedure-tailored Post-Op Care Instructions with instant WhatsApp dispatch, and a real-time Clinic Open/Closed and Doctor Availability management console displayed directly on the Clinic Portfolio.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following choices were confirmed during the interactive interview:

- **Confirmed Decision 1 (Primary Workflow)**: Procedure-specific **Post-Op Care Instruction Dispatcher** with pre-configured WhatsApp templates, copy-to-clipboard, and printable patient handouts.
- **Confirmed Decision 2 (Secondary Tool)**: **Real-Time Clinic Live Status & Doctor Availability Console**, managed by all non-patient staff (`admin`, `super-admin`, `dentist`, `receptionist`), updating live indicators on the public Clinic Portfolio.
- **Confirmed Decision 3 (Interface Location)**: Integrated directly into the existing **Appointments Tab View** within the staff dashboard for zero-friction access during patient flow.

---

## 1. Overview & Core Concept

- **What It Does**:
  1. **Post-Op Care Dispatcher**: Enables the clinic assistant or dentist to send procedure-specific post-treatment care instructions (e.g. Tooth Extraction, Root Canal, Crown/Bridge, Scaling, Implants, Whitening) directly to the patient's WhatsApp in one click, copy text, or print a clinical care slip.
  2. **Clinic & Doctor Live Status Manager**: Allows any clinic assistant, receptionist, or doctor to set the clinic's real-time operational status (Open, Lunch Break, Emergency Only, Closed) and update doctor on-duty status (Available, In Surgery, On Break, Off-Duty) with optional expected resume times.
  3. **Live Portfolio Presence**: Broadcasts live clinic status and doctor availability to the public Clinic Portfolio so prospective and walk-in patients know clinic readiness before visiting.
- **Target Audience**: Clinic Assistants, Receptionists, Dental Surgeons, and Patients receiving post-treatment care.
- **Key Value**: Eliminates repetitive verbal post-op explanations, reduces post-operative complications via structured WhatsApp care guides, and minimizes walk-in confusion.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Dispatching Post-Op Instructions**:
   - In the **Appointments** view, the assistant locates a completed or ongoing treatment.
   - The assistant clicks the **"Post-Op Care"** button on the appointment card.
   - A modal opens with pre-selected clinical care guidelines matching the appointment's treatment (gauze biting duration, cold compress advice, food restrictions, oral rinse schedule, emergency contact).
   - The assistant clicks **"Send via WhatsApp"** to launch WhatsApp Web/mobile with formatted text (`wa.me/<phone>?text=...`), or clicks **"Copy Text"** or **"Print Slip"**.

2. **Managing Live Clinic Status & Doctor Availability**:
   - At the top of the **Appointments** view, a dedicated **Live Status Control Bar** displays current status.
   - The assistant toggles Clinic Status (`Open`, `Lunch Break`, `Emergency Only`, `Closed`) or updates a doctor's status (`Available`, `In Surgery`, `On Break`, `Off Duty`) with optional note (e.g., "Available from 3:30 PM").
   - Changes persist to Firestore (`clinics/{clinicId}`) in real-time.

3. **Public Clinic Portfolio View**:
   - Visitors on the Clinic Portfolio page see a real-time status pill in the hero and opening hours card (e.g., `🟢 Currently Open for Consultations` or `🟡 Lunch Break · Resumes 2:00 PM`).
   - In the Doctors & Surgeons roster, each doctor card displays their live availability state (e.g., `Available Now`, `In Surgery`).

### Visual Identity & Theme

- **Appointments View Status Bar**:
  - Border: `border border-slate-200/90 dark:border-slate-800 rounded-2xl p-4 bg-white dark:bg-slate-900 shadow-xs`.
  - Status Indicators: Subtle live status markers pairing colors with clear text (`Open` in emerald, `Lunch Break` in amber, `Closed` in rose, `In Surgery` in purple).
- **Post-Op Modal**:
  - Clean medical typography with unboxed bullet points, warning notes, and high-contrast action buttons (`bg-emerald-600 hover:bg-emerald-700` for WhatsApp).

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Direct WhatsApp URL Integration vs. Third-Party Gateway API**
  - *Chosen Approach*: Direct `https://wa.me/{phone}?text={encoded}` integration.
  - *Why*: Instant, zero-cost, requires no paid API keys or webhook servers, and works seamlessly on both desktop WhatsApp Web and mobile WhatsApp apps.

- **Decision 2: Non-Patient Role Gate**
  - *Chosen Approach*: Allowed for all roles except `'patient'` (`role !== 'patient'`).
  - *Why*: Clinic assistants and receptionists are the primary staff managing front-desk walk-in queues and doctor chairs, while doctors and admins also need control.

- **Decision 3: Treatment-Aware Clinical Care Templates**
  - *Chosen Approach*: Rich built-in clinical templates for major dental procedures (Extractions, RCT, Fillings, Implants, Braces, Whitening, Cleaning) with editable custom notes.
  - *Why*: Provides instant high-grade medical accuracy while allowing custom doctor notes.

---

## 4. Technical Architecture & Data Strategy

### System Architecture Diagram

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Staff Dashboard (Appointments)                  │
├────────────────────────────────────────────────────────────────────────┤
│  Top Control Bar: [Live Clinic Status & Doctor Availability Manager]   │
│  • Clinic Mode: [Open | Lunch Break | Closed | Emergency]             │
│  • Doctor Roster: [Dr. Tohid: Available] [Dr. Rao: In Surgery]         │
│  (Managed by Admin, Dentist, Receptionist, Assistant)                  │
├────────────────────────────────────────────────────────────────────────┤
│  Appointment Cards                                                     │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Patient: John Doe · Treatment: Root Canal Treatment              │  │
│  │ [Reschedule] [Billing] ────► [Post-Op Care Instructions 💬]      │  │
│  └──────────────────────────────────┬───────────────────────────────┘  │
└─────────────────────────────────────┼──────────────────────────────────┘
                                      │
                                      ▼
             ┌──────────────────────────────────────────────────┐
             │       Post-Op Care Instruction Dispatcher        │
             │  • Procedure Care Rules (RCT, Extraction, etc.)  │
             │  • Customized Medications & Follow-up Note       │
             │  • [Send WhatsApp] [Copy] [Print Care Slip]      │
             └──────────────────────────────────────────────────┘
                                      │
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Firestore (clinics/{clinicId})                    │
│  • liveStatus: { isOpen, statusMode, customNote, doctorAvailability } │
└─────────────────────────────────────┬──────────────────────────────────┘
                                      │ Real-time Sync
                                      ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      Public Clinic Portfolio Page                      │
│  • Hero & Hours: "🟢 Currently Open · Walk-ins Welcome"               │
│  • Doctor Cards: "Dr. Tohid · Available for Consultations"            │
└────────────────────────────────────────────────────────────────────────┘
```

### Data Schema Additions

```typescript
// types.ts
export type DoctorAvailabilityStatus = 'available' | 'in_surgery' | 'on_break' | 'out_of_clinic';

export interface DoctorAvailability {
  dentistId: string;
  dentistName: string;
  status: DoctorAvailabilityStatus;
  statusNote?: string;
  updatedAt?: string;
  updatedBy?: string;
}

export interface ClinicLiveStatus {
  isOpen: boolean;
  statusMode: 'open' | 'closed' | 'lunch_break' | 'emergency_only';
  customNote?: string;
  expectedResumeTime?: string;
  updatedAt?: string;
  updatedBy?: string;
  doctorAvailability?: Record<string, DoctorAvailability>;
}
```

---

## 5. Implementation Verification & Completed Tasks

- [x] Extended TypeScript interfaces in `src/types.ts` with `DoctorAvailabilityStatus`, `DoctorAvailability`, `ClinicLiveStatus`, and added `liveStatus` to the `Clinic` interface.
- [x] Created `src/components/PostOpCareModal.tsx` containing clinical post-operative instructions for 8 dental procedures (Extractions, Root Canal, Crown/Bridge, Implants, Whitening, Scaling, Braces, General), 1-click WhatsApp dispatcher (`wa.me/<phone>?text=...`), clipboard copy, and printable clinical handout.
- [x] Created `src/components/ClinicLiveStatusBar.tsx` featuring real-time operational status switcher (Open, Lunch Break, Emergency Only, Closed) and doctor availability toggles (Available, In Surgery, On Break, Off Duty) for clinic staff.
- [x] Integrated `ClinicLiveStatusBar` and `PostOpCareModal` into `src/components/Dashboard.tsx` in the Appointments tab view with a dedicated "Post-Op" action button on appointment cards.
- [x] Updated `src/components/LandingPage.tsx` (Clinic Portfolio) to reflect live clinic operational status in Hero and Opening Hours, and show doctor chairside availability badges on specialist cards.
- [x] Added **Clinic Status Scheduling**: Time-window scheduling for clinic operational mode (Lunch Break, Emergency, Closed, Open) with presets (30m, 1h, Lunch, Until 8 PM), custom notes, active banner, and automatic reversion when time expires.
- [x] Added **Doctor Live Availability Scheduling**: Procedure-aware scheduling on doctor cards (In Surgery, On Break, Off Duty) with chair/operatory room assignment, duration presets (15m, 30m, 45m, 60m), and countdown return estimates.
- [x] Added **Strict Clinic Scope Synchronization**: Enforced clinic-scoped doctor filtering across `useClinicData.ts` and `ClinicLiveStatusBar.tsx`, preventing cross-clinic doctor leakage and providing a 1-click `Sync Clinic Doctors` action to prune and synchronize specialists exclusively for the active clinic.
- [x] Verified via concurrent `compile_applet` and `lint_applet` with zero build and type check errors, and restarted dev server.
