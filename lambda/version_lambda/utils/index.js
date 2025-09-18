const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const dynamoDB = new AWS.DynamoDB.DocumentClient();

/**
 * Verify a JWT token.
 * @param {string} token - The JWT token.
 * @param {string} secretKey - The secret key to verify the token.
 * @returns {Object} - The decoded token.
 * @throws {Error} - If the token is invalid or expired.
 */
function verifyToken(token, secretKey) {
  if (!secretKey) throw new Error('Secret key is required to verify the token');
  try {
    return jwt.verify(token, secretKey, { algorithms: ['HS256'] });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    }
    throw new Error('Invalid token');
  }
}

/**
 * Get all versions from DynamoDB.
 * @param {string} versionsTable - The DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function getAllVersions(versionsTable) {
  try {
    const params = {
      TableName: versionsTable
    };

    const result = await dynamoDB.scan(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({
        versions: result.Items || []
      })
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
async function getVersion(version, versionsTable) {
  try {
    const params = {
      TableName: versionsTable,
      Key: { version }
    };

    const result = await dynamoDB.get(params).promise();
    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Version not found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item)
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
async function createVersion(version, userId, description, isActive, versionsTable) {
  try {
    // Check if version already exists
    const existingParams = {
      TableName: versionsTable,
      Key: { version }
    };

    const existingResult = await dynamoDB.get(existingParams).promise();
    if (existingResult.Item) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'Version already exists' })
      };
    }

    // Create new version
    const timestamp = new Date().toISOString();
    const versionItem = {
      version,
      description: description || '',
      isActive: isActive || false,
      createdBy: userId,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const params = {
      TableName: versionsTable,
      Item: versionItem
    };

    await dynamoDB.put(params).promise();
    return {
      statusCode: 201,
      body: JSON.stringify(versionItem)
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
 * Update a version in DynamoDB.
 * @param {string} version - The version to update.
 * @param {string} description - The updated description.
 * @param {boolean} isActive - Whether the version is active.
 * @param {string} versionsTable - The DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function updateVersion(version, description, isActive, versionsTable) {
  try {
    // Check if version exists
    const existingParams = {
      TableName: versionsTable,
      Key: { version }
    };

    const existingResult = await dynamoDB.get(existingParams).promise();
    if (!existingResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Version not found' })
      };
    }

    // Build update expression and attribute values
    const timestamp = new Date().toISOString();
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

    // Update version
    const params = {
      TableName: versionsTable,
      Key: { version },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamoDB.update(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(result.Attributes)
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
 * Delete a version and all associated shortname-versions and configurations.
 * @param {string} version - The version to delete.
 * @param {string} versionsTable - The versions DynamoDB table name.
 * @param {string} shortnameVersionsTable - The shortname-versions DynamoDB table name.
 * @param {string} configurationsTable - The configurations DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function deleteVersion(version, versionsTable, shortnameVersionsTable, configurationsTable) {
  try {
    // Check if version exists
    const existingParams = {
      TableName: versionsTable,
      Key: { version }
    };

    const existingResult = await dynamoDB.get(existingParams).promise();
    if (!existingResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Version not found' })
      };
    }

    // Get all shortname-versions for this version
    const shortnameVersionsParams = {
      TableName: shortnameVersionsTable,
      IndexName: 'VersionIndex',
      KeyConditionExpression: 'version = :version',
      ExpressionAttributeValues: {
        ':version': version
      }
    };

    const shortnameVersionsResult = await dynamoDB.query(shortnameVersionsParams).promise();
    const shortnameVersions = shortnameVersionsResult.Items || [];

    // Delete all configurations for this version
    for (const shortnameVersion of shortnameVersions) {
      const shortnameVersionId = `${shortnameVersion.shortname}:${version}`;
      
      const configurationsParams = {
        TableName: configurationsTable,
        IndexName: 'ShortnameVersionIndex',
        KeyConditionExpression: 'shortnameVersion = :shortnameVersion',
        ExpressionAttributeValues: {
          ':shortnameVersion': shortnameVersionId
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
      
      // Delete the shortname-version entry
      await dynamoDB.delete({
        TableName: shortnameVersionsTable,
        Key: { shortnameVersionId: shortnameVersion.shortnameVersionId }
      }).promise();
    }

    // Delete the version
    await dynamoDB.delete({
      TableName: versionsTable,
      Key: { version }
    }).promise();

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

/**
 * Get all shortnames for a version from DynamoDB.
 * @param {string} version - The version to get shortnames for.
 * @param {string} shortnameVersionsTable - The shortname-versions DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function getVersionShortnames(version, shortnameVersionsTable) {
  try {
    const params = {
      TableName: shortnameVersionsTable,
      IndexName: 'VersionIndex',
      KeyConditionExpression: 'version = :version',
      ExpressionAttributeValues: {
        ':version': version
      }
    };
    
    const result = await dynamoDB.query(params).promise();
    
    const shortnames = result.Items.map(item => ({
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
 * @param {string} shortnameVersionsTable - The shortname-versions DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function addShortnameToVersion(version, shortname, description, userId, shortnamesTable, versionsTable, shortnameVersionsTable) {
  try {
    // Check if version exists
    const versionParams = {
      TableName: versionsTable,
      Key: { version }
    };

    const versionResult = await dynamoDB.get(versionParams).promise();
    if (!versionResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Version not found' })
      };
    }

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
    
    // Generate the shortnameVersionId
    const shortnameVersionId = `${shortname}:${version}`;
    
    // Check if this shortname-version combination already exists
    const existingParams = {
      TableName: shortnameVersionsTable,
      Key: { shortnameVersionId }
    };
    
    const existingResult = await dynamoDB.get(existingParams).promise();
    if (existingResult.Item) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'Shortname already exists for this version' })
      };
    }
    
    // Create the shortname-version association
    const timestamp = new Date().toISOString();
    const shortnameVersionItem = {
      shortnameVersionId,
      shortname,
      version,
      description: description || `Version ${version} for ${shortname}`,
      isActive: true,
      createdBy: userId,
      createdAt: timestamp,
      updatedAt: timestamp
    };
    
    await dynamoDB.put({
      TableName: shortnameVersionsTable,
      Item: shortnameVersionItem
    }).promise();
    
    return {
      statusCode: 201,
      body: JSON.stringify({
        shortname,
        version,
        description: shortnameVersionItem.description
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
 * Get all versions for a shortname from DynamoDB.
 * @param {string} shortname - The shortname to get versions for.
 * @param {string} shortnameVersionsTable - The shortname-versions DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function getAllVersionsForShortname(shortname, shortnameVersionsTable) {
  try {
    const params = {
      TableName: shortnameVersionsTable,
      IndexName: 'ShortnameIndex',
      KeyConditionExpression: 'shortname = :shortname',
      ExpressionAttributeValues: {
        ':shortname': shortname
      }
    };

    const result = await dynamoDB.query(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({
        versions: result.Items || []
      })
    };
  } catch (error) {
    console.error(`Error fetching versions for shortname ${shortname}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch versions', error: error.message })
    };
  }
}

/**
 * Get a specific version for a shortname from DynamoDB.
 * @param {string} shortname - The shortname.
 * @param {string} version - The version to get.
 * @param {string} shortnameVersionsTable - The shortname-versions DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function getVersionForShortname(shortname, version, shortnameVersionsTable) {
  try {
    // Generate the shortnameVersionId
    const shortnameVersionId = `${shortname}:${version}`;
    
    const params = {
      TableName: shortnameVersionsTable,
      Key: { shortnameVersionId }
    };

    const result = await dynamoDB.get(params).promise();
    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Version not found for this shortname' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item)
    };
  } catch (error) {
    console.error(`Error fetching version ${version} for shortname ${shortname}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch version', error: error.message })
    };
  }
}

/**
 * Create a new version for a shortname in DynamoDB.
 * @param {string} shortname - The shortname.
 * @param {string} version - The version to create.
 * @param {string} userId - The user ID creating the version.
 * @param {string} description - The version description.
 * @param {boolean} isActive - Whether the version is active.
 * @param {string} shortnamesTable - The shortnames DynamoDB table name.
 * @param {string} versionsTable - The versions DynamoDB table name.
 * @param {string} shortnameVersionsTable - The shortname-versions DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function createVersionForShortname(shortname, version, userId, description, isActive, shortnamesTable, versionsTable, shortnameVersionsTable) {
  try {
    // Check if shortname exists
    const shortnameParams = {
      TableName: shortnamesTable,
      Key: { shortname }
    };

    const shortnameResult = await dynamoDB.get(shortnameParams).promise();
    if (!shortnameResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Shortname not found' })
      };
    }

    // Check if version exists, create if not
    const versionParams = {
      TableName: versionsTable,
      Key: { version }
    };

    const versionResult = await dynamoDB.get(versionParams).promise();
    if (!versionResult.Item) {
      // Create the version
      const timestamp = new Date().toISOString();
      const versionItem = {
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
    }

    // Generate the shortnameVersionId
    const shortnameVersionId = `${shortname}:${version}`;
    
    // Check if this shortname-version combination already exists
    const existingParams = {
      TableName: shortnameVersionsTable,
      Key: { shortnameVersionId }
    };

    const existingResult = await dynamoDB.get(existingParams).promise();
    if (existingResult.Item) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'Version already exists for this shortname' })
      };
    }

    // Create the shortname-version association
    const timestamp = new Date().toISOString();
    const shortnameVersionItem = {
      shortnameVersionId,
      shortname,
      version,
      description: description || '',
      isActive: isActive || false,
      createdBy: userId,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const params = {
      TableName: shortnameVersionsTable,
      Item: shortnameVersionItem
    };

    await dynamoDB.put(params).promise();
    return {
      statusCode: 201,
      body: JSON.stringify(shortnameVersionItem)
    };
  } catch (error) {
    console.error(`Error creating version ${version} for shortname ${shortname}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create version', error: error.message })
    };
  }
}

/**
 * Update a version for a shortname in DynamoDB.
 * @param {string} shortname - The shortname.
 * @param {string} version - The version to update.
 * @param {string} description - The updated description.
 * @param {boolean} isActive - Whether the version is active.
 * @param {string} shortnameVersionsTable - The shortname-versions DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function updateVersionForShortname(shortname, version, description, isActive, shortnameVersionsTable) {
  try {
    // Generate the shortnameVersionId
    const shortnameVersionId = `${shortname}:${version}`;
    
    // Check if shortname-version exists
    const existingParams = {
      TableName: shortnameVersionsTable,
      Key: { shortnameVersionId }
    };

    const existingResult = await dynamoDB.get(existingParams).promise();
    if (!existingResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Version not found for this shortname' })
      };
    }

    // Build update expression and attribute values
    const timestamp = new Date().toISOString();
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

    // Update shortname-version
    const params = {
      TableName: shortnameVersionsTable,
      Key: { shortnameVersionId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamoDB.update(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(result.Attributes)
    };
  } catch (error) {
    console.error(`Error updating version ${version} for shortname ${shortname}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to update version', error: error.message })
    };
  }
}

/**
 * Delete a version for a shortname and all associated configurations.
 * @param {string} shortname - The shortname.
 * @param {string} version - The version to delete.
 * @param {string} shortnameVersionsTable - The shortname-versions DynamoDB table name.
 * @param {string} configurationsTable - The configurations DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function deleteVersionForShortname(shortname, version, shortnameVersionsTable, configurationsTable) {
  try {
    // Generate the shortnameVersionId
    const shortnameVersionId = `${shortname}:${version}`;
    
    // Check if shortname-version exists
    const existingParams = {
      TableName: shortnameVersionsTable,
      Key: { shortnameVersionId }
    };

    const existingResult = await dynamoDB.get(existingParams).promise();
    if (!existingResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Version not found for this shortname' })
      };
    }

    // Delete all configurations for this shortname-version
    const configurationsParams = {
      TableName: configurationsTable,
      IndexName: 'ShortnameVersionIndex',
      KeyConditionExpression: 'shortnameVersion = :shortnameVersion',
      ExpressionAttributeValues: {
        ':shortnameVersion': shortnameVersionId
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

    // Delete the shortname-version
    await dynamoDB.delete({
      TableName: shortnameVersionsTable,
      Key: { shortnameVersionId }
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Version and all associated configurations deleted successfully' })
    };
  } catch (error) {
    console.error(`Error deleting version ${version} for shortname ${shortname}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to delete version', error: error.message })
    };
  }
}

module.exports = {
  verifyToken,
  getAllVersions,
  getVersion,
  createVersion,
  updateVersion,
  deleteVersion,
  getVersionShortnames,
  addShortnameToVersion,
  getAllVersionsForShortname,
  getVersionForShortname,
  createVersionForShortname,
  updateVersionForShortname,
  deleteVersionForShortname
};
