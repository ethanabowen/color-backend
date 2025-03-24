import { ColorSubmission, LambdaHandler, ErrorResponse } from '@shared/types';
import { ColorService } from './service';

const colorService = new ColorService();

export const handler: LambdaHandler = async (event) => {
  if (process.env.DEBUG === 'true') {
    console.debug('Received event:', JSON.stringify(event, null, 2));
  }

  const websiteUrl = process.env.WEBSITE_URL || '';

  const corsHeaders = {
    'Access-Control-Allow-Origin': websiteUrl,
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '300'
  };

  try {
    switch (event.requestContext.http.method) {
      case 'OPTIONS': 
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'OK' }),
        };
      case 'POST': {
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

        const response = await colorService.submitColor(submission);

        return {
          statusCode: response.statusCode,
          headers: corsHeaders,
          body: JSON.stringify(response.data),
        };
      }
      case 'GET': {
        const firstName = event.queryStringParameters?.firstName;
        if (!firstName) {
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Missing required firstName parameter' }),
          };
        }
        
        const response = await colorService.searchColors(firstName);

        return {
          statusCode: response.statusCode,
          headers: corsHeaders,
          body: JSON.stringify(response.data),
        };
      } 
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
    }
  }
}; 