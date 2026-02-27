import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    Index,
} from 'typeorm';

export enum MenuLocation {
    HEADER = 'HEADER',
    FOOTER = 'FOOTER',
    SIDEBAR = 'SIDEBAR',
}

@Entity('menu_items')
export class MenuItem {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    label: string;

    @Column()
    url: string;

    @Column({
        type: 'enum',
        enum: MenuLocation,
        default: MenuLocation.FOOTER,
    })
    @Index()
    location: MenuLocation;

    @Column({ nullable: true })
    parent_id: string;

    @Column({ default: 0 })
    order: number;

    @Column({ default: true })
    is_active: boolean;

    @Column({ default: false })
    open_in_new_tab: boolean;

    @Column({ nullable: true })
    icon: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
