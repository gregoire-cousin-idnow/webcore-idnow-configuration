/**
 * This Lambda handles user login.
 * It validates the user's credentials and returns a JWT token if valid.
 */

const AWS = require('aws-sdk');
const { comparePassword, generateToken } = require('/opt/nodejs/layer-utils');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const USERS_TABLE = process.env.USERS_TABLE;
const SECRET_KEY = process.env.SECRET_KEY;

exports.handler = async (event) => {
  console.log('Login Lambda triggered. Event:', JSON.stringify(event));

  try {
    const { email, password } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Email and password are required' })
      };
    }

    // Find user by email
    const params = {
      TableName: USERS_TABLE,
      IndexName: 'EmailIndex',
      KeyConditionExpression: 'email = :email',
      ExpressionAttributeValues: {
        ':email': email
      }
    };

    const result = await dynamoDB.query(params).promise();
    const user = result.Items && result.Items.length > 0 ? result.Items[0] : null;

    if (!user) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid email or password' })
      };
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'Invalid email or password' })
      };
    }

    // Generate JWT token
    const token = generateToken(
      {
        userId: user.userId,
        email: user.email,
        userType: user.userType
      },
      SECRET_KEY
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Login successful',
        token,
        user: {
          userId: user.userId,
          email: user.email,
          userType: user.userType
        }
      })
    };
  } catch (error) {
    console.error('Error in Login Lambda:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error', error: error.message })
    };
  }
};
