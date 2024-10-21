import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../entity/Category.entity';
import { CategoryRecipeService } from './CategoryRecipe.service';
import { CategoryRecipeController } from './CategoryRecipe.controller';

@Module({
    imports: [TypeOrmModule.forFeature([Category])], // Intègre l'entité Category avec TypeORM
    providers: [CategoryRecipeService], // Fournit le service de Category
    controllers: [CategoryRecipeController], // Associe le contrôleur pour Category
})
export class CategoryRecipeModule {}
