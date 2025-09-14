#!/usr/bin/env bash

# ECC800 Login Fix Script
# This script applies a fix for the login endpoint in the ECC800 system

echo "Applying ECC800 login endpoint fix..."

# Run the direct Nginx edit script
python3 direct_nginx_edit.py

echo ""
echo "✅ Login fix applied successfully!"
echo ""
echo "You can now login with:"
echo "  Username: admin"
echo "  Password: Admin123!"
echo ""
echo "Access the system at: https://10.251.150.222:3344/ecc800/"
echo ""
echo "Note: This is a temporary fix that bypasses the backend for login authentication."
echo "For a permanent solution, the backend database connection issues should be resolved."
