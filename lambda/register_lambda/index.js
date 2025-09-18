/**
 * This Lambda handles user registration.
 * It validates the user's input, creates a new user in DynamoDB, and returns a JWT token.
 */

const AWS = require('aws-sdk');
const { hashPassword, generateToken, generateId } = require('/opt/nodejs/layer-utils');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const s3 = new AWS.S3();

const USERS_TABLE = process.env.USERS_TABLE;
const SECRET_KEY = process.env.SECRET_KEY;
const ADMIN_KEY = process.env.ADMIN_KEY;
const CONFIG_BUCKET = process.env.CONFIG_BUCKET;

exports.handler = async (event) => {
  console.log('Register Lambda triggered. Event:', JSON.stringify(event));

  try {
    const { email, password, userType, adminKey } = JSON.parse(event.body || '{}');

    if (!email || !password || !userType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email, password, and userType are required' })
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid email format' })
      };
    }

    // Validate password strength
    if (password.length < 8) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Password must be at least 8 characters long' })
      };
    }

    // Fetch allowed user types from S3
    const userTypesParams = {
      Bucket: CONFIG_BUCKET,
      Key: 'config/user-types.json'
    };

    const userTypesData = await s3.getObject(userTypesParams).promise();
    const userTypes = JSON.parse(userTypesData.Body.toString('utf-8'));

    if (!userTypes.allowedUserTypes.includes(userType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid user type' })
      };
    }

    // Check admin key if registering as admin
    if (userType === 'admin' && adminKey !== ADMIN_KEY) {
      return {
        statusCode: 403,
        body: JSON.stringify({ message: 'Invalid admin key' })
      };
    }

    // Check if user already exists
    const checkParams = {
      TableName: USERS_TABLE,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    };

    const checkResult = await dynamoDB.query(checkParams).promise();
    if (checkResult.Items && checkResult.Items.length > 0) {
      return {
        statusCode: 409,
        body: JSON.stringify({ message: 'User with this email already exists' })
      };
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user
    const userId = generateId();
    const timestamp = new Date().toISOString();
    const user = {
      userId,
      email,
      password: hashedPassword,
      userType,
      createdAt: timestamp,
      updatedAt: timestamp
    };

    const putParams = {
      TableName: USERS_TABLE,
      Item: user
    };

    await dynamoDB.put(putParams).promise();

    // Generate JWT token
    const token = generateToken(
      {
        userId,
        email,
        userType
      },
      SECRET_KEY
    );

    return {
      statusCode: 201,
      body: JSON.stringify({
        message: 'User registered successfully',
        token,
        user: {
          userId,
          email,
          userType
        }
      })
    };
  } catch (error) {
    console.error('Error in Register Lambda:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error', error: error.message })
    };
  }
};
