import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { handler } from '../../../src/functions/colorService/handler';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context, APIGatewayEventDefaultAuthorizerContext } from 'aws-lambda';
import { ColorService } from '../../../src/functions/colorService/service';
import { ColorSubmission, ColorRecord, SuccessResponse } from '../../../src/shared/types';
import serverless from 'serverless-http';
const createMockRequestContext = (method: string) => ({
  accountId: '123456789012',
  apiId: 'test-api-id',
  httpMethod: method,
  path: '/dev/colors',
  protocol: 'HTTP/1.1',
  requestId: 'test-request-id',
  requestTimeEpoch: 1742834964789,
  resourceId: 'test-resource-id',
  resourcePath: '/colors',
  stage: 'dev',
  authorizer: {
    principalId: 'test-principal',
    claims: null,
    context: null,
  } as APIGatewayEventDefaultAuthorizerContext,
  identity: {
    accessKey: null,
    accountId: null,
    apiKey: null,
    apiKeyId: null,
    caller: null,
    clientCert: null,
    cognitoAuthenticationProvider: null,
    cognitoAuthenticationType: null,
    cognitoIdentityId: null,
    cognitoIdentityPoolId: null,
    principalOrgId: null,
    sourceIp: '127.0.0.1',
    user: null,
    userAgent: 'test-agent',
    userArn: null,
  }
});

const createMockEvent = (options: {
  method: string;
  body?: any;
  queryStringParameters?: { [key: string]: string } | null;
}): APIGatewayProxyEvent => ({
  requestContext: createMockRequestContext(options.method),
  body: options.body ? JSON.stringify(options.body) : undefined,
  headers: {},
  multiValueHeaders: {},
  httpMethod: options.method,
  isBase64Encoded: false,
  path: '/colors',
  pathParameters: null,
  queryStringParameters: options.queryStringParameters || null,
  multiValueQueryStringParameters: null,
  stageVariables: null,
  resource: '/colors'
}) as APIGatewayProxyEvent;

const mockContext: Context = {
  callbackWaitsForEmptyEventLoop: true,
  functionName: 'test-function',
  functionVersion: '1',
  invokedFunctionArn: 'test-arn',
  memoryLimitInMB: '128',
  awsRequestId: 'test-request-id',
  logGroupName: 'test-log-group',
  logStreamName: 'test-log-stream',
  getRemainingTimeInMillis: () => 1000,
  done: () => {},
  fail: () => {},
  succeed: () => {},
};

