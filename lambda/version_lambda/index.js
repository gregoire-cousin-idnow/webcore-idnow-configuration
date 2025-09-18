/**
 * This Lambda handles CRUD operations for versions.
 * It validates the user's JWT token before performing any operation.
 * Operations include:
 * 
 * Version-first approach:
 * - GET /api/versions - List all versions
 * - POST /api/versions - Create a new version
 * - GET /api/versions/{version} - Get a specific version
 * - PUT /api/versions/{version} - Update a version
 * - DELETE /api/versions/{version} - Delete a version
 * - GET /api/versions/{version}/shortnames - Get all shortnames for a version
 * - POST /api/versions/{version}/shortnames - Add a shortname to a version
 * 
 * Shortname-first approach (legacy):
 * - GET /api/shortnames/{shortname}/versions - List all versions for a shortname
 * - POST /api/shortnames/{shortname}/versions - Create a new version for a shortname
 * - GET /api/shortnames/{shortname}/versions/{version} - Get a specific version
 * - PUT /api/shortnames/{shortname}/versions/{version} - Update a version
 * - DELETE /api/shortnames/{shortname}/versions/{version} - Delete a version
 */

const { 
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
} = require('./utils/index');

const SECRET_KEY = process.env.SECRET_KEY;
const SHORTNAMES_TABLE = process.env.SHORTNAMES_TABLE;
const VERSIONS_TABLE = process.env.VERSIONS_TABLE;
const SHORTNAME_VERSIONS_TABLE = process.env.SHORTNAME_VERSIONS_TABLE;
const CONFIGURATIONS_TABLE = process.env.CONFIGURATIONS_TABLE;

exports.handler = async (event) => {
  console.log('Version Lambda triggered. Event:', JSON.stringify(event));

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
    const path = event.requestContext.http.path;
    
    // Handle version-first approach
    if (path.startsWith('/api/versions')) {
      const version = pathParams.version;
      
      if (!version && httpMethod === 'GET') {
        // GET /api/versions - List all versions
        return await getAllVersions(VERSIONS_TABLE);
      }
      
      if (!version && httpMethod === 'POST') {
        // POST /api/versions - Create a new version
        const body = JSON.parse(event.body || '{}');
        if (!body.version) {
          return badRequestResponse('Version is required');
        }
        
        return await createVersion(
          body.version, 
          userId, 
          body.description || '', 
          body.isActive || false,
          VERSIONS_TABLE
        );
      }
      
      if (version && httpMethod === 'GET' && !path.includes('/shortnames')) {
        // GET /api/versions/{version} - Get a specific version
        return await getVersion(version, VERSIONS_TABLE);
      }
      
      if (version && httpMethod === 'PUT') {
        // PUT /api/versions/{version} - Update a version
        const body = JSON.parse(event.body || '{}');
        return await updateVersion(
          version, 
          body.description, 
          body.isActive,
          VERSIONS_TABLE
        );
      }
      
      if (version && httpMethod === 'DELETE') {
        // DELETE /api/versions/{version} - Delete a version
        return await deleteVersion(
          version, 
          VERSIONS_TABLE, 
          SHORTNAME_VERSIONS_TABLE, 
          CONFIGURATIONS_TABLE
        );
      }
      
      if (version && path.includes('/shortnames')) {
        if (httpMethod === 'GET') {
          // GET /api/versions/{version}/shortnames - Get all shortnames for a version
          return await getVersionShortnames(version, SHORTNAME_VERSIONS_TABLE);
        }
        
        if (httpMethod === 'POST') {
          // POST /api/versions/{version}/shortnames - Add a shortname to a version
          const body = JSON.parse(event.body || '{}');
          if (!body.shortname) {
            return badRequestResponse('Shortname is required');
          }
          
          return await addShortnameToVersion(
            version, 
            body.shortname, 
            body.description || '', 
            userId, 
            SHORTNAMES_TABLE, 
            VERSIONS_TABLE,
            SHORTNAME_VERSIONS_TABLE
          );
        }
      }
      
      return {
        statusCode: 405,
        body: JSON.stringify({ message: 'Method not allowed' })
      };
    }
    
    // Handle shortname-first approach (legacy)
    const shortname = pathParams.shortname;
    const version = pathParams.version;

    if (!shortname) {
      return badRequestResponse('Shortname is required in the URL');
    }

    switch (httpMethod) {
      case 'GET':
        if (version) {
          // Get specific version for a shortname
          return await getVersionForShortname(shortname, version, SHORTNAME_VERSIONS_TABLE);
        } else {
          // List all versions for a shortname
          return await getAllVersionsForShortname(shortname, SHORTNAME_VERSIONS_TABLE);
        }

      case 'POST':
        // Create new version for a shortname
        if (version) {
          return badRequestResponse('Version should not be provided in the URL for POST requests');
        }

        const createBody = JSON.parse(event.body || '{}');
        if (!createBody.version) {
          return badRequestResponse('Version is required');
        }

        return await createVersionForShortname(
          shortname, 
          createBody.version, 
          userId, 
          createBody.description || '', 
          createBody.isActive || false,
          SHORTNAMES_TABLE,
          VERSIONS_TABLE,
          SHORTNAME_VERSIONS_TABLE
        );

      case 'PUT':
        // Update version for a shortname
        if (!version) {
          return badRequestResponse('Version is required in the URL');
        }

        const updateBody = JSON.parse(event.body || '{}');
        return await updateVersionForShortname(
          shortname, 
          version, 
          updateBody.description, 
          updateBody.isActive,
          SHORTNAME_VERSIONS_TABLE
        );

      case 'DELETE':
        // Delete version for a shortname
        if (!version) {
          return badRequestResponse('Version is required in the URL');
        }

        return await deleteVersionForShortname(
          shortname, 
          version, 
          SHORTNAME_VERSIONS_TABLE, 
          CONFIGURATIONS_TABLE
        );

      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ message: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Unexpected error in Version Lambda:', error);
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
