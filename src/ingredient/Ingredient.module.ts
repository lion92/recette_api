import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from '../entity/Ingredient.entity';
import { IngredientService } from './ingredient.service';
import { IngredientController } from './ingredient.controller';
import {JwtService} from '@nestjs/jwt';
@Module({
    imports: [TypeOrmModule.forFeature([Ingredient])], // Intègre l'entité Ingredient avec TypeORM
    providers: [IngredientService, JwtService], // Fournit le service d'Ingredient
    controllers: [IngredientController], // Associe le contrôleur pour Ingredient
})
export class IngredientModule {}
