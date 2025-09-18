# Backend Update Plan for Version-First Approach

## Current Implementation

The current backend implementation uses a shortname-first approach:

1. **DynamoDB Schema**:
   - `cms_versions` table has primary key `versionId` (composite of `shortname:version`)
   - Global secondary index on `shortname` to query versions for a shortname
   - No index on just the `version` field

2. **Lambda Functions**:
   - All version operations require a shortname parameter
   - versionId is constructed as `${shortname}:${version}`

3. **API Gateway Routes**:
   - All version routes are under `/api/shortnames/{shortname}/versions`
   - No direct version access routes

## Required Changes

### 1. Update DynamoDB Schema

```terraform
resource "aws_dynamodb_table" "cms_versions" {
  name         = "${var.project_name}-versions-${var.cms_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "versionId"

  attribute {
    name = "versionId"
    type = "S"
  }

  attribute {
    name = "shortname"
    type = "S"
  }

  attribute {
    name = "version"
    type = "S"
  }

  global_secondary_index {
    name               = "ShortnameIndex"
    hash_key           = "shortname"
    projection_type    = "ALL"
    write_capacity     = 0
    read_capacity      = 0
  }

  global_secondary_index {
    name               = "VersionIndex"
    hash_key           = "version"
    projection_type    = "ALL"
    write_capacity     = 0
    read_capacity      = 0
  }
}
```

### 2. Add New API Gateway Routes

```terraform
"GET /api/versions" = {
  integration = {
    uri                    = module.cms_version_lambda.lambda_function_invoke_arn
    payload_format_version = "2.0"
    type                   = "AWS_PROXY"
  }
},

"POST /api/versions" = {
  integration = {
    uri                    = module.cms_version_lambda.lambda_function_invoke_arn
    payload_format_version = "2.0"
    type                   = "AWS_PROXY"
  }
},

"GET /api/versions/{version}" = {
  integration = {
    uri                    = module.cms_version_lambda.lambda_function_invoke_arn
    payload_format_version = "2.0"
    type                   = "AWS_PROXY"
  }
},

"PUT /api/versions/{version}" = {
  integration = {
    uri                    = module.cms_version_lambda.lambda_function_invoke_arn
    payload_format_version = "2.0"
    type                   = "AWS_PROXY"
  }
},

"DELETE /api/versions/{version}" = {
  integration = {
    uri                    = module.cms_version_lambda.lambda_function_invoke_arn
    payload_format_version = "2.0"
    type                   = "AWS_PROXY"
  }
},

"GET /api/versions/{version}/shortnames" = {
  integration = {
    uri                    = module.cms_version_lambda.lambda_function_invoke_arn
    payload_format_version = "2.0"
    type                   = "AWS_PROXY"
  }
},

"POST /api/versions/{version}/shortnames" = {
  integration = {
    uri                    = module.cms_version_lambda.lambda_function_invoke_arn
    payload_format_version = "2.0"
    type                   = "AWS_PROXY"
  }
}
```

### 3. Update Lambda Functions

#### 3.1 Update version_lambda/index.js

