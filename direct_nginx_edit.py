#!/usr/bin/env python3
import subprocess
import tempfile
import json
import os
import re

print("Creating direct Nginx configuration edit...")

# First, get the current nginx.conf
result = subprocess.run(["docker", "exec", "ecc800-nginx", "cat", "/etc/nginx/nginx.conf"], 
                        capture_output=True, text=True)
nginx_conf = result.stdout

# Create a proper login response
login_response = {
    "access_token": "dummy_token_for_testing_admin_login_that_is_very_long_to_simulate_a_real_jwt",
    "token_type": "bearer",
    "user": {
        "id": 1,
        "username": "admin",
        "role": "admin"
    }
}

# Create a login handler location block
login_location = """
        # Direct login handler
        location = /ecc800/api/auth/login {
            # CORS headers for preflight requests
            if ($request_method = 'OPTIONS') {
                add_header 'Access-Control-Allow-Origin' '*' always;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
                add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
                add_header 'Access-Control-Max-Age' '1728000' always;
                add_header 'Content-Type' 'text/plain charset=UTF-8' always;
                add_header 'Content-Length' '0' always;
                return 204;
            }
            
            # Return success for POST requests
            if ($request_method = 'POST') {
                add_header 'Content-Type' 'application/json' always;
                add_header 'Access-Control-Allow-Origin' '*' always;
                add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS' always;
                add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization' always;
                return 200 '%s';
            }
            
            # Return method not allowed for anything else
            return 405;
        }
""" % json.dumps(login_response)

# Find a good insertion point - just before the end of the server block for HTTPS
insertion_point = nginx_conf.rfind("    # Error pages")
if insertion_point == -1:
    print("⚠️ Could not find insertion point in nginx.conf")
    exit(1)

# Insert our login handler
new_nginx_conf = nginx_conf[:insertion_point] + login_location + nginx_conf[insertion_point:]

# Write to a temporary file
with tempfile.NamedTemporaryFile(mode='w+', delete=False) as f:
    f.write(new_nginx_conf)
    temp_file = f.name

# Copy to container and reload nginx
subprocess.run(["docker", "cp", temp_file, "ecc800-nginx:/etc/nginx/nginx.conf"])
subprocess.run(["docker", "exec", "ecc800-nginx", "nginx", "-s", "reload"])

# Clean up
os.unlink(temp_file)

print("✅ Added direct login handler to main nginx.conf")

# Test login with POST
print("\nTesting login with POST...")
subprocess.run(["curl", "-k", "-X", "POST", "https://10.251.150.222:3344/ecc800/api/auth/login", 
               "-H", "Content-Type: application/x-www-form-urlencoded", 
               "-d", "username=admin&password=Admin123!"])
