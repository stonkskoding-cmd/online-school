@echo off
cd /d "c:\Users\User-pc\Desktop\online-school"
if not exist ".commit-msg-tmp.txt" (
  echo Error: create .commit-msg-tmp.txt with commit message first
  exit /b 1
)
git add .
git commit -F .commit-msg-tmp.txt
if errorlevel 1 exit /b 1
del /q .commit-msg-tmp.txt 2>nul
git push
exit /b %errorlevel%
