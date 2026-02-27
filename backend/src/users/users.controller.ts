import {
    Controller,
    Get,
    Patch,
    Body,
    Param,
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
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from './entities/user.entity';

@ApiTags('users')
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
    constructor(private readonly usersService: UsersService) { }

    @Get('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user profile' })
    @ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully',
    })
    async getMe(@CurrentUser() user: User) {
        return user;
    }

    @Get('me/stats')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get current user statistics' })
    @ApiResponse({
        status: 200,
        description: 'User statistics retrieved successfully',
    })
    async getMyStats(@CurrentUser() user: User) {
        return await this.usersService.getUserStats(user.id);
    }

    @Get('check-username/:username')
    @ApiOperation({ summary: 'Check if username is available' })
    @ApiResponse({
        status: 200,
        description: 'Username availability checked',
    })
    async checkUsername(@Param('username') username: string) {
        const user = await this.usersService.findByUsername(username);
        const available = !user;

        // Generate suggestions if username is taken
        let suggestions: string[] = [];
        if (!available) {
            suggestions = await this.generateUsernameSuggestions(username);
        }

        return { available, suggestions };
    }

    private async generateUsernameSuggestions(username: string): Promise<string[]> {
        const suggestions: string[] = [];
        const baseUsername = username.toLowerCase();

        // Strategy 1: Add random numbers
        for (let i = 0; i < 2; i++) {
            const randomNum = Math.floor(Math.random() * 9999);
            const suggestion = `${baseUsername}${randomNum}`;
            const exists = await this.usersService.findByUsername(suggestion);
            if (!exists) {
                suggestions.push(suggestion);
            }
        }

        // Strategy 2: Add year
        const currentYear = new Date().getFullYear();
        const yearSuggestion = `${baseUsername}${currentYear}`;
        const yearExists = await this.usersService.findByUsername(yearSuggestion);
        if (!yearExists && suggestions.length < 4) {
            suggestions.push(yearSuggestion);
        }

        // Strategy 3: Add underscore and number
        const underscoreSuggestion = `${baseUsername}_${Math.floor(Math.random() * 999)}`;
        const underscoreExists = await this.usersService.findByUsername(underscoreSuggestion);
        if (!underscoreExists && suggestions.length < 4) {
            suggestions.push(underscoreSuggestion);
        }

        // Strategy 4: Add "official" or "real"
        const prefixes = ['official', 'real', 'the'];
        for (const prefix of prefixes) {
            if (suggestions.length >= 4) break;
            const suggestion = `${prefix}${baseUsername}`;
            const exists = await this.usersService.findByUsername(suggestion);
            if (!exists) {
                suggestions.push(suggestion);
                break;
            }
        }

        return suggestions.slice(0, 4);
    }

    @Get('check-email/:email')
    @ApiOperation({ summary: 'Check if email is available' })
    @ApiResponse({
        status: 200,
        description: 'Email availability checked',
    })
    async checkEmail(@Param('email') email: string) {
        const user = await this.usersService.findByEmail(email);
        return { available: !user };
    }

    @Patch('me')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Update current user profile' })
    @ApiResponse({
        status: 200,
        description: 'Profile updated successfully',
    })
    async updateMe(
        @CurrentUser() user: User,
        @Body() updateProfileDto: UpdateProfileDto,
    ) {
        return await this.usersService.update(user.id, updateProfileDto);
    }

    @Get(':username')
    @ApiOperation({ summary: 'Get user profile by username (public)' })
    @ApiResponse({
        status: 200,
        description: 'User profile retrieved successfully',
    })
    @ApiResponse({
        status: 404,
        description: 'User not found',
    })
    async getUserByUsername(@Param('username') username: string) {
        return await this.usersService.findByUsername(username);
    }
}
