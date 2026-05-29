@echo off
REM Setup script to initialize the Tclaw Telegram Bot project structure for Windows

REM Create all necessary directories
mkdir src\agent
mkdir src\memory
mkdir src\rag
mkdir src\tools
mkdir src\telegram
mkdir src\scheduler
mkdir src\config

mkdir data\memory
mkdir data\rag
mkdir data\state

mkdir docs
mkdir tests

REM Create .gitkeep files to preserve empty directories
type nul > src\agent\.gitkeep
type nul > src\memory\.gitkeep
type nul > src\rag\.gitkeep
type nul > src\tools\.gitkeep
type nul > src\telegram\.gitkeep
type nul > src\scheduler\.gitkeep
type nul > src\config\.gitkeep

type nul > data\memory\.gitkeep
type nul > data\rag\.gitkeep
type nul > data\state\.gitkeep

echo Directory structure created successfully!
pause
