import { APIGatewayProxyHandler, APIGatewayProxyEvent } from 'aws-lambda';
import { ColorSubmission } from '@generated/server';
import { ColorService } from './service';
import debug from '@shared/debug';
import { successResponse, badResponse, errorResponse } from './responses';
import { ColorRecordResponse, ErrorResponse } from '@generated/server/model/models';

// Initialize service
const colorService = new ColorService();

// Helper function
const getDecodedBody = (event: APIGatewayProxyEvent): string => {
  if (!event.body) {
    throw new Error('Missing request body');
  }
  return event.isBase64Encoded 
    ? Buffer.from(event.body, 'base64').toString('utf-8')
    : event.body;
};

// Route handlers
const getColors = async (event: APIGatewayProxyEvent): Promise<ColorRecordResponse | ErrorResponse> => {
  const firstName = event.queryStringParameters?.firstName;
  
  if (!firstName) {
    return {
      message: 'Missing required firstName parameter',
      statusCode: 400
    };
  }

  try {
    const result = await colorService.searchColors(firstName);
    return {
      data: result.data,
      statusCode: result.statusCode
    };
  } catch (error) {
    debug('Error searching colors:', error);
    return {
      message: 'Internal server error',
      statusCode: 500
    };
  }
};

const saveColor = async (event: APIGatewayProxyEvent): Promise<ColorRecordResponse | ErrorResponse> => {
  try {
    const decodedBody = getDecodedBody(event);
    const body = JSON.parse(decodedBody) as ColorSubmission;
    const { firstName, color } = body;

    if (!firstName || !color) {
      return {
        message: 'Missing required fields',
        statusCode: 400
      };
    }

    const result = await colorService.saveColor({ firstName, color });
    return {
      data: result.data,
      statusCode: 201
    };
  } catch (error) {
    debug('Error saving color:', error);
    return {
      message: 'Internal server error',
      statusCode: 500
    };
  }
};

// Main handler
export const handler: APIGatewayProxyHandler = async (event, context) => {
  debug('Incoming event:', event);
  debug('Incoming context:', context);

  if (!event?.httpMethod || !event?.path) {
    return errorResponse(new Error('Invalid event structure'));
  }

  try {
    // CORS preflight
    if (event.httpMethod === 'OPTIONS') {
      return successResponse(null);
    }

    // Route handling
    if (event.path === '/colors') {
      let response: ColorRecordResponse | ErrorResponse;
      
      switch (event.httpMethod) {
        case 'GET':
          response = await getColors(event);
          break;
        case 'POST':
          response = await saveColor(event);
          break;
        default:
          response = {
            message: 'Method not allowed',
            statusCode: 405
          };
      }
      
      if (response.statusCode >= 400) {
        return badResponse(response.message || 'Error occurred', response.statusCode);
      }
      return successResponse(response.data, response.statusCode);
    }

    return badResponse('Not found', 404);
  } catch (error) {
    debug('Unhandled error:', error);
    return errorResponse(error as Error);
  }
};