@echo off
cd /d "c:\Users\User-pc\Desktop\online-school"
git rm -f .commit-msg-tmp.txt 2>nul
git add .gitignore
echo feat: Complete all tasks - Supabase Storage, chat buttons, animations, stats, mobile responsive> .commit-msg-tmp.txt
git add .
git commit -F .commit-msg-tmp.txt
if errorlevel 1 exit /b 1
del /q .commit-msg-tmp.txt 2>nul
git push
git log --oneline -6
git status
exit /b %errorlevel%
