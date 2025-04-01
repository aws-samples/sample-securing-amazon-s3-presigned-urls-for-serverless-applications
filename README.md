# Securing S3 Presigned URLs for Serverless Applications
Sample serverless application that demonstrates multiple techniques used to secure S3 presigned URLs, including adding a Content-MD5 checksum, expiring URLs dynamically, and generating UUIDs to replace object names.

Please read the [full blog post](https://aws-future-compute-blog-post-url.com).

## Architecture

This sample application illustrates how to protect against arbitrary file uploads using S3's MD5 checksum feature, as well as several other methods for securing S3 presigned URLs:

![Architecture](./ARCHITECTURE.png)

## Steps to Use

To test this sample application, you will need a web browser (see /client) and to create an S3 bucket and a Lambda function (see /server).

### Server Setup

#### Provision an S3 Bucket

Complete the following steps:

1. Navigate to the **S3 console**, choose **Create bucket**.
2. Note that your S3 bucket can remain private with **block all public access** set to **ON**.
3. Select the bucket you created, then open the **Permissions** tab.
4. Scroll down to **Cross-origin resource sharing (CORS)**, add the following configuration:

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET",
            "POST",
            "PUT",
            "DELETE"
        ],
        "AllowedOrigins": [
            "*"
        ],
        "ExposeHeaders": [
            "ETag"
        ],
        "MaxAgeSeconds": 3000
    }
]
```

This policy is for this proof of concept. Learn more by reading about [Configuring cross-origin resource sharing (CORS)](https://docs.aws.amazon.com/AmazonS3/latest/userguide/enabling-cors-examples.html?icmpid=docs_amazons3_console).

#### Create a Lambda Function

Complete the following steps:

1. Navigate to the **Lambda console**, choose **Create function**.
2. Under the **Create function** options, select **Author from scratch**.
3. Within **Basic information**, provide a **Function name**, choose Runtime **Node.js 22.x**, and Architecture **x86_64**.
4. Choose **Create function**.

#### Configure an API Gateway trigger for your Lambda function

Complete the following steps:

1. In the **Lambda console** for your function, select **[add Trigger](https://docs.aws.amazon.com/lambda/latest/dg/lambda-services.html)**.
2. Under **Trigger configuration**, choose **API Gateway**.
3. For **Intent**, select the **Create a new API** option.  
4. For **API type**, select **REST API**.
5. For this proof of concept, under **Security** choose **Open**.
6. Select **Add** to create the trigger.

You will be returned to the Lambda console for your function.

#### Setup and deploy API Gateway

Complete the following steps:

1. In the **Lambda console** for your function, select the **API Gateway** icon for the newly created trigger. 
2. From the **Configuration** tab below, the **Triggers** should display an **API Gateway** name and **API endpoint** as a URL.
3. Save the value of the **API endpoint** URL, as you will need it to configure the client.
4. Select the name of the **API Gateway** to open a new browser tab.
5. In the **API Gateway console**, under the **Resources** heading, choose the path above **ANY** (the path should correspond to the name of your Lambda function).
6. Within **Resource details**, select **Enable CORS**.
7. For **Enable CORS**, select **Save** with all the defaults as-is.
8. The **API Gateway** console under the **Methods** section should now show a new **Method type** for **OPTIONS**.
9. Select **Deploy API**.
10. Within **Deploy API**, choose **Stage** as **default**.

You can now return to the original browser tab with the **Lambda console**.

You can test that the API Gateway and Lambda function are integrated by loading the API endpoint URL in a different browser tab.  You should see the message, "Hello from Lambda!"

#### Configure the Lambda function to access S3

Complete the following steps:

1. In the **Lambda console** for your function, select the **Configuration** tab.
2. From the side menu, select **Environment variables**.
3. Within **Environment variables**, select **Edit**.
4. For **Environment variables**, select **Add environment variable**.
5. [Define an environment variable](https://docs.aws.amazon.com/lambda/latest/dg/configuration-envvars.html) as **Key**=BUCKET_NAME, **Value**=yourbucketname.
6. Select **Save**.

We will now modify the Lambda function's execution role to allow it to interact with S3. For more information, see [Managing permissions in AWS Lambda](https://docs.aws.amazon.com/lambda/latest/dg/lambda-permissions.html).

Complete the following steps:

1. Still in the **Configuration** tab, from the side menu select **Permissions**.
2. Under **Execution role**, then **Role name**, select the name to open the execution role in a separate browser tab.  
3. Within the **Identity and Access Management (IAM) console**, under **Permissions policies** select **Add permissions**.
4. From the drop down menu, select **Create inline policy**.
5. Toggle from the Visual editor to JSON editor, by selecting **JSON**.
6. Copy the policy below and completely replace the content within the **Policy editor** input.
7. Make sure to replace the value of `yourbucketname` with your actual bucket nameL


```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": "s3:PutObject",
            "Resource": "arn:aws:s3:::yourbucketname/*"
        }
    ]
}
```

8. Select **Next**.
9. Under **Policy details** and **Policy name** provide a meaningful name.
10. Select **Create policy**.

Because the Lambda function is generating the S3 presigned URL, this means that the URLs this function generates will inherit the function's access rights. This restricts anyone using the S3 presigned URLs generated by this function to only be able to add new objects to this specific bucket. 

For more information, see [Download and upload objects with presigned URLs](https://docs.aws.amazon.com/AmazonS3/latest/userguide/using-presigned-url.html) for additional information.

#### Deploy server-side code to your Lambda function

Complete the following steps:

1. Navigate to the **Lambda console** for your function, select the **Code** tab.
2. Copy the sample code from this repository's /server directory in the file **index.mjs** to the Lambda function's **index.mjs** in the console.  Your code should completely replace the existing handler.
3. Select **Deploy** to publish your code.

You should observe a message informing you, "Successfully updated the function..."

Congratulations!  

Your Lambda function (the server) is ready to start generating S3 presigned URLs for your specific bucket.

Let's setup the client now.

### Client Setup
In this section, we will instrument your client files to use the correct API Gateway:

Complete the following steps:

1. Navigate to the client directory using the command line: `cd client/`
2. Install the spark-md5 library as a dependency by running: `npm install`
3. You should see a new **/node_modules** directory inside the **/client** directory you are working within.
4. Open the **index.html** found within the **/client** directory.
5. Modify line 15 containing the form action, changing its value to the **public URL** for your API Gateway from **Setup and deploy API Gateway**, step 3 above:
```html
<form action="https://yourapigateway.execute-api.yourregion.amazonaws.com/default/yourresource">
```
6. Open the **index.html** file in a local web browser.

You may now upload a file to test your sample application.  

Your file will appear within your private S3 bucket.

If you encounter an issue, open your browser's console and enable Debug-level messages to aid in your troubleshooting.

## Contributing

We welcome community contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the [LICENSE](LICENSE) file.