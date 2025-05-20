#!/bin/bash

# Test script for the error logging API
echo "Testing error logging API..."

# Create a test error file
echo "Creating test error JSON..."
cat > /tmp/test_error.json <<EOL
{
  "message": "Test error from manual script",
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "source": "test-script",
  "details": {
    "testId": "$(date +%s)",
    "environment": "$(uname -a)"
  }
}
EOL

echo "Test JSON created:"
cat /tmp/test_error.json

echo -e "\nSending to error log API..."
RESPONSE=$(curl -s -X POST -H "Content-Type: application/json" -d @/tmp/test_error.json http://localhost:8000/log_error)
echo "Response: $RESPONSE"

# Parse the response to get the filename if successful
if [[ "$RESPONSE" == *"success\":true"* && "$RESPONSE" == *"filename"* ]]; then
  FILENAME=$(echo $RESPONSE | grep -o '"filename":"[^"]*"' | cut -d'"' -f4)
  echo -e "\nLog file created: $FILENAME"
  echo "Checking if file exists in logs/errors directory..."
  
  if [ -f "logs/errors/$FILENAME" ]; then
    echo "File exists! Content:"
    cat "logs/errors/$FILENAME"
  else
    echo "File not found. Check the logs/errors directory manually."
  fi
else
  echo -e "\nError logging failed. Check if the server is running with the command:"
  echo "node strvct/local-web-server/main.js --secure true --port 8000"
fi

echo -e "\nDone testing."