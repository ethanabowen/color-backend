import { DynamoDB } from 'aws-sdk';
import { ColorRecord } from './types';
import DEBUG from './debug';

export class DynamoDbConnector {
  private dynamodb: DynamoDB.DocumentClient;
  private tableName: string;

  constructor(client?: DynamoDB.DocumentClient) {
    this.dynamodb = client || new DynamoDB.DocumentClient();
    this.tableName = process.env.TABLE_NAME || '';
  }

  async getRecord(pk: string): Promise<ColorRecord | null> {
    try {
      const result = await this.dynamodb.get({
        TableName: this.tableName,
        Key: { pk }
      }).promise();

      DEBUG('Get record result: %O', result);
      return result.Item as ColorRecord || null;
    } catch (error) {
      DEBUG('Error getting record: %O', error);
      console.error('Error getting record:', error);
      throw error;
    }
  }

  async saveRecord(record: ColorRecord): Promise<void> {
    try {
      await this.dynamodb.put({
        TableName: this.tableName,
        Item: record
      }).promise();

      DEBUG('Record saved successfully');
    } catch (error) {
      DEBUG('Error saving record: %O', error);
      console.error('Error saving record:', error);
      throw error;
    }
  }

  async updateColors(pk: string, newColor: string): Promise<string[]> {
    try {
      const result = await this.dynamodb.update({
        TableName: this.tableName,
        Key: { pk },
        UpdateExpression: 'SET colors = list_append(if_not_exists(colors, :empty_list), :new_color)',
        ExpressionAttributeValues: {
          ':empty_list': [],
          ':new_color': [newColor]
        },
        ReturnValues: 'UPDATED_NEW'
      }).promise();

      DEBUG('Update colors result: %O', result);

      return result.Attributes?.colors || [newColor];
    } catch (error) {
      DEBUG('Error updating colors: %O', error);
      console.error('Error updating colors:', error);
      throw error;
    }
  }

  async saveColorSubmission(record: ColorRecord): Promise<ColorRecord> {
    await this.dynamodb.put({
      TableName: this.tableName,
      Item: record,
    }).promise();
    
    DEBUG('Color submission saved successfully');

    return record;
  }

  async searchColors(pk: string): Promise<ColorRecord[]> {
    const params: DynamoDB.DocumentClient.ScanInput = {
      TableName: this.tableName,
    };

    params.FilterExpression = 'begins_with(pk, :pk)';
    params.ExpressionAttributeValues = {
      ':pk': pk,
    };

    const result = await this.dynamodb.scan(params).promise();
    DEBUG('Search results: %d items found', result.Items?.length || 0);

    return (result.Items || []) as ColorRecord[];
  }
}