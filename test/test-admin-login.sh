#!/bin/bash

# Set the API base URL
API_URL="https://6bz00r29y3.execute-api.eu-west-3.amazonaws.com/api"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Function to make API requests
make_request() {
  local method=$1
  local endpoint=$2
  local data=$3
  local auth_header=$4
  
  echo -e "${YELLOW}Testing $method $endpoint${NC}"
  
  if [ -z "$data" ]; then
    if [ -z "$auth_header" ]; then
      response=$(curl -s -X $method "$API_URL$endpoint")
    else
      response=$(curl -s -X $method "$API_URL$endpoint" -H "Authorization: Bearer $auth_header")
    fi
  else
    if [ -z "$auth_header" ]; then
      response=$(curl -s -X $method "$API_URL$endpoint" -H "Content-Type: application/json" -d "$data")
    else
      response=$(curl -s -X $method "$API_URL$endpoint" -H "Content-Type: application/json" -H "Authorization: Bearer $auth_header" -d "$data")
    fi
  fi
  
  echo -e "${GREEN}Response: $response${NC}"
  return 0
}

# Admin credentials for testing
admin_email="admin@example.com"
admin_password="admin123"
admin_key="1234"

echo "=== Testing Admin Login Functionality ==="

# 1. Test login with existing admin credentials
echo -e "\n=== 1. Login with existing admin credentials ==="
login_admin_data="{\"email\":\"$admin_email\",\"password\":\"$admin_password\"}"
make_request "POST" "/login" "$login_admin_data"

# 2. Try to register a new admin with the same admin key
echo -e "\n=== 2. Register a new admin with the same admin key ==="
new_admin_email="newadmin@example.com"
new_admin_password="newadmin123"
register_admin_data="{\"email\":\"$new_admin_email\",\"password\":\"$new_admin_password\",\"userType\":\"admin\",\"adminKey\":\"$admin_key\"}"
make_request "POST" "/register" "$register_admin_data"

# 3. Login with the new admin credentials
echo -e "\n=== 3. Login with the new admin credentials ==="
login_new_admin_data="{\"email\":\"$new_admin_email\",\"password\":\"$new_admin_password\"}"
make_request "POST" "/login" "$login_new_admin_data"

# 4. Try to login with incorrect admin key
echo -e "\n=== 4. Try to register with incorrect admin key ==="
incorrect_admin_data="{\"email\":\"badadmin@example.com\",\"password\":\"badadmin123\",\"userType\":\"admin\",\"adminKey\":\"wrong_key\"}"
make_request "POST" "/register" "$incorrect_admin_data"

echo -e "\n${GREEN}All tests completed!${NC}"
