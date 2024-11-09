import {Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {In, Repository} from 'typeorm';
import {JwtService} from '@nestjs/jwt';
import {Recipe} from "../entity/Recipe.entity";
import {Ingredient} from "../entity/Ingredient.entity";
import {Category} from "../entity/Category.entity";
import {User} from "../entity/User.entity";
import * as dotenv from 'dotenv';
import {RecipeDTO} from "../interface/RecipeDTO";

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
        private jwtService: JwtService
    ) {}

    // Création d'une recette liée à un utilisateur
    async createRecipe(createRecipeDto: Recipe, authorizationHeader: string) {
        console.log(createRecipeDto);
        console.log(authorizationHeader);

        // Vérification si le header Authorization est présent
        if (!authorizationHeader) {
            throw new UnauthorizedException('En-tête Authorization manquant');
        }

        const token = authorizationHeader.replace('Bearer ', ''); // Extraction du token sans le préfixe 'Bearer'

        try {
            // Vérification et déchiffrement du token JWT
            const decryptToken = await this.jwtService.verifyAsync(token, { secret: "" + process.env.SECRET });

            if (!decryptToken) {
                throw new UnauthorizedException('Token JWT invalide ou expiré');
            }

            // Récupération de l'ID utilisateur à partir du token
            const userId = decryptToken?.id;
            if (!userId) {
                throw new UnauthorizedException('Utilisateur non valide');
            }

            // Récupérer tous les ingrédients à partir de leurs identifiants
            const ingredients = await this.ingredientRepository.findBy({
                id: In(createRecipeDto.ingredients),
            });

            // Vérifier si tous les ingrédients ont été trouvés
            if (ingredients.length <= 0) {
                throw new Error('Certains ingrédients n\'ont pas été trouvés');
            }

            // Récupérer toutes les catégories à partir de leurs identifiants
            const categories = await this.categoryRepository.findBy({
                id: In(createRecipeDto.categories),
            });

            // Vérifier si toutes les catégories ont été trouvées
            if (categories.length <= 0) {
                throw new Error('Certaines catégories n\'ont pas été trouvées');
            }

            console.log(ingredients);
            console.log(categories);

            // Calcul des calories totales
            let totalCalories = 0;
            ingredients.forEach((ingredient) => {
                totalCalories += ingredient.caloriesPerUnit * (ingredient.defaultQuantity || 1);
            });

            // Créer la nouvelle recette en incluant les ingrédients, les catégories et les calories totales
            const newRecipe = this.recipesRepository.create({
                ...createRecipeDto,
                user: userId, // Associer l'utilisateur à la recette
                ingredients: ingredients, // Associer les ingrédients récupérés
                categories: categories, // Associer les catégories récupérées
                totalCalories: totalCalories, // Inclure les calories totales calculées
            });

            // Sauvegarder la recette dans la base de données
            const savedRecipe = await this.recipesRepository.save(newRecipe);
            console.log(savedRecipe);

            return savedRecipe;

        } catch (error) {
            console.error(error);
            throw new Error('Erreur lors de la création de la recette');
        }
    }



    // Trouver toutes les recettes
    async findAll(): Promise<{
        instructions: string;
        isPublished: boolean;
        description: string;
        ingredients: Ingredient[];
        id: number;
        categories: Category[];
        title: string;
        user: Omit<User, "password">;
        totalCost: number
    }[]> {
        let recipes = await this.recipesRepository.find({
            relations: ['user', 'ingredients', 'categories'], // Charge les relations nécessaires
        });

        return recipes.map(recipe => {
            const { password, ...userWithoutPassword } = recipe.user; // Extraire le champ password et conserver le reste

            return {
                ...recipe,
                user: userWithoutPassword, // Utiliser l'objet user sans le champ password
                totalCost: recipe.ingredients.reduce((total, ingredient) => total + Number(ingredient.price), 0) // Calculer et ajouter le coût total
            };
        });

    }


    // Trouver une recette par ID
    async findOne(id: number): Promise<Recipe> {
        const recipe = await this.recipesRepository.findOne({ where: { id } });

        if (!recipe) {
            throw new NotFoundException(`Recette avec l'ID ${id} non trouvée`);
        }

        return recipe;
    }

    // Mettre à jour une recette
    // Mettre à jour une recette
    async updateRecipe(
        recipeId: number,
        updateData: Partial<Recipe>,
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




    // Supprimer une recette
    async deleteRecipe(id: number, authorizationHeader: string){
        const token = authorizationHeader.replace('Bearer ', ''); // Extraction du token sans le préfixe 'Bearer'
        const decryptToken = await this.jwtService.verifyAsync(token, { secret: ""+process.env.SECRET });
        const userId = decryptToken?.id;

        if (!userId) {
            throw new UnauthorizedException('Utilisateur non valide');
        }

        const recipe = await this.recipesRepository.findBy( {id});
        console.log(recipe)
        console.log(id)

        if (!recipe) {
            throw new NotFoundException(`Recette avec l'ID ${id} non trouvée`);
        }
        console.log(userId)
        // S'assurer que l'utilisateur supprime sa propre recette
        if (recipe[0]?.user?.id !== userId) {
            throw new UnauthorizedException('Accès non autorisé à cette recette');
        }

        return this.recipesRepository.delete(recipe[0].id);
    }

    calculateCalories(recipe: Recipe, ingredients: Ingredient[]): number {
        let totalCalories = 0;

        // Parcourir chaque ingrédient de la recette
        for (const ingredient of recipe.ingredients) {
            const quantity = ingredient.defaultQuantity; // Assurez-vous que chaque `Ingredient` a une propriété `quantity`

            if (quantity) {
                totalCalories += ingredient.caloriesPerUnit * quantity;
            }
        }

        return totalCalories;
    }

    async filterByCategoriesAndIngredients(categoryIds: number[], ingredientIds: number[]): Promise<number[]> {
        const categoryPlaceholders = categoryIds.map(() => '?').join(',');
        const ingredientPlaceholders = ingredientIds.map(() => '?').join(',');

        const rawData = await this.recipesRepository.query(
            `
            SELECT 
                r.id
            FROM recipe r
            JOIN recipe_categories_category rc ON rc.recipeId = r.id
            JOIN recipe_ingredients_ingredient ri ON ri.recipeId = r.id
            WHERE rc.categoryId IN (${categoryPlaceholders})
            AND ri.ingredientId IN (${ingredientPlaceholders})
            GROUP BY r.id
            `,
            [...categoryIds, ...ingredientIds]
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
