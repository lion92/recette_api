import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { Recipe } from '../entity/Recipe.entity';
import { Ingredient } from '../entity/Ingredient.entity';
import { Category } from '../entity/Category.entity';
import { User } from '../entity/User.entity';
import { RecipeIngredient } from '../entity/RecipeIngredient.entity';
import * as dotenv from 'dotenv';
import { RecipeDTO } from '../interface/RecipeDTO';
import { RecipeResponse } from '../interface/recipeResponseDTO';

dotenv.config();

@Injectable()
export class RecipeService {
    constructor(
        @InjectRepository(Recipe)
        private recipesRepository: Repository<Recipe>,
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        @InjectRepository(Ingredient)
        private ingredientRepository: Repository<Ingredient>,
        @InjectRepository(RecipeIngredient)
        private recipeIngredientRepository: Repository<RecipeIngredient>,
        private jwtService: JwtService
    ) {}

    // Trouver toutes les recettes
    async findAll(): Promise<RecipeResponse[]> {
        const recipes = await this.recipesRepository.find({
            relations: ['user', 'recipeIngredients', 'recipeIngredients.ingredient', 'categories'],
        });

        return recipes.map(recipe => {
            const { password, ...userWithoutPassword } = recipe.user;

            const totalCost = recipe.recipeIngredients.reduce((total, recipeIngredient) => {
                const quantity = recipeIngredient.quantity;
                return total + (recipeIngredient.ingredient.price * quantity);
            }, 0);

            const ingredientsWithQuantities = recipe.recipeIngredients.map(recipeIngredient => ({
                id: recipeIngredient.ingredient.id,
                name: recipeIngredient.ingredient.name,
                price: recipeIngredient.ingredient.price,
                quantity: recipeIngredient.quantity,
                caloriesPerUnit: recipeIngredient.ingredient.caloriesPerUnit,
                defaultQuantity: recipeIngredient.quantity,
            }));

            return {
                ...recipe,
                user: userWithoutPassword,
                totalCost,
                ingredients: ingredientsWithQuantities,
            };
        });
    }

    // Trouver une recette par ID
    async findOne(id: number): Promise<RecipeResponse> {
        const recipe = await this.recipesRepository.findOne({
            where: { id },
            relations: ['user', 'recipeIngredients', 'recipeIngredients.ingredient', 'categories'],
        });

        if (!recipe) {
            throw new NotFoundException(`Recette avec l'ID ${id} non trouvée`);
        }

        const totalCost = recipe.recipeIngredients.reduce((total, recipeIngredient) => {
            const quantity = recipeIngredient.quantity;
            return total + (recipeIngredient.ingredient.price * quantity);
        }, 0);

        const ingredientsWithQuantities = recipe.recipeIngredients.map(recipeIngredient => ({
            id: recipeIngredient.ingredient.id,
            name: recipeIngredient.ingredient.name,
            price: recipeIngredient.ingredient.price,
            quantity: recipeIngredient.quantity,
            caloriesPerUnit: recipeIngredient.ingredient.caloriesPerUnit,
            defaultQuantity: recipeIngredient.quantity,
        }));

        return {
            ...recipe,
            totalCost,
            ingredients: ingredientsWithQuantities,
        };
    }

    // Création d'une recette
    // Création d'une recette
    async createRecipe(createRecipeDto: RecipeDTO, authorizationHeader: string) {
        if (!authorizationHeader) {
            throw new UnauthorizedException('En-tête Authorization manquant');
        }

        const token = authorizationHeader.replace('Bearer ', '');
        const decryptToken = await this.jwtService.verifyAsync(token, { secret: process.env.SECRET });

        if (!decryptToken) {
            throw new UnauthorizedException('Token JWT invalide ou expiré');
        }

        const userId = decryptToken?.id;
        if (!userId) {
            throw new UnauthorizedException('Utilisateur non valide');
        }

        const ingredientIds = createRecipeDto.ingredients.map((ing) => ing.id);
        const ingredients = await this.ingredientRepository.findBy({ id: In(ingredientIds) });

        if (ingredients.length !== ingredientIds.length) {
            throw new NotFoundException('Certains ingrédients n\'ont pas été trouvés');
        }

        const recipeIngredients: RecipeIngredient[] = createRecipeDto.ingredients.map((ingredientDto) => {
            const ingredient = ingredients.find((ing) => ing.id === ingredientDto.id);
            if (!ingredient) {
                throw new NotFoundException(`Ingrédient avec l'ID ${ingredientDto.id} non trouvé`);
            }

            const recipeIngredient = new RecipeIngredient();
            recipeIngredient.ingredient = ingredient;
            recipeIngredient.quantity = ingredientDto.quantity;

            return recipeIngredient;
        });

        // Calcul du coût total et des calories totales
        let totalCalories = 0;
        let totalCost = 0;
        recipeIngredients.forEach((recipeIngredient) => {
            const quantity = recipeIngredient.quantity;
            totalCalories += recipeIngredient.ingredient.caloriesPerUnit * quantity;
            totalCost += recipeIngredient.ingredient.price * quantity; // Calcul du coût total
        });

        const categories = await this.categoryRepository.findBy({ id: In(createRecipeDto.categories.map(cat => cat.id)) });

        if (categories.length !== createRecipeDto.categories.length) {
            throw new NotFoundException('Certaines catégories n\'ont pas été trouvées');
        }

        const newRecipe = this.recipesRepository.create({
            title: createRecipeDto.title,
            description: createRecipeDto.description,
            instructions: createRecipeDto.instructions,
            isPublished: createRecipeDto.isPublished ?? true,
            user: userId,
            recipeIngredients: recipeIngredients,
            categories: categories,
            totalCalories: totalCalories,
            totalCost: totalCost, // Enregistrement du coût total
        });

        await this.recipesRepository.save(newRecipe);

        return newRecipe;
    }

