@echo off
cd /d "%~dp0.."
git add .
git commit -F .commit-msg-tmp.txt
git push
