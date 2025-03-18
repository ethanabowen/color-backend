import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// DynamoDB record type
export interface ColorRecord {
  id: string;           // User's first name (partition key)
  colors: string[];     // Array of favorite colors
}

// API Request/Response types
export interface SubmitColorRequest {
  firstName: string;
  favoriteColor: string;
}

export interface SubmitColorResponse {
  success: boolean;
  message: string;
  colors?: string[];
}

export interface SearchColorsRequest {
  firstName: string;
}

export interface SearchColorsResponse {
  success: boolean;
  message: string;
  record?: ColorRecord;
}

export interface ColorSubmission {
  firstName: string;
  favoriteColor: string;
}

export interface ColorSearchResult {
  firstName: string;
  favoriteColor: string;
  timestamp: string;
}

export interface DynamoDBRecord {
  firstName: string;
  favoriteColor: string;
  timestamp: string;
}

export type LambdaHandler = (
  event: APIGatewayProxyEvent
) => Promise<APIGatewayProxyResult>;

export interface ErrorResponse {
  message: string;
  statusCode: number;
}

export interface SuccessResponse<T> {
  data: T;
  statusCode: number;
} 