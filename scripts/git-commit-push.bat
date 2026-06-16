@echo off
cd /d "c:\Users\User-pc\Desktop\online-school"
git add .
git commit -F .git-commit-msg.txt
if errorlevel 1 exit /b 1
git push
del /q .git-commit-msg.txt
exit /b %errorlevel%
