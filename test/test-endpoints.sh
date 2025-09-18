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
  
  # Check if the response contains an error message or Internal Server Error
  if echo "$response" | grep -q -i "error\|Internal Server Error"; then
    echo -e "${RED}Failed: $response${NC}"
    return 1
  else
    echo -e "${GREEN}Success: $response${NC}"
    return 0
  fi
}

# Generate a unique email for testing
email="test$(date +%s)@example.com"
password="password123"
user_type="user"
shortname="test-$(date +%s)"
version="1.0.0"
config_key="test-key"
config_value="test-value"

# Admin credentials for testing
admin_email="admin@example.com"
admin_password="admin123"
admin_key="1234"

echo "=== Testing API Endpoints ==="
echo "Using email: $email"
echo "Using shortname: $shortname"

# 1. Test registering an admin user with admin key
echo -e "\n=== 1. Register an admin user with admin key ==="
register_admin_data="{\"email\":\"$admin_email\",\"password\":\"$admin_password\",\"userType\":\"admin\",\"adminKey\":\"$admin_key\"}"
make_request "POST" "/register" "$register_admin_data"

# 2. Test login with admin credentials
echo -e "\n=== 2. Login with admin credentials ==="
login_admin_data="{\"email\":\"$admin_email\",\"password\":\"$admin_password\"}"
make_request "POST" "/login" "$login_admin_data"

