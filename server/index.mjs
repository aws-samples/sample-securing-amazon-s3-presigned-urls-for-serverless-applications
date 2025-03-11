import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';
import path from 'path';

// Initialize the S3 client using AWS SDK
const s3Client = new S3Client({ region: process.env.AWS_REGION_NAME });

/**
 * AWS Lambda function to generate a presigned URL for uploading a file to S3.
 *
 * The function expects a JSON payload containing the filename, file MD5 hash,
 * and file MIME type. It returns a presigned URL that allows the client to
 * upload the file directly to S3.
 *
 * @param {Object} event - The event data passed to the function, containing the HTTP request information.
 * @param {Object} context - The context in which the Lambda function is called (contains runtime information).
 * @returns {Object} - An object containing the HTTP response with the presigned URL or an error message.
 */
export const handler = async (event, context) => {

    // Get the S3 bucket name from environment variables
    const bucketName = process.env.BUCKET_NAME;
    if (!bucketName) {
        console.error('Missing BUCKET_NAME environment variable.');
        return createResponse(500, { error: 'The server is missing an important variable.' });
    }

    console.debug(bucketName);

    // Parse the incoming JSON payload from the HTTP request body
    let body;
    try {
        body = JSON.parse(event.body);

        console.debug(body);

        const { filename, filesize, filetype, filemd5, clientnetwork } = body;

        if (!filename || !filesize || !filetype || !filemd5 || !clientnetwork) {
            console.error('Missing required fields: filename, filesize, filetype, filemd5, clientnetwork');
            return createResponse(400, { error: 'Missing required fields.' });
        }

        console.debug(filename, filesize, filetype, filemd5, clientnetwork);

        // Derive values for the new key name
        const uuid = randomUUID();
        const fileext = getFileExtension(filename);
        const keyName = uuid + '.' + fileext;

        // Create parameters for the presigned PUT request
        const putParams = {
            Bucket: bucketName,
            Key: keyName,              // The random key (name) under which the file will be stored
            ContentMD5: filemd5,       // The MD5 hash of the file, used for validating the upload
            ContentType: filetype,     // The content type (MIME type) of the file
        }

        const putCommand = new PutObjectCommand(putParams)

        // Calculate the time the presigned URL should be available
        const expireInSeconds = calculateTransferTime(clientnetwork, filesize);

        // Generate the presigned URL for uploading the file to S3
        try {

            const presignedUrl = await getSignedUrl(s3Client, putCommand, { expiresIn: expireInSeconds });

            console.debug(presignedUrl);

            // Return the presigned URL as a successful response
            return createResponse(200, { presignedUrl });

        } catch (err) {
            console.debug(err);
            return createResponse(500, { error: `Failed to generate presigned URL: ${err.message}` });
        }

    } catch (err) {
        return createResponse(400, { error: `Invalid request: ${err.message}` });
    }
};

/**
 * Calculates the estimated time to transfer a file over a network based on network type and file size.
 *
 * @param {string} networkType - The type of network (e.g., 'ethernet', 'wifi', '4g', '3g', '2g', 'slow-2g', or 'unknown').
 * @param {number} fileSizeBytes - The size of the file in bytes.
 * @returns {number} The estimated transfer time in seconds, which will be a number between 60 (1 minute) and 300 (5 minutes).
 */
function calculateTransferTime(networkType, fileSizeBytes) {
    // Define heuristic transfer speeds in bits per second (bps) for each network type
    const speeds = {
        'slow-2g': 50 * 1e3,   // 50 Kbps
        '2g': 100 * 1e3,      // 100 Kbps
        '3g': 1 * 1e6,        // 1 Mbps
        'unknown': 1 * 1e6,   // Default to 1 Mbps for unknown types
        '4g': 10 * 1e6,       // 10 Mbps
        'wifi': 30 * 1e6,     // 30 Mbps
        'ethernet': 50 * 1e6, // 50 Mbps
    };

    // Get the speed for the detected network type, defaulting to 'unknown' if not found
    const speed = speeds[networkType] || speeds['unknown'];

    // Calculate the transfer time in seconds
    const fileSizeBits = fileSizeBytes * 8; // Convert file size to bits
    const transferTimeSeconds = fileSizeBits / speed;

    // Round up to 60 seconds if < 60 and round down to 300 seconds if > 300
    const transferTime = Math.round(Math.min(Math.max(transferTimeSeconds, 60), 300));

    return transferTime;
}

/**
 * Utility function to generate a JSON HTTP response
 * @param {number} statusCode - The HTTP status code.
 * @param {Object} body - The response body as an object.
 * @returns {Object} - The formatted HTTP response.
 */
function createResponse(statusCode, body) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  // Allow all origins (CORS policy)
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        },
        body: JSON.stringify(body),
    };
};

/**
 * Extracts the file extension (suffix) from a filename.
 *
 * @param {string} filename - The name of the file.
 * @returns {string} - The file extension without the dot, or an empty string if none exists.
 * @throws {TypeError} - If the input is not a string.
 */
function getFileExtension(filename) {
    if (typeof filename !== 'string') {
        throw new TypeError('The filename must be a string.');
    }

    // Trim whitespace and get the base filename
    const base = path.basename(filename.trim());

    // Handle filenames that are only dots or empty
    if (base === '' || /^\.{1,}$/.test(base)) {
        return '';
    }

    // Split the filename by dots, filtering out empty strings
    const parts = base.split('.').filter(Boolean);

    // No dot found or filename starts with a dot (hidden files like .gitignore)
    if (parts.length === 1) {
        return '';
    }

    // Return the last part after the last dot
    return parts.pop().toLowerCase();
}