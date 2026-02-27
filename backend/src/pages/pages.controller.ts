import { Controller, Get, Param, Query, NotFoundException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Page } from './entities/page.entity';
import { MenuItem } from './entities/menu-item.entity';

@ApiTags('pages')
@Controller()
export class PagesController {
    constructor(
        @InjectRepository(Page)
        private readonly pageRepository: Repository<Page>,
        @InjectRepository(MenuItem)
        private readonly menuItemRepository: Repository<MenuItem>,
    ) { }

    @Get('pages/:slug')
    @ApiOperation({ summary: 'Get page by slug (public)' })
    async getPageBySlug(@Param('slug') slug: string) {
        const page = await this.pageRepository.findOne({
            where: { slug, status: 'PUBLISHED' as any },
        });

        if (!page) {
            throw new NotFoundException('Page not found');
        }

        // Increment view count
        await this.pageRepository.increment({ id: page.id }, 'view_count', 1);

        return page;
    }

    @Get('menu-items')
    @ApiOperation({ summary: 'Get menu items (public)' })
    async getMenuItems(@Query('location') location?: string) {
        const query = this.menuItemRepository.createQueryBuilder('menu');

        query.where('menu.is_active = :active', { active: true });

        if (location) {
            query.andWhere('menu.location = :location', { location });
        }

        query.orderBy('menu.order', 'ASC');
        query.addOrderBy('menu.created_at', 'ASC');

        const items = await query.getMany();

        // Group by location
        const grouped = items.reduce((acc, item) => {
            if (!acc[item.location]) {
                acc[item.location] = [];
            }
            acc[item.location].push(item);
            return acc;
        }, {} as Record<string, any[]>);

        return grouped;
    }
}
