import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { ColorSubmission, LambdaHandler, SuccessResponse, ErrorResponse } from '@shared/types';
import { saveColorSubmission, searchColors } from '@shared/dynamodb';

export const handler: LambdaHandler = async (event) => {
  const websiteUrl = process.env.WEBSITE_URL || '';

  const corsHeaders = {
    'Access-Control-Allow-Origin': websiteUrl,
  };

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Max-Age': '300',
        ...corsHeaders
      },
      body: JSON.stringify({ message: 'OK' }),
    };
  }

  try {
    switch (event.httpMethod) {
      case 'POST':
        if (!event.body) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Missing request body' }),
          };
        }

        const submission: ColorSubmission = JSON.parse(event.body);

        if (!submission.firstName || !submission.favoriteColor) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Missing required fields' }),
          };
        }

        const record = await saveColorSubmission(submission);
        
        const submitResponse: SuccessResponse<typeof record> = {
          data: record,
          statusCode: 201,
        };

        return {
          statusCode: submitResponse.statusCode,
          headers: corsHeaders,
          body: JSON.stringify(submitResponse),
        };

      case 'GET':
        const firstName = event.queryStringParameters?.firstName;
        const results = await searchColors(firstName);
        
        const searchResponse: SuccessResponse<typeof results> = {
          data: results,
          statusCode: 200,
        };

        return {
          statusCode: searchResponse.statusCode,
          headers: corsHeaders,
          body: JSON.stringify(searchResponse),
        };

      default:
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Error in color service:', error);
    
    const errorResponse: ErrorResponse = {
      message: 'Internal server error',
      statusCode: 500,
    };

    return {
      statusCode: errorResponse.statusCode,
      headers: corsHeaders,
      body: JSON.stringify(errorResponse),
    };
  }
}; 