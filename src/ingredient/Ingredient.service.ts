import {Headers, Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from '../entity/Ingredient.entity';
import {JwtService} from '@nestjs/jwt';
import {User} from "../entity/User.entity";
@Injectable()
export class IngredientService {
    constructor(
        @InjectRepository(Ingredient)
        private ingredientRepository: Repository<Ingredient>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService
    ) {}

    // Retourne tous les ingrédients
    findAll(): Promise<Ingredient[]> {
        return this.ingredientRepository.find();
    }

    // Retourne un ingrédient en fonction de l'ID
    findOne(id: number): Promise<Ingredient | null> {
        return this.ingredientRepository.findOne({ where: { id } });
    }

    // Crée un nouvel ingrédient
    async create(ingredientData: Ingredient, authorizationHeader: string): Promise<Ingredient> {

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

            // Récupérer l'utilisateur à partir de l'ID
            const user = await this.userRepository.findOne({ where: { id: userId } });
            if (!user) {
                throw new UnauthorizedException('Utilisateur non trouvé');
            }

            // Associer l'utilisateur à l'ingrédient
            const ingredient = this.ingredientRepository.create({
                ...ingredientData,
                user: user // Association de l'utilisateur récupéré à l'ingrédient
            });

            // Sauvegarder l'ingrédient dans la base de données
            return await this.ingredientRepository.save(ingredient);

        } catch (error) {
            console.error(error);
            throw new UnauthorizedException('Une erreur est survenue lors de la création de l\'ingrédient');
        }
    }


    // Met à jour un ingrédient
    async update(id: number, updatedIngredient: Partial<Ingredient>): Promise<Ingredient | null> {
        await this.ingredientRepository.update(id, updatedIngredient);
        return this.ingredientRepository.findOne({ where: { id } });
    }

    // Supprime un ingrédient en fonction de l'ID
    async delete(id: number, @Headers('Authorization') authorizationHeader: string): Promise<void> {
        const token = authorizationHeader.replace('Bearer ', ''); // Extraction du token sans le préfixe 'Bearer'
        const decryptToken = await this.jwtService.verifyAsync(token, {secret: "" + process.env.SECRET});
        const userId = decryptToken?.id;

        if (!userId) {
            throw new UnauthorizedException('Utilisateur non valide');
        }

// Recherche de l'ingrédient par son ID
        const ingredient = await this.ingredientRepository.findOne({where: {id}, relations: ['user']});
        console.log(ingredient);
        console.log(id);

        if (!ingredient) {
            throw new NotFoundException(`Ingrédient avec l'ID ${id} non trouvé`);
        }
        console.log(userId);

// S'assurer que l'utilisateur supprime son propre ingrédient
        if (ingredient.user.id !== userId) {
            throw new UnauthorizedException('Accès non autorisé à cet ingrédient');
        }

        return this.ingredientRepository.delete(id).then(() => undefined);
    }
}
