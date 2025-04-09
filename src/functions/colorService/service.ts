import { ColorSubmission, ColorRecord } from '@generated/server/model/models';
import { DynamoDbConnector } from '@shared/dynamodb';
import DEBUG from '@shared/debug';
import { omit } from 'lodash';

export class ColorService {
  private dynamodbConnector: DynamoDbConnector;
  
  constructor(dynamodDbConnector?: DynamoDbConnector) {
    this.dynamodbConnector = dynamodDbConnector || new DynamoDbConnector();
  }

  async saveColor(submission: ColorSubmission): Promise<{ data: ColorRecord; statusCode: number }> {
    const dynamoRecord: ColorRecord = {
      pk: submission.firstName,
      colors: [submission.color],
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

  async searchColors(firstName: string): Promise<{ data: ColorRecord; statusCode: number }> {
    const result = await this.dynamodbConnector.searchColors(firstName);
    DEBUG('Found result: %O', result);
    
    return {
      data: result,
      statusCode: 200
    };
  }
}