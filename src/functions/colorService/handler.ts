import { ColorSubmission, LambdaHandler, ErrorResponse } from '@shared/types';
import { ColorService } from './service';
import DEBUG from '@shared/debug';

const colorService = new ColorService();

export const handler: LambdaHandler = async (event) => {
  DEBUG('Received event: %O', event);

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
        DEBUG('Handling OPTIONS request');
        return {
          statusCode: 200,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'OK' }),
        };
      case 'POST': {
        DEBUG('Handling POST request');
        if (!event.body) {
          DEBUG('Missing request body');
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Missing request body' }),
          };
        }

        const submission: ColorSubmission = JSON.parse(event.body);
        DEBUG('Parsed submission: %O', submission);

        if (!submission.firstName || !submission.favoriteColor) {
          DEBUG('Missing required fields: %O', submission);
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Missing required fields' }),
          };
        }

        const response = await colorService.submitColor(submission);
        DEBUG('Submit color response: %O', response);

        return {
          statusCode: response.statusCode,
          headers: corsHeaders,
          body: JSON.stringify(response.data),
        };
      }
      case 'GET': {
        DEBUG('Handling GET request');
        const firstName = event.queryStringParameters?.firstName;
        if (!firstName) {
          DEBUG('Missing firstName parameter');
          return {
            statusCode: 400,
            headers: corsHeaders,
            body: JSON.stringify({ message: 'Missing required firstName parameter' }),
          };
        }
        
        DEBUG('Searching colors for firstName: %s', firstName);
        const response = await colorService.searchColors(firstName);
        DEBUG('Search results: %O', response);

        return {
          statusCode: response.statusCode,
          headers: corsHeaders,
          body: JSON.stringify(response.data),
        };
      } 
      default:
        DEBUG('Method not allowed: %s', event.requestContext.http.method);
        return {
          statusCode: 405,
          headers: corsHeaders,
          body: JSON.stringify({ message: 'Method not allowed' }),
        };
    }
  } catch (error) {
    DEBUG('Error in color service: %O', error);
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