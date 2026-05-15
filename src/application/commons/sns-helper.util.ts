import {
  SNSClient,
  PublishCommand,
} from '@aws-sdk/client-sns';


export class SNSService {

  private client: SNSClient;
  constructor() {

    this.client = new SNSClient({
      region: process.env.AWS_REGION,
    });

  }

  async publishMessage(
    topicArn: string,
    message: string,
  ) {

    try {
      const command = new PublishCommand({
        TopicArn: topicArn,
        Message: JSON.stringify(message),
      });

      const response = await this.client.send(command);
      console.log(response);
      return response;
    }
    catch(error) {
      console.log(error);
      throw error;
    }
  }
}