```javascript
exports.handler = async (event) => {
  // Authentication code...

  const httpMethod = event.requestContext.http.method;
  const pathParams = event.pathParameters || {};
  const path = event.requestContext.http.path;
  
  // Handle version-first approach
  if (path.startsWith('/api/versions')) {
    const version = pathParams.version;
    
    if (!version && httpMethod === 'GET') {
      // GET /api/versions - List all versions
      return await getAllVersionsTopLevel(VERSIONS_TABLE);
    }
    
    if (!version && httpMethod === 'POST') {
      // POST /api/versions - Create a new version
      const body = JSON.parse(event.body || '{}');
      return await createVersionTopLevel(body.version, userId, body.description, body.isActive, VERSIONS_TABLE);
    }
    
    if (version && httpMethod === 'GET' && !path.includes('/shortnames')) {
      // GET /api/versions/{version} - Get a specific version
      return await getVersionTopLevel(version, VERSIONS_TABLE);
    }
    
    if (version && httpMethod === 'PUT') {
      // PUT /api/versions/{version} - Update a version
      const body = JSON.parse(event.body || '{}');
      return await updateVersionTopLevel(version, body.description, body.isActive, VERSIONS_TABLE);
    }
    
    if (version && httpMethod === 'DELETE') {
      // DELETE /api/versions/{version} - Delete a version
      return await deleteVersionTopLevel(version, VERSIONS_TABLE, CONFIGURATIONS_TABLE);
    }
    
    if (version && path.includes('/shortnames')) {
      if (httpMethod === 'GET') {
        // GET /api/versions/{version}/shortnames - Get all shortnames for a version
        return await getVersionShortnames(version, VERSIONS_TABLE);
      }
      
      if (httpMethod === 'POST') {
        // POST /api/versions/{version}/shortnames - Add a shortname to a version
        const body = JSON.parse(event.body || '{}');
        return await addShortnameToVersion(version, body.shortname, body.description, userId, SHORTNAMES_TABLE, VERSIONS_TABLE);
      }
    }
  }
  
  // Existing shortname-first approach code...
};
```

#### 3.2 Add new functions to version_lambda/utils/index.js

```javascript
/**
 * Get all versions from DynamoDB.
 * @param {string} versionsTable - The DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function getAllVersionsTopLevel(versionsTable) {
  try {
    // Use the VersionIndex to get all unique versions
    const params = {
      TableName: versionsTable,
      IndexName: 'VersionIndex',
      ProjectionExpression: 'version, description, isActive, createdAt, updatedAt'
    };
    
    const result = await dynamoDB.scan(params).promise();
    
    // Remove duplicates (same version across different shortnames)
    const uniqueVersions = Array.from(
      new Map(result.Items.map(item => [item.version, item])).values()
    );
    
    return {
      statusCode: 200,
      body: JSON.stringify({ versions: uniqueVersions })
    };
  } catch (error) {
    console.error('Error fetching all versions:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch versions', error: error.message })
    };
  }
}

/**
 * Get a specific version from DynamoDB.
 * @param {string} version - The version to get.
 * @param {string} versionsTable - The DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function getVersionTopLevel(version, versionsTable) {
  try {
    const params = {
      TableName: versionsTable,
      IndexName: 'VersionIndex',
      KeyConditionExpression: 'version = :version',
      ExpressionAttributeValues: {
        ':version': version
      }
    };
    
    const result = await dynamoDB.query(params).promise();
    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Version not found' })
      };
    }
    
    // Return the first item (there might be multiple with different shortnames)
    return {
      statusCode: 200,
      body: JSON.stringify(result.Items[0])
    };
  } catch (error) {
    console.error(`Error fetching version ${version}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch version', error: error.message })
    };
  }
}

