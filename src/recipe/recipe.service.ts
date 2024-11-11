import {Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {In, Repository} from 'typeorm';
import {JwtService} from '@nestjs/jwt';
import {Recipe} from '../entity/Recipe.entity';
import {Ingredient} from '../entity/Ingredient.entity';
import {Category} from '../entity/Category.entity';
import {RecipeIngredient} from '../entity/RecipeIngredient.entity';
import * as dotenv from 'dotenv';
import {RecipeDTO} from '../interface/RecipeDTO';
import {RecipeResponse} from '../interface/recipeResponseDTO';

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
    ) {
    }

    // Trouver toutes les recettes
    async findAll(): Promise<RecipeResponse[]> {
        const recipes = await this.recipesRepository.find({
            relations: ['user', 'recipeIngredients', 'recipeIngredients.ingredient', 'categories'],
        });

        return recipes.map(recipe => {
            const {password, ...userWithoutPassword} = recipe.user;

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
            where: {id},
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

        // Validation des ingrédients
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
            totalCost += recipeIngredient.ingredient.price * quantity;
        });

        const categories = await this.categoryRepository.findBy({ id: In(createRecipeDto.categories.map(cat => cat.id)) });

        if (categories.length !== createRecipeDto.categories.length) {
            throw new NotFoundException('Certaines catégories n\'ont pas été trouvées');
        }

        // Ajoutez l'image au moment de la création de la recette
        const newRecipe = this.recipesRepository.create({
            title: createRecipeDto.title,
            description: createRecipeDto.description,
            instructions: createRecipeDto.instructions,
            isPublished: createRecipeDto.isPublished ?? true,
            user: userId,
            recipeIngredients: recipeIngredients,
            categories: categories,
            totalCalories: totalCalories,
            totalCost: totalCost,
            imagePath: createRecipeDto.imagePath, // Image enregistrée lors du téléchargement
        });

        await this.recipesRepository.save(newRecipe);

        return newRecipe;
    }

    // Mettre à jour une recette
    async updateRecipe(
        recipeId: number,
        updateData: RecipeDTO,
        authorizationHeader: string
    ): Promise<Recipe> {
        if (!authorizationHeader) {
            console.log('En-tête Authorization manquant');
            throw new UnauthorizedException('En-tête Authorization manquant');
        }

        const token = authorizationHeader.replace('Bearer ', '');
        console.log('Token extrait :', token);

        try {
            const decryptToken = await this.jwtService.verifyAsync(token, { secret: "" + process.env.SECRET });
            const userId = decryptToken?.id;
            console.log('ID utilisateur extrait du token :', userId);

            if (!userId) {
                console.log('Utilisateur non valide');
                throw new UnauthorizedException('Utilisateur non valide');
            }

            // Rechercher la recette par ID avec ses relations
            const existingRecipe = await this.recipesRepository.findOne({
                where: { id: recipeId },
                relations: ['user', 'ingredients', 'categories'],
            });
            console.log('Recette existante récupérée :', existingRecipe);

            // Vérification que la recette existe
            if (!existingRecipe) {
                console.log(`Recette avec l'ID ${recipeId} non trouvée`);
                throw new NotFoundException(`Recette avec l'ID ${recipeId} non trouvée`);
            }

            // S'assurer que l'utilisateur modifie sa propre recette
            if (existingRecipe.user?.id !== userId) {
                console.log('Accès non autorisé : utilisateur différent');
                throw new UnauthorizedException('Accès non autorisé à cette recette');
            }

            // Mettre à jour les propriétés simples de la recette
            console.log('Mise à jour des données de la recette avec :', updateData);
            Object.assign(existingRecipe, updateData);

            // Si des ingrédients sont fournis, les récupérer par leurs IDs
            if (updateData.ingredients && updateData.ingredients.length > 0) {
                console.log('Récupération des ingrédients avec les IDs :', updateData.ingredients.map(ing => ing.id));
                const ingredients = await this.ingredientRepository.findBy({
                    id: In(updateData.ingredients.map((ingredient) => ingredient.id)),
                });

                if (ingredients.length !== updateData.ingredients.length) {
                    console.log('Certains ingrédients n\'ont pas été trouvés');
                    throw new NotFoundException('Certains ingrédients n\'ont pas été trouvés');
                }
                existingRecipe.ingredients = ingredients;
                console.log('Ingrédients mis à jour :', ingredients);
            }

            // Si des catégories sont fournies, les récupérer par leurs IDs
            if (updateData.categories && updateData.categories.length > 0) {
                console.log('Récupération des catégories avec les IDs :', updateData.categories.map(cat => cat.id));
                const categories = await this.categoryRepository.findBy({
                    id: In(updateData.categories.map((category) => category.id)),
                });

                if (categories.length !== updateData.categories.length) {
                    console.log('Certaines catégories n\'ont pas été trouvées');
                    throw new NotFoundException('Certaines catégories n\'ont pas été trouvées');
                }
                existingRecipe.categories = categories;
                console.log('Catégories mises à jour :', categories);
            }

            // Recalcul des calories et du prix total
            let totalCalories = 0;
            let totalPrice = 0;
            existingRecipe.ingredients.forEach((ingredient) => {
                const quantity = ingredient.defaultQuantity || 1;
                totalCalories += ingredient.caloriesPerUnit * quantity;
                totalPrice += ingredient.price * quantity;
            });
            existingRecipe.totalCalories = totalCalories; // Mettre à jour le total des calories
            existingRecipe.totalCost = totalPrice; // Mettre à jour le prix total
            console.log('Calories totales recalculées :', totalCalories);
            console.log('Prix total recalculé :', totalPrice);

            // Sauvegarder la recette mise à jour
            console.log('Sauvegarde de la recette mise à jour');
            await this.recipesRepository.save(existingRecipe);

            // Retourner la recette mise à jour
            const updatedRecipe = await this.recipesRepository.findOne({
                where: { id: recipeId },
                relations: ['user', 'ingredients', 'categories'],
            });

            // Vérification que la recette mise à jour existe
            if (!updatedRecipe) {
                console.log(`Recette avec l'ID ${recipeId} non trouvée après la mise à jour`);
                throw new NotFoundException(`Recette avec l'ID ${recipeId} non trouvée après la mise à jour`);
            }

            console.log('Recette mise à jour avec succès :', updatedRecipe);
            return updatedRecipe;
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la recette :', error);
            throw error;
        }
    }

    // Calcul des calories pour une recette
    calculateCalories(recipe: RecipeResponse): number {
        return recipe.ingredients.reduce((total, ingredient) => {
            const quantity = ingredient.quantity || 1;
            return total + (ingredient.caloriesPerUnit * quantity);
        }, 0);
    }

    // Supprimer une recette
    async deleteRecipe(id: number, authorizationHeader: string) {
        if (!authorizationHeader) {
            throw new UnauthorizedException('En-tête Authorization manquant');
        }

        const token = authorizationHeader.replace('Bearer ', '');
        const decryptToken = await this.jwtService.verifyAsync(token, {secret: process.env.SECRET});
        const userId = decryptToken?.id;

        if (!userId) {
            throw new UnauthorizedException('Utilisateur non valide');
        }

        const recipe = await this.recipesRepository.findOne({where: {id}, relations: ['user']});

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
                SELECT r.id
                FROM recipe r
                         JOIN recipe_categories_category rc ON rc.recipeId = r.id
                         JOIN recipe_ingredient ri ON ri.recipeId = r.id
                WHERE (${categoryIds.length ? `rc.categoryId IN (${categoryPlaceholders})` : '1=1'})
                  AND (${ingredientIds.length ? `ri.ingredientId IN (${ingredientPlaceholders})` : '1=1'})
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
            where: {id: In(recipeIds)},
            relations: ['user', 'recipeIngredients', 'recipeIngredients.ingredient', 'categories'],
        });

        return recipes.map(recipe => {
            const totalCost = recipe.recipeIngredients.reduce((total, recipeIngredient) => {
                const quantity = recipeIngredient.quantity;
                return total + (recipeIngredient.ingredient.price * quantity);
            }, 0);

            return {
                ...recipe,
                totalCost,
            };
        });
    }

    // Méthode complète pour récupérer les recettes filtrées avec détails
    async getFilteredRecipes(categoryIds: number[], ingredientIds: number[]): Promise<Recipe[]> {
        const recipeIds = await this.filterByCategoriesAndIngredients(categoryIds, ingredientIds);
        return this.getRecipesByIds(recipeIds);
    }
}
