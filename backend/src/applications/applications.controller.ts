import {
    Controller,
    Get,
    Post,
    Body,
    Patch,
    Param,
    Delete,
    UseGuards,
    UseInterceptors,
    ClassSerializerInterceptor,
} from '@nestjs/common';
import {
    ApiTags,
    ApiOperation,
    ApiResponse,
    ApiBearerAuth,
} from '@nestjs/swagger';
import { ApplicationsService } from './applications.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('applications')
@Controller('applications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class ApplicationsController {
    constructor(private readonly applicationsService: ApplicationsService) { }

    @Post('posts/:postId')
    @ApiOperation({ summary: 'Apply to a post' })
    @ApiResponse({ status: 201, description: 'Application created successfully' })
    async create(
        @CurrentUser() user: User,
        @Param('postId') postId: string,
        @Body() createApplicationDto: CreateApplicationDto,
    ) {
        return await this.applicationsService.create(
            user.id,
            postId,
            createApplicationDto,
        );
    }

    @Get('my-applications')
    @ApiOperation({ summary: 'Get current user applications' })
    async getMyApplications(@CurrentUser() user: User) {
        return await this.applicationsService.findUserApplications(user.id);
    }

    @Get('incoming')
    @ApiOperation({ summary: 'Get incoming applications for user posts' })
    async getIncomingApplications(@CurrentUser() user: User) {
        return await this.applicationsService.findIncomingApplications(user.id);
    }


    @Get('posts/:postId')
    @ApiOperation({ summary: 'Get applications for a post' })
    async getPostApplications(
        @CurrentUser() user: User,
        @Param('postId') postId: string,
    ) {
        return await this.applicationsService.findPostApplications(postId, user.id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update application status (post creator only)' })
    async update(
        @CurrentUser() user: User,
        @Param('id') id: string,
        @Body() updateApplicationDto: UpdateApplicationDto,
    ) {
        return await this.applicationsService.update(id, user.id, updateApplicationDto);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Withdraw application' })
    async withdraw(@CurrentUser() user: User, @Param('id') id: string) {
        await this.applicationsService.withdraw(id, user.id);
        return { message: 'Application withdrawn successfully' };
    }
}
