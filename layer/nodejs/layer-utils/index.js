/**
 * This module provides utility functions shared across all Lambda functions.
 */

const AWS = require('aws-sdk');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

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
 * Generate a JWT token.
 * @param {Object} payload - The payload to include in the token.
 * @param {string} secretKey - The secret key to sign the token.
 * @param {string} expiresIn - The expiration time for the token.
 * @returns {string} - The JWT token.
 */
function generateToken(payload, secretKey, expiresIn = '24h') {
  return jwt.sign(payload, secretKey, { expiresIn, algorithm: 'HS256' });
}

/**
 * Hash a password.
 * @param {string} password - The password to hash.
 * @returns {Promise<string>} - The hashed password.
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Compare a password with a hash.
 * @param {string} password - The password to compare.
 * @param {string} hash - The hash to compare against.
 * @returns {Promise<boolean>} - Whether the password matches the hash.
 */
async function comparePassword(password, hash) {
  return bcrypt.compare(password, hash);
}

/**
 * Generate a unique ID.
 * @returns {string} - The unique ID.
 */
function generateId() {
  return uuidv4();
}

/**
 * Create a standard response object.
 * @param {number} statusCode - The HTTP status code.
 * @param {Object} body - The response body.
 * @param {Object} headers - Additional headers to include.
 * @returns {Object} - The response object.
 */
function createResponse(statusCode, body, headers = {}) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true,
      ...headers
    },
    body: JSON.stringify(body)
  };
}

/**
 * Create a success response object.
 * @param {Object} body - The response body.
 * @param {number} statusCode - The HTTP status code (default: 200).
 * @returns {Object} - The response object.
 */
function createSuccessResponse(body, statusCode = 200) {
  return createResponse(statusCode, body);
}

/**
 * Create an error response object.
 * @param {string} message - The error message.
 * @param {number} statusCode - The HTTP status code (default: 500).
 * @returns {Object} - The response object.
 */
function createErrorResponse(message, statusCode = 500) {
  return createResponse(statusCode, { message });
}

module.exports = {
  verifyToken,
  generateToken,
  hashPassword,
  comparePassword,
  generateId,
  createResponse,
  createSuccessResponse,
  createErrorResponse
};