describe('colorService Lambda', () => {
  let submitColorSpy: any;
  let searchColorsSpy: any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.WEBSITE_URL = 'https://example.com';
    submitColorSpy = jest.spyOn(ColorService.prototype, 'submitColor');
    searchColorsSpy = jest.spyOn(ColorService.prototype, 'searchColors');
  });

  describe('POST /colors', () => {
    it('should successfully submit a color', async () => {
      // Arrange
      const mockSubmission: ColorSubmission = {
        firstName: 'John',
        favoriteColor: 'blue',
      };
      const mockEvent = createMockEvent({
        method: 'POST',
        body: mockSubmission
      });
      const mockResponse = {
        data: {
          pk: 'John',
          favoriteColor: 'blue',
          colors: ['blue'],
          timestamp: '2024-01-01T00:00:00.000Z',
        },
        statusCode: 201,
      };

      submitColorSpy.mockImplementation(() => Promise.resolve(mockResponse as never));

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual(mockResponse.data);
      expect(submitColorSpy).toHaveBeenCalledWith(mockSubmission);
    });

    it('should return 400 when request body is missing', async () => {
      // Arrange
      const mockEvent = createMockEvent({
        method: 'POST'
      });

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Missing request body',
      });
      expect(submitColorSpy).not.toHaveBeenCalled();
    });

    it('should return 400 when required fields are missing', async () => {
      // Arrange
      const mockEvent = createMockEvent({
        method: 'POST',
        body: { firstName: 'John' }
      });

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Missing required fields',
      });
      expect(submitColorSpy).not.toHaveBeenCalled();
    });

    it('should return 500 when service operation fails', async () => {
      // Arrange
      const mockSubmission: ColorSubmission = {
        firstName: 'John',
        favoriteColor: 'blue',
      };
      const mockEvent = createMockEvent({
        method: 'POST',
        body: mockSubmission
      });
      submitColorSpy.mockRejectedValue(new Error('Service error') as never);

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Internal server error',
        statusCode: 500,
      });
      expect(submitColorSpy).toHaveBeenCalledWith(mockSubmission);
    });
  });

  describe('GET /colors', () => {
    it('should successfully search colors by firstName', async () => {
      // Arrange
      const mockFirstName = 'John';
      const mockEvent = createMockEvent({
        method: 'GET',
        queryStringParameters: { firstName: mockFirstName }
      });
      const mockResponse = {
        data: [
          {
            pk: 'John',
            favoriteColor: 'blue',
            colors: ['blue'],
            timestamp: '2024-01-01T00:00:00.000Z',
          },
        ],
        statusCode: 200,
      };
      searchColorsSpy.mockImplementation(() => Promise.resolve(mockResponse as never));

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockResponse.data);
      expect(searchColorsSpy).toHaveBeenCalledWith(mockFirstName);
    });

    it('should return 400 when firstName is missing', async () => {
      // Arrange
      const mockEvent = createMockEvent({
        method: 'GET',
        queryStringParameters: {}
      });

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Missing required firstName parameter',
      });
      expect(searchColorsSpy).not.toHaveBeenCalled();
    });

    it('should return 500 when service operation fails', async () => {
      // Arrange
      const mockFirstName = 'John';
      const mockEvent = createMockEvent({
        method: 'GET',
        queryStringParameters: { firstName: mockFirstName }
      });
      searchColorsSpy.mockRejectedValue(new Error('Service error') as never);

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Internal server error',
        statusCode: 500,
      });
      expect(searchColorsSpy).toHaveBeenCalledWith(mockFirstName);
    });
  });

  describe('OPTIONS /colors', () => {
    it('should return CORS headers for preflight requests', async () => {
      // Arrange
      const mockEvent = createMockEvent({
        method: 'OPTIONS'
      });

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual({
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-origin": "https://example.com",
        "access-control-max-age": "300",
        "content-length": "16",
        "content-type": "application/json; charset=utf-8",
        "etag": "W/\"10-MxB4y4MLcx6QDsp8b8vgp7iFMFo\"",
        "x-powered-by": "Express",
      });
      expect(JSON.parse(response.body)).toEqual({
        message: 'OK',
      });
      expect(submitColorSpy).not.toHaveBeenCalled();
      expect(searchColorsSpy).not.toHaveBeenCalled();
    });

    it('should handle missing WEBSITE_URL environment variable', async () => {
      // Arrange
      delete process.env.WEBSITE_URL;
      const mockEvent = createMockEvent({
        method: 'OPTIONS'
      });

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual({
        "access-control-allow-headers": "*",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-origin": "",
        "access-control-max-age": "300",
        "content-length": "16",
        "content-type": "application/json; charset=utf-8",
        "etag": "W/\"10-MxB4y4MLcx6QDsp8b8vgp7iFMFo\"",
        "x-powered-by": "Express",
      });
      expect(JSON.parse(response.body)).toEqual({
        message: 'OK',
      });
      expect(submitColorSpy).not.toHaveBeenCalled();
      expect(searchColorsSpy).not.toHaveBeenCalled();
    });
  });

  describe('Unsupported Methods', () => {
    it('should return 405 for unsupported HTTP methods', async () => {
      // Arrange
      const mockEvent = createMockEvent({
        method: 'PUT'
      });

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(405);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Method not allowed',
      });
      expect(submitColorSpy).not.toHaveBeenCalled();
      expect(searchColorsSpy).not.toHaveBeenCalled();
    });
  });

  describe('Body Parsing', () => {
    it('should handle invalid JSON in request body', async () => {
      // Arrange
      const mockEvent = {
        ...createMockEvent({ method: 'POST' }),
        body: 'invalid json{'
      };

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Missing request body',
      });
      expect(submitColorSpy).not.toHaveBeenCalled();
    });
  });

  describe('CORS Headers', () => {
    it('should include CORS headers in successful GET response', async () => {
      // Arrange
      const mockFirstName = 'John';
      const mockEvent = createMockEvent({
        method: 'GET',
        queryStringParameters: { firstName: mockFirstName }
      });
      const mockResponse = {
        data: [
          {
            pk: 'John',
            favoriteColor: 'blue',
            colors: ['blue'],
            timestamp: '2024-01-01T00:00:00.000Z',
          },
        ],
        statusCode: 200,
      };
      searchColorsSpy.mockImplementation(() => Promise.resolve(mockResponse as never));

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.headers).toEqual(expect.objectContaining({
        'access-control-allow-origin': 'https://example.com',
        'access-control-allow-methods': 'GET,POST,OPTIONS',
        'access-control-allow-headers': '*',
        'access-control-max-age': '300',
      }));
    });

    it('should include CORS headers in error response', async () => {
      // Arrange
      const mockEvent = createMockEvent({
        method: 'GET',
        queryStringParameters: {}
      });

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.headers).toEqual(expect.objectContaining({
        'access-control-allow-origin': 'https://example.com',
        'access-control-allow-methods': 'GET,POST,OPTIONS',
        'access-control-allow-headers': '*',
        'access-control-max-age': '300',
      }));
    });
  });

  describe('Main Handler Error Handling', () => {
    it('should handle unhandled errors in the handler', async () => {
      // Arrange
      const mockEvent = createMockEvent({
        method: 'GET',
        queryStringParameters: { firstName: 'John' }
      });
      
      // Simulate an unhandled error by making serverless-http throw
      jest.mock('serverless-http', () => {
        return () => {
          throw new Error('Unhandled error');
        };
      });

      // Act
      const response = await handler(mockEvent, mockContext, () => {}) as APIGatewayProxyResult;

      // Assert
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Internal server error',
        statusCode: 500,
      });
    });
  });
}); 