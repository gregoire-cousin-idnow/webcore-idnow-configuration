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
 * Get all versions for a shortname from DynamoDB.
 * @param {string} shortname - The shortname to get versions for.
 * @param {string} versionsTable - The DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function getAllVersions(shortname, versionsTable) {
  try {
    const params = {
      TableName: versionsTable,
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
 * @param {string} versionsTable - The DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function getVersion(shortname, version, versionsTable) {
  try {
    // Generate the versionId
    const versionId = `${shortname}:${version}`;
    
    const params = {
      TableName: versionsTable,
      Key: { versionId }
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
 * @returns {Promise<Object>} - The response object.
 */
async function createVersion(shortname, version, userId, description, isActive, shortnamesTable, versionsTable) {
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

    // Generate the versionId
    const versionId = `${shortname}:${version}`;
    
    // Check if version already exists
    const existingParams = {
      TableName: versionsTable,
      Key: { versionId }
    };

    const existingResult = await dynamoDB.get(existingParams).promise();
    if (existingResult.Item) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'Version already exists for this shortname' })
      };
    }

    // Create new version
    const timestamp = new Date().toISOString();
    const versionItem = {
      versionId,
      shortname,
      version,
      description,
      isActive,
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
 * @param {string} versionsTable - The DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function updateVersion(shortname, version, description, isActive, versionsTable) {
  try {
    // Generate the versionId
    const versionId = `${shortname}:${version}`;
    
    // Check if version exists
    const existingParams = {
      TableName: versionsTable,
      Key: { versionId }
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
      Key: { versionId },
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
 * Delete a version and all associated configurations.
 * @param {string} shortname - The shortname.
 * @param {string} version - The version to delete.
 * @param {string} versionsTable - The versions DynamoDB table name.
 * @param {string} configurationsTable - The configurations DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function deleteVersion(shortname, version, versionsTable, configurationsTable) {
  try {
    // Generate the versionId
    const versionId = `${shortname}:${version}`;
    
    // Check if version exists
    const existingParams = {
      TableName: versionsTable,
      Key: { versionId }
    };

    const existingResult = await dynamoDB.get(existingParams).promise();
    if (!existingResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Version not found' })
      };
    }

    // Delete all configurations for this version
    const shortnameVersion = `${shortname}:${version}`;
    
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

    // Delete the version
    await dynamoDB.delete({
      TableName: versionsTable,
      Key: { versionId }
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

/**
 * Get all versions from DynamoDB.
 * @param {string} versionsTable - The DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function getAllVersionsTopLevel(versionsTable) {
  try {
    // Use the VersionIndex to get all versions
    const params = {
      TableName: versionsTable,
      IndexName: 'VersionIndex',
      ProjectionExpression: 'version, description, isActive, createdAt, updatedAt, createdBy'
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
    // Filter out system shortnames
    const nonSystemItems = result.Items.filter(item => !item.shortname.startsWith('_system_'));
    const responseItem = nonSystemItems.length > 0 ? nonSystemItems[0] : result.Items[0];
    
    // Remove shortname reference to present as a standalone version
    const { shortname, ...versionData } = responseItem;
    
    return {
      statusCode: 200,
      body: JSON.stringify(versionData)
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
    const { shortname, ...responseItem } = versionItem;
    
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
