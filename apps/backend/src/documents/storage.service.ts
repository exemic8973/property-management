import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs/promises';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream/promises';
import { randomBytes } from 'crypto';
import { File } from 'buffer';

export interface StorageOptions {
  tenantId: string;
  entityType: string;
  entityId: string;
}

export interface UploadResult {
  filePath: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  storageType: 'local' | 's3';
  url?: string;
}

export interface DownloadResult {
  stream: NodeJS.ReadableStream;
  fileName: string;
  mimeType: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly storageType: 'local' | 's3';
  private readonly localUploadDir: string;
  private readonly maxFileSize: number;
  private readonly allowedMimeTypes: string[];
  private readonly s3Bucket?: string;
  private readonly s3Region?: string;

  constructor(private readonly configService: ConfigService) {
    this.storageType = this.configService.get<'local' | 's3'>('STORAGE_TYPE', 'local');
    this.localUploadDir = this.configService.get<string>('UPLOAD_DIR', './uploads');
    this.maxFileSize = this.configService.get<number>('MAX_FILE_SIZE', 50 * 1024 * 1024); // 50MB default
    this.allowedMimeTypes = this.configService.get<string[]>(
      'ALLOWED_MIME_TYPES',
      [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'image/svg+xml',
        'text/plain',
        'text/csv',
      ],
    );
    this.s3Bucket = this.configService.get<string>('S3_BUCKET');
    this.s3Region = this.configService.get<string>('S3_REGION');

    // Initialize upload directory if using local storage
    if (this.storageType === 'local') {
      this.initializeLocalStorage();
    }
  }

  private async initializeLocalStorage() {
    try {
      await fs.mkdir(this.localUploadDir, { recursive: true });
      this.logger.log(`Local storage initialized at: ${this.localUploadDir}`);
    } catch (error) {
      this.logger.error(`Failed to initialize local storage: ${error.message}`);
    }
  }

  /**
   * Generate a unique file path for the document
   */
  private generateFilePath(options: StorageOptions, fileName: string): string {
    const sanitizedFileName = this.sanitizeFileName(fileName);
    const uniqueId = randomBytes(16).toString('hex');
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    return path.join(
      options.tenantId,
      options.entityType,
      options.entityId,
      date,
      `${uniqueId}-${sanitizedFileName}`,
    );
  }

