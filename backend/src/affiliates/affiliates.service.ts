import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { AffiliateLink } from './entities/affiliate-link.entity';
import { AffiliateClick } from './entities/affiliate-click.entity';
import { AffiliateConversion } from './entities/affiliate-conversion.entity';
import { CreateAffiliateLinkDto } from './dto/create-affiliate-link.dto';
import { UpdateAffiliateLinkDto } from './dto/update-affiliate-link.dto';
import { CreateConversionDto } from './dto/create-conversion.dto';

@Injectable()
export class AffiliatesService {
    constructor(
        @InjectRepository(AffiliateLink)
        private readonly linkRepository: Repository<AffiliateLink>,
        @InjectRepository(AffiliateClick)
        private readonly clickRepository: Repository<AffiliateClick>,
        @InjectRepository(AffiliateConversion)
        private readonly conversionRepository: Repository<AffiliateConversion>,
    ) { }

    // Affiliate Links
    async createLink(dto: CreateAffiliateLinkDto): Promise<AffiliateLink> {
        const link = this.linkRepository.create(dto);
        return await this.linkRepository.save(link);
    }

    async findAllLinks(filters?: any): Promise<{ links: AffiliateLink[]; total: number }> {
        const { provider, category, is_active, page = 1, limit = 25 } = filters || {};

        const query = this.linkRepository.createQueryBuilder('link');

        if (provider) {
            query.andWhere('link.provider = :provider', { provider });
        }

        if (category) {
            query.andWhere('link.category = :category', { category });
        }

        if (is_active !== undefined) {
            query.andWhere('link.is_active = :is_active', { is_active });
        }

        query.orderBy('link.created_at', 'DESC');
        query.skip((page - 1) * limit);
        query.take(limit);

        const [links, total] = await query.getManyAndCount();

        return { links, total };
    }

    async findLinkById(id: string): Promise<AffiliateLink> {
        const link = await this.linkRepository.findOne({
            where: { id },
            relations: ['clicks', 'conversions'],
        });

        if (!link) {
            throw new NotFoundException('Affiliate link not found');
        }

        return link;
    }

    async findLinkByShortCode(shortCode: string): Promise<AffiliateLink> {
        const link = await this.linkRepository.findOne({
            where: { short_code: shortCode, is_active: true },
        });

        if (!link) {
            throw new NotFoundException('Affiliate link not found');
        }

        return link;
    }

    async updateLink(id: string, dto: UpdateAffiliateLinkDto): Promise<AffiliateLink> {
        const link = await this.findLinkById(id);
        Object.assign(link, dto);
        return await this.linkRepository.save(link);
    }

    async deleteLink(id: string): Promise<void> {
        const link = await this.findLinkById(id);
        await this.linkRepository.remove(link);
    }

    // Click Tracking
    async trackClick(
        linkId: string,
        userId: string | null,
        ipAddress: string,
        userAgent: string,
        referrer: string,
    ): Promise<AffiliateClick> {
        const click = this.clickRepository.create({
            link_id: linkId,
            user_id: userId,
            ip_address: ipAddress,
            user_agent: userAgent,
            referrer: referrer,
        });

        await this.clickRepository.save(click);

        // Increment click count
        await this.linkRepository.increment({ id: linkId }, 'click_count', 1);

        return click;
    }

    // Conversion Tracking
    async createConversion(dto: CreateConversionDto): Promise<AffiliateConversion> {
        const conversion = this.conversionRepository.create(dto);
        await this.conversionRepository.save(conversion);

        // Update link stats
        await this.linkRepository.increment({ id: dto.link_id }, 'conversion_count', 1);
        await this.linkRepository.increment({ id: dto.link_id }, 'revenue', dto.commission);

        return conversion;
    }

    async findAllConversions(filters?: any): Promise<{ conversions: AffiliateConversion[]; total: number }> {
        const { status, link_id, page = 1, limit = 25 } = filters || {};

        const query = this.conversionRepository
            .createQueryBuilder('conversion')
            .leftJoinAndSelect('conversion.link', 'link')
            .leftJoinAndSelect('conversion.user', 'user');

        if (status) {
            query.andWhere('conversion.status = :status', { status });
        }

        if (link_id) {
            query.andWhere('conversion.link_id = :link_id', { link_id });
        }

        query.orderBy('conversion.converted_at', 'DESC');
        query.skip((page - 1) * limit);
        query.take(limit);

        const [conversions, total] = await query.getManyAndCount();

        return { conversions, total };
    }

    // Analytics
    async getStats(startDate?: Date, endDate?: Date): Promise<any> {
        const start = startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate || new Date();

        const [totalClicks, totalConversions, totalRevenue] = await Promise.all([
            this.clickRepository.count({
                where: {
                    clicked_at: Between(start, end),
                },
            }),
            this.conversionRepository.count({
                where: {
                    converted_at: Between(start, end),
                },
            }),
            this.conversionRepository
                .createQueryBuilder('conversion')
                .select('SUM(conversion.commission)', 'total')
                .where('conversion.converted_at BETWEEN :start AND :end', { start, end })
                .getRawOne(),
        ]);

        const conversionRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

        return {
            totalClicks,
            totalConversions,
            totalRevenue: parseFloat(totalRevenue?.total || '0'),
            conversionRate: Math.round(conversionRate * 100) / 100,
        };
    }

    async getTopPerformers(limit: number = 10): Promise<AffiliateLink[]> {
        return await this.linkRepository.find({
            where: { is_active: true },
            order: { revenue: 'DESC' },
            take: limit,
        });
    }

    // Featured Products (for widgets)
    async getFeaturedProducts(category?: string, limit: number = 6, location?: string): Promise<AffiliateLink[]> {
        const query = this.linkRepository
            .createQueryBuilder('link')
            .where('link.is_active = :active', { active: true })
            .andWhere('link.image_url IS NOT NULL');

        if (category) {
            query.andWhere('link.category = :category', { category });
        }

        if (location) {
            query.andWhere('link.display_locations LIKE :location', { location: `%${location}%` });
        }

        query.orderBy('link.click_count', 'DESC');
        query.take(limit);

        return await query.getMany();
    }
}
