import {Module} from '@nestjs/common';
import {RecipeService} from './recipe.service';
import {RecipeController} from './recipe.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Recipe} from "../entity/Recipe.entity";
import {JwtService} from '@nestjs/jwt';
import {Category} from "../entity/Category.entity";
import {Ingredient} from "../entity/Ingredient.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Recipe, Category, Ingredient])], // Spécifie l'entité Recipe
  controllers: [RecipeController],
  providers: [RecipeService, JwtService],
})
export class RecipeModule {}
