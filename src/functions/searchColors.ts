import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { LambdaHandler, SuccessResponse, ErrorResponse } from '@shared/types';
import { searchColors } from '@shared/dynamodb';

export const handler: LambdaHandler = async (event) => {
  try {
    const firstName = event.queryStringParameters?.firstName;
    const results = await searchColors(firstName);
    
    const response: SuccessResponse<typeof results> = {
      data: results,
      statusCode: 200,
    };

    return {
      statusCode: response.statusCode,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error searching colors:', error);
    
    const errorResponse: ErrorResponse = {
      message: 'Internal server error',
      statusCode: 500,
    };

    return {
      statusCode: errorResponse.statusCode,
      body: JSON.stringify(errorResponse),
    };
  }
}; 