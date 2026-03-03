import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    Request,
    UseInterceptors,
    UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ContactService } from './contact.service';
import { CreateContactDto, UpdateContactDto, CreateTemplateDto, UpdateTemplateDto } from './dto';
import { ContactStatus } from './entities/contact.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@Controller('contact')
export class ContactController {
    constructor(private readonly contactService: ContactService) { }

    /**
     * Create a new contact message (public)
     * POST /contact
     */
    @Post()
    async create(@Body() data: CreateContactDto, @Request() req: any) {
        const userId = req.user?.id;
        return this.contactService.create(data, userId);
    }

    /**
     * Upload attachment for contact message (public)
     * POST /contact/upload
     */
    @Post('upload')
    @UseInterceptors(FileInterceptor('file', {
        storage: diskStorage({
            destination: './uploads/contact',
            filename: (req, file, cb) => {
                const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
                const ext = extname(file.originalname);
                cb(null, `contact-${uniqueSuffix}${ext}`);
            },
        }),
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB
        },
        fileFilter: (req, file, cb) => {
            // Allow images and PDFs
            const allowedMimes = [
                'image/jpeg',
                'image/png',
                'image/gif',
                'application/pdf',
            ];
            if (allowedMimes.includes(file.mimetype)) {
                cb(null, true);
            } else {
                cb(new Error('Invalid file type. Only images and PDFs are allowed.'), false);
            }
        },
    }))
    async uploadAttachment(@UploadedFile() file: Express.Multer.File) {
        if (!file) {
            throw new Error('No file uploaded');
        }
        return {
            filename: file.filename,
            path: `/uploads/contact/${file.filename}`,
            originalName: file.originalname,
            size: file.size,
        };
    }

    /**
     * Get all contact messages (admin only)
     * GET /contact
     */
    @Get()
    @UseGuards(JwtAuthGuard, AdminGuard)
    async findAll(@Query('status') status?: ContactStatus) {
        return this.contactService.findAll(status);
    }

    /**
     * Get contact statistics (admin only)
     * GET /contact/stats
     */
    @Get('stats')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async getStats() {
        return this.contactService.getStats();
    }

    /**
     * Get a single contact message (admin only)
     * GET /contact/:id
     */
    @Get(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async findOne(@Param('id') id: string) {
        return this.contactService.findOne(id);
    }

    /**
     * Update contact message (admin only)
     * PUT /contact/:id
     */
    @Put(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async update(
        @Param('id') id: string,
        @Body() data: UpdateContactDto,
        @Request() req: any,
    ) {
        return this.contactService.update(id, data, req.user.id);
    }

    /**
     * Delete contact message (admin only)
     * DELETE /contact/:id
     */
    @Delete(':id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async delete(@Param('id') id: string) {
        await this.contactService.delete(id);
        return { message: 'Contact message deleted successfully' };
    }

    // ==================== TEMPLATE ENDPOINTS ====================

    /**
     * Create a new template (admin only)
     * POST /contact/templates
     */
    @Post('templates')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async createTemplate(@Body() data: CreateTemplateDto, @Request() req: any) {
        return this.contactService.createTemplate(data, req.user.id);
    }

    /**
     * Get all templates (admin only)
     * GET /contact/templates
     */
    @Get('templates')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async getAllTemplates(@Query('activeOnly') activeOnly?: string) {
        return this.contactService.getAllTemplates(activeOnly === 'true');
    }

    /**
     * Get a single template (admin only)
     * GET /contact/templates/:id
     */
    @Get('templates/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async getTemplateById(@Param('id') id: string) {
        return this.contactService.getTemplateById(id);
    }

    /**
     * Update template (admin only)
     * PUT /contact/templates/:id
     */
    @Put('templates/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async updateTemplate(@Param('id') id: string, @Body() data: UpdateTemplateDto) {
        return this.contactService.updateTemplate(id, data);
    }

    /**
     * Delete template (admin only)
     * DELETE /contact/templates/:id
     */
    @Delete('templates/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    async deleteTemplate(@Param('id') id: string) {
        await this.contactService.deleteTemplate(id);
        return { message: 'Template deleted successfully' };
    }
}
