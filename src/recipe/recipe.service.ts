import {Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {In, Repository} from 'typeorm';
import {JwtService} from '@nestjs/jwt';
import {Recipe} from "../entity/Recipe.entity";
import {Ingredient} from "../entity/Ingredient.entity";
import {Category} from "../entity/Category.entity";
import {RecipeDTO} from "../interface/RecipeDTO";

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
            const decryptToken = await this.jwtService.verifyAsync(token, { secret: ""+process.env.SECRET });

            if (!decryptToken) {
                throw new UnauthorizedException('Token JWT invalide ou expiré');
            }

            // Récupération de l'ID utilisateur à partir du token
            const userId = decryptToken?.id;
            if (!userId) {
                throw new UnauthorizedException('Utilisateur non valide');
            }

            const ingredients = await this.ingredientRepository.findBy({
                id: In(createRecipeDto.ingredients),
            });

// 2. Vérifier si tous les ingrédients ont été trouvés
            if (ingredients.length <=0) {
                throw new Error('Some ingredients were not found');
            }

// 3. Récupérer toutes les catégories à partir de leurs identifiants
            const categories = await this.categoryRepository.findBy({
                id: In(createRecipeDto.categories),
            });

// 4. Vérifier si toutes les catégories ont été trouvées
            if (categories.length<=0) {
                throw new Error('Some categories were not found');
            }
            console.log(ingredients)
            console.log(categories)
// 5. Créer la nouvelle recette en incluant les ingrédients et les catégories
            const newRecipe = this.recipesRepository.create({
                ...createRecipeDto,
                user: userId, // Associer l'utilisateur à la recette
                ingredients:ingredients,  // Associer les ingrédients récupérés
                categories:categories,   // Associer les catégories récupérées
            });

// 6. Sauvegarder la recette dans la base de données
            let newVar = await this.recipesRepository.save(newRecipe);
            console.log(newVar)

            return newVar;


        } catch (error) {
            // @ts-ignore
            console.log(error);
        }
    }


    // Trouver toutes les recettes
    async findAll(): Promise<RecipeDTO[]> {
        let recipes = await this.recipesRepository.find({
            relations: ['user', 'ingredients', 'categories'], // Charge les relations nécessaires
        });

        // Map sur les recettes pour éliminer le champ password de l'utilisateur
        return recipes.map(recipe => {
            const { password, ...userWithoutPassword } = recipe.user; // Extraire le champ password et conserver le reste
            return {
                ...recipe,
                user: userWithoutPassword, // Utiliser l'objet user sans le champ password
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
    async updateRecipe(id: number, updateData: Recipe, authorizationHeader: string) {
        const token = authorizationHeader.replace('Bearer ', ''); // Extraction du token sans le préfixe 'Bearer'
        const decryptToken = await this.jwtService.verifyAsync(token, { secret:""+ process.env.SECRET });
        const userId = decryptToken?.id;

        if (!userId) {
            throw new UnauthorizedException('Utilisateur non valide');
        }

        const recipe = await this.findOne(id);  // Vérifier si la recette existe

        if (!recipe) {
            throw new NotFoundException(`Recette avec l'ID ${id} non trouvée`);
        }

        // S'assurer que l'utilisateur modifie sa propre recette
        if (recipe.user?.id !== userId) {
            throw new UnauthorizedException('Accès non autorisé à cette recette');
        }

        await this.recipesRepository.update(id, updateData);
        return this.findOne(id); // Retourner la recette mise à jour
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
}
