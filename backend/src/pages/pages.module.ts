import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagesController } from './pages.controller';
import { Page } from './entities/page.entity';
import { MenuItem } from './entities/menu-item.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Page, MenuItem])],
    controllers: [PagesController],
    exports: [TypeOrmModule],
})
export class PagesModule { }
