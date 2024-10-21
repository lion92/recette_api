import {Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {JwtService} from '@nestjs/jwt';
import {Recipe} from "../entity/Recipe.entity";
import {Ingredient} from "../entity/Ingredient.entity";
import {Category} from "../entity/Category.entity";

@Injectable()
export class RecipeService {
    constructor(
        @InjectRepository(Recipe)
        private recipesRepository: Repository<Recipe>,
        private recipesCategoryRepository: Repository<Recipe>,
        private recipesIngredientRepository: Repository<Recipe>,
        private jwtService: JwtService
    ) {}

    // Création d'une recette liée à un utilisateur
    async createRecipe(createRecipeDto: Recipe, authorizationHeader: string) {
        console.log(createRecipeDto.ingredients);
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

// Création de l'objet Recipe à partir des données DTO et de l'ID utilisateur
            const newRecipe = this.recipesRepository.create({
                ...createRecipeDto,
                user: userId,
            });

            console.log()

            // Sauvegarde de la nouvelle recette dans la base de données
            return await this.recipesRepository.save(newRecipe);

        } catch (error) {
            // @ts-ignore
            throw new UnauthorizedException('JWT invalide', error.name);
        }
    }


    // Trouver toutes les recettes
    findAll(): Promise<Recipe[]> {
        return this.recipesRepository.find();
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
