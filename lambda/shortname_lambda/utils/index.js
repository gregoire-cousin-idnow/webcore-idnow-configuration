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
 * Get all shortnames from DynamoDB.
 * @param {string} shortnamesTable - The DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function getAllShortnames(shortnamesTable) {
  try {
    const params = {
      TableName: shortnamesTable
    };

    const result = await dynamoDB.scan(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify({
        shortnames: result.Items || []
      })
    };
  } catch (error) {
    console.error('Error fetching all shortnames:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch shortnames', error: error.message })
    };
  }
}

/**
 * Get a specific shortname from DynamoDB.
 * @param {string} shortname - The shortname to get.
 * @param {string} shortnamesTable - The DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function getShortname(shortname, shortnamesTable) {
  try {
    const params = {
      TableName: shortnamesTable,
      Key: { shortname }
    };

    const result = await dynamoDB.get(params).promise();
    if (!result.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Shortname not found' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(result.Item)
    };
  } catch (error) {
    console.error(`Error fetching shortname ${shortname}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to fetch shortname', error: error.message })
    };
  }
}

/**
 * Create a new shortname in DynamoDB.
 * @param {string} shortname - The shortname to create.
 * @param {string} userId - The user ID creating the shortname.
 * @param {string} description - The shortname description.
 * @param {string} shortnamesTable - The DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function createShortname(shortname, userId, description, shortnamesTable) {
  try {
    // Check if shortname already exists
    const existingParams = {
      TableName: shortnamesTable,
      Key: { shortname }
    };

    const existingResult = await dynamoDB.get(existingParams).promise();
    if (existingResult.Item) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'Shortname already exists' })
      };
    }

    // Create new shortname
    const timestamp = new Date().toISOString();
    const shortnameItem = {
      shortname,
      description,
      createdBy: userId,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const params = {
      TableName: shortnamesTable,
      Item: shortnameItem
    };

    await dynamoDB.put(params).promise();
    return {
      statusCode: 201,
      body: JSON.stringify(shortnameItem)
    };
  } catch (error) {
    console.error(`Error creating shortname ${shortname}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to create shortname', error: error.message })
    };
  }
}

/**
 * Update a shortname in DynamoDB.
 * @param {string} shortname - The shortname to update.
 * @param {string} description - The updated description.
 * @param {string} shortnamesTable - The DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function updateShortname(shortname, description, shortnamesTable) {
  try {
    // Check if shortname exists
    const existingParams = {
      TableName: shortnamesTable,
      Key: { shortname }
    };

    const existingResult = await dynamoDB.get(existingParams).promise();
    if (!existingResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Shortname not found' })
      };
    }

    // Update shortname
    const timestamp = new Date().toISOString();
    const params = {
      TableName: shortnamesTable,
      Key: { shortname },
      UpdateExpression: 'SET description = :description, updatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':description': description,
        ':updatedAt': timestamp
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await dynamoDB.update(params).promise();
    return {
      statusCode: 200,
      body: JSON.stringify(result.Attributes)
    };
  } catch (error) {
    console.error(`Error updating shortname ${shortname}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to update shortname', error: error.message })
    };
  }
}

/**
 * Delete a shortname and all associated versions and configurations.
 * @param {string} shortname - The shortname to delete.
 * @param {string} shortnamesTable - The shortnames DynamoDB table name.
 * @param {string} versionsTable - The versions DynamoDB table name.
 * @param {string} configurationsTable - The configurations DynamoDB table name.
 * @returns {Promise<Object>} - The response object.
 */
async function deleteShortname(shortname, shortnamesTable, versionsTable, configurationsTable) {
  try {
    // Check if shortname exists
    const existingParams = {
      TableName: shortnamesTable,
      Key: { shortname }
    };

    const existingResult = await dynamoDB.get(existingParams).promise();
    if (!existingResult.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Shortname not found' })
      };
    }

    // Get all versions for this shortname
    const versionsParams = {
      TableName: versionsTable,
      IndexName: 'ShortnameIndex',
      KeyConditionExpression: 'shortname = :shortname',
      ExpressionAttributeValues: {
        ':shortname': shortname
      }
    };

    const versionsResult = await dynamoDB.query(versionsParams).promise();
    const versions = versionsResult.Items || [];

    // Delete all configurations for each version
    for (const version of versions) {
      const shortnameVersion = `${shortname}:${version.version}`;
      
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
        Key: { versionId: version.versionId }
      }).promise();
    }

    // Delete the shortname
    await dynamoDB.delete({
      TableName: shortnamesTable,
      Key: { shortname }
    }).promise();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Shortname and all associated data deleted successfully' })
    };
  } catch (error) {
    console.error(`Error deleting shortname ${shortname}:`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Failed to delete shortname', error: error.message })
    };
  }
}

module.exports = {
  verifyToken,
  getAllShortnames,
  getShortname,
  createShortname,
  updateShortname,
  deleteShortname
};
