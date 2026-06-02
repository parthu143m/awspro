"use server";

import { S3Client, PutObjectCommand, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

function getS3Client() {
  const requiredEnvVars = [
    "AWS_REGION",
    "AWS_ACCESS_KEY_ID",
    "AWS_SECRET_ACCESS_KEY",
    "AWS_S3_BUCKET_NAME",
  ];

  const missing = requiredEnvVars.filter((v) => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      `AWS S3 configuration is missing. Please define the following environment variables in your .env.local file: ${missing.join(
        ", "
      )}`
    );
  }

  return new S3Client({
    region: process.env.AWS_REGION,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
  });
}

export async function uploadImageToS3(formData) {
  const file = formData.get("image");
  const name = formData.get("name") || file.name;

  if (!file) {
    throw new Error("No file was provided in the upload request.");
  }

  try {
    const s3Client = getS3Client();

    // Convert standard browser file to Buffer for AWS SDK S3 client
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Create cloud-safe key
    const cleanFileName = name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const key = `uploads/${Date.now()}-${cleanFileName}`;

    // Build S3 PutObject command
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    // Send upload command to AWS
    await s3Client.send(command);

    // If CloudFront URL is configured, use CDN URL for faster feedback
    const cdnDomain = process.env.AWS_CLOUDFRONT_URL;
    let finalReadUrl = "";

    if (cdnDomain) {
      const cleanDomain = cdnDomain.replace(/\/$/, "");
      finalReadUrl = cleanDomain.startsWith("http") 
        ? `${cleanDomain}/${key}` 
        : `https://${cleanDomain}/${key}`;
    } else {
      // Fallback to secure temporary read URL
      const getCommand = new GetObjectCommand({
        Bucket: process.env.AWS_S3_BUCKET_NAME,
        Key: key,
      });
      finalReadUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
    }

    return {
      success: true,
      fileUrl: finalReadUrl,
      key,
    };
  } catch (error) {
    console.error("Error in uploadImageToS3 server action:", error);
    throw new Error(error.message || "Failed to upload file to AWS S3.");
  }
}

export async function getS3Images() {
  try {
    const s3Client = getS3Client();

    const command = new ListObjectsV2Command({
      Bucket: process.env.AWS_S3_BUCKET_NAME,
      Prefix: "uploads/",
    });

    const response = await s3Client.send(command);

    if (!response.Contents) {
      return { success: true, images: [] };
    }

    const cdnDomain = process.env.AWS_CLOUDFRONT_URL;

    // Map objects to either high-speed CDN URLs or secure presigned temporary URLs
    const imagesPromises = response.Contents
      .filter((item) => item.Key !== "uploads/") // Filter out directory prefix itself
      .map(async (item) => {
        const keyParts = item.Key.split("/");
        const rawFileName = keyParts[keyParts.length - 1];
        
        // Strip timestamps (e.g. 17182937123-my_image.png -> my_image.png)
        const nameWithoutTimestamp = rawFileName.replace(/^\d+-/, "");
        
        // Replace underscores/dashes with spaces and capitalize
        const humanReadableName = nameWithoutTimestamp
          .substring(0, nameWithoutTimestamp.lastIndexOf("."))
          .replace(/[_-]/g, " ") || nameWithoutTimestamp;

        let finalUrl = "";

        if (cdnDomain) {
          // If CloudFront is configured, build CDN edge URL
          const cleanDomain = cdnDomain.replace(/\/$/, "");
          finalUrl = cleanDomain.startsWith("http") 
            ? `${cleanDomain}/${item.Key}` 
            : `https://${cleanDomain}/${item.Key}`;
        } else {
          // Otherwise, generate a secure presigned read URL valid for 1 hour (3600 seconds)
          const getCommand = new GetObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: item.Key,
          });
          finalUrl = await getSignedUrl(s3Client, getCommand, { expiresIn: 3600 });
        }

        return {
          key: item.Key,
          name: humanReadableName,
          url: finalUrl,
          lastModified: item.LastModified.toISOString(),
          size: item.Size,
        };
      });

    const images = await Promise.all(imagesPromises);

    // Sort newest images first
    images.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    return { success: true, images };
  } catch (error) {
    console.error("Error in getS3Images server action:", error);
    throw new Error(error.message || "Failed to load images from AWS S3.");
  }
}