/**
 * Create a new version in DynamoDB.
 * @param {string} version - The version to create.
 * @param {string} userId - The user ID creating the version.
 * @param {string} description - The version description.
 * @param {boolean} isActive - Whether the version is active.
 * @param {string} versionsTable - The versions DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function createVersionTopLevel(version, userId, description, isActive, versionsTable) {
  try {
    // Check if version already exists
    const params = {
      TableName: versionsTable,
      IndexName: 'VersionIndex',
      KeyConditionExpression: 'version = :version',
      ExpressionAttributeValues: {
        ':version': version
      }
    };
    
    const result = await dynamoDB.query(params).promise();
    if (result.Items && result.Items.length > 0) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'Version already exists' })
      };
    }
    
    // Create a system shortname for this version
    const systemShortname = `_system_${version}`;
    const versionId = `${systemShortname}:${version}`;
    
    // Create new version
    const timestamp = new Date().toISOString();
    const versionItem = {
      versionId,
      shortname: systemShortname,
      version,
      description: description || '',
      isActive: isActive || false,
      createdBy: userId,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await dynamoDB.put({
      TableName: versionsTable,
      Item: versionItem
    }).promise();
    
    // Return a clean version object without the system shortname
    const responseItem = {
      ...versionItem,
      shortname: undefined
    };
    
    return {
      statusCode: 201,
      body: JSON.stringify(responseItem)
    };
  } catch (error) {
    console.error(`Error creating version ${version}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create version', error: error.message })
    };
  }
}

/**
 * Get all shortnames for a version from DynamoDB.
 * @param {string} version - The version to get shortnames for.
 * @param {string} versionsTable - The DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function getVersionShortnames(version, versionsTable) {
  try {
    const params = {
      TableName: versionsTable,
      IndexName: 'VersionIndex',
      KeyConditionExpression: 'version = :version',
      ExpressionAttributeValues: {
        ':version': version
      }
    };
    
    const result = await dynamoDB.query(params).promise();
    
    // Filter out system shortnames
    const shortnames = result.Items
      .filter(item => !item.shortname.startsWith('_system_'))
      .map(item => ({
        shortname: item.shortname,
        description: item.description
      }));
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        shortnames
      })
    };
  } catch (error) {
    console.error(`Error fetching shortnames for version ${version}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch shortnames', error: error.message })
    };
  }
}

/**
 * Add a shortname to a version in DynamoDB.
 * @param {string} version - The version.
 * @param {string} shortname - The shortname to add.
 * @param {string} description - The shortname description.
 * @param {string} userId - The user ID creating the shortname.
 * @param {string} shortnamesTable - The shortnames DynamoDB table name.
 * @param {string} versionsTable - The versions DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function addShortnameToVersion(version, shortname, description, userId, shortnamesTable, versionsTable) {
  try {
    // Check if shortname exists, create if not
    const shortnameParams = {
      TableName: shortnamesTable,
      Key: { shortname }
    };
    
    const shortnameResult = await dynamoDB.get(shortnameParams).promise();
    if (!shortnameResult.Item) {
      // Create the shortname
      const timestamp = new Date().toISOString();
      const shortnameItem = {
        shortname,
        description: description || '',
        createdBy: userId,
        createdAt: timestamp,
        updatedAt: timestamp
      };
      
      await dynamoDB.put({
        TableName: shortnamesTable,
        Item: shortnameItem
      }).promise();
    }
    
    // Generate the versionId
    const versionId = `${shortname}:${version}`;
    
    // Check if this shortname-version combination already exists
    const existingParams = {
      TableName: versionsTable,
      Key: { versionId }
    };
    
    const existingResult = await dynamoDB.get(existingParams).promise();
    if (existingResult.Item) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'Shortname already exists for this version' })
      };
    }
    
    // Create the version-shortname association
    const timestamp = new Date().toISOString();
    const versionItem = {
      versionId,
      shortname,
      version,
      description: `Version ${version} for ${shortname}`,
      isActive: true,
      createdBy: userId,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await dynamoDB.put({
      TableName: versionsTable,
      Item: versionItem
    }).promise();
    
    return {
      statusCode: 201,
      body: JSON.stringify({
        shortname,
        version,
        description: versionItem.description
      })
    };
  } catch (error) {
    console.error(`Error adding shortname ${shortname} to version ${version}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to add shortname to version', error: error.message })
    };
  }
}

/**
 * Update a version in DynamoDB.
 * @param {string} version - The version to update.
 * @param {string} description - The updated description.
 * @param {boolean} isActive - Whether the version is active.
 * @param {string} versionsTable - The DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function updateVersionTopLevel(version, description, isActive, versionsTable) {
  try {
    // Get all entries for this version
    const params = {
      TableName: versionsTable,
      IndexName: 'VersionIndex',
      KeyConditionExpression: 'version = :version',
      ExpressionAttributeValues: {
        ':version': version
      }
    };
    
    const result = await dynamoDB.query(params).promise();
    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Version not found' })
      };
    }
    
    // Update all entries for this version
    const timestamp = new Date().toISOString();
    const updatePromises = result.Items.map(item => {
      let updateExpression = 'SET updatedAt = :updatedAt';
      const expressionAttributeValues = {
        ':updatedAt': timestamp
      };
      
      if (description !== undefined) {
        updateExpression += ', description = :description';
        expressionAttributeValues[':description'] = description;
      }
      
      if (isActive !== undefined) {
        updateExpression += ', isActive = :isActive';
        expressionAttributeValues[':isActive'] = isActive;
      }
      
      return dynamoDB.update({
        TableName: versionsTable,
        Key: { versionId: item.versionId },
        UpdateExpression: updateExpression,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      }).promise();
    });
    
    await Promise.all(updatePromises);
    
    // Return the updated version
    const updatedVersion = {
      version,
      description: description !== undefined ? description : result.Items[0].description,
      isActive: isActive !== undefined ? isActive : result.Items[0].isActive,
      updatedAt: timestamp
    };
    
    return {
      statusCode: 200,
      body: JSON.stringify(updatedVersion)
    };
  } catch (error) {
    console.error(`Error updating version ${version}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to update version', error: error.message })
    };
  }
}

/**
 * Delete a version and all associated configurations.
 * @param {string} version - The version to delete.
 * @param {string} versionsTable - The versions DynamoDB table name.
 * @param {string} configurationsTable - The configurations DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function deleteVersionTopLevel(version, versionsTable, configurationsTable) {
  try {
    // Get all entries for this version
    const params = {
      TableName: versionsTable,
      IndexName: 'VersionIndex',
      KeyConditionExpression: 'version = :version',
      ExpressionAttributeValues: {
        ':version': version
      }
    };
    
    const result = await dynamoDB.query(params).promise();
    if (!result.Items || result.Items.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Version not found' })
      };
    }
    
    // Delete all configurations for this version
    for (const item of result.Items) {
      const shortnameVersion = `${item.shortname}:${version}`;
      
      const configurationsParams = {
        TableName: configurationsTable,
        IndexName: 'ShortnameVersionIndex',
        KeyConditionExpression: 'shortnameVersion = :shortnameVersion',
        ExpressionAttributeValues: {
          ':shortnameVersion': shortnameVersion
        }
      };
      
      const configurationsResult = await dynamoDB.query(configurationsParams).promise();
      const configurations = configurationsResult.Items || [];
      
      // Delete each configuration
      for (const config of configurations) {
        await dynamoDB.delete({
          TableName: configurationsTable,
          Key: { configId: config.configId }
        }).promise();
      }
      
      // Delete the version entry
      await dynamoDB.delete({
        TableName: versionsTable,
        Key: { versionId: item.versionId }
      }).promise();
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Version and all associated configurations deleted successfully' })
    };
  } catch (error) {
    console.error(`Error deleting version ${version}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to delete version', error: error.message })
    };
  }
}

// Export the new functions
module.exports = {
  verifyToken,
  getAllVersions,
  getVersion,
  createVersion,
  updateVersion,
  deleteVersion,
  getAllVersionsTopLevel,
  getVersionTopLevel,
  createVersionTopLevel,
  updateVersionTopLevel,
  deleteVersionTopLevel,
  getVersionShortnames,
  addShortnameToVersion
};
```

### 4. Update Frontend Code

#### 4.1 Update API Configuration (src/config/api.config.ts)

```typescript
export const API_ENDPOINTS = {
  // ...existing endpoints
  
  VERSIONS: {
    ALL: `${API_BASE_URL}/versions`,
    CREATE: `${API_BASE_URL}/versions`,
    DETAIL_BY_ID: (versionId: string) => `${API_BASE_URL}/versions/${versionId}`,
    SHORTNAMES: (version: string) => `${API_BASE_URL}/versions/${version}/shortnames`,
    
    // Keep legacy endpoints for backward compatibility
    BY_SHORTNAME: (shortname: string) => `${API_BASE_URL}/shortnames/${shortname}/versions`,
    DETAIL: (shortname: string, version: string) => `${API_BASE_URL}/shortnames/${shortname}/versions/${version}`,
  },
};
```

#### 4.2 Update VersionService (src/services/VersionService.ts)

```typescript
/**
 * Get all versions
 * @param setError - Optional error setter function
 * @returns Version response
 */
