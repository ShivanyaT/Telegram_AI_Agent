#!/bin/bash
# Setup script to initialize the Tclaw Telegram Bot project structure

# Create directory structure
mkdir -p src/{agent,memory,rag,tools,telegram,scheduler,config}
mkdir -p data/{memory,rag,state}
mkdir -p docs
mkdir -p tests

# Create placeholder files in each directory
touch src/agent/.gitkeep
touch src/memory/.gitkeep
touch src/rag/.gitkeep
touch src/tools/.gitkeep
touch src/telegram/.gitkeep
touch src/scheduler/.gitkeep
touch src/config/.gitkeep

touch data/memory/.gitkeep
touch data/rag/.gitkeep
touch data/state/.gitkeep

echo "Directory structure created successfully!"
