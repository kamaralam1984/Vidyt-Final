#!/bin/bash

# ============================================
# ViralBoost AI - Docker Setup Script
# ============================================

set -e

echo "🚀 ViralBoost AI - Docker Setup"
echo "=================================="

# Check if .env file exists
if [ ! -f .env ]; then
    echo "📋 Creating .env file from .env.example..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your configuration!"
    echo "📝 Edit .env file before starting:"
    echo "   nano .env"
    exit 1
fi

# Create SSL directory if it doesn't exist
if [ ! -d "nginx/ssl" ]; then
    echo "📁 Creating nginx/ssl directory for SSL certificates..."
    mkdir -p nginx/ssl
    
    echo "⚠️  Self-signed certificate created (for development only)."
    echo "For production, use Let's Encrypt or your own certificates."
    echo "Place your certificates in: nginx/ssl/"
    echo "  - cert.pem (certificate)"
    echo "  - key.pem (private key)"
fi

# Create dummy SSL certificates if they don't exist (for development)
if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
    echo "🔐 Generating self-signed SSL certificate for development..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout nginx/ssl/key.pem \
        -out nginx/ssl/cert.pem \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
        2>/dev/null || echo "Note: Could not generate SSL certificate"
fi

# Create backend package.json if it doesn't exist
if [ ! -f "backend/package.json" ]; then
    echo "📦 Creating backend package.json..."
    cat > backend/package.json << 'EOF'
{
  "name": "viralboost-backend",
  "version": "1.0.0",
  "description": "ViralBoost AI - Backend API Server",
  "main": "dist/server.js",
  "scripts": {
    "dev": "ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "mongoose": "^8.0.0",
    "redis": "^4.6.0",
    "jsonwebtoken": "^9.1.1",
    "bcryptjs": "^2.4.3",
    "bull": "^4.10.4",
    "multer": "^1.4.5",
    "axios": "^1.6.0",
    "stripe": "^12.18.0",
    "@sendgrid/mail": "^7.7.0"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "ts-node": "^10.9.1",
    "@types/node": "^20.5.9"
  }
}
EOF
fi

# Create frontend package.json if it doesn't exist
if [ ! -f "frontend/package.json" ]; then
    echo "📦 Creating frontend package.json..."
    cat > frontend/package.json << 'EOF'
{
  "name": "viralboost-frontend",
  "version": "1.0.0",
  "description": "ViralBoost AI - Frontend with Next.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
EOF
fi

# Create worker package.json if it doesn't exist
if [ ! -f "worker/package.json" ]; then
    echo "📦 Creating worker package.json..."
    cat > worker/package.json << 'EOF'
{
  "name": "viralboost-worker",
  "version": "1.0.0",
  "description": "ViralBoost AI - Queue Workers with BullMQ",
  "main": "worker.js",
  "scripts": {
    "start": "node worker.js",
    "dev": "nodemon worker.js"
  },
  "dependencies": {
    "bullmq": "^4.11.0",
    "redis": "^4.6.0",
    "dotenv": "^16.3.1",
    "mongoose": "^8.0.0",
    "axios": "^1.6.0",
    "express": "^4.18.2"
  }
}
EOF
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🚀 Next steps:"
echo "   1. Review and update .env file with your configuration:"
echo "      nano .env"
echo ""
echo "   2. Start the infrastructure:"
echo "      docker-compose up --build"
echo ""
echo "   3. Check service health:"
echo "      docker-compose ps"
echo ""
echo "📝 Useful commands:"
echo "   docker-compose logs -f backend"
echo "   docker-compose logs -f worker"
echo "   docker-compose exec backend npm install package-name"
echo "   docker-compose down -v  # Remove volumes too"
echo ""
