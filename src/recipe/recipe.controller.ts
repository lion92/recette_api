import {Body, Controller, Delete, Get, Headers, Param, Post, Put} from '@nestjs/common';
import {RecipeService} from './recipe.service';
import {Recipe} from "../entity/Recipe.entity";
import {IngredientService} from "../ingredient/Ingredient.service";

@Controller('recipes')
export class RecipeController {
    constructor(private recipeService: RecipeService,
    private readonly ingredientService: IngredientService) {}

    // Création d'une recette, en passant le JWT depuis l'en-tête
    @Post()
    createRecipe(@Body() body: Recipe, @Headers('Authorization') authorizationHeader: string) {
        console.log(body);
        return this.recipeService.createRecipe(body, authorizationHeader);
    }

    // Récupération de toutes les recettes
    @Get('/all')
    findAll() {
        return this.recipeService.findAll();
    }

    // Récupération d'une recette par ID
    @Get(':id')
    findOne(@Param('id') id: number) {
        return this.recipeService.findOne(id);
    }

    // Mise à jour d'une recette, en passant le JWT depuis l'en-tête
    @Put(':id')
    updateRecipe(
        @Param('id') id: number,
        @Body() updateData: Recipe,
        @Headers('Authorization') authorizationHeader: string
    ) {
        return this.recipeService.updateRecipe(id, updateData, authorizationHeader);
    }

    // Suppression d'une recette, en passant le JWT depuis l'en-tête
    @Delete(':id')
    deleteRecipe(@Param('id') id: number, @Headers('Authorization') authorizationHeader: string) {
        return this.recipeService.deleteRecipe(id, authorizationHeader);
    }

    @Get(':recipeId')
    async getCalories(@Param('recipeId') recipeId: number): Promise<number> {
        // Récupérer la recette par son ID
        const recipe = await this.recipeService.findOne(recipeId);

        // Extraire les identifiants des ingrédients
        const ingredientIds = recipe.ingredients.map(ingredient => ingredient.id);

        // Récupérer les ingrédients en utilisant les identifiants extraits
        const ingredients = await this.ingredientService.findAllByIds(ingredientIds);

        // Calculer les calories
        return this.recipeService.calculateCalories(recipe, ingredients);
    }

}