    // Mettre à jour une recette
    async updateRecipe(
        recipeId: number,
        updateData: Partial<RecipeDTO>,
        authorizationHeader: string
    ): Promise<RecipeResponse> {
        if (!authorizationHeader) {
            throw new UnauthorizedException('En-tête Authorization manquant');
        }

        const token = authorizationHeader.replace('Bearer ', '');
        const decryptToken = await this.jwtService.verifyAsync(token, { secret: process.env.SECRET });
        const userId = decryptToken?.id;

        if (!userId) {
            throw new UnauthorizedException('Utilisateur non valide');
        }

        const existingRecipe = await this.recipesRepository.findOne({
            where: { id: recipeId },
            relations: ['user', 'recipeIngredients', 'recipeIngredients.ingredient', 'categories'],
        });

        if (!existingRecipe) {
            throw new NotFoundException(`Recette avec l'ID ${recipeId} non trouvée`);
        }

        if (existingRecipe.user?.id !== userId) {
            throw new UnauthorizedException('Accès non autorisé à cette recette');
        }

        // Mise à jour des propriétés de la recette
        if (updateData.title) existingRecipe.title = updateData.title;
        if (updateData.description) existingRecipe.description = updateData.description;
        if (updateData.instructions) existingRecipe.instructions = updateData.instructions;
        if (updateData.isPublished !== undefined) existingRecipe.isPublished = updateData.isPublished;

        // Mise à jour des ingrédients et de leurs quantités
        if (updateData.ingredients && updateData.ingredients.length > 0) {
            const ingredientIds = updateData.ingredients.map((ingredient) => ingredient.id);
            const ingredients = await this.ingredientRepository.findBy({
                id: In(ingredientIds),
            });

            if (ingredients.length !== ingredientIds.length) {
                throw new NotFoundException('Certains ingrédients n\'ont pas été trouvés');
            }

            const updatedRecipeIngredients = updateData.ingredients.map((ingredientDto) => {
                const ingredient = ingredients.find((ing) => ing.id === ingredientDto.id);
                if (!ingredient) {
                    throw new NotFoundException(`Ingrédient avec l'ID ${ingredientDto.id} non trouvé`);
                }

                const recipeIngredient = new RecipeIngredient();
                recipeIngredient.ingredient = ingredient;
                recipeIngredient.quantity = ingredientDto.quantity;

                return recipeIngredient;
            });

            existingRecipe.recipeIngredients = updatedRecipeIngredients;
        }

        // Mise à jour des catégories
        if (updateData.categories && updateData.categories.length > 0) {
            const categoryIds = updateData.categories.map((category) => category.id);
            const categories = await this.categoryRepository.findBy({
                id: In(categoryIds),
            });

            if (categories.length !== categoryIds.length) {
                throw new NotFoundException('Certaines catégories n\'ont pas été trouvées');
            }

            existingRecipe.categories = categories;
        }

        // Recalcul des calories et du coût total
        let totalCalories = 0;
        let totalPrice = 0;
        existingRecipe.recipeIngredients.forEach((recipeIngredient) => {
            const quantity = recipeIngredient.quantity;
            totalCalories += recipeIngredient.ingredient.caloriesPerUnit * quantity;
            totalPrice += recipeIngredient.ingredient.price * quantity;
        });
        existingRecipe.totalCalories = totalCalories;
        existingRecipe.totalCost = totalPrice;

        await this.recipesRepository.save(existingRecipe);

        const updatedRecipe = await this.recipesRepository.findOne({
            where: { id: recipeId },
            relations: ['user', 'recipeIngredients', 'recipeIngredients.ingredient', 'categories'],
        });

        if (!updatedRecipe) {
            throw new NotFoundException(`Recette avec l'ID ${recipeId} non trouvée après la mise à jour`);
        }

        const ingredientsWithQuantities = updatedRecipe.recipeIngredients.map(recipeIngredient => ({
            id: recipeIngredient.ingredient.id,
            name: recipeIngredient.ingredient.name,
            price: recipeIngredient.ingredient.price,
            quantity: recipeIngredient.quantity,
            caloriesPerUnit: recipeIngredient.ingredient.caloriesPerUnit,
            defaultQuantity: recipeIngredient.quantity,
        }));

        return {
            ...updatedRecipe,
            ingredients: ingredientsWithQuantities,
        };
    }

