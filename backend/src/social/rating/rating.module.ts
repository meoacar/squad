import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RatingService } from './rating.service';
import { RatingController } from './rating.controller';
import { Rating, RatingReport } from '../entities';
import { User } from '../../users/entities/user.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([Rating, RatingReport, User]),
    ],
    controllers: [RatingController],
    providers: [RatingService],
    exports: [RatingService],
})
export class RatingModule { }
