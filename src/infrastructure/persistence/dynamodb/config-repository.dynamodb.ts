import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DynamoDBDocumentClient,
  GetCommand
} from '@aws-sdk/lib-dynamodb';
import { Injectable, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ConfigRepository } from '@domain/repositories/config-repository.interface';

@Injectable()
export class ConfigRepositoryDynamoDb implements ConfigRepository {
  private readonly client: DynamoDBDocumentClient;
  private docClient: DynamoDBDocumentClient;

  constructor(@Inject(ConfigService) config: ConfigService) {
    this.client = new DynamoDBClient({
      region: 'us-east-1'
    });
    this.docClient = DynamoDBDocumentClient.from(this.client);
  }

    async findById(id: string): Promise<any> {
       const command = new GetCommand({
        TableName: process.env.TABLE_CONFIG,
        Key: {
          NAME_PORTAL: id,
        },
      });
       const response = await this.docClient.send(command);
       return response.Item;
    }  
}
