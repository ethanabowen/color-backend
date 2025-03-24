import { ColorSubmission, ColorRecord, SuccessResponse } from '@shared/types';
import { DynamoDbConnector } from '@shared/dynamodb';
import { omit } from 'lodash';

export class ColorService {
  private dynamodbConnector: DynamoDbConnector;
  
  constructor(dynamodDbConnector?: DynamoDbConnector) {
    this.dynamodbConnector = dynamodDbConnector || new DynamoDbConnector();
  }

  async submitColor(submission: ColorSubmission): Promise<SuccessResponse<ColorRecord>> {
    const dynamoRecord: ColorRecord = {
      pk: submission.firstName,
      ...omit(submission, 'firstName'),
      colors: [submission.favoriteColor],
      timestamp: new Date().toISOString()
    };

    const record = await this.dynamodbConnector.saveColorSubmission(dynamoRecord);
    
    return {
      data: record,
      statusCode: 201
    };
  }

  async searchColors(firstName: string): Promise<SuccessResponse<ColorRecord[]>> {
    const results = await this.dynamodbConnector.searchColors(firstName);
    
    return {
      data: results,
      statusCode: 200
    };
  }
}