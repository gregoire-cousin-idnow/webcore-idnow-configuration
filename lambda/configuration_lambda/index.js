/**
 * This Lambda handles CRUD operations for configurations.
 * It validates the user's JWT token before performing any operation.
 * Operations include:
 * - GET /api/shortnames/{shortname}/versions/{version}/configurations - List all configurations for a shortname and version
 * - POST /api/shortnames/{shortname}/versions/{version}/configurations - Create a new configuration for a shortname and version
 * - GET /api/shortnames/{shortname}/versions/{version}/configurations/{configId} - Get a specific configuration
 * - PUT /api/shortnames/{shortname}/versions/{version}/configurations/{configId} - Update a configuration
 * - DELETE /api/shortnames/{shortname}/versions/{version}/configurations/{configId} - Delete a configuration
 */

const { 
  verifyToken, 
  getAllConfigurations, 
  getConfiguration, 
  createConfiguration, 
  updateConfiguration, 
  deleteConfiguration 
} = require('./utils/index');

const SECRET_KEY = process.env.SECRET_KEY;
const SHORTNAMES_TABLE = process.env.SHORTNAMES_TABLE;
const VERSIONS_TABLE = process.env.VERSIONS_TABLE;
const CONFIGURATIONS_TABLE = process.env.CONFIGURATIONS_TABLE;

exports.handler = async (event) => {
  console.log('Configuration Lambda triggered. Event:', JSON.stringify(event));

  try {
    // Extract authorization token
    const authHeader = event.headers.Authorization || event.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Authorization header is missing or malformed');
      return unauthorizedResponse('Authorization token is missing or malformed');
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;

    try {
      decodedToken = verifyToken(token, SECRET_KEY);
    } catch (error) {
      console.error('Error verifying token:', error);
      if (error.name === 'TokenExpiredError') {
        return unauthorizedResponse('Token has expired');
      }
      return unauthorizedResponse('Invalid token');
    }

    const { userId } = decodedToken;
    console.log('Decoded token:', decodedToken);

    // Handle different HTTP methods
    const httpMethod = event.requestContext.http.method;
    const pathParams = event.pathParameters || {};
    const shortname = pathParams.shortname;
    const version = pathParams.version;
    const configId = pathParams.configId;

    if (!shortname) {
      return badRequestResponse('Shortname is required in the URL');
    }

    if (!version) {
      return badRequestResponse('Version is required in the URL');
    }

    switch (httpMethod) {
      case 'GET':
        if (configId) {
          // Get specific configuration
          return await getConfiguration(shortname, version, configId, CONFIGURATIONS_TABLE);
        } else {
          // List all configurations for a shortname and version
          return await getAllConfigurations(shortname, version, CONFIGURATIONS_TABLE);
        }

      case 'POST':
        // Create new configuration
        if (configId) {
          return badRequestResponse('ConfigId should not be provided in the URL for POST requests');
        }

        const createBody = JSON.parse(event.body || '{}');
        if (!createBody.key) {
          return badRequestResponse('Configuration key is required');
        }

        return await createConfiguration(
          shortname, 
          version, 
          createBody.key,
          createBody.value,
          userId, 
          createBody.description || '', 
          SHORTNAMES_TABLE,
          VERSIONS_TABLE,
          CONFIGURATIONS_TABLE
        );

      case 'PUT':
        // Update configuration
        if (!configId) {
          return badRequestResponse('ConfigId is required in the URL');
        }

        const updateBody = JSON.parse(event.body || '{}');
        return await updateConfiguration(
          shortname, 
          version, 
          configId, 
          updateBody.value,
          updateBody.description,
          CONFIGURATIONS_TABLE
        );

      case 'DELETE':
        // Delete configuration
        if (!configId) {
          return badRequestResponse('ConfigId is required in the URL');
        }

        return await deleteConfiguration(shortname, version, configId, CONFIGURATIONS_TABLE);

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ message: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Unexpected error in Configuration Lambda:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error', error: error.message })
    };
  }
};

function unauthorizedResponse(message) {
  return {
    statusCode: 401,
    body: JSON.stringify({ message })
  };
}

function badRequestResponse(message) {
  return {
    statusCode: 400,
    body: JSON.stringify({ message })
  };
}
