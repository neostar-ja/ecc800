# 📤 Push to GitHub - Guide & Scripts

## Overview

สคริปต์สำหรับการ upload โปรเจค ecc800 ขึ้น GitHub ที่ https://github.com/neostar-ja/ecc800 พร้อมการตรวจสอบความปลอดภัยและการทดสอบ

## Current Status

```
✅ Git Repository:     OK
✅ GitHub Authentication: OK  
✅ Remote URL:        https://github.com/neostar-ja/ecc800.git
📊 Current Branch:     main
⚠️  Unstaged Changes:  41 files
📦 Untracked Files:    117 files
🔄 Commits Ahead:      4 commits (ready to push)
⬇️  Commits Behind:    1 commit (need to pull)
```

## ⚠️ สำคัญ: ข้อมูลที่ต้องตรวจสอบก่อน Push

### ไฟล์ที่อาจมีความเสี่ยง:
โปรเจคมีไฟล์หลายตัวที่ควรตรวจสอบ:
- `setup_permissions.py` - มี hardcoded credentials
- `test_permissions.py` - มี hardcoded credentials
- `test_users_api.sh` - มี hardcoded password
- `.env` - ควรไม่ push (ใช้ .env.example แทน)

**แนะนำ:** ตรวจสอบ `.gitignore` ว่าไฟล์เหล่านี้ถูก ignore หรือไม่

---

## 🚀 Quick Start

### ขั้นตอน 1: Pull ก่อน (อัพเดทจาก Remote)
```bash
cd /opt/code/ecc800/ecc800
git pull origin main
```

### ขั้นตอน 2: ตรวจสอบสถานะ
```bash
./test_push.sh
```

### ขั้นตอน 3: Push ไปยัง GitHub
```bash
./push_to_github.sh
```

---

## 📋 Scripts Available

### 1. `test_push.sh` - ทดสอบ Push Configuration
**ใช้เพื่อ:** ตรวจสอบสถานะ repo ก่อนการ push

**Features:**
- ✅ ตรวจสอบการเชื่อมต่อ GitHub
- ✅ แสดงจำนวน commits ที่พร้อม push
- ✅ ตรวจสอบ branch status
- ✅ Dry run preview

**วิธีใช้:**
```bash
./test_push.sh
```

### 2. `push_to_github.sh` - Push ไป GitHub อย่างปลอดภัย
**ใช้เพื่อ:** Upload commits ไปยัง GitHub

**Features:**
- ✅ Confirm before pushing
- ✅ Security scan (detect secrets)
- ✅ Verify after push
- ✅ Show commit hash
- ✅ Display GitHub link

**วิธีใช้:**
```bash
./push_to_github.sh
```

**Options:**
Script จะ prompt ให้เลือก:
1. Add all changes
2. Add specific files
3. Cancel

---

## 🔧 Typical Workflow

### Scenario 1: Push Existing Commits
```bash
# 1. ตรวจสอบสถานะ
./test_push.sh

# 2. Pull from remote (ถ้าจำเป็น)
git pull origin main

# 3. Push commits
./push_to_github.sh
```

### Scenario 2: Commit & Push New Changes
```bash
# 1. ตรวจสอบอะไรเปลี่ยนแปลง
git status

# 2. ตรวจสอบ push configuration
./test_push.sh

# 3. Push (script จะ prompt สำหรับ commit message)
./push_to_github.sh
```

### Scenario 3: Emergency Rollback
```bash
# ถ้า push ล้มเหลว:
git status              # ดูสถานะปัจจุบัน
git log --oneline       # ดู commit history
git reset --soft HEAD~1 # Undo last commit (keep changes staged)
git reset               # Unstage all
./push_to_github.sh     # ลองอีกครั้ง
```

---

## 📊 Pre-Push Checklist

### ✅ ก่อนจะ Push:
- [ ] ได้ Test script ผ่าน (`./test_push.sh`)
- [ ] ได้ Pull จาก remote (`git pull origin main`)
- [ ] Reviewed ว่าไฟล์ใดบ้างจะ push
- [ ] ตรวจสอบว่าไม่มี secrets (passwords, API keys)
- [ ] Commit message ชัดเจน

