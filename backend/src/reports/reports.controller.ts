import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('reports')
@Controller('reports')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ReportsController {
    constructor(private readonly reportsService: ReportsService) { }

    @Post('posts/:postId')
    @ApiOperation({ summary: 'Report a post' })
    async create(
        @CurrentUser() user: User,
        @Param('postId') postId: string,
        @Body() createReportDto: CreateReportDto,
    ) {
        return await this.reportsService.create(user.id, postId, createReportDto);
    }

    @Get('pending')
    @ApiOperation({ summary: 'Get pending reports (admin only)' })
    async getPending() {
        return await this.reportsService.findPending();
    }

    @Get()
    @ApiOperation({ summary: 'Get all reports (admin only)' })
    async findAll() {
        return await this.reportsService.findAll();
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update report status (admin only)' })
    async update(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Body() updateReportDto: UpdateReportDto,
    ) {
        return await this.reportsService.update(id, user.id, updateReportDto);
    }
}
