/**
 * This Lambda handles CRUD operations for shortnames.
 * It validates the user's JWT token before performing any operation.
 * Operations include:
 * - GET /api/shortnames - List all shortnames
 * - POST /api/shortnames - Create a new shortname
 * - GET /api/shortnames/{shortname} - Get a specific shortname
 * - PUT /api/shortnames/{shortname} - Update a shortname
 * - DELETE /api/shortnames/{shortname} - Delete a shortname
 */

const { 
  verifyToken, 
  getAllShortnames, 
  getShortname, 
  createShortname, 
  updateShortname, 
  deleteShortname 
} = require('./utils/index');

const SECRET_KEY = process.env.SECRET_KEY;
const SHORTNAMES_TABLE = process.env.SHORTNAMES_TABLE;
const VERSIONS_TABLE = process.env.VERSIONS_TABLE;
const CONFIGURATIONS_TABLE = process.env.CONFIGURATIONS_TABLE;

exports.handler = async (event) => {
  console.log('Shortname Lambda triggered. Event:', JSON.stringify(event));

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
    const path = event.requestContext.http.path;
    const pathParams = event.pathParameters || {};
    const shortname = pathParams.shortname;

    switch (httpMethod) {
      case 'GET':
        if (shortname) {
          // Get specific shortname
          return await getShortname(shortname, SHORTNAMES_TABLE);
        } else {
          // List all shortnames
          return await getAllShortnames(SHORTNAMES_TABLE);
        }

      case 'POST':
        // Create new shortname
        if (shortname) {
          return badRequestResponse('Shortname should not be provided in the URL for POST requests');
        }

        const createBody = JSON.parse(event.body || '{}');
        if (!createBody.shortname) {
          return badRequestResponse('Shortname is required');
        }

        return await createShortname(createBody.shortname, userId, createBody.description || '', SHORTNAMES_TABLE);

      case 'PUT':
        // Update shortname
        if (!shortname) {
          return badRequestResponse('Shortname is required in the URL');
        }

        const updateBody = JSON.parse(event.body || '{}');
        return await updateShortname(shortname, updateBody.description || '', SHORTNAMES_TABLE);

      case 'DELETE':
        // Delete shortname
        if (!shortname) {
          return badRequestResponse('Shortname is required in the URL');
        }

        return await deleteShortname(shortname, SHORTNAMES_TABLE, VERSIONS_TABLE, CONFIGURATIONS_TABLE);

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ message: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Unexpected error in Shortname Lambda:', error);
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
