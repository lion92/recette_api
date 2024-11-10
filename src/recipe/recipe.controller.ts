import {
    BadRequestException,
    Body,
    Controller,
    Delete,
    Get,
    Headers,
    InternalServerErrorException,
    Param,
    Post,
    Put,
    Query
} from '@nestjs/common';
import { RecipeService } from './recipe.service';
import { Recipe } from "../entity/Recipe.entity";
import { IngredientService } from "../ingredient/Ingredient.service";
import { RecipeDTO } from "../interface/RecipeDTO";
import { RecipeResponse } from "../interface/recipeResponseDTO";

@Controller('recipes')
export class RecipeController {
    constructor(
        private readonly recipeService: RecipeService,
        private readonly ingredientService: IngredientService
    ) {}

    // Route pour la création d'une recette
    @Post()
    async createRecipe(@Body() body: RecipeDTO, @Headers('Authorization') authorizationHeader: string) {
        try {
            console.log('Création de la recette:', body);
            return await this.recipeService.createRecipe(body, authorizationHeader);
        } catch (error) {
            console.error('Erreur lors de la création de la recette:', error);
            throw new InternalServerErrorException('Erreur lors de la création de la recette.');
        }
    }

    // Récupération de toutes les recettes
    @Get('/all')
    async findAll(): Promise<RecipeResponse[]> {
        try {
            return await this.recipeService.findAll();
        } catch (error) {
            console.error('Erreur lors de la récupération de toutes les recettes:', error);
            throw new InternalServerErrorException('Erreur lors de la récupération de toutes les recettes.');
        }
    }

    // Route de filtrage des recettes
    @Get('/filter')
    async filterRecipes(
        @Query('categories') categories: string,
        @Query('ingredients') ingredients: string
    ): Promise<Recipe[]> {
        console.log("Début du filtrage des recettes");
        try {
            let categoryIds: number[] = [];
            let ingredientIds: number[] = [];

            if (categories && categories.trim() !== '') {
                categoryIds = categories.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
                console.log('IDs des catégories analysés:', categoryIds);
            }

            if (ingredients && ingredients.trim() !== '') {
                ingredientIds = ingredients.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
                console.log('IDs des ingrédients analysés:', ingredientIds);
            }

            if (categoryIds.length === 0 && ingredientIds.length === 0) {
                throw new BadRequestException('Veuillez fournir au moins un identifiant de catégorie ou d\'ingrédient pour le filtrage.');
            }

            return await this.recipeService.getFilteredRecipes(categoryIds, ingredientIds);
        } catch (error) {
            console.error('Erreur lors du filtrage des recettes:', error);
            throw new InternalServerErrorException('Une erreur est survenue lors du filtrage des recettes.');
        }
    }

    // Récupération d'une recette par ID
    @Get(':id')
    async findOne(@Param('id') id: number): Promise<RecipeResponse> {
        try {
            return await this.recipeService.findOne(id);
        } catch (error) {
            console.error(`Erreur lors de la récupération de la recette avec l'ID ${id}:`, error);
            throw new InternalServerErrorException(`Erreur lors de la récupération de la recette avec l'ID ${id}.`);
        }
    }

    // Route pour obtenir les calories d'une recette
    @Get(':recipeId/calories')
    async getCalories(@Param('recipeId') recipeId: number): Promise<number> {
        try {
            const recipe = await this.recipeService.findOne(recipeId);
            return this.recipeService.calculateCalories(recipe);
        } catch (error) {
            console.error(`Erreur lors du calcul des calories pour la recette avec l'ID ${recipeId}:`, error);
            throw new InternalServerErrorException('Erreur lors du calcul des calories.');
        }
    }

    // Mise à jour d'une recette
    @Put(':id')
    async updateRecipe(
        @Param('id') id: number,
        @Body() updateData: RecipeDTO,
        @Headers('Authorization') authorizationHeader: string
    ): Promise<RecipeResponse> {
        try {
            return await this.recipeService.updateRecipe(id, updateData, authorizationHeader);
        } catch (error) {
            console.error(`Erreur lors de la mise à jour de la recette avec l'ID ${id}:`, error);
            throw new InternalServerErrorException('Erreur lors de la mise à jour de la recette.');
        }
    }

    // Suppression d'une recette
    @Delete(':id')
    async deleteRecipe(@Param('id') id: number, @Headers('Authorization') authorizationHeader: string) {
        try {
            return await this.recipeService.deleteRecipe(id, authorizationHeader);
        } catch (error) {
            console.error(`Erreur lors de la suppression de la recette avec l'ID ${id}:`, error);
            throw new InternalServerErrorException('Erreur lors de la suppression de la recette.');
        }
    }
}
