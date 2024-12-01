import {Module} from '@nestjs/common';
import {RecipeService} from './recipe.service';
import {RecipeController} from './recipe.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {Recipe} from "../entity/Recipe.entity";
import {JwtService} from '@nestjs/jwt';
import {Category} from "../entity/Category.entity";
import {Ingredient} from "../entity/Ingredient.entity";
import {IngredientService} from "../ingredient/Ingredient.service";
import {User} from "../entity/User.entity";
import {RecipeIngredient} from "../entity/RecipeIngredient.entity";
import {MulterModule} from "@nestjs/platform-express";
import {CalendarEvent} from "../entity/CalendarEvent.entity";
import {CalendarController} from "./CalendarControler";
import {CalendarService} from "./CalendarService";

@Module({
    imports: [TypeOrmModule.forFeature([Recipe, Category, CalendarEvent, Ingredient, User, RecipeIngredient]),
        MulterModule.register({
            dest: './uploads',
            limits: {
                fileSize: 3 * 1024 * 1024 * 1024, // 3 Go en octets
            },
        })], // Spécifie l'entité Recipe
    controllers: [RecipeController, CalendarController],
    providers: [RecipeService, CalendarService, JwtService, IngredientService],
})

export class RecipeModule {
}
