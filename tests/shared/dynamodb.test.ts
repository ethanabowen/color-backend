import { jest, describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { DynamoDbConnector } from '../../src/shared/dynamodb';
import { ColorRecord } from '../../src/shared/types';
import DynamoDB from 'aws-sdk/clients/dynamodb';

type DynamoDBResponse = {
  Item?: ColorRecord | null;
  Items?: ColorRecord[];
  Attributes?: { colors: string[] };
};


describe('DynamoDB Utils', () => {
  let dynamodb: DynamoDbConnector;

  let documentClient: DynamoDB.DocumentClient;
  let getRecordDocumentClientSpy: any;
  let saveRecordDocumentClientSpy: any;
  let updateColorsDocumentClientSpy: any;
  let saveColorSubmissionDocumentClientSpy: any;
  let searchColorsDocumentClientSpy: any;
  const mockRecord: ColorRecord = {
    pk: 'John',
    favoriteColor: 'blue',
    colors: ['blue'],
    timestamp: '2024-01-01T00:00:00.000Z',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.TABLE_NAME = 'FavoriteColors';
    documentClient = new DynamoDB.DocumentClient();
    getRecordDocumentClientSpy = jest.spyOn(documentClient, 'get');
    saveRecordDocumentClientSpy = jest.spyOn(documentClient, 'put');
    updateColorsDocumentClientSpy = jest.spyOn(documentClient, 'update');
    saveColorSubmissionDocumentClientSpy = jest.spyOn(documentClient, 'put');
    searchColorsDocumentClientSpy = jest.spyOn(documentClient, 'scan');

    dynamodb = new DynamoDbConnector(documentClient);
  });

  describe('initialization', () => {
    const OLD_ENV = process.env;

    beforeEach(() => {
      jest.resetModules();
      process.env = { ...OLD_ENV };
    });

    afterAll(() => {
      process.env = OLD_ENV;
    });

    it('should initialize with TABLE_NAME from environment variable', () => {
      // Arrange
      process.env.TABLE_NAME = 'TestTable';
      
      // Act
      const db = new DynamoDbConnector(documentClient);

      // Assert
      expect(db['tableName']).toBe('TestTable');
    });

    it('should initialize with empty string when TABLE_NAME is not set', () => {
      // Arrange
      delete process.env.TABLE_NAME;
      
      // Act
      const db = new DynamoDbConnector(documentClient);

      // Assert
      expect(db['tableName']).toBe('');
    });
  });

  describe('getRecord', () => {
    it('should successfully get a record', async () => {
      // Arrange
      const response: DynamoDBResponse = { Item: mockRecord };
      getRecordDocumentClientSpy.mockReturnValue({
        promise: jest.fn().mockResolvedValue(response as never)
      });

      // Act
      const result = await dynamodb.getRecord('John');

      // Assert
      expect(result).toEqual(mockRecord);
      expect(getRecordDocumentClientSpy).toHaveBeenCalledWith({
        TableName: 'FavoriteColors',
        Key: { pk: 'John' },
      });
    });

    it('should return null when no record is found', async () => {
      // Arrange
      const response: DynamoDBResponse = { Item: null };
      getRecordDocumentClientSpy.mockReturnValue({
        promise: jest.fn().mockResolvedValue(response as never)
      });

      // Act
      const result = await dynamodb.getRecord('John');

      // Assert
      expect(result).toEqual(null);
    });

      it('should handle errors', async () => {
        // Arrange
        const error = new Error('DynamoDB error');
        getRecordDocumentClientSpy.mockReturnValue({
          promise: jest.fn().mockRejectedValue(error as never)
        });

        // Act & Assert
        await expect(dynamodb.getRecord('John')).rejects.toThrow('DynamoDB error');
      });
    });

    describe('saveRecord', () => {
      it('should successfully save a record', async () => {
        // Arrange
        const response: DynamoDBResponse = {};
        saveRecordDocumentClientSpy.mockReturnValue({
          promise: jest.fn().mockResolvedValue(response as never)
        });

        // Act
        await dynamodb.saveRecord(mockRecord);

        // Assert
        expect(saveRecordDocumentClientSpy).toHaveBeenCalledWith({
          TableName: 'FavoriteColors',
          Item: mockRecord,
        });
      });

      it('should handle errors', async () => {
        // Arrange
        const error = new Error('DynamoDB error');
        saveRecordDocumentClientSpy.mockReturnValue({
          promise: jest.fn().mockRejectedValue(error as never)
        });

        // Act & Assert
        await expect(dynamodb.saveRecord(mockRecord)).rejects.toThrow('DynamoDB error');
      });
    });

    describe('updateColors', () => {
      it('should successfully update colors for a record', async () => {
        // Arrange
        const response: DynamoDBResponse = {
          Attributes: { colors: ['blue', 'red'] },
        };
        updateColorsDocumentClientSpy.mockReturnValue({
          promise: jest.fn().mockResolvedValue(response as never)
        });

        // Act
        const result = await dynamodb.updateColors('John', 'red');

        // Assert
        expect(result).toEqual(['blue', 'red']);
        expect(updateColorsDocumentClientSpy).toHaveBeenCalledWith({
          TableName: 'FavoriteColors',
          Key: { pk: 'John' },
          UpdateExpression: 'SET colors = list_append(if_not_exists(colors, :empty_list), :new_color)',
          ExpressionAttributeValues: {
            ':empty_list': [],
            ':new_color': ['red'],
          },
          ReturnValues: 'UPDATED_NEW',
        });
      });

      it('should handle errors', async () => {
        // Arrange
        const error = new Error('DynamoDB error');
        updateColorsDocumentClientSpy.mockReturnValue({
          promise: jest.fn().mockRejectedValue(error as never)
        });

        // Act & Assert
        await expect(dynamodb.updateColors('John', 'red')).rejects.toThrow('DynamoDB error');
      });
    });

    describe('saveColorSubmission', () => {
      it('should successfully save a color submission', async () => {
        // Arrange
        const response: DynamoDBResponse = {};
        saveColorSubmissionDocumentClientSpy.mockReturnValue({
          promise: jest.fn().mockResolvedValue(response as never)
        });

        // Act
        const result = await dynamodb.saveColorSubmission(mockRecord);

        // Assert
        expect(result).toEqual(mockRecord);
        expect(saveColorSubmissionDocumentClientSpy).toHaveBeenCalledWith({
          TableName: 'FavoriteColors',
          Item: mockRecord,
        });
      });

      it('should handle errors', async () => {
        // Arrange
        const error = new Error('DynamoDB error');
        saveColorSubmissionDocumentClientSpy.mockReturnValue({
          promise: jest.fn().mockRejectedValue(error as never)
        });

        // Act & Assert
        await expect(dynamodb.saveColorSubmission(mockRecord)).rejects.toThrow('DynamoDB error');
      });
    });

    describe('searchColors', () => {
      it('should successfully search colors with a pk', async () => {
        // Arrange
        const response: DynamoDBResponse = {
          Items: [mockRecord],
        };
        searchColorsDocumentClientSpy.mockReturnValue({
          promise: jest.fn().mockResolvedValue(response as never)
        });

        // Act
        const result = await dynamodb.searchColors('John');

        // Assert
        expect(result).toEqual([mockRecord]);
        expect(searchColorsDocumentClientSpy).toHaveBeenCalledWith({
          TableName: 'FavoriteColors',
          FilterExpression: 'begins_with(pk, :pk)',
          ExpressionAttributeValues: {
            ':pk': 'John',
          },
        });
      });

      it('should handle errors', async () => {
        // Arrange
        const error = new Error('DynamoDB error');
        searchColorsDocumentClientSpy.mockReturnValue({
          promise: jest.fn().mockRejectedValue(error as never)
        });

        // Act & Assert
        await expect(dynamodb.searchColors('John')).rejects.toThrow('DynamoDB error');
      });
    });
  }); 