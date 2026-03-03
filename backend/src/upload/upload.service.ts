import { Injectable, BadRequestException } from '@nestjs/common';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UploadService {
    private readonly uploadPath = path.join(process.cwd(), 'uploads', 'avatars');

    constructor() {
        // Create upload directory if it doesn't exist
        if (!fs.existsSync(this.uploadPath)) {
            fs.mkdirSync(this.uploadPath, { recursive: true });
        }
    }

    /**
     * Validate file type
     */
    validateImageFile(file: Express.Multer.File): void {
        const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

        if (!allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('Only image files are allowed (JPEG, PNG, GIF, WebP)');
        }

        // Max file size: 5MB
        const maxSize = 5 * 1024 * 1024;
        if (file.size > maxSize) {
            throw new BadRequestException('File size must be less than 5MB');
        }
    }

    /**
     * Generate unique filename
     */
    generateFilename(originalname: string): string {
        const ext = extname(originalname);
        return `${uuidv4()}${ext}`;
    }

    /**
     * Get file URL
     */
    getFileUrl(filename: string): string {
        return `/uploads/avatars/${filename}`;
    }

    /**
     * Delete old avatar file
     */
    deleteFile(filename: string): void {
        try {
            const filePath = path.join(this.uploadPath, filename);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        } catch (error) {
            console.error('Error deleting file:', error);
        }
    }

    /**
     * Extract filename from URL
     */
    extractFilenameFromUrl(url: string): string | null {
        if (!url) return null;
        const match = url.match(/\/uploads\/avatars\/(.+)$/);
        return match ? match[1] : null;
    }
}
