import { Injectable, UnauthorizedException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from '../entity/Recipe.entity';
import { RecipeData } from "../interface/Recipe";
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class RecipeService {
    constructor(
        @InjectRepository(Recipe)
        private recipesRepository: Repository<Recipe>,
        private jwtService: JwtService
    ) {}

    // Création d'une recette liée à un utilisateur
    async createRecipe(createRecipeDto: RecipeData, authorizationHeader: string) {
        console.log(authorizationHeader)
        // Vérification si le header Authorization est présent
        if (!authorizationHeader) {
            throw new UnauthorizedException('En-tête Authorization manquant');
        }

        const token = authorizationHeader.replace('Bearer ', ''); // Extraction du token sans le préfixe 'Bearer'

        try {
            // Vérification et déchiffrement du token JWT
            const decryptToken = await this.jwtService.verifyAsync(token, { secret: ""+process.env.secret });

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
                user: userId,  // Associer l'utilisateur via l'ID extrait du token
            });

            // Sauvegarde de la nouvelle recette dans la base de données
            return await this.recipesRepository.save(newRecipe);

        } catch (error) {
            // @ts-ignore
            if (error.name === 'JsonWebTokenError') {
                throw new UnauthorizedException('JWT invalide');
            } else { // @ts-ignore
                if (error.name === 'TokenExpiredError') {
                                throw new UnauthorizedException('Le token a expiré');
                            } else {
                                // @ts-ignore
                                throw new InternalServerErrorException('Erreur lors de la création de la recette : ' + error.message);
                            }
            }
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
    async updateRecipe(id: number, updateData: Partial<Recipe>, authorizationHeader: string): Promise<any> {
        const token = authorizationHeader.replace('Bearer ', ''); // Extraction du token sans le préfixe 'Bearer'
        const decryptToken = await this.jwtService.verifyAsync(token, { secret:""+ process.env.secret });
        const userId = decryptToken?.id;

        if (!userId) {
            throw new UnauthorizedException('Utilisateur non valide');
        }

        const recipe = await this.findOne(id);  // Vérifier si la recette existe

        if (!recipe) {
            throw new NotFoundException(`Recette avec l'ID ${id} non trouvée`);
        }

        // S'assurer que l'utilisateur modifie sa propre recette
        if (recipe.user !== userId) {
            throw new UnauthorizedException('Accès non autorisé à cette recette');
        }

        await this.recipesRepository.update(id, updateData);
        return this.findOne(id); // Retourner la recette mise à jour
    }

    // Supprimer une recette
    async deleteRecipe(id: number, authorizationHeader: string): Promise<any> {
        const token = authorizationHeader.replace('Bearer ', ''); // Extraction du token sans le préfixe 'Bearer'
        const decryptToken = await this.jwtService.verifyAsync(token, { secret: ""+process.env.secret });
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
