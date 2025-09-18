# Version-First Implementation Plan

## Current Issues
- When creating a version, a shortname is automatically created
- We want versions to exist independently without any shortnames
- Shortnames should be added to versions explicitly when needed
- Configurations should be created for specific shortname-version combinations

## Required Changes

### 1. DynamoDB Schema Changes

The current schema uses `versionId` (constructed as `${shortname}:${version}`) as the primary key, which forces us to have a shortname for each version. We need to modify this to allow versions to exist independently.

#### New Schema:

**cms_versions table:**
- Primary key: `version` (string)
- Attributes:
  - `version` (string)
  - `description` (string)
  - `isActive` (boolean)
  - `createdBy` (string)
  - `createdAt` (string)
  - `updatedAt` (string)

**cms_shortname_versions table (new):**
- Primary key: `shortnameVersionId` (constructed as `${shortname}:${version}`)
- Attributes:
  - `shortname` (string)
  - `version` (string)
  - `description` (string)
  - `isActive` (boolean)
  - `createdBy` (string)
  - `createdAt` (string)
  - `updatedAt` (string)
- Global Secondary Indexes:
  - `ShortnameIndex` (hash key: `shortname`)
  - `VersionIndex` (hash key: `version`)

### 2. Lambda Function Changes

#### version_lambda:

**New endpoints:**
- `GET /api/versions` - Get all versions
- `POST /api/versions` - Create a new version
- `GET /api/versions/{version}` - Get a specific version
- `PUT /api/versions/{version}` - Update a version
- `DELETE /api/versions/{version}` - Delete a version
- `GET /api/versions/{version}/shortnames` - Get all shortnames for a version
- `POST /api/versions/{version}/shortnames` - Add a shortname to a version

**New functions:**
- `getAllVersions` - Get all versions
- `getVersion` - Get a specific version
- `createVersion` - Create a new version
- `updateVersion` - Update a version
- `deleteVersion` - Delete a version
- `getVersionShortnames` - Get all shortnames for a version
- `addShortnameToVersion` - Add a shortname to a version

### 3. Frontend Changes

#### API Configuration:
- Update API endpoints to use the new version-first endpoints

#### Version Service:
- Update service methods to use the new endpoints

## Implementation Steps

### Step 1: Update DynamoDB Schema
1. Create a new `cms_versions` table with `version` as the primary key
2. Create a new `cms_shortname_versions` table for shortname-version associations

### Step 2: Update Lambda Functions
1. Update `version_lambda` to handle the new endpoints and use the new tables
2. Add new functions for version-first operations

### Step 3: Update API Gateway Routes
1. Add new routes for version-first operations

### Step 4: Update Frontend Code
1. Update API configuration to use the new endpoints
2. Update Version Service to use the new endpoints

### Step 5: Test Implementation
1. Test creating versions without shortnames
2. Test adding shortnames to versions
3. Test creating configurations for shortname-version combinations
