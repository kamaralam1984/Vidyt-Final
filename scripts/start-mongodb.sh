#!/bin/bash

# Script to start MongoDB for ViralBoost AI

echo "Checking MongoDB installation..."

# Check if Docker is available
if command -v docker &> /dev/null; then
    echo "Docker detected. Starting MongoDB in Docker..."
    
    # Check if MongoDB container already exists
    if docker ps -a --format '{{.Names}}' | grep -q "^mongodb$"; then
        echo "MongoDB container exists. Starting it..."
        docker start mongodb
    else
        echo "Creating new MongoDB container..."
        docker run -d -p 27017:27017 --name mongodb mongo:latest
    fi
    
    echo "MongoDB should be running on localhost:27017"
    echo "To stop: docker stop mongodb"
    echo "To remove: docker rm mongodb"
    exit 0
fi

# Check if MongoDB is installed locally
if command -v mongod &> /dev/null; then
    echo "MongoDB found. Checking if it's running..."
    
    # Try to start MongoDB service
    if systemctl is-active --quiet mongod 2>/dev/null; then
        echo "MongoDB is already running!"
    elif systemctl start mongod 2>/dev/null; then
        echo "MongoDB started successfully!"
    elif service mongod start 2>/dev/null; then
        echo "MongoDB started successfully!"
    else
        echo "Could not start MongoDB service. Trying to run mongod directly..."
        echo "You may need to run: sudo systemctl start mongod"
        echo "Or run mongod manually in another terminal"
    fi
    exit 0
fi

echo "MongoDB not found. Please install MongoDB:"
echo ""
echo "Option 1: Install MongoDB locally"
echo "  Ubuntu/Debian: sudo apt-get install mongodb"
echo "  macOS: brew install mongodb-community"
echo ""
echo "Option 2: Use Docker"
echo "  docker run -d -p 27017:27017 --name mongodb mongo:latest"
echo ""
echo "Option 3: Use MongoDB Atlas (cloud)"
echo "  Sign up at https://www.mongodb.com/cloud/atlas"
echo "  Get connection string and add to .env file"
