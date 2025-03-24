import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { handler } from '../../../src/functions/colorService/handler';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { saveColorSubmission, searchColors } from '../../../src/shared/dynamodb';

// Mock the DynamoDB utilities
jest.mock('../../../src/shared/dynamodb', () => ({
  saveColorSubmission: jest.fn(),
  searchColors: jest.fn(),
}));

describe('colorService Lambda', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    process.env.WEBSITE_URL = 'https://example.com';
  });

  describe('POST /colors', () => {
    it('should successfully submit a color', async () => {
      // Arrange
      const mockSubmission = {
        firstName: 'John',
        favoriteColor: 'blue',
      };
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        body: JSON.stringify(mockSubmission),
      };
      const mockSavedRecord = {
        id: '123',
        ...mockSubmission,
        createdAt: new Date().toISOString(),
      };
      (saveColorSubmission as jest.Mock).mockResolvedValue(mockSavedRecord as never);

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEvent);

      // Assert
      expect(response.statusCode).toBe(201);
      expect(JSON.parse(response.body)).toEqual({
        data: mockSavedRecord,
        statusCode: 201,
      });
      expect(saveColorSubmission).toHaveBeenCalledWith(mockSubmission);
      expect(searchColors).not.toHaveBeenCalled();
    });

    it('should return 400 when request body is missing', async () => {
      // Arrange
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        body: undefined,
      };

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEvent);

      // Assert
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Missing request body',
      });
      expect(saveColorSubmission).not.toHaveBeenCalled();
      expect(searchColors).not.toHaveBeenCalled();
    });

    it('should return 400 when required fields are missing', async () => {
      // Arrange
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        body: JSON.stringify({
          firstName: 'John',
        }),
      };

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEvent);

      // Assert
      expect(response.statusCode).toBe(400);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Missing required fields',
      });
      expect(saveColorSubmission).not.toHaveBeenCalled();
      expect(searchColors).not.toHaveBeenCalled();
    });

    it('should return 500 when DynamoDB operation fails', async () => {
      // Arrange
      const mockSubmission = {
        firstName: 'John',
        favoriteColor: 'blue',
      };
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'POST',
        body: JSON.stringify(mockSubmission),
      };
      (saveColorSubmission as jest.Mock).mockRejectedValue(new Error('DynamoDB error') as never);

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEvent);

      // Assert
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Internal server error',
        statusCode: 500,
      });
      expect(saveColorSubmission).toHaveBeenCalledWith(mockSubmission);
      expect(searchColors).not.toHaveBeenCalled();
    });
  });

  describe('GET /colors', () => {
    it('should successfully search colors by firstName', async () => {
      // Arrange
      const mockFirstName = 'John';
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        queryStringParameters: {
          firstName: mockFirstName,
        },
      };
      const mockResults = [
        {
          id: '123',
          firstName: mockFirstName,
          favoriteColor: 'blue',
          createdAt: new Date().toISOString(),
        },
      ];
      (searchColors as jest.Mock).mockResolvedValue(mockResults as never);

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEvent);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        data: mockResults,
        statusCode: 200,
      });
      expect(searchColors).toHaveBeenCalledWith(mockFirstName);
      expect(saveColorSubmission).not.toHaveBeenCalled();
    });

    it('should return empty results when no firstName is provided', async () => {
      // Arrange
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        queryStringParameters: {},
      };
      const mockResults: any[] = [];
      (searchColors as jest.Mock).mockResolvedValue(mockResults as never);

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEvent);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        data: mockResults,
        statusCode: 200,
      });
      expect(searchColors).toHaveBeenCalledWith(undefined);
      expect(saveColorSubmission).not.toHaveBeenCalled();
    });

    it('should return 500 when DynamoDB operation fails', async () => {
      // Arrange
      const mockFirstName = 'John';
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        queryStringParameters: {
          firstName: mockFirstName,
        },
      };
      (searchColors as jest.Mock).mockRejectedValue(new Error('DynamoDB error') as never);

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEvent);

      // Assert
      expect(response.statusCode).toBe(500);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Internal server error',
        statusCode: 500,
      });
      expect(searchColors).toHaveBeenCalledWith(mockFirstName);
      expect(saveColorSubmission).not.toHaveBeenCalled();
    });

    it('should handle missing queryStringParameters', async () => {
      // Arrange
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'GET',
        queryStringParameters: undefined,
      };
      const mockResults: any[] = [];
      (searchColors as jest.Mock).mockResolvedValue(mockResults as never);

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEvent);

      // Assert
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual({
        data: mockResults,
        statusCode: 200,
      });
      expect(searchColors).toHaveBeenCalledWith(undefined);
      expect(saveColorSubmission).not.toHaveBeenCalled();
    });
  });

  describe('OPTIONS /colors', () => {
    it('should return CORS headers for preflight requests', async () => {
      // Arrange
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'OPTIONS',
      };

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEvent);

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
      expect(saveColorSubmission).not.toHaveBeenCalled();
      expect(searchColors).not.toHaveBeenCalled();
    });

    it('should handle missing WEBSITE_URL environment variable', async () => {
      // Arrange
      delete process.env.WEBSITE_URL;
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'OPTIONS',
      };

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEvent);

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
      expect(saveColorSubmission).not.toHaveBeenCalled();
      expect(searchColors).not.toHaveBeenCalled();
    });
  });

  describe('Unsupported Methods', () => {
    it('should return 405 for unsupported HTTP methods', async () => {
      // Arrange
      const mockEvent: Partial<APIGatewayProxyEvent> = {
        httpMethod: 'PUT',
      };

      // Act
      const response = await handler(mockEvent as APIGatewayProxyEvent);

      // Assert
      expect(response.statusCode).toBe(405);
      expect(JSON.parse(response.body)).toEqual({
        message: 'Method not allowed',
      });
      expect(saveColorSubmission).not.toHaveBeenCalled();
      expect(searchColors).not.toHaveBeenCalled();
    });
  });
}); 