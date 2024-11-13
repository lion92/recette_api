import {Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {Repository} from 'typeorm';
import {Category} from '../entity/Category.entity';
import {JwtService} from '@nestjs/jwt';
import {User} from "../entity/User.entity";
import * as dotenv from 'dotenv';
dotenv.config();
@Injectable()
export class CategoryRecipeService {
    constructor(
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService
    ) {
    }

    // Retourne toutes les catégories
    findAll(): Promise<Category[]> {
        return this.categoryRepository.find();
    }

    // Retourne une catégorie en fonction de l'ID
    findOne(id: number): Promise<Category | null> {
        return this.categoryRepository.findOne({where: {id}});
    }

    // Crée une nouvelle catégorie
    async create(categoryData: Category, authorizationHeader: string): Promise<Category> {

        if (!authorizationHeader) {
            throw new UnauthorizedException('En-tête Authorization manquant');
        }

        const token = authorizationHeader.replace('Bearer ', ''); // Extraction du token sans le préfixe 'Bearer'

        try {
            // Vérification et déchiffrement du token JWT
            const decryptToken = await this.jwtService.verifyAsync(token, { secret:  process.env.SECRET });

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

            // Associer l'utilisateur à la catégorie
            const category = this.categoryRepository.create({
                ...categoryData,
                user: user // Association de l'utilisateur récupéré à la catégorie
            });

            // Sauvegarder la catégorie dans la base de données
            return await this.categoryRepository.save(category);

        } catch (error) {
            console.error(error);
            throw new UnauthorizedException('Une erreur est survenue lors de la création de la catégorie');
        }
    }


    // Met à jour une catégorie
    async update(id: number, updatedCategory: Partial<Category>): Promise<Category | null> {
        await this.categoryRepository.update(id, updatedCategory);
        return this.categoryRepository.findOne({where: {id}});
    }

    // Supprime une catégorie en fonction de l'ID
    async delete(id: number, authorizationHeader: string) {
        const token = authorizationHeader.replace('Bearer ', ''); // Extraction du token sans le préfixe 'Bearer'
        const decryptToken = await this.jwtService.verifyAsync(token, {secret: process.env.SECRET});
        const userId = decryptToken?.id;

        if (!userId) {
            throw new UnauthorizedException('Utilisateur non valide');
        }

        // Recherche de la catégorie par son ID
        const category = await this.categoryRepository.findOne({where: {id}, relations: ['user']});
        console.log(category);
        console.log(id);

        if (!category) {
            throw new NotFoundException(`Catégorie avec l'ID ${id} non trouvée`);
        }
        console.log(userId);

        // S'assurer que l'utilisateur supprime sa propre catégorie
        if (category.user.id !== userId) {
            throw new UnauthorizedException('Accès non autorisé à cette catégorie');
        }

        // Suppression de la catégorie
        await this.categoryRepository.remove(category);

        return {message: `Catégorie avec l'ID ${id} supprimée avec succès`};
    }

}