# Extract token from response
admin_token=$(echo $response | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$admin_token" ]; then
  echo -e "${RED}Failed to extract admin token. Continuing with regular tests.${NC}"
else
  echo "Admin Token: $admin_token"
fi

# 3. Test login with admin credentials but wrong password
echo -e "\n=== 3. Login with admin credentials but wrong password ==="
login_admin_wrong_data="{\"email\":\"$admin_email\",\"password\":\"wrongpassword\"}"
make_request "POST" "/login" "$login_admin_wrong_data"

# 4. Register a regular user
echo -e "\n=== 4. Register a regular user ==="
register_data="{\"email\":\"$email\",\"password\":\"$password\",\"userType\":\"$user_type\"}"
make_request "POST" "/register" "$register_data"

if [ $? -ne 0 ]; then
  echo -e "${RED}Registration failed. Exiting.${NC}"
  exit 1
fi

# Extract token from response
token=$(echo $response | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$token" ]; then
  echo -e "${RED}Failed to extract token. Exiting.${NC}"
  exit 1
fi

echo "Token: $token"

# 5. Login with the registered user
echo -e "\n=== 5. Login with the registered user ==="
login_data="{\"email\":\"$email\",\"password\":\"$password\"}"
make_request "POST" "/login" "$login_data"

if [ $? -ne 0 ]; then
  echo -e "${RED}Login failed. Exiting.${NC}"
  exit 1
fi

# 3. Create a shortname
echo -e "\n=== 3. Create a shortname ==="
shortname_data="{\"shortname\":\"$shortname\",\"description\":\"Test shortname\"}"
make_request "POST" "/shortnames" "$shortname_data" "$token"

if [ $? -ne 0 ]; then
  echo -e "${RED}Create shortname failed. Exiting.${NC}"
  exit 1
fi

# 4. Get all shortnames
echo -e "\n=== 4. Get all shortnames ==="
make_request "GET" "/shortnames" "" "$token"

if [ $? -ne 0 ]; then
  echo -e "${RED}Get all shortnames failed. Exiting.${NC}"
  exit 1
fi

# 5. Get a specific shortname
echo -e "\n=== 5. Get a specific shortname ==="
make_request "GET" "/shortnames/$shortname" "" "$token"

if [ $? -ne 0 ]; then
  echo -e "${RED}Get specific shortname failed. Exiting.${NC}"
  exit 1
fi

# 6. Create a version for the shortname
echo -e "\n=== 6. Create a version for the shortname ==="
version_data="{\"version\":\"$version\",\"description\":\"Test version\",\"isActive\":true}"
make_request "POST" "/shortnames/$shortname/versions" "$version_data" "$token"

if [ $? -ne 0 ]; then
  echo -e "${RED}Create version failed. Exiting.${NC}"
  exit 1
fi

# 7. Get all versions for the shortname
echo -e "\n=== 7. Get all versions for the shortname ==="
make_request "GET" "/shortnames/$shortname/versions" "" "$token"

if [ $? -ne 0 ]; then
  echo -e "${RED}Get all versions failed. Exiting.${NC}"
  exit 1
fi

# 8. Get a specific version
echo -e "\n=== 8. Get a specific version ==="
make_request "GET" "/shortnames/$shortname/versions/$version" "" "$token"

if [ $? -ne 0 ]; then
  echo -e "${RED}Get specific version failed. Exiting.${NC}"
  exit 1
fi

# 9. Create a configuration for the version
echo -e "\n=== 9. Create a configuration for the version ==="
config_data="{\"key\":\"$config_key\",\"value\":\"$config_value\",\"description\":\"Test configuration\"}"
make_request "POST" "/shortnames/$shortname/versions/$version/configurations" "$config_data" "$token"

if [ $? -ne 0 ]; then
  echo -e "${RED}Create configuration failed. Exiting.${NC}"
  exit 1
fi

# Extract configId from response
config_id=$(echo $response | grep -o '"configId":"[^"]*' | sed 's/"configId":"//')

if [ -z "$config_id" ]; then
  echo -e "${RED}Failed to extract configId. Exiting.${NC}"
  exit 1
fi

echo "ConfigId: $config_id"

# 10. Get all configurations for the version
echo -e "\n=== 10. Get all configurations for the version ==="
make_request "GET" "/shortnames/$shortname/versions/$version/configurations" "" "$token"

if [ $? -ne 0 ]; then
  echo -e "${RED}Get all configurations failed. Exiting.${NC}"
  exit 1
fi

# 11. Get a specific configuration
echo -e "\n=== 11. Get a specific configuration ==="
make_request "GET" "/shortnames/$shortname/versions/$version/configurations/$config_id" "" "$token"

if [ $? -ne 0 ]; then
  echo -e "${RED}Get specific configuration failed. Exiting.${NC}"
  exit 1
fi

# 12. Update the configuration
echo -e "\n=== 12. Update the configuration ==="
update_config_data="{\"value\":\"updated-value\",\"description\":\"Updated configuration\"}"
make_request "PUT" "/shortnames/$shortname/versions/$version/configurations/$config_id" "$update_config_data" "$token"

if [ $? -ne 0 ]; then
  echo -e "${RED}Update configuration failed. Exiting.${NC}"
  exit 1
fi

# 13. Delete the configuration
echo -e "\n=== 13. Delete the configuration ==="
make_request "DELETE" "/shortnames/$shortname/versions/$version/configurations/$config_id" "" "$token"

if [ $? -ne 0 ]; then
  echo -e "${RED}Delete configuration failed. Exiting.${NC}"
  exit 1
fi

# 14. Update the version
echo -e "\n=== 14. Update the version ==="
update_version_data="{\"description\":\"Updated version\",\"isActive\":false}"
make_request "PUT" "/shortnames/$shortname/versions/$version" "$update_version_data" "$token"

if [ $? -ne 0 ]; then
  echo -e "${RED}Update version failed. Exiting.${NC}"
  exit 1
fi

# 15. Delete the version
echo -e "\n=== 15. Delete the version ==="
make_request "DELETE" "/shortnames/$shortname/versions/$version" "" "$token"

if [ $? -ne 0 ]; then
  echo -e "${RED}Delete version failed. Exiting.${NC}"
  exit 1
fi

# 16. Update the shortname
echo -e "\n=== 16. Update the shortname ==="
update_shortname_data="{\"description\":\"Updated shortname\"}"
make_request "PUT" "/shortnames/$shortname" "$update_shortname_data" "$token"

if [ $? -ne 0 ]; then
  echo -e "${RED}Update shortname failed. Exiting.${NC}"
  exit 1
fi

# 17. Delete the shortname
echo -e "\n=== 17. Delete the shortname ==="
make_request "DELETE" "/shortnames/$shortname" "" "$token"

if [ $? -ne 0 ]; then
  echo -e "${RED}Delete shortname failed. Exiting.${NC}"
  exit 1
fi

echo -e "\n${GREEN}All tests completed successfully!${NC}"