    calculateCalories(recipe: RecipeResponse): number {
        return recipe.ingredients.reduce((total, ingredient) => {
            const quantity = ingredient.quantity || 1; // Utilise la quantité de RecipeIngredient
            return total + (ingredient.caloriesPerUnit * quantity);
        }, 0);
    }

    // Supprimer une recette
    async deleteRecipe(id: number, authorizationHeader: string) {
        if (!authorizationHeader) {
            throw new UnauthorizedException('En-tête Authorization manquant');
        }

        const token = authorizationHeader.replace('Bearer ', '');
        const decryptToken = await this.jwtService.verifyAsync(token, { secret: process.env.SECRET });
        const userId = decryptToken?.id;

        if (!userId) {
            throw new UnauthorizedException('Utilisateur non valide');
        }

        const recipe = await this.recipesRepository.findOne({ where: { id }, relations: ['user'] });

        if (!recipe) {
            throw new NotFoundException(`Recette avec l'ID ${id} non trouvée`);
        }

        if (recipe.user?.id !== userId) {
            throw new UnauthorizedException('Accès non autorisé à cette recette');
        }

        return this.recipesRepository.delete(id);
    }
    // Filtrer les recettes par catégories et ingrédients
    async filterByCategoriesAndIngredients(categoryIds: number[], ingredientIds: number[]): Promise<number[]> {
        if (!categoryIds.length && !ingredientIds.length) {
            return [];
        }

        const categoryPlaceholders = categoryIds.map(() => '?').join(',');
        const ingredientPlaceholders = ingredientIds.map(() => '?').join(',');

        const rawData = await this.recipesRepository.query(
            `
        SELECT 
            r.id
        FROM recipe r
        JOIN recipe_categories_category rc ON rc.recipeId = r.id
        JOIN recipe_ingredient ri ON ri.recipeId = r.id
        WHERE 
            (${categoryIds.length ? `rc.categoryId IN (${categoryPlaceholders})` : '1=1'})
            AND
            (${ingredientIds.length ? `ri.ingredientId IN (${ingredientPlaceholders})` : '1=1'})
        GROUP BY r.id
        HAVING COUNT(DISTINCT rc.categoryId) >= ?
        AND COUNT(DISTINCT ri.ingredientId) >= ?
        `,
            [...categoryIds, ...ingredientIds, categoryIds.length, ingredientIds.length]
        );

        return rawData.map((recipe: any) => recipe.id);
    }

    // Méthode pour récupérer les recettes complètes à partir de leurs IDs
    async getRecipesByIds(recipeIds: number[]): Promise<Recipe[]> {
        if (recipeIds.length === 0) {
            return [];
        }

        const recipes = await this.recipesRepository.find({
            where: { id: In(recipeIds) },
            relations: ['user', 'ingredients', 'categories'], // Charger les relations nécessaires
        });

        // Calculer le totalCost pour chaque recette
        return recipes.map(recipe => {
            const totalCost = recipe.ingredients.reduce((total, ingredient) => {
                const ingredientPrice = ingredient.price || 0; // Assurer que le prix est défini
                const quantity = ingredient.defaultQuantity || 1; // Utiliser la quantité par défaut si elle est définie
                return total + (ingredientPrice * quantity);
            }, 0);

            return {
                ...recipe,
                totalCost, // Ajouter le coût total calculé à la recette
            };
        });
    }

    // Méthode complète pour récupérer les recettes filtrées avec détails
    async getFilteredRecipes(categoryIds: number[], ingredientIds: number[]): Promise<Recipe[]> {
        const recipeIds = await this.filterByCategoriesAndIngredients(categoryIds, ingredientIds);
        return this.getRecipesByIds(recipeIds);
    }


}
