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

module.exports = {
  verifyToken,
  getAllVersions,
  getVersion,
  createVersion,
  updateVersion,
  deleteVersion
};
