import { IsNotEmpty, IsBoolean, IsArray, IsString, IsOptional } from 'class-validator';
import {Ingredient} from "../entity/Ingredient.entity";
import {Category} from "../entity/Category.entity";

export class CreateRecipeDto {
    @IsNotEmpty()
    @IsString()
    title!: string;

    @IsNotEmpty()
    @IsString()
    description!: string;

    @IsNotEmpty()
    @IsString()
    instructions!: string;

    @IsOptional()
    @IsBoolean()
    isPublished?: boolean;

    @IsNotEmpty()
    @IsArray()
    ingredients!: Ingredient[]; // Liste des identifiants des ingrédients

    @IsNotEmpty()
    @IsArray()
    categories!: Category[]; // Liste des identifiants des catégories
}
