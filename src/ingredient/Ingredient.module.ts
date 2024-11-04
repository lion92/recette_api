import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ingredient } from '../entity/Ingredient.entity';
import { User } from '../entity/User.entity';
import { IngredientService } from './Ingredient.service';
import { IngredientController } from './Ingredient.controller';
import { JwtService } from '@nestjs/jwt';

@Module({
    imports: [
        TypeOrmModule.forFeature([Ingredient, User]), // Intègre les entités Ingredient et User avec TypeORM
    ],
    providers: [IngredientService, JwtService], // Fournit IngredientService et JwtService
    controllers: [IngredientController],
})
export class IngredientModule {}
