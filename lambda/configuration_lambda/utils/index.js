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
 * Get all configurations for a shortname and version from DynamoDB.
 * @param {string} shortname - The shortname.
 * @param {string} version - The version.
 * @param {string} configurationsTable - The DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function getAllConfigurations(shortname, version, configurationsTable) {
  try {
    const shortnameVersion = `${shortname}:${version}`;
    
    const params = {
      TableName: configurationsTable,
      IndexName: 'ShortnameVersionIndex',
      KeyConditionExpression: 'shortnameVersion = :shortnameVersion',
      ExpressionAttributeValues: {
        ':shortnameVersion': shortnameVersion
      }
    };

    const result = await dynamoDB.query(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({
        configurations: result.Items || []
      })
    };
  } catch (error) {
    console.error(`Error fetching configurations for shortname ${shortname} and version ${version}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch configurations', error: error.message })
    };
  }
}

/**
 * Get a specific configuration for a shortname and version from DynamoDB.
 * @param {string} shortname - The shortname.
 * @param {string} version - The version.
 * @param {string} configId - The configuration ID.
 * @param {string} configurationsTable - The DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function getConfiguration(shortname, version, configId, configurationsTable) {
  try {
    const params = {
      TableName: configurationsTable,
      Key: { configId }
    };

    const result = await dynamoDB.get(params).promise();
    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Configuration not found' })
      };
    }

    // Verify that the configuration belongs to the specified shortname and version
    const shortnameVersion = `${shortname}:${version}`;
    if (result.Item.shortnameVersion !== shortnameVersion) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Configuration not found for the specified shortname and version' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item)
    };
  } catch (error) {
    console.error(`Error fetching configuration ${configId} for shortname ${shortname} and version ${version}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch configuration', error: error.message })
    };
  }
}

/**
 * Create a new configuration for a shortname and version in DynamoDB.
 * @param {string} shortname - The shortname.
 * @param {string} version - The version.
 * @param {string} key - The configuration key.
 * @param {any} value - The configuration value.
 * @param {string} userId - The user ID creating the configuration.
 * @param {string} description - The configuration description.
 * @param {string} shortnamesTable - The shortnames DynamoDB table name.
 * @param {string} versionsTable - The versions DynamoDB table name.
 * @param {string} configurationsTable - The configurations DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function createConfiguration(shortname, version, key, value, userId, description, shortnamesTable, versionsTable, configurationsTable) {
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

    // Check if version exists
    const versionId = `${shortname}:${version}`;
    const versionParams = {
      TableName: versionsTable,
      Key: { versionId }
    };

    const versionResult = await dynamoDB.get(versionParams).promise();
    if (!versionResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Version not found' })
      };
    }

    // Check if configuration key already exists for this shortname and version
    const shortnameVersion = `${shortname}:${version}`;
    const existingParams = {
      TableName: configurationsTable,
      IndexName: 'ShortnameVersionIndex',
      KeyConditionExpression: 'shortnameVersion = :shortnameVersion',
      FilterExpression: '#key = :key',
      ExpressionAttributeNames: {
        '#key': 'key'
      },
      ExpressionAttributeValues: {
        ':shortnameVersion': shortnameVersion,
        ':key': key
      }
    };

    const existingResult = await dynamoDB.query(existingParams).promise();
    if (existingResult.Items && existingResult.Items.length > 0) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'Configuration key already exists for this shortname and version' })
      };
    }

    // Create new configuration
    const configId = uuidv4();
    const timestamp = new Date().toISOString();
    const configItem = {
      configId,
      shortnameVersion,
      shortname,
      version,
      key,
      value,
      description,
      createdBy: userId,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const params = {
      TableName: configurationsTable,
      Item: configItem
    };

    await dynamoDB.put(params).promise();
    return {
      statusCode: 201,
      body: JSON.stringify(configItem)
    };
  } catch (error) {
    console.error(`Error creating configuration for shortname ${shortname} and version ${version}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create configuration', error: error.message })
    };
  }
}

/**
 * Update a configuration for a shortname and version in DynamoDB.
 * @param {string} shortname - The shortname.
 * @param {string} version - The version.
 * @param {string} configId - The configuration ID.
 * @param {any} value - The updated configuration value.
 * @param {string} description - The updated description.
 * @param {string} configurationsTable - The DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function updateConfiguration(shortname, version, configId, value, description, configurationsTable) {
  try {
    // Check if configuration exists
    const existingParams = {
      TableName: configurationsTable,
      Key: { configId }
    };

    const existingResult = await dynamoDB.get(existingParams).promise();
    if (!existingResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Configuration not found' })
      };
    }

    // Verify that the configuration belongs to the specified shortname and version
    const shortnameVersion = `${shortname}:${version}`;
    if (existingResult.Item.shortnameVersion !== shortnameVersion) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Configuration not found for the specified shortname and version' })
      };
    }

    // Build update expression and attribute values
    const timestamp = new Date().toISOString();
    let updateExpression = 'SET updatedAt = :updatedAt';
    const expressionAttributeValues = {
      ':updatedAt': timestamp
    };

    if (value !== undefined) {
      updateExpression += ', #value = :value';
      expressionAttributeValues[':value'] = value;
    }

    if (description !== undefined) {
      updateExpression += ', description = :description';
      expressionAttributeValues[':description'] = description;
    }

    // Update configuration
    const params = {
      TableName: configurationsTable,
      Key: { configId },
      UpdateExpression: updateExpression,
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: {
        '#value': 'value'
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamoDB.update(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(result.Attributes)
    };
  } catch (error) {
    console.error(`Error updating configuration ${configId} for shortname ${shortname} and version ${version}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to update configuration', error: error.message })
    };
  }
}

/**
 * Delete a configuration.
 * @param {string} shortname - The shortname.
 * @param {string} version - The version.
 * @param {string} configId - The configuration ID to delete.
 * @param {string} configurationsTable - The configurations DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function deleteConfiguration(shortname, version, configId, configurationsTable) {
  try {
    // Check if configuration exists
    const existingParams = {
      TableName: configurationsTable,
      Key: { configId }
    };

    const existingResult = await dynamoDB.get(existingParams).promise();
    if (!existingResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Configuration not found' })
      };
    }

    // Verify that the configuration belongs to the specified shortname and version
    const shortnameVersion = `${shortname}:${version}`;
    if (existingResult.Item.shortnameVersion !== shortnameVersion) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Configuration not found for the specified shortname and version' })
      };
    }

    // Delete the configuration
    await dynamoDB.delete({
      TableName: configurationsTable,
      Key: { configId }
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Configuration deleted successfully' })
    };
  } catch (error) {
    console.error(`Error deleting configuration ${configId} for shortname ${shortname} and version ${version}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to delete configuration', error: error.message })
    };
  }
}

module.exports = {
  verifyToken,
  getAllConfigurations,
  getConfiguration,
  createConfiguration,
  updateConfiguration,
  deleteConfiguration
};
