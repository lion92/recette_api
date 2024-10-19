import {Injectable, UnauthorizedException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from '../entity/Recipe.entity';
import {RecipeData} from "../interface/Recipe";
import { JwtService } from '@nestjs/jwt';
@Injectable()
export class RecipeService {
    constructor(
        @InjectRepository(Recipe)
        private recipesRepository: Repository<Recipe>,
        private jwtService:JwtService
    ) {}

// Création d'une recette liée à un utilisateur
    async createRecipe(createRecipeDto: RecipeData) {
        console.log(createRecipeDto);

        if (!createRecipeDto.jwt) {
            throw new UnauthorizedException('Token JWT manquant');
        }

        try {
            // Vérification et déchiffrement du token JWT
            const decryptToken = await this.jwtService.verifyAsync(createRecipeDto.jwt, { secret: ""+process.env.secret });

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
            const savedRecipe = await this.recipesRepository.save(newRecipe);

            return savedRecipe;

        } catch (error) {
            // Gérer les erreurs JWT ou autres erreurs
            throw new UnauthorizedException('Erreur lors de la création de la recette : ' + error);
        }
    }

    findAll(): Promise<Recipe[]> {
        return this.recipesRepository.find();
    }

    findOne(id: number): Promise<Recipe> {
        // @ts-ignore
        return this.recipesRepository.findOneBy({ id });
    }

    updateRecipe(id: number, updateData: Partial<Recipe>): Promise<any> {
        return this.recipesRepository.update(id, updateData);
    }

    deleteRecipe(id: number): Promise<any> {
        return this.recipesRepository.delete(id);
    }
}
