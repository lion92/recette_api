import { Module } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { RecipeController } from './recipe.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Recipe} from "../entity/Recipe.entity";


@Module({
  imports: [TypeOrmModule.forFeature([Recipe])], // Spécifie l'entité Recipe
  controllers: [RecipeController],
  providers: [RecipeService],
})
export class RecipeModule {}