async getAllVersions(setError?: (error: string) => void): Promise<VersionResponse> {
  try {
    // Use the direct endpoint to get all versions
    return this.get<VersionResponse>(API_ENDPOINTS.VERSIONS.ALL, setError);
  } catch (error) {
    if (setError) setError(error instanceof Error ? error.message : 'Failed to fetch versions');
    throw error;
  }
}

/**
 * Create a new version
 * @param data - Version form data
 * @param setError - Optional error setter function
 * @returns Created version
 */
async createVersion(data: VersionFormData, setError?: (error: string) => void): Promise<Version> {
  try {
    // Create the version as a top-level entity
    const url = API_ENDPOINTS.VERSIONS.CREATE;
    return this.post<Version>(url, data, setError);
  } catch (error) {
    if (setError) setError(error instanceof Error ? error.message : 'Failed to create version');
    throw error;
  }
}

/**
 * Get shortnames for a version
 * @param version - Version string
 * @param setError - Optional error setter function
 * @returns Shortname response
 */
async getVersionShortnames(version: string, setError?: (error: string) => void): Promise<ShortnameResponse> {
  try {
    // Use the direct endpoint to get shortnames for a version
    const url = API_ENDPOINTS.VERSIONS.SHORTNAMES(version);
    return this.get<ShortnameResponse>(url, setError);
  } catch (error) {
    if (setError) setError(error instanceof Error ? error.message : 'Failed to fetch shortnames for version');
    throw error;
  }
}

