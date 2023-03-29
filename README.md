# aws-dynamodb-table-data-transer
Transfer data from DynamoDB table to the other table across accounts <br>
# how to run script
1. Replace source and destination profile/region/table name with your own <br>
2. Run command: ts-node data-transfer.ts <br>
3. With profile has MFA replace mfa code then run: ts-node data-transfer-2.ts <br>
