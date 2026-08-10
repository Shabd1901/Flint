# Flint — Product Requirements Document

**PS-01: Secure, proctored examination tool to screen and shortlist candidates for hackathons.**
**Phase:** 1 (MVP) | **Owner:** Hmm | **Status:** Draft

---

## 1. What Flint is

Flint is a hierarchical exam, contest, and assignment platform. One institution can host many independent admins (teachers, hackathon organizers, club leads), each running their own classes, contests, and screening tests, without stepping on each other's data — while a top-level maintainer can see and fix anything across the whole system.

Flint is not a video-proctoring product. Phase 1 deliberately uses **event-based integrity signals** (tab switches, fullscreen exits, copy-paste, multi-session detection) instead of camera or eye-tracking — cheaper to run, no consent/privacy overhead, and good enough to catch the overwhelming majority of real cheating at screening scale.

---

## 2. Problem

Colleges and hackathon organizers currently stitch together 3-4 disconnected tools to run a single event:

1. **MCQ screening tests** are run on Google Forms or generic quiz tools with zero integrity signal — a candidate can Google every answer with no trace.
2. **Assignments** live in Google Classroom / email / WhatsApp — no versioning, no plagiarism signal, no per-class ownership when multiple teachers run parallel sections.
3. **Coding rounds / hackathon screening** get run through ad-hoc HackerRank-style tools that cost real money per seat, or organizers manually eyeball code — neither scales past a few hundred candidates.
4. **No real hierarchy.** A college has many teachers and many events happening in parallel, each needing isolated data (a teacher shouldn't see another teacher's class), but someone (IT admin, event lead) still needs override access when a candidate is locked out or a bug needs fixing mid-exam.

Flint solves all four with one login system and one data model.

---

## 3. Goals (Phase 1)

- One candidate login works across every exam/contest/assignment they're enrolled in.
- Any admin can independently create and run: MCQ tests, coding contests, and assignments — scoped to their own class/cohort.
- Built-in integrity signals for timed tests, without cameras.
- A maintainer role that can see across all admins/orgs to debug or intervene.
- Runs entirely on free/low-cost serverless infrastructure at pilot scale (up to ~150-200 concurrent candidates per live session).

## 4. Non-goals (Phase 1 — explicitly out of scope)

- Camera-based proctoring, eye tracking, face verification, gaze detection.
- AI-based plagiarism/essay scoring.
- Payments/billing inside the product.
- Native mobile apps (web, mobile-responsive only).
- Multi-institution marketplace (each deployment serves one institution to start).

---

## 5. Roles & hierarchy

```
Maintainer  (1 or few, cross-org superuser)
   └── Admin  (per class / event / club — many, independent of each other)
          └── Candidate  (enrolled under one or more admins)
```

| Role | Who | Can do |
|---|---|---|
| **Maintainer** | Platform owner / IT lead | Full override access across every admin's orgs, exams, and candidates. View system health, unlock stuck sessions, impersonate for debugging, manage admin accounts. |
| **Admin** | Teacher / hackathon organizer / club lead | Create and manage their own classes/cohorts. Create MCQ exams, coding contests, and assignments scoped only to their own candidates. Cannot see other admins' data. Review submissions, view integrity flags, export shortlists. |
| **Candidate** | Student / hackathon applicant | Joins classes/events via invite code or admin enrollment. Takes exams, submits contest solutions, uploads assignments. Sees only their own results. |

Data isolation between admins is a hard requirement — this is the "hierarchical, safe, scalable" part of the brief, enforced at the database level (see TRD, Row-Level Security).

---

## 6. Core modules

### 6.1 Proctored MCQ Exams
- Admin builds a question bank (MCQ, single/multi-select), sets duration, question randomization, negative marking (optional).
- Candidate takes exam in a locked-down browser view: forced fullscreen, disabled copy-paste/right-click/devtools.
- Every integrity-relevant event (tab switch, fullscreen exit, blur, multi-tab open) is logged with a timestamp and rolled into a per-candidate **violation score**.
- Server-side timer — auto-submit on expiry regardless of client clock.
- Auto-graded instantly on submit.
- Admin dashboard: ranked results + violation flags side by side, so a high scorer with high violations gets a manual second look instead of being silently shortlisted or silently disqualified.

### 6.2 Assignments (Google-Classroom-style, not timed/proctored)
- Admin posts an assignment: instructions, optional attachment, due date.
- Candidate submits a file upload and/or link (e.g. GitHub repo, Drive link).
- Late submission clearly flagged, not blocked.
- Admin grades manually with a score + optional comment. No auto-eval in Phase 1.
- Full submission history retained (resubmission before deadline overwrites with version history kept).

### 6.3 Contests / Hackathon coding rounds (basic HackerRank-style)
- Admin creates a problem set: problem statement, starter code (optional), and a set of test cases (input → expected output), each marked sample (visible) or hidden.
- Candidate writes code in-browser, runs against sample test cases on demand, submits for full evaluation against all test cases.
- Code runs in an isolated execution sandbox (not inside the main app server) — supports a small set of common languages to start (e.g. Python, JavaScript, C++, Java).
- Score = test cases passed (weighted, optional partial credit). Live leaderboard per contest.
- Time-boxed like MCQs (start/end window, optional per-candidate duration) with the same server-side timer discipline.

---

## 7. Success metrics (pilot)

- A single admin can go from "create exam" to "candidates taking it" in under 10 minutes with no support needed.
- Zero cross-admin data leaks in a multi-admin pilot (verified via RLS test suite, not just manual QA).
- Violation-flag precision: manually spot-checked flags should correlate with actual suspicious behavior often enough that admins trust the score instead of ignoring it.
- Handles one live session of 150+ concurrent candidates without dropped connections or timer drift.

## 8. Future phases (explicitly not now)

- Optional camera-based proctoring as an add-on, not default.
- Plagiarism detection for code and assignment submissions.
- Auto-grading for assignments via rubric + LLM-assisted first-pass scoring (human-reviewed).
- Org-level billing / multi-institution SaaS packaging.
- Question bank sharing/marketplace across admins.
