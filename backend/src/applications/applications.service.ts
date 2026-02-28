import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Application, ApplicationStatus } from './entities/application.entity';
import { Post } from '../posts/entities/post.entity';
import { CreateApplicationDto } from './dto/create-application.dto';
import { UpdateApplicationDto } from './dto/update-application.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/entities/notification.entity';

@Injectable()
export class ApplicationsService {
    constructor(
        @InjectRepository(Application)
        private readonly applicationRepository: Repository<Application>,
        @InjectRepository(Post)
        private readonly postRepository: Repository<Post>,
        private readonly notificationsService: NotificationsService,
    ) { }

    async create(
        userId: string,
        postId: string,
        createApplicationDto: CreateApplicationDto,
    ): Promise<Application> {
        const post = await this.postRepository.findOne({
            where: { id: postId },
            relations: ['creator'],
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        // Cannot apply to own post
        if (post.created_by === userId) {
            throw new BadRequestException('Cannot apply to your own post');
        }

        // Check if already applied (any status except WITHDRAWN)
        const existingApplication = await this.applicationRepository.findOne({
            where: {
                post_id: postId,
                applicant_id: userId,
            },
        });

        if (existingApplication && existingApplication.status !== ApplicationStatus.WITHDRAWN) {
            throw new BadRequestException('You have already applied to this post');
        }

        const application = this.applicationRepository.create({
            post_id: postId,
            applicant_id: userId,
            message: createApplicationDto.message,
            status: ApplicationStatus.PENDING,
        });

        const savedApplication = await this.applicationRepository.save(application);

        // Increment application count
        await this.postRepository.increment({ id: postId }, 'application_count', 1);

        // Send push notification to post creator
        await this.notificationsService.sendToUser(post.created_by, {
            title: 'Yeni Başvuru',
            body: `İlanınıza yeni bir başvuru geldi: ${post.title}`,
            url: `/posts/${postId}/applications`,
        });

        const result = await this.applicationRepository.findOne({
            where: { id: savedApplication.id },
            relations: ['applicant', 'post'],
        });

        if (!result) {
            throw new NotFoundException('Application not found after creation');
        }

        return result;
    }

    async findUserApplications(userId: string): Promise<Application[]> {
        return await this.applicationRepository.find({
            where: { applicant_id: userId },
            relations: ['post', 'post.game'],
            order: { created_at: 'DESC' },
        });
    }

    async findIncomingApplications(userId: string): Promise<Application[]> {
        // Kullanıcının ilanlarına gelen başvuruları bul
        const userPosts = await this.postRepository.find({
            where: { created_by: userId },
            select: ['id'],
        });

        if (userPosts.length === 0) {
            return [];
        }

        const postIds = userPosts.map(post => post.id);

        return await this.applicationRepository.find({
            where: postIds.map(postId => ({ post_id: postId })),
            relations: ['applicant', 'post'],
            order: { created_at: 'DESC' },
        });
    }


    async findPostApplications(postId: string, userId: string): Promise<Application[]> {
        const post = await this.postRepository.findOne({
            where: { id: postId },
        });

        if (!post) {
            throw new NotFoundException('Post not found');
        }

        if (post.created_by !== userId) {
            throw new ForbiddenException('You can only view applications for your own posts');
        }

        return await this.applicationRepository.find({
            where: { post_id: postId },
            relations: ['applicant'],
            order: { created_at: 'DESC' },
        });
    }

    async update(
        applicationId: string,
        userId: string,
        updateApplicationDto: UpdateApplicationDto,
    ): Promise<Application> {
        const application = await this.applicationRepository.findOne({
            where: { id: applicationId },
            relations: ['post', 'applicant'],
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        // Only post creator can update application status
        if (application.post.created_by !== userId) {
            throw new ForbiddenException(
                'Only the post creator can update application status',
            );
        }

        await this.applicationRepository.update(applicationId, {
            status: updateApplicationDto.status,
            rejection_reason: updateApplicationDto.rejection_reason || null,
        });

        // Send push notification to applicant
        if (updateApplicationDto.status === ApplicationStatus.ACCEPTED) {
            await this.notificationsService.sendToUser(application.applicant_id, {
                title: 'Başvurunuz Kabul Edildi',
                body: `${application.post.title} ilanına başvurunuz kabul edildi!`,
                url: `/applications/${applicationId}`,
            });
        } else if (updateApplicationDto.status === ApplicationStatus.REJECTED) {
            await this.notificationsService.sendToUser(application.applicant_id, {
                title: 'Başvurunuz Reddedildi',
                body: `${application.post.title} ilanına başvurunuz reddedildi.`,
                url: `/applications/${applicationId}`,
            });
        }

        const result = await this.applicationRepository.findOne({
            where: { id: applicationId },
            relations: ['applicant', 'post'],
        });

        if (!result) {
            throw new NotFoundException('Application not found after update');
        }

        return result;
    }

    async withdraw(applicationId: string, userId: string): Promise<void> {
        const application = await this.applicationRepository.findOne({
            where: { id: applicationId },
        });

        if (!application) {
            throw new NotFoundException('Application not found');
        }

        if (application.applicant_id !== userId) {
            throw new ForbiddenException('You can only withdraw your own applications');
        }

        if (application.status !== ApplicationStatus.PENDING) {
            throw new BadRequestException('Can only withdraw pending applications');
        }

        await this.applicationRepository.update(applicationId, {
            status: ApplicationStatus.WITHDRAWN,
        });

        // Decrement application count
        await this.postRepository.decrement(
            { id: application.post_id },
            'application_count',
            1,
        );
    }
}
