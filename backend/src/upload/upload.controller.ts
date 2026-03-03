import {
    Controller,
    Post,
    Put,
    Body,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFile,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from './upload.service';
import { UsersService } from '../users/users.service';

interface RequestWithUser {
    user: {
        id: string;
        username: string;
    };
}

@Controller('upload')
@UseGuards(JwtAuthGuard)
export class UploadController {
    constructor(
        private readonly uploadService: UploadService,
        private readonly usersService: UsersService,
    ) { }

    /**
     * Upload avatar from file
     * POST /upload/avatar
     */
    @Post('avatar')
    @UseInterceptors(
        FileInterceptor('file', {
            storage: diskStorage({
                destination: './uploads/avatars',
                filename: (req, file, cb) => {
                    const uploadService = new UploadService();
                    const filename = uploadService.generateFilename(file.originalname);
                    cb(null, filename);
                },
            }),
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
        }),
    )
    async uploadAvatar(
        @Request() req: RequestWithUser,
        @UploadedFile() file: Express.Multer.File,
    ) {
        if (!file) {
            throw new BadRequestException('No file uploaded');
        }

        // Validate file
        this.uploadService.validateImageFile(file);

        // Get file URL
        const avatarUrl = this.uploadService.getFileUrl(file.filename);

        // Get user's old avatar
        const user = await this.usersService.findById(req.user.id);
        const oldAvatarFilename = this.uploadService.extractFilenameFromUrl(user.avatar_url);

        // Update user avatar
        await this.usersService.updateAvatar(req.user.id, avatarUrl);

        // Delete old avatar file if it exists
        if (oldAvatarFilename) {
            this.uploadService.deleteFile(oldAvatarFilename);
        }

        return {
            success: true,
            data: {
                avatar_url: avatarUrl,
            },
        };
    }

    /**
     * Update avatar from URL
     * PUT /upload/avatar-url
     */
    @Put('avatar-url')
    async updateAvatarUrl(@Request() req: RequestWithUser, @Body('avatar_url') avatarUrl: string) {
        if (!avatarUrl) {
            throw new BadRequestException('Avatar URL is required');
        }

        // Validate URL format
        try {
            new URL(avatarUrl);
        } catch (error) {
            throw new BadRequestException('Invalid URL format');
        }

        // Get user's old avatar
        const user = await this.usersService.findById(req.user.id);
        const oldAvatarFilename = this.uploadService.extractFilenameFromUrl(user.avatar_url);

        // Update user avatar
        await this.usersService.updateAvatar(req.user.id, avatarUrl);

        // Delete old avatar file if it was uploaded (not external URL)
        if (oldAvatarFilename) {
            this.uploadService.deleteFile(oldAvatarFilename);
        }

        return {
            success: true,
            data: {
                avatar_url: avatarUrl,
            },
        };
    }
}