### ⚠️ ระหว่าง Push:
- [ ] ตรวจสอบ branch ที่ถูก (main)
- [ ] ตรวจสอบ security warnings (ถ้ามี)
- [ ] Confirm ก่อน commit & push

### ✅ หลัง Push:
- [ ] ตรวจสอบ GitHub ว่า commits ปรากฏ
- [ ] ตรวจสอบว่า workflow/CI ทำงาน (ถ้ามี)
- [ ] ตรวจสอบ branch protection rules

---

## 🔒 Security Considerations

### Secrets Detection
Script จะสแกน staged changes เพื่อหา:
- `POSTGRES_PASSWORD`
- `JWT_SECRET`
- RSA private keys
- API keys
- Passwords
- Hardcoded credentials

**ถ้าตรวจพบ:** Script จะ prompt ให้ confirm ก่อน push

### Best Practices:
1. ใช้ `.env` สำหรับ secrets (ไม่ push)
2. ใช้ `.env.example` เป็น template
3. ใช้ environment variables ใน CI/CD
4. ใช้ GitHub Secrets สำหรับ credentials

---

## 🐛 Troubleshooting

### Problem: "Cannot connect to GitHub"
```bash
# ตรวจสอบ SSH keys
ssh -T git@github.com

# หรือตรวจสอบ credentials
git config user.email
git config user.name
```

### Problem: "Your branch is behind remote"
```bash
# Pull ก่อน
git pull origin main

# จากนั้น push
./push_to_github.sh
```

### Problem: "File permissions"
```bash
# ทำให้ script executable
chmod +x push_to_github.sh test_push.sh

# ตรวจสอบ
ls -la *.sh
```

### Problem: "Merge conflicts"
```bash
# ดูไฟล์ที่มี conflict
git status

# Resolve conflicts ด้วยตนเอง

# Stage และ commit
git add .
git commit -m "Fix merge conflicts"

# Push
./push_to_github.sh
```

---

## 📈 Advanced Usage

### Cherry-pick specific commits:
```bash
# ดูว่ามี commits ไหนที่ยังไม่ได้ push
git log origin/main..main

# ถ้าต้องการ push เฉพาะบาง commits
git push origin <commit-hash>:main
```

### Create a branch before pushing:
```bash
# สร้าง feature branch
git checkout -b feature/your-feature

# Make changes and commit
git add .
git commit -m "Add feature: ..."

# Push to branch
git push origin feature/your-feature

# Then create PR on GitHub
```

### Verify what will be pushed:
```bash
# ดู commits ที่จะ push
git log origin/main..main

# ดู files ที่จะ push
git diff --name-only origin/main..main
```

---

## 📝 Examples

### Example 1: Push with detailed commit message
```bash
$ ./push_to_github.sh

# Script จะถาม
Choose option (1-3): 1
Enter commit message: "feat: add security hardening to auth endpoints"

# Confirm
Proceed with commit and push? (y/n): y

# Result
✅ Commit created successfully
✅ Push successful
✅ Verify successful
🎉 Push Complete
```

### Example 2: Push only specific files
```bash
$ ./push_to_github.sh

# Script จะถาม
Choose option (1-3): 2
Enter files to add: backend/app/main.py backend/app/core/config.py

# Confirm
Proceed with commit and push? (y/n): y

# Result
✅ Files staged: 2
✅ Commit created
✅ Push successful
```

---

## 🎯 Next Steps

1. **Immediate:**
   ```bash
   cd /opt/code/ecc800/ecc800
   ./test_push.sh      # ตรวจสอบสถานะ
   ```

2. **Before Pushing:**
   ```bash
   git pull origin main  # Update local repo
   ```

3. **Push Changes:**
   ```bash
   ./push_to_github.sh   # Interactive push
   ```

4. **Verify:**
   - เข้า https://github.com/neostar-ja/ecc800
   - ตรวจสอบว่า commits ปรากฏ
   - ตรวจสอบ branch status

---

## 📞 Support

ถ้ามีปัญหา:
1. ตรวจสอบ `git log` ว่า commits ถูกต้อง
2. ตรวจสอบ GitHub permissions
3. ตรวจสอบ SSH keys หรือ credentials

---

**Last Updated:** April 20, 2026

**Repository:** https://github.com/neostar-ja/ecc800

**Branch:** main