  /**
   * Sanitize file name to prevent directory traversal
   */
  private sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\.+/g, '.')
      .replace(/^\.+|\.+$/g, '');
  }

  /**
   * Validate file before upload
   */
  private validateFile(file: any): void {
    // Check file size
    if (file.size > this.maxFileSize) {
      throw new BadRequestException(
        `File size exceeds maximum allowed size of ${this.maxFileSize / 1024 / 1024}MB`,
      );
    }

    // Check file type
    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type ${file.mimetype} is not allowed. Allowed types: ${this.allowedMimeTypes.join(', ')}`,
      );
    }
  }

  /**
   * Upload file to storage
   */
  async uploadFile(
    file: any,
    options: StorageOptions,
  ): Promise<UploadResult> {
    this.validateFile(file);

    const filePath = this.generateFilePath(options, file.originalname);

    if (this.storageType === 'local') {
      return this.uploadToLocal(file, filePath);
    } else {
      return this.uploadToS3(file, filePath);
    }
  }

  /**
   * Upload file to local storage
   */
  private async uploadToLocal(
    file: any,
    filePath: string,
  ): Promise<UploadResult> {
    const fullPath = path.join(this.localUploadDir, filePath);
    const dir = path.dirname(fullPath);

    try {
      // Create directory if it doesn't exist
      await fs.mkdir(dir, { recursive: true });

      // Write file
      await fs.writeFile(fullPath, file.buffer);

      this.logger.log(`File uploaded to local storage: ${filePath}`);

      return {
        filePath,
        fileName: file.originalname,
        fileSize: file.size,
        mimeType: file.mimetype,
        storageType: 'local',
      };
    } catch (error) {
      this.logger.error(`Failed to upload file to local storage: ${error.message}`);
      throw new BadRequestException('Failed to upload file');
    }
  }

  /**
   * Upload file to S3 (placeholder for future S3 integration)
   */
  private async uploadToS3(
    file: any,
    filePath: string,
  ): Promise<UploadResult> {
    // Note: This is a placeholder for S3 integration
    // To implement S3 upload, you would use the AWS SDK v3 for S3
    // Example implementation would require @aws-sdk/client-s3 package

    this.logger.warn('S3 storage not yet implemented. Falling back to local storage.');
    return this.uploadToLocal(file, filePath);
  }

  /**
   * Download file from storage
   */
  async downloadFile(filePath: string): Promise<DownloadResult> {
    if (this.storageType === 'local') {
      return this.downloadFromLocal(filePath);
    } else {
      return this.downloadFromS3(filePath);
    }
  }

  /**
   * Download file from local storage
   */
  private async downloadFromLocal(filePath: string): Promise<DownloadResult> {
    const fullPath = path.join(this.localUploadDir, filePath);

    try {
      // Check if file exists
      await fs.access(fullPath);

      const stats = await fs.stat(fullPath);
      const stream = createReadStream(fullPath);
      const fileName = path.basename(filePath);

      // Determine MIME type from file extension
      const ext = path.extname(fileName).toLowerCase();
      const mimeType = this.getMimeTypeFromExtension(ext);

      this.logger.log(`File downloaded from local storage: ${filePath}`);

      return {
        stream,
        fileName,
        mimeType,
      };
    } catch (error) {
      this.logger.error(`Failed to download file from local storage: ${error.message}`);
      throw new BadRequestException('File not found or could not be accessed');
    }
  }

  /**
   * Download file from S3 (placeholder for future S3 integration)
   */
  private async downloadFromS3(filePath: string): Promise<DownloadResult> {
    this.logger.warn('S3 storage not yet implemented. Falling back to local storage.');
    return this.downloadFromLocal(filePath);
  }

  /**
   * Delete file from storage
   */
  async deleteFile(filePath: string): Promise<void> {
    if (this.storageType === 'local') {
      return this.deleteFromLocal(filePath);
    } else {
      return this.deleteFromS3(filePath);
    }
  }

  /**
   * Delete file from local storage
   */
  private async deleteFromLocal(filePath: string): Promise<void> {
    const fullPath = path.join(this.localUploadDir, filePath);

    try {
      await fs.unlink(fullPath);
      this.logger.log(`File deleted from local storage: ${filePath}`);
    } catch (error) {
      // Log error but don't throw - file might not exist
      this.logger.warn(`File not found or could not be deleted: ${filePath}`);
    }
  }

  /**
   * Delete file from S3 (placeholder for future S3 integration)
   */
  private async deleteFromS3(filePath: string): Promise<void> {
    this.logger.warn('S3 storage not yet implemented. Falling back to local storage.');
    return this.deleteFromLocal(filePath);
  }

  /**
   * Get MIME type from file extension
   */
  private getMimeTypeFromExtension(ext: string): string {
    const mimeTypes: Record<string, string> = {
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.txt': 'text/plain',
      '.csv': 'text/csv',
    };

    return mimeTypes[ext] || 'application/octet-stream';
  }

  /**
   * Get file URL for S3 (placeholder)
   */
  getFileUrl(filePath: string): string {
    if (this.storageType === 's3' && this.s3Bucket) {
      // Return S3 URL format
      return `https://${this.s3Bucket}.s3.${this.s3Region}.amazonaws.com/${filePath}`;
    }

    // For local storage, return API endpoint
    return `/api/documents/file/${encodeURIComponent(filePath)}`;
  }

  /**
   * Check if storage is properly configured
   */
  isConfigured(): boolean {
    if (this.storageType === 's3') {
      return !!(this.s3Bucket && this.s3Region);
    }
    return true;
  }
}