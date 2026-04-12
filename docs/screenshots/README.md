# 📸 ViralBoost AI - Dashboard Screenshots Guide

## How to Add & Push Dashboard Screenshots

### Step 1: Capture Dashboard Screenshots

Take screenshots of your ViralBoost AI dashboard:

**Dashboard (main):**
- Screenshot the home/dashboard page
- Save as: `dashboard.png`

**Viral Optimizer:**
- Screenshot the optimizer tool
- Save as: `optimizer.png`

**Analytics:**
- Screenshot the analytics page
- Save as: `analytics.png`

---

### Step 2: Add Screenshots to Repository

```bash
# Navigate to project directory
cd /home/server/Desktop/viralboost-ai

# Copy your screenshot to the screenshots folder
cp /path/to/dashboard.png docs/screenshots/
cp /path/to/optimizer.png docs/screenshots/
cp /path/to/analytics.png docs/screenshots/

# Verify files are in place
ls -lh docs/screenshots/
```

---

### Step 3: Add to Git & Commit

```bash
# Add screenshot files to git
git add docs/screenshots/*.png

# Verify files are staged
git status

# Commit with a message
git commit -m "docs: Add dashboard, optimizer, and analytics screenshots"

# Push to GitHub
git push origin main
```

---

### Step 4: Update README

In the README.md file, the screenshots section will show:

```markdown
## 📊 Screenshots

### Dashboard
![Dashboard](docs/screenshots/dashboard.png)

### Viral Optimizer
![Viral Optimizer](docs/screenshots/optimizer.png)

### Analytics
![Analytics](docs/screenshots/analytics.png)
```

---

## 📁 File Locations

```
docs/
└── screenshots/
    ├── dashboard.png     (Main dashboard)
    ├── optimizer.png     (Viral optimizer tool)
    └── analytics.png     (Analytics page)
```

---

## 🚀 Quick Commands

```bash
# One-liner to add, commit, and push
git add docs/screenshots/ && git commit -m "docs: Add dashboard screenshots" && git push origin main

# Check what will be pushed
git status

# View git log
git log --oneline -5
```

---

## ✅ After Pushing

1. Screenshots will be visible on GitHub README
2. They'll appear in the repository
3. Documentation will be complete

---

**That's it!** Your screenshots are now part of the repository. 📸✨
