#!/bin/bash

echo "🚀 MongoDB Setup Script for ViralBoost AI"
echo "=========================================="
echo ""

# Check if MongoDB is installed
if ! command -v mongod &> /dev/null; then
    echo "❌ MongoDB is not installed!"
    echo "📦 Installing MongoDB..."
    echo "Please run: sudo apt update && sudo apt install -y mongodb"
    exit 1
fi

echo "✅ MongoDB is installed"

# Check MongoDB service status
echo ""
echo "📊 Checking MongoDB service status..."
if systemctl is-active --quiet mongod; then
    echo "✅ MongoDB service is running"
else
    echo "⚠️  MongoDB service is not running"
    echo ""
    echo "🔧 Starting MongoDB service..."
    echo "Please run: sudo systemctl start mongod"
    echo ""
    echo "To enable MongoDB on boot:"
    echo "sudo systemctl enable mongod"
fi

# Check MongoDB connection
echo ""
echo "🔌 Testing MongoDB connection..."
if mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
    echo "✅ MongoDB connection successful!"
    
    # Create database
    echo ""
    echo "📝 Creating database 'viralboost'..."
    mongosh --eval "use viralboost; db.createCollection('users'); db.createCollection('videos'); db.createCollection('analyses'); print('Database created successfully!')"
    
    echo ""
    echo "✅ Setup complete!"
    echo ""
    echo "📋 Database Info:"
    echo "   Name: viralboost"
    echo "   URI: mongodb://localhost:27017/viralboost"
else
    echo "❌ MongoDB connection failed"
    echo ""
    echo "🔧 Troubleshooting steps:"
    echo "1. Start MongoDB: sudo systemctl start mongod"
    echo "2. Check status: sudo systemctl status mongod"
    echo "3. Check logs: sudo journalctl -u mongod -n 50"
fi

echo ""
echo "✨ Done! You can now use the application."
