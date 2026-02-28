import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    Res,
    Req,
    UseGuards,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AffiliatesService } from './affiliates.service';
import { CreateAffiliateLinkDto } from './dto/create-affiliate-link.dto';
import { UpdateAffiliateLinkDto } from './dto/update-affiliate-link.dto';
import { CreateConversionDto } from './dto/create-conversion.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('affiliates')
@Controller('affiliates')
export class AffiliatesController {
    constructor(private readonly affiliatesService: AffiliatesService) { }

    // Public redirect endpoint
    @Get('go/:shortCode')
    @ApiOperation({ summary: 'Redirect to affiliate link (public)' })
    async redirectToAffiliate(
        @Param('shortCode') shortCode: string,
        @Req() req: Request,
        @Res() res: Response,
    ) {
        try {
            const link = await this.affiliatesService.findLinkByShortCode(shortCode);

            // Extract user info
            const userId = (req.user as any)?.id || null;
            const ipAddress = req.ip || req.socket.remoteAddress || '';
            const userAgent = req.headers['user-agent'] || '';
            const referrer = req.headers['referer'] || '';

            // Track click
            await this.affiliatesService.trackClick(
                link.id,
                userId,
                ipAddress,
                userAgent,
                referrer,
            );

            // Redirect
            return res.redirect(link.url);
        } catch (error) {
            return res.redirect('/404');
        }
    }

    // Public featured products
    @Get('featured')
    @ApiOperation({ summary: 'Get featured products (public)' })
    async getFeaturedProducts(
        @Query('category') category?: string,
        @Query('limit') limit?: number,
        @Query('location') location?: string,
    ) {
        return await this.affiliatesService.getFeaturedProducts(
            category,
            limit ? parseInt(limit.toString()) : 6,
            location,
        );
    }

    // Admin endpoints
    @Post('admin/links')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create affiliate link (admin only)' })
    async createLink(@Body() dto: CreateAffiliateLinkDto) {
        return await this.affiliatesService.createLink(dto);
    }

    @Get('admin/links')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all affiliate links (admin only)' })
    async getAllLinks(
        @Query('provider') provider?: string,
        @Query('category') category?: string,
        @Query('is_active') is_active?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return await this.affiliatesService.findAllLinks({
            provider,
            category,
            is_active: is_active !== undefined ? is_active === 'true' : undefined,
            page: page || 1,
            limit: limit || 25,
        });
    }

    @Get('admin/links/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get affiliate link by ID (admin only)' })
    async getLinkById(@Param('id') id: string) {
        return await this.affiliatesService.findLinkById(id);
    }

    @Put('admin/links/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update affiliate link (admin only)' })
    async updateLink(
        @Param('id') id: string,
        @Body() dto: UpdateAffiliateLinkDto,
    ) {
        return await this.affiliatesService.updateLink(id, dto);
    }

    @Delete('admin/links/:id')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Delete affiliate link (admin only)' })
    async deleteLink(@Param('id') id: string) {
        await this.affiliatesService.deleteLink(id);
        return { message: 'Affiliate link deleted successfully' };
    }

    // Conversions
    @Post('admin/conversions')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Create conversion (admin only)' })
    async createConversion(@Body() dto: CreateConversionDto) {
        return await this.affiliatesService.createConversion(dto);
    }

    @Get('admin/conversions')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get all conversions (admin only)' })
    async getAllConversions(
        @Query('status') status?: string,
        @Query('link_id') link_id?: string,
        @Query('page') page?: number,
        @Query('limit') limit?: number,
    ) {
        return await this.affiliatesService.findAllConversions({
            status,
            link_id,
            page: page || 1,
            limit: limit || 25,
        });
    }

    // Analytics
    @Get('admin/stats')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get affiliate stats (admin only)' })
    async getStats(
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
    ) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return await this.affiliatesService.getStats(start, end);
    }

    @Get('admin/top-performers')
    @UseGuards(JwtAuthGuard, AdminGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get top performing links (admin only)' })
    async getTopPerformers(@Query('limit') limit?: number) {
        return await this.affiliatesService.getTopPerformers(
            limit ? parseInt(limit.toString()) : 10,
        );
    }
}
