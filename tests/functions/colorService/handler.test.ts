import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { handler } from '../../../src/functions/colorService/handler';
import { APIGatewayProxyEventV2 } from 'aws-lambda';
import { ColorService } from '../../../src/functions/colorService/service';
import { ColorSubmission, ColorRecord, SuccessResponse } from '../../../src/shared/types';

const createMockRequestContext = (method: string) => ({
  accountId: '123456789012',
  apiId: 'test-api-id',
  domainName: 'test-api.execute-api.region.amazonaws.com',
  domainPrefix: 'test-api',
  http: {
    method,
    path: '/dev/colors',
    protocol: 'HTTP/1.1',
    sourceIp: '127.0.0.1',
    userAgent: 'test-agent'
  },
  requestId: 'test-request-id',
  routeKey: 'ANY /colors',
  stage: 'dev',
  time: '24/Mar/2025:16:49:24 +0000',
  timeEpoch: 1742834964789
});

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
      const mockEvent: Partial<APIGatewayProxyEventV2> = {
        requestContext: createMockRequestContext('POST'),
        body: JSON.stringify(mockSubmission),
      };
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
      const response = await handler(mockEvent as APIGatewayProxyEventV2);

      // Assert
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual(mockResponse.data);
      expect(submitColorSpy).toHaveBeenCalledWith(mockSubmission);
    });

    it('should return 400 when request body is missing', async () => {
      // Arrange
      const mockEvent: Partial<APIGatewayProxyEventV2> = {
        requestContext: createMockRequestContext('POST'),
        body: undefined,
      };

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEventV2);

      // Assert
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Missing request body',
      });
      expect(submitColorSpy).not.toHaveBeenCalled();
    });

    it('should return 400 when required fields are missing', async () => {
      // Arrange
      const mockEvent: Partial<APIGatewayProxyEventV2> = {
        requestContext: createMockRequestContext('POST'),
        body: JSON.stringify({
          firstName: 'John',
        }),
      };

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEventV2);

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
      const mockEvent: Partial<APIGatewayProxyEventV2> = {
        requestContext: createMockRequestContext('POST'),
        body: JSON.stringify(mockSubmission),
      };
      submitColorSpy.mockRejectedValue(new Error('Service error') as never);

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEventV2);

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
      const mockEvent: Partial<APIGatewayProxyEventV2> = {
        requestContext: createMockRequestContext('GET'),
        queryStringParameters: {
          firstName: mockFirstName,
        },
      };
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
      const response = await handler(mockEvent as APIGatewayProxyEventV2);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual(mockResponse.data);
      expect(searchColorsSpy).toHaveBeenCalledWith(mockFirstName);
    });

    it('should return 400 when firstName is missing', async () => {
      // Arrange
      const mockEvent: Partial<APIGatewayProxyEventV2> = {
        requestContext: createMockRequestContext('GET'),
        queryStringParameters: {},
      };

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEventV2);

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
      const mockEvent: Partial<APIGatewayProxyEventV2> = {
        requestContext: createMockRequestContext('GET'),
        queryStringParameters: {
          firstName: mockFirstName,
        },
      };
      searchColorsSpy.mockRejectedValue(new Error('Service error') as never);

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEventV2);

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
      const mockEvent: Partial<APIGatewayProxyEventV2> = {
        requestContext: createMockRequestContext('OPTIONS'),
      };

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEventV2);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual({
        'Access-Control-Allow-Origin': 'https://example.com',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '300',
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
      const mockEvent: Partial<APIGatewayProxyEventV2> = {
        requestContext: createMockRequestContext('OPTIONS'),
      };

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEventV2);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(response.headers).toEqual({
        'Access-Control-Allow-Origin': '',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '300',
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
      const mockEvent: Partial<APIGatewayProxyEventV2> = {
        requestContext: createMockRequestContext('PUT'),
      };

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEventV2);

      // Assert
      expect(response.statusCode).toBe(405);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Method not allowed',
      });
      expect(submitColorSpy).not.toHaveBeenCalled();
      expect(searchColorsSpy).not.toHaveBeenCalled();
    });
  });
}); 