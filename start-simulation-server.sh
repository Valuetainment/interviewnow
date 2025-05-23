#!/bin/bash

# Change to the directory containing the simulation server
cd fly-interview-hybrid

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Node.js is not installed. Please install Node.js and try again."
    exit 1
fi

# Check if npm modules are installed
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install express ws
fi

# Check for port conflicts
if lsof -Pi :3001 -sTCP:LISTEN -t >/dev/null ; then
    echo "Port 3001 is already in use. Attempting to kill the process..."
    lsof -Pi :3001 -sTCP:LISTEN -t | xargs kill -9
    sleep 1
fi

# Start the simulation server
echo "Starting WebRTC simulation server on http://localhost:3001"
echo "Test page available at: http://localhost:8080/interview-test-simple"
echo "Press Ctrl+C to stop the server"
node simple-server.js