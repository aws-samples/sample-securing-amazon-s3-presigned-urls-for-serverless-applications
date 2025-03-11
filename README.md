# Securing S3 Presigned URLs for Serverless Applications
Sample serverless application that demonstrates multiple techniques used to secure S3 presigned URLs, including adding a Content-MD5 checksum, expiring URLs dynamically, and generating UUIDs to replace object names.

Please read the [full blog post](https://aws-future-compute-blog-post-url.com).

## Architecture

This sample application focuses first on how to protect against arbitrary file uploads using S3's MD5 checksum feature:

![Architecture](architecture-diagram.png)

## Steps to Use

To test this sample application, you will need a web browser (see /client) and to create an S3 bucket and a Lambda function (see /server).

### Server Setup
1. Create an S3 bucket.  Your S3 bucket can remain private with block all public access set to ON.
2. Define and [configure cross-origin resource sharing (CORS)](https://docs.aws.amazon.com/AmazonS3/latest/userguide/enabling-cors-examples.html?icmpid=docs_amazons3_console) for the bucket as appropriate.
3. Create a Lambda function.
4. [Add a Trigger](https://docs.aws.amazon.com/lambda/latest/dg/lambda-services.html) for API Gateway, using the "Create a new API" option.  Select Security as appropriate.
5. Save the public URL for your API Gateway, as you will need it to configure the client.
6. In the Configuration tab of your Lambda function, [define an environment variable](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html) as Key=BUCKET_NAME, Value=yourbucketname.
7. In the Permissions tab of your Lambda function, select the Execution role name.  See [Managing permissions in AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/lambda-permissions.html).
8. Modify the execution role in the Identity and Access Management (IAM) console to add S3 bucket access as appropriate. See [Download and upload objects with presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html).
9. Upload the sample code from this repository's /server directory in the file index.mjs to the Lambda function.

### Client Setup

Open the index.html found within the /client directory and modify the form action to the public URL for your API Gateway from step 5 above.

You may now upload a file to test your sample application.  Your file will appear within your private S3 bucket.

## Contributing

We welcome community contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file.