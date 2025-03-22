import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { handler } from '../../../src/functions/submitColor/handler';
import { APIGatewayProxyEvent } from 'aws-lambda';
import { saveColorSubmission } from '../../../src/shared/dynamodb';

// Mock the DynamoDB utility
jest.mock('../../../src/shared/dynamodb', () => ({
  saveColorSubmission: jest.fn(),
}));

describe('submitColor Lambda', () => {
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully submit a color', async () => {
    // Arrange
    const mockSubmission = {
      firstName: 'John',
      favoriteColor: 'blue',
    };
    const mockEvent: Partial<APIGatewayProxyEvent> = {
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
  });

  it('should return 400 when request body is missing', async () => {
    // Arrange
    const mockEvent: Partial<APIGatewayProxyEvent> = {
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
  });

  it('should return 400 when required fields are missing', async () => {
    // Arrange
    const mockEvent: Partial<APIGatewayProxyEvent> = {
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
  });

  it('should return 500 when DynamoDB operation fails', async () => {
    // Arrange
    const mockSubmission = {
      firstName: 'John',
      favoriteColor: 'blue',
    };
    const mockEvent: Partial<APIGatewayProxyEvent> = {
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
  });
}); 