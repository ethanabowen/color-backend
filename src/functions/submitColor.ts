import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ColorSubmission, LambdaHandler, SuccessResponse, ErrorResponse } from '@shared/types';
import { saveColorSubmission } from '@shared/dynamodb';

export const handler: LambdaHandler = async (event) => {
  try {
    if (!event.body) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing request body' }),
      };
    }

    const submission: ColorSubmission = JSON.parse(event.body);

    if (!submission.firstName || !submission.favoriteColor) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing required fields' }),
      };
    }

    const record = await saveColorSubmission(submission);
    
    const response: SuccessResponse<typeof record> = {
      data: record,
      statusCode: 201,
    };

    return {
      statusCode: response.statusCode,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Error submitting color:', error);
    
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