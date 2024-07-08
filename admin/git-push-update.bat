   @echo off
   setlocal enabledelayedexpansion

   :: Check if we're in a git repository
   git rev-parse --is-inside-work-tree > nul 2>&1
   if %errorlevel% neq 0 (
       echo Error: Not in a git repository.
       pause
       exit /b 1
   )

   :: Get the current branch name
   for /f "tokens=*" %%a in ('git rev-parse --abbrev-ref HEAD') do set current_branch=%%a

   :: Prompt for the tag name
   set /p tag_name=Enter the tag name: 

   :: Check if tag name is provided
   if "%tag_name%"=="" (
       echo Error: Tag name is required.
       pause
       exit /b 1
   )

   :: Add all changes
   git add .

   :: Commit changes
   set /p commit_message=Enter commit message: 
   git commit -m "%commit_message%"

   :: Create a new tag
   git tag -a "%tag_name%" -m "Release %tag_name%"

   :: Push changes and tags
   git push origin "%current_branch%"
   git push origin "%tag_name%"

   echo Changes committed and pushed to %current_branch% with tag %tag_name%
   pause