import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportStatus } from './entities/report.entity';
import { Post } from '../posts/entities/post.entity';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateReportDto } from './dto/update-report.dto';
import { PostStatus } from '../common/enums';

@Injectable()
export class ReportsService {
    constructor(
        @InjectRepository(Report)
        private readonly reportRepository: Repository<Report>,
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
    ) { }

    async create(
        userId: string,
        postId: string,
        createReportDto: CreateReportDto,
    ): Promise<Report> {
        const post = await this.postRepository.findOne({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        // Check if user already reported this post
        const existingReport = await this.reportRepository.findOne({
            where: {
                reporter_id: userId,
                post_id: postId,
            },
        });

        if (existingReport) {
            throw new BadRequestException('You have already reported this post');
        }

        const report = this.reportRepository.create({
            reporter_id: userId,
            post_id: postId,
            ...createReportDto,
        });

        const savedReport = await this.reportRepository.save(report);

        // Auto-hide post if it has 3+ reports
        const reportCount = await this.reportRepository.count({
            where: { post_id: postId },
        });

        if (reportCount >= 3) {
            await this.postRepository.update(postId, {
                status: PostStatus.PAUSED,
            });
        }

        return savedReport;
    }

    async findAll(): Promise<Report[]> {
        return await this.reportRepository.find({
            relations: ['reporter', 'post', 'reviewer'],
            order: { created_at: 'DESC' },
        });
    }

    async findPending(): Promise<Report[]> {
        return await this.reportRepository.find({
            where: { status: ReportStatus.PENDING },
            relations: ['reporter', 'post'],
            order: { created_at: 'DESC' },
        });
    }

    async update(
        reportId: string,
        adminId: string,
        updateReportDto: UpdateReportDto,
    ): Promise<Report> {
        const report = await this.reportRepository.findOne({
            where: { id: reportId },
        });

        if (!report) {
            throw new NotFoundException('Report not found');
        }

        await this.reportRepository.update(reportId, {
            ...updateReportDto,
            reviewed_by: adminId,
        });

        const updated = await this.reportRepository.findOne({
            where: { id: reportId },
            relations: ['reporter', 'post', 'reviewer'],
        });

        if (!updated) {
            throw new NotFoundException('Report not found after update');
        }

        return updated;
    }
}
