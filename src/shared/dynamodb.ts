import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { 
  DynamoDBDocumentClient, 
  GetCommand, 
  PutCommand, 
  UpdateCommand,
  ScanCommand
} from '@aws-sdk/lib-dynamodb';
import { ColorRecord } from '@generated/server';

import DEBUG from './debug';

export class DynamoDbConnector {
  private docClient: DynamoDBDocumentClient;
  private tableName: string;

  constructor(client?: DynamoDBDocumentClient) {
    if (client) {
      this.docClient = client;
    } else {
      const ddbClient = new DynamoDBClient({});
      this.docClient = DynamoDBDocumentClient.from(ddbClient);
    }
    this.tableName = process.env.TABLE_NAME || '';
  }

  async getRecord(pk: string): Promise<ColorRecord | null> {
    try {
      const result = await this.docClient.send(new GetCommand({
        TableName: this.tableName,
        Key: { pk }
      }));

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
      await this.docClient.send(new PutCommand({
        TableName: this.tableName,
        Item: record
      }));

      DEBUG('Record saved successfully');
    } catch (error) {
      DEBUG('Error saving record: %O', error);
      console.error('Error saving record:', error);
      throw error;
    }
  }

  async updateColors(record: ColorRecord): Promise<ColorRecord> {
    try {
      const result = await this.docClient.send(new UpdateCommand({
        TableName: this.tableName,
        Key: { pk: record.pk },
        UpdateExpression: 'SET colors = list_append(if_not_exists(colors, :empty_list), :new_color)',
        ExpressionAttributeValues: {
          ':empty_list': [],
          ':new_color': record.colors
        },
        ReturnValues: 'ALL_NEW'
      }));

      DEBUG('Update colors result: %O', result);
      return result.Attributes as ColorRecord;
    } catch (error) {
      DEBUG('Error updating colors: %O', error);
      console.error('Error updating colors:', error);
      throw error;
    }
  }

  async saveColorSubmission(record: ColorRecord): Promise<ColorRecord> {
    await this.docClient.send(new PutCommand({
      TableName: this.tableName,
      Item: record,
    }));
    
    DEBUG('Color submission saved successfully');
    return record;
  }

  async searchColors(pk: string): Promise<ColorRecord> {
    const result = await this.docClient.send(new GetCommand({
      TableName: this.tableName,
      Key: { pk }
    }));

    DEBUG('Search results: %O', result);

    if (!result.Item) {
      throw new Error(`No record found for pk: ${pk}`);
    }

    return result.Item as ColorRecord;
  }
}