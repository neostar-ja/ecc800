#!/bin/bash
# Script to run server and test API

echo "Starting ECC800 backend server..."
cd /opt/code/ecc800/ecc800/backend
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8011 &
SERVER_PID=$!

echo "Waiting for server to start..."
sleep 5

echo "Running API tests..."
cd /opt/code/ecc800/ecc800
python3 test_api.py

echo "Stopping server..."
kill $SERVER_PID

echo "Test completed."
