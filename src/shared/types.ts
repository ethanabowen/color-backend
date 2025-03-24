import { APIGatewayProxyEventV2, APIGatewayProxyResult } from 'aws-lambda';

// Core domain types
export interface ColorSubmission {
  firstName: string;    // Primary key
  favoriteColor: string;
}

// Database types
export interface ColorRecord {
  pk: string;          // firstName (partition key)
  favoriteColor: string;
  timestamp: string;
  colors: string[];    // Array of favorite colors
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

export type LambdaHandler = (
  event: APIGatewayProxyEventV2
) => Promise<APIGatewayProxyResult>;

export interface ErrorResponse {
  message: string;
  statusCode: number;
}

export interface SuccessResponse<T> {
  data: T;
  statusCode: number;
} 