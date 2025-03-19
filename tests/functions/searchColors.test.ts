import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { handler } from '../../src/functions/searchColors';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { searchColors } from '../../src/shared/dynamodb';

// Mock the DynamoDB utility
jest.mock('../../src/shared/dynamodb', () => ({
  searchColors: jest.fn(),
}));

describe('searchColors Lambda', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully search colors by firstName', async () => {
    // Arrange
    const mockFirstName = 'John';
    const mockEvent: Partial<APIGatewayProxyEvent> = {
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
  });

  it('should return empty results when no firstName is provided', async () => {
    // Arrange
    const mockEvent: Partial<APIGatewayProxyEvent> = {
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
  });

  it('should return 500 when DynamoDB operation fails', async () => {
    // Arrange
    const mockFirstName = 'John';
    const mockEvent: Partial<APIGatewayProxyEvent> = {
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
  });

  it('should handle missing queryStringParameters', async () => {
    // Arrange
    const mockEvent: Partial<APIGatewayProxyEvent> = {
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
  });
}); 