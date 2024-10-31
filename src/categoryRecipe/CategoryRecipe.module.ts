import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../entity/Category.entity';
import { CategoryRecipeService } from './CategoryRecipe.service';
import { CategoryRecipeController } from './CategoryRecipe.controller';
import {JwtService} from '@nestjs/jwt';
import {User} from "../entity/User.entity";
@Module({
    imports: [TypeOrmModule.forFeature([Category, User])], // Intègre l'entité Category avec TypeORM
    providers: [CategoryRecipeService, JwtService], // Fournit le service de Category
    controllers: [CategoryRecipeController], // Associe le contrôleur pour Category
})
export class CategoryRecipeModule {}
