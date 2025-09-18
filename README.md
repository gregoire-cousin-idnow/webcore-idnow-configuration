# Simple CMS System

A lightweight Content Management System (CMS) for managing shortnames, versions, and configurations.

## Overview

This CMS system allows authenticated users to:

1. Create and manage shortnames
2. Create and manage versions for each shortname
3. Create and manage key-value configurations for each shortname and version

The system consists of:

- **Backend**: AWS Lambda functions for serverless API endpoints
- **Frontend**: React TypeScript application with Material UI components
- **Database**: AWS DynamoDB for data storage
- **Authentication**: JWT-based authentication system

## Architecture

### Backend Architecture

The backend is built using AWS serverless technologies:

- **API Gateway**: Routes API requests to appropriate Lambda functions
- **Lambda Functions**: Handle business logic for CRUD operations
- **DynamoDB**: Stores user data, shortnames, versions, and configurations
- **S3**: Stores configuration files

### Frontend Architecture

The frontend is built using React with TypeScript:

- **React**: UI library for building the user interface
- **TypeScript**: Adds static typing to JavaScript
- **Material UI**: Component library for consistent design
- **React Router**: Handles client-side routing
- **Axios**: Handles API requests

## API Endpoints

### Authentication

- `POST /api/register`: Register a new user
- `POST /api/login`: Login a user

### Shortnames

- `GET /api/shortnames`: Get all shortnames
- `POST /api/shortnames`: Create a new shortname
- `GET /api/shortnames/{shortname}`: Get a specific shortname
- `PUT /api/shortnames/{shortname}`: Update a shortname
- `DELETE /api/shortnames/{shortname}`: Delete a shortname

### Versions

- `GET /api/shortnames/{shortname}/versions`: Get all versions for a shortname
- `POST /api/shortnames/{shortname}/versions`: Create a new version for a shortname
- `GET /api/shortnames/{shortname}/versions/{version}`: Get a specific version
- `PUT /api/shortnames/{shortname}/versions/{version}`: Update a version
- `DELETE /api/shortnames/{shortname}/versions/{version}`: Delete a version

### Configurations

- `GET /api/shortnames/{shortname}/versions/{version}/configurations`: Get all configurations for a shortname and version
- `POST /api/shortnames/{shortname}/versions/{version}/configurations`: Create a new configuration
- `GET /api/shortnames/{shortname}/versions/{version}/configurations/{configId}`: Get a specific configuration
- `PUT /api/shortnames/{shortname}/versions/{version}/configurations/{configId}`: Update a configuration
- `DELETE /api/shortnames/{shortname}/versions/{version}/configurations/{configId}`: Delete a configuration

## Data Models

### User

```typescript
interface User {
  userId: string;
  email: string;
  userType: 'admin' | 'user';
}
```

### Shortname

```typescript
interface Shortname {
  shortname: string;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### Version

```typescript
interface Version {
  versionId: string;
  shortname: string;
  version: string;
  description: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

### Configuration

```typescript
interface Configuration {
  configId: string;
  shortnameVersion: string;
  shortname: string;
  version: string;
  key: string;
  value: any;
  description: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}
```

## Setup and Deployment

### Prerequisites

- Node.js (v16+)
- AWS CLI configured with appropriate credentials
- Terraform

### Backend Deployment

1. Navigate to the project directory:
   ```bash
   cd cms
   ```

2. Deploy the AWS resources using Terraform:
   ```bash
   terraform init
   terraform apply
   ```

### Frontend Development

1. Navigate to the frontend directory:
   ```bash
   cd cms/frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm start
   ```

## Usage

1. Register a new user or login with existing credentials
2. Create a shortname
3. Create a version for the shortname
4. Add configurations to the shortname and version
5. Access configurations via the API

## Security

- JWT-based authentication
- Role-based access control (admin vs. user)
- Secure password storage with bcrypt
- HTTPS for all API requests
