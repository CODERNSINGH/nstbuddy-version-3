#!/bin/bash

# Setup script for creating initial admin user

echo "🔧 NST Buddy Admin Setup"
echo "========================"
echo ""

# Check if backend server is running
if ! curl -s http://localhost:5000/api/health > /dev/null; then
    echo "❌ Error: Backend server is not running!"
    echo "Please start the backend server first:"
    echo "  cd backend && npm run dev"
    exit 1
fi

echo "✅ Backend server is running"
echo ""

# Prompt for admin details
read -p "Enter admin email: " ADMIN_EMAIL
read -sp "Enter unique key (will be hidden): " UNIQUE_KEY
echo ""
read -p "Enter admin name: " ADMIN_NAME

echo ""
echo "Creating admin user..."

# Create admin user
RESPONSE=$(curl -s -X POST http://localhost:5000/api/auth/setup-admin \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"uniqueKey\": \"$UNIQUE_KEY\",
    \"name\": \"$ADMIN_NAME\"
  }")

# Check if successful
if echo "$RESPONSE" | grep -q "success"; then
    echo "✅ Admin user created successfully!"
    echo ""
    echo "You can now login at: http://localhost:5173/admin/login"
    echo "Email: $ADMIN_EMAIL"
    echo "Unique Key: (the one you entered)"
else
    echo "❌ Error creating admin user:"
    echo "$RESPONSE"
fi
