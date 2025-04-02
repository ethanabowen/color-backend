import { APIGatewayProxyHandler, APIGatewayProxyResult, APIGatewayProxyEvent } from 'aws-lambda';
import serverless from 'serverless-http';
import express, { Request, Response } from 'express';
import { json } from 'body-parser';
import { ColorSubmission } from '@shared/types';
import { ColorService } from './service';
import debug from '../../shared/debug';

// Extend Request type to include API Gateway event
interface ApiGatewayRequest extends Request {
  apiGateway?: {
    event: APIGatewayProxyEvent;
  };
}

// Initialize service
const colorService = new ColorService();

// Create Express app (won't actually run as a server)
const app = express();

// Configure body parsing middleware
app.use((req: ApiGatewayRequest, res, next) => {
  if (req.apiGateway?.event) {
    const event = req.apiGateway.event;
    debug('Received event:', event.body);
    if (event.body) {
      try {
        req.body = JSON.parse(event.body);
      } catch (error) {
        debug('Error parsing body:', error);
      }
    }
  }
  next();
});

// Configure JSON parsing
app.use(express.json());

// Get colors
app.get('/colors', async (req: ApiGatewayRequest, res: Response) => {
  const firstName = req.query.firstName as string;
  debug('Received event:', firstName);

  if (!firstName) {
    debug('Missing firstName parameter');
    return res.status(400).json({
      message: 'Missing required firstName parameter',
    });
  }

  debug('Searching colors for firstName:', firstName);
  try {
    const result = await colorService.searchColors(firstName);
    debug('Search results:', result);
    return res.status(result.statusCode).json(result.data);
  } catch (error) {
    debug('Error searching colors:', error);
    return res.status(500).json({
      message: 'Internal server error',
      statusCode: 500,
    });
  }
});

// Submit color
app.post('/colors', async (req: ApiGatewayRequest, res: Response) => {
  debug('* Received event:', req.body);

  if (!req.body) {
    return res.status(400).json({
      message: 'Missing request body',
    });
  }

  const { firstName, favoriteColor } = req.body;

  if (!firstName || !favoriteColor) {
    return res.status(400).json({
      message: 'Missing required fields',
    });
  }

  try {
    const result = await colorService.submitColor({
      firstName: firstName,
      favoriteColor: favoriteColor,
    });
    return res.status(201).json(result.data);
  } catch (error) {
    debug('Error submitting color:', error);
    return res.status(500).json({
      message: 'Internal server error',
      statusCode: 500,
    });
  }
});

// Options for CORS preflight
app.options('/colors', (req: ApiGatewayRequest, res) => {
  debug('* Received event:', req.body);

  const headers = {
    'Access-Control-Allow-Origin': process.env.WEBSITE_URL || '',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Access-Control-Allow-Headers': '*',
    'Access-Control-Max-Age': '300',
  };

  res.set(headers).status(200).json({ message: 'OK' });
});

// Handle 405 Method Not Allowed
app.use('/colors', (req, res) => {
  res.status(405).json({
    message: 'Method not allowed',
  });
});

// Create handler using serverless-http
const serverlessHandler = serverless(app, {
  binary: false,
  request: (request: any, event: any) => {
    // Add CORS headers to all responses
    request.headers['access-control-allow-origin'] = process.env.WEBSITE_URL || '';
    request.headers['access-control-allow-methods'] = 'GET,POST,OPTIONS';
    request.headers['access-control-allow-headers'] = '*';
    request.headers['access-control-max-age'] = '300';
    
    // Pass through API Gateway event if needed
    request.apiGateway = { event };
  }
});

export const handler: APIGatewayProxyHandler = async (event, context) => {
  try {
    // Handle the request using serverless-http
    const response = await serverlessHandler(event, context);
    return response as APIGatewayProxyResult;
  } catch (error) {
    console.error('Unhandled error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        message: 'Internal server error',
        statusCode: 500
      })
    };
  }
}; 