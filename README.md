# Flint - Candidate Assessment Platform

Flint unifies proctored MCQ exams, coding rounds, and assignments with strict role-based boundaries, server-authoritative timing, and practical integrity signals.

## Getting Started

First, install dependencies:
```bash
npm install
```

Then, run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Git Workflow for Collaboration

### Pulling from all branches
To fetch the latest changes from all remote branches without merging them automatically:
```bash
git fetch --all
```
To update your current locally checked-out branch:
```bash
git pull
```

### Testing Ameya's forked changes (Example)
When Ameya (or another teammate) pushes changes to their own forked version of this repository, you can fetch and test their code locally before merging it into the main project.

**1. Add their fork as a remote (only needed once per teammate):**
```bash
git remote add ameya https://github.com/Ameya79/Flint.git
```

**2. Fetch their latest changes:**
```bash
git fetch ameya
```

**3. Checkout their code into a temporary testing branch:**
```bash
git checkout -b test-ameya ameya/main
```
*(Note: If they worked on a different branch, replace `main` with their branch name)*

*Run your local dev server and test their changes.*

**4. Merge and Push to the main repository (if everything works):**
```bash
git checkout main
git merge test-ameya
git push origin main
```

**5. Clean up (delete the temporary branch):**
```bash
git branch -d test-ameya
```
