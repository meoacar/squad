import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Contact, ContactStatus } from './entities/contact.entity';
import { ContactTemplate } from './entities/contact-template.entity';
import { CreateContactDto, UpdateContactDto, CreateTemplateDto, UpdateTemplateDto } from './dto';
import { EmailService } from '../notifications/email.service';
import { getContactReplyEmailTemplate } from './templates/contact-reply.template';

@Injectable()
export class ContactService {
    private readonly logger = new Logger(ContactService.name);

    constructor(
        @InjectRepository(Contact)
        private contactRepository: Repository<Contact>,
        @InjectRepository(ContactTemplate)
        private templateRepository: Repository<ContactTemplate>,
        private emailService: EmailService,
    ) { }

    /**
     * Create a new contact message
     */
    async create(data: CreateContactDto, userId?: string): Promise<Contact> {
        const contact = this.contactRepository.create({
            ...data,
            user_id: userId,
            status: ContactStatus.NEW,
        });

        const savedContact = await this.contactRepository.save(contact);
        this.logger.log(`New contact message created: ${savedContact.id}`);

        return savedContact;
    }

    /**
     * Get all contact messages (admin only)
     */
    async findAll(status?: ContactStatus): Promise<Contact[]> {
        const query = this.contactRepository.createQueryBuilder('contact');

        if (status) {
            query.where('contact.status = :status', { status });
        }

        query.orderBy('contact.created_at', 'DESC');

        return query.getMany();
    }

    /**
     * Get a single contact message by ID
     */
    async findOne(id: string): Promise<Contact> {
        const contact = await this.contactRepository.findOne({
            where: { id },
        });

        if (!contact) {
            throw new NotFoundException(`Contact message with ID ${id} not found`);
        }

        return contact;
    }

    /**
     * Update contact message (admin only)
     */
    async update(id: string, data: UpdateContactDto, adminId: string): Promise<Contact> {
        const contact = await this.findOne(id);

        if (data.status) {
            contact.status = data.status;
        }

        if (data.admin_reply) {
            contact.admin_reply = data.admin_reply;
            contact.replied_by = adminId;
            contact.replied_at = new Date();
            contact.status = ContactStatus.REPLIED;

            // Send email to user
            try {
                await this.sendReplyEmail(contact);
            } catch (error) {
                this.logger.error(`Failed to send reply email to ${contact.email}`, error);
            }
        }

        const updatedContact = await this.contactRepository.save(contact);
        this.logger.log(`Contact message updated: ${id} by admin ${adminId}`);

        return updatedContact;
    }

    /**
     * Delete contact message (admin only)
     */
    async delete(id: string): Promise<void> {
        const contact = await this.findOne(id);
        await this.contactRepository.remove(contact);
        this.logger.log(`Contact message deleted: ${id}`);
    }

    /**
     * Get contact statistics
     */
    async getStats(): Promise<{
        total: number;
        new: number;
        read: number;
        replied: number;
        archived: number;
    }> {
        const [total, newCount, read, replied, archived] = await Promise.all([
            this.contactRepository.count(),
            this.contactRepository.count({ where: { status: ContactStatus.NEW } }),
            this.contactRepository.count({ where: { status: ContactStatus.READ } }),
            this.contactRepository.count({ where: { status: ContactStatus.REPLIED } }),
            this.contactRepository.count({ where: { status: ContactStatus.ARCHIVED } }),
        ]);

        return {
            total,
            new: newCount,
            read,
            replied,
            archived,
        };
    }

    /**
     * Send reply email to user
     */
    private async sendReplyEmail(contact: Contact): Promise<void> {
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3003';
        const { subject, html, text } = getContactReplyEmailTemplate({ contact, frontendUrl });

        await this.emailService.sendEmail(contact.email, subject, html, text);
        this.logger.log(`Reply email sent to ${contact.email}`);
    }

    // ==================== TEMPLATE MANAGEMENT ====================

    /**
     * Create a new template
     */
    async createTemplate(data: CreateTemplateDto, adminId: string): Promise<ContactTemplate> {
        const template = this.templateRepository.create({
            ...data,
            created_by: adminId,
        });

        const savedTemplate = await this.templateRepository.save(template);
        this.logger.log(`Template created: ${savedTemplate.id} by admin ${adminId}`);

        return savedTemplate;
    }

    /**
     * Get all templates
     */
    async getAllTemplates(activeOnly: boolean = false): Promise<ContactTemplate[]> {
        const query = this.templateRepository.createQueryBuilder('template');

        if (activeOnly) {
            query.where('template.is_active = :isActive', { isActive: true });
        }

        query.orderBy('template.created_at', 'DESC');

        return query.getMany();
    }

    /**
     * Get a single template by ID
     */
    async getTemplateById(id: string): Promise<ContactTemplate> {
        const template = await this.templateRepository.findOne({
            where: { id },
        });

        if (!template) {
            throw new NotFoundException(`Template with ID ${id} not found`);
        }

        return template;
    }

    /**
     * Update template
     */
    async updateTemplate(id: string, data: UpdateTemplateDto): Promise<ContactTemplate> {
        const template = await this.getTemplateById(id);

        Object.assign(template, data);

        const updatedTemplate = await this.templateRepository.save(template);
        this.logger.log(`Template updated: ${id}`);

        return updatedTemplate;
    }

    /**
     * Delete template
     */
    async deleteTemplate(id: string): Promise<void> {
        const template = await this.getTemplateById(id);
        await this.templateRepository.remove(template);
        this.logger.log(`Template deleted: ${id}`);
    }
}
