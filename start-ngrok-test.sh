#!/bin/bash
# WebRTC Testing with Ngrok
# This script starts the simulation server and ngrok tunnel for testing

# Terminal colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}=== WebRTC Testing Environment Setup ====${NC}"
echo -e "${YELLOW}Starting WebSocket simulation server...${NC}"

# Create a temporary directory for logs
TEMP_DIR=$(mktemp -d)
SERVER_LOG="${TEMP_DIR}/server.log"
NGROK_LOG="${TEMP_DIR}/ngrok.log"

# Change to the fly-interview-hybrid directory
cd "$(dirname "$0")/fly-interview-hybrid"

# Start simulation server and save PID
node simple-server.js > "${SERVER_LOG}" 2>&1 &
SIM_PID=$!

echo -e "${GREEN}Simulation server started with PID ${SIM_PID}${NC}"
echo -e "${YELLOW}Waiting for server to initialize...${NC}"
sleep 3

# Check if simulation server is running
if ! ps -p $SIM_PID > /dev/null; then
  echo -e "\033[0;31mError: Simulation server failed to start. Check ${SERVER_LOG} for details.${NC}"
  exit 1
fi

echo -e "${YELLOW}Starting ngrok tunnel...${NC}"

# Start ngrok in background
ngrok http 3001 > "${NGROK_LOG}" 2>&1 &
NGROK_PID=$!

echo -e "${GREEN}Ngrok started with PID ${NGROK_PID}${NC}"
echo -e "${YELLOW}Waiting for ngrok to initialize...${NC}"
sleep 5

# Get ngrok URL from logs (supporting both old and new formats)
NGROK_URL=$(grep -o 'https://.*\.ngrok\.\(io\|app\)' "${NGROK_LOG}" | head -n 1)

if [ -z "$NGROK_URL" ]; then
  echo -e "\033[0;31mError: Could not determine ngrok URL. Check ${NGROK_LOG} for details.${NC}"
  echo -e "\033[0;31mManually check the ngrok console output for the URL.${NC}"
else
  # Convert http URL to WebSocket URL
  WS_URL=$(echo $NGROK_URL | sed 's/https:/wss:/g')
  
  echo -e "${GREEN}Ngrok tunnel established!${NC}"
  echo -e "${BLUE}HTTP URL: ${NGROK_URL}${NC}"
  echo -e "${BLUE}WebSocket URL: ${WS_URL}${NC}"
  
  echo -e "\n${YELLOW}Testing Instructions:${NC}"
  echo -e "1. Open http://localhost:8080/interview-test-simple in your browser"
  echo -e "2. Enter the WebSocket URL: ${WS_URL}"
  echo -e "3. Ensure 'Simulation Mode' is checked"
  echo -e "4. Check browser console for connection details"
  
  # Always update URL files automatically for consistency
  echo -e "\n${YELLOW}Updating files with new ngrok URL...${NC}"

  # Extract domain from URL (without protocol)
  NGROK_DOMAIN=$(echo $NGROK_URL | sed 's|https://||')

  # Update the InterviewTestSimple.tsx with the ngrok URL
  INTERVIEW_TEST_FILE="../src/pages/InterviewTestSimple.tsx"
  if [ -f "$INTERVIEW_TEST_FILE" ]; then
    sed -i '' "s|const \[serverUrl, setServerUrl\] = useState<string>('.*')|const [serverUrl, setServerUrl] = useState<string>('${WS_URL}')|g" "$INTERVIEW_TEST_FILE"
    echo -e "${GREEN}Updated test page with WebSocket URL: ${WS_URL}${NC}"
  else
    echo -e "\033[0;31mCouldn't find test page file to update.${NC}"
  fi

  # Update the simple-server.js file with the ngrok domain
  SERVER_JS_FILE="./simple-server.js"
  if [ -f "$SERVER_JS_FILE" ]; then
    sed -i '' "s|const ngrokUrl = '.*';|const ngrokUrl = '${NGROK_DOMAIN}';|g" "$SERVER_JS_FILE"
    echo -e "${GREEN}Updated server with ngrok domain: ${NGROK_DOMAIN}${NC}"
  else
    echo -e "\033[0;31mCouldn't find server file to update.${NC}"
  fi
fi

# Handle cleanup on Ctrl+C
function cleanup {
  echo -e "\n${YELLOW}Stopping services...${NC}"
  kill $SIM_PID 2>/dev/null
  kill $NGROK_PID 2>/dev/null
  echo -e "${GREEN}Services stopped.${NC}"
  exit 0
}

trap cleanup INT

# Keep script running until Ctrl+C
echo -e "\n${BLUE}====================================${NC}"
echo -e "${BLUE}Environment is ready for testing!${NC}"
echo -e "${BLUE}Logs are available at:${NC}"
echo -e "${BLUE}- Server log: ${SERVER_LOG}${NC}"
echo -e "${BLUE}- Ngrok log: ${NGROK_LOG}${NC}"
echo -e "${BLUE}====================================${NC}"
echo -e "${YELLOW}Press Ctrl+C to stop all services${NC}"

# Display server log in real-time
echo -e "\n${BLUE}Server log output:${NC}"
tail -f "${SERVER_LOG}"