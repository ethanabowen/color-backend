import { ColorSubmission, ColorRecord, SuccessResponse } from '@shared/types';
import { DynamoDbConnector } from '@shared/dynamodb';
import DEBUG from '@shared/debug';
import { omit } from 'lodash';

export class ColorService {
  private dynamodbConnector: DynamoDbConnector;
  
  constructor(dynamodDbConnector?: DynamoDbConnector) {
    DEBUG('Initializing ColorService');
    this.dynamodbConnector = dynamodDbConnector || new DynamoDbConnector();
  }

  async submitColor(submission: ColorSubmission): Promise<SuccessResponse<ColorRecord>> {
    DEBUG('Processing color submission: %O', submission);
    
    const dynamoRecord: ColorRecord = {
      pk: submission.firstName,
      ...omit(submission, 'firstName'),
      colors: [submission.favoriteColor],
      timestamp: new Date().toISOString()
    };
    
    DEBUG('Created DynamoDB record: %O', dynamoRecord);
    const record = await this.dynamodbConnector.saveColorSubmission(dynamoRecord);
    DEBUG('Saved record successfully');
    
    return {
      data: record,
      statusCode: 201
    };
  }

  async searchColors(firstName: string): Promise<SuccessResponse<ColorRecord[]>> {
    DEBUG('Searching colors for firstName: %s', firstName);
    const results = await this.dynamodbConnector.searchColors(firstName);
    DEBUG('Found %d results', results.length);
    
    return {
      data: results,
      statusCode: 200
    };
  }
}