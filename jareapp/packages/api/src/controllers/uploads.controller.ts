import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import crypto from 'crypto';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm'];
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB

export async function getPresignedUrl(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { fileName, contentType, fileSize } = req.body as {
      fileName: string;
      contentType: string;
      fileSize: number;
    };

    const isImage = ALLOWED_IMAGE_TYPES.includes(contentType);
    const isVideo = ALLOWED_VIDEO_TYPES.includes(contentType);

    if (!isImage && !isVideo) {
      res.status(400).json({ success: false, message: 'Invalid file type. Only images and videos allowed.' });
      return;
    }

    const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
    if (fileSize > maxSize) {
      res.status(400).json({
        success: false,
        message: `File too large. Max size is ${isVideo ? '50MB' : '10MB'}.`,
      });
      return;
    }

    // Generate unique file key
    const ext = fileName.split('.').pop();
    const key = `uploads/${req.user!.userId}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;

    // In production, generate a real presigned URL using AWS SDK or Cloudflare R2
    // For now, return a mock URL that the client can use
    const bucketName = process.env.AWS_BUCKET_NAME || 'jareapp-media';
    const region = process.env.AWS_REGION || 'me-south-1';
    const mockUploadUrl = `https://${bucketName}.s3.${region}.amazonaws.com/${key}`;
    const publicUrl = mockUploadUrl.split('?')[0];

    res.json({
      success: true,
      data: {
        uploadUrl: mockUploadUrl,
        publicUrl,
        key,
        expiresIn: 300, // 5 minutes
      },
    });
  } catch (err) {
    console.error('[Uploads] getPresignedUrl error:', err);
    res.status(500).json({ success: false, message: 'Failed to generate upload URL' });
  }
}
