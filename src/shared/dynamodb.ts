import { DynamoDB } from 'aws-sdk';
import { ColorRecord, ColorSubmission, DynamoDBRecord } from './types';

const dynamodb = new DynamoDB.DocumentClient();
const TABLE_NAME = process.env.TABLE_NAME || 'FavoriteColors';

export async function getRecord(id: string): Promise<ColorRecord | null> {
  try {
    const result = await dynamodb.get({
      TableName: TABLE_NAME,
      Key: { id }
    }).promise();

    return result.Item as ColorRecord || null;
  } catch (error) {
    console.error('Error getting record:', error);
    throw error;
  }
}

export async function saveRecord(record: ColorRecord): Promise<void> {
  try {
    await dynamodb.put({
      TableName: TABLE_NAME,
      Item: record
    }).promise();
  } catch (error) {
    console.error('Error saving record:', error);
    throw error;
  }
}

export async function updateColors(id: string, newColor: string): Promise<string[]> {
  try {
    const result = await dynamodb.update({
      TableName: TABLE_NAME,
      Key: { id },
      UpdateExpression: 'SET colors = list_append(if_not_exists(colors, :empty_list), :new_color)',
      ExpressionAttributeValues: {
        ':empty_list': [],
        ':new_color': [newColor]
      },
      ReturnValues: 'UPDATED_NEW'
    }).promise();

    return result.Attributes?.colors || [newColor];
  } catch (error) {
    console.error('Error updating colors:', error);
    throw error;
  }
}

export async function saveColorSubmission(submission: ColorSubmission): Promise<DynamoDBRecord> {
  const timestamp = new Date().toISOString();
  const record: DynamoDBRecord = {
    ...submission,
    timestamp,
  };

  await dynamodb.put({
    TableName: TABLE_NAME,
    Item: record,
  }).promise();

  return record;
}

export async function searchColors(firstName?: string): Promise<DynamoDBRecord[]> {
  const params: DynamoDB.DocumentClient.ScanInput = {
    TableName: TABLE_NAME,
  };

  if (firstName) {
    params.FilterExpression = 'begins_with(firstName, :firstName)';
    params.ExpressionAttributeValues = {
      ':firstName': firstName,
    };
  }

  const result = await dynamodb.scan(params).promise();
  return (result.Items || []) as DynamoDBRecord[];
} 