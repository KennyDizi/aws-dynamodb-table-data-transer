import {
  DynamoDBClient,
  ScanCommand,
  BatchWriteItemCommand,
  AttributeValue,
} from "@aws-sdk/client-dynamodb";
import { fromIni } from "@aws-sdk/credential-provider-ini";

// Set up credentials for source AWS account
const sourceProfile = "default"; // source-profile-name
const sourceRegion = "eu-central-1"; // can be us-east-1 or such
const sourceCredentials = fromIni({
  profile: sourceProfile,
  // mfaCodeProvider: async () => "", // enable this line if we need mfa code for this profile
});

// Set up credentials for target AWS account
const targetProfile = "ffv2-dev"; // target-profile-name
const targetRegion = "eu-central-1"; // can be eu-central-1 or such
const targetCredentials = fromIni({
  profile: targetProfile,
  // mfaCodeProvider: async () => "312450", // enable this line if we need mfa code for this profile
});

// Set up DynamoDB clients for both accounts
const sourceClient = new DynamoDBClient({
  region: sourceRegion,
  credentials: sourceCredentials,
});
const targetClient = new DynamoDBClient({
  region: targetRegion,
  credentials: targetCredentials,
});

// Specify table names and other options
const sourceTableName = "single-dynamodb-table-ffv2-stg-stack";
const targetTableName = "single-dynamodb-table-ffv2-new-dev-stack";
const batchSize = 25; // Number of items to process at a time

// Define function to transfer data
async function transferData() {
  console.log("Starting to transfert data...");
  let lastEvaluatedKey: Record<string, AttributeValue> | undefined;
  console.log(`Transfering data with lastEvaluatedKey: ${lastEvaluatedKey}`);
  do {
    const scanParams = {
      TableName: sourceTableName,
      ExclusiveStartKey: lastEvaluatedKey,
      Limit: batchSize,
    };
    const scanCommand = new ScanCommand(scanParams);
    const data = await sourceClient.send(scanCommand);
    const items = data.Items;
    if (items === undefined) break;
    const putRequests = items.map((item) => ({ PutRequest: { Item: item } }));
    const batchParams = {
      RequestItems: {
        [targetTableName]: putRequests,
      },
    };
    const batchWriteCommand = new BatchWriteItemCommand(batchParams);
    await targetClient.send(batchWriteCommand);
    lastEvaluatedKey = data.LastEvaluatedKey;
  } while (lastEvaluatedKey);
}

// Call the function to start the transfer
transferData()
  .then(() => {
    console.log("Data transfer complete!");
  })
  .catch((error) => {
    console.error("Error transferring data:", error);
  });