/**
 * Create a shortname in a version
 * @param version - Version string
 * @param data - Shortname form data
 * @param setError - Optional error setter function
 * @returns Created shortname
 */
async createShortnameInVersion(
  version: string,
  data: { shortname: string; description: string },
  setError?: (error: string) => void
): Promise<any> {
  try {
    // Post directly to the version's shortnames endpoint
    const url = API_ENDPOINTS.VERSIONS.SHORTNAMES(version);
    return this.post<any>(url, data, setError);
  } catch (error) {
    if (setError) setError(error instanceof Error ? error.message : 'Failed to create shortname in version');
    throw error;
  }
}

/**
 * Delete a version
 * @param version - Version string
 * @param setError - Optional error setter function
 * @returns API response
 */
async deleteVersion(version: string, setError?: (error: string) => void): Promise<any> {
  try {
    // Delete the version from the top-level versions endpoint
    const url = `${API_ENDPOINTS.VERSIONS.ALL}/${version}`;
    return this.delete(url, setError);
  } catch (error) {
    if (setError) setError(error instanceof Error ? error.message : 'Failed to delete version');
    throw error;
  }
}
```

## Implementation Steps

1. **Update DynamoDB Schema**:
   - Add the `version` attribute and `VersionIndex` to the `cms_versions` table

2. **Update Lambda Functions**:
   - Add new functions to `version_lambda/utils/index.js`
   - Update `version_lambda/index.js` to handle version-first routes

3. **Update API Gateway Routes**:
   - Add new routes for version-first operations

4. **Update Frontend Code**:
   - Update API configuration
   - Update VersionService to use the new endpoints

5. **Deploy Changes**:
   - Deploy backend changes with Terraform
   - Deploy frontend changes

6. **Test Implementation**:
   - Test all new endpoints
   - Verify frontend functionality

## Backward Compatibility

The implementation maintains backward compatibility by:

1. Keeping existing shortname-first routes and functions
2. Using a system shortname for versions without explicit shortnames
3. Preserving the existing data structure while adding new capabilities

This allows for a smooth transition to the version-first approach without breaking existing functionality.
