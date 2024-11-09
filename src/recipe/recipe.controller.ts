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
import {RecipeService} from './recipe.service';
import {Recipe} from "../entity/Recipe.entity";
import {IngredientService} from "../ingredient/Ingredient.service";
import {RecipeDTO} from "../interface/RecipeDTO";

@Controller('recipes')
export class RecipeController {
    constructor(private recipeService: RecipeService,
                private readonly ingredientService: IngredientService) {}

    // Route pour la création d'une recette
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

    // Route de filtrage des recettes (doit être placée avant la route paramétrique)
    @Get('/filter')
    async filterRecipes(
        @Query('categories') categories: string,
        @Query('ingredients') ingredients: string
    ): Promise<RecipeDTO[]> {
        console.log("Début du filtrage des recettes");
        try {
            // Initialisation par défaut à des listes vides
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

            // Vérification des paramètres : au moins une liste doit être non vide
            if (categoryIds.length === 0 && ingredientIds.length === 0) {
                throw new BadRequestException('Veuillez fournir au moins un identifiant de catégorie ou d\'ingrédient pour le filtrage.');
            }

            // Appel au service avec les listes fournies
            console.log('Filtrage par catégories et ingrédients');
            return await this.recipeService.getFilteredRecipes(categoryIds, ingredientIds);
        } catch (error) {
            console.error('Erreur lors du filtrage des recettes:', error);
            throw new InternalServerErrorException('Une erreur est survenue lors du filtrage des recettes.');
        }
    }

    // Récupération d'une recette par ID (route paramétrique)
    @Get(':id')
    findOne(@Param('id') id: number) {
        return this.recipeService.findOne(id);
    }

    // Route pour obtenir les calories d'une recette
    @Get(':recipeId')
    async getCalories(@Param('recipeId') recipeId: number): Promise<number> {
        const recipe = await this.recipeService.findOne(recipeId);
        const ingredientIds = recipe.ingredients.map(ingredient => ingredient.id);
        const ingredients = await this.ingredientService.findAllByIds(ingredientIds);
        return this.recipeService.calculateCalories(recipe, ingredients);
    }

    // Mise à jour d'une recette
    @Put(':id')
    updateRecipe(
        @Param('id') id: number,
        @Body() updateData: Recipe,
        @Headers('Authorization') authorizationHeader: string
    ) {
        return this.recipeService.updateRecipe(id, updateData, authorizationHeader);
    }

    // Suppression d'une recette
    @Delete(':id')
    deleteRecipe(@Param('id') id: number, @Headers('Authorization') authorizationHeader: string) {
        return this.recipeService.deleteRecipe(id, authorizationHeader);
    }
}
