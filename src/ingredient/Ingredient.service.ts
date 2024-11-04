import {Headers, Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {InjectRepository} from '@nestjs/typeorm';
import {In, Repository} from 'typeorm';
import {Ingredient} from '../entity/Ingredient.entity';
import {JwtService} from '@nestjs/jwt';
import {User} from "../entity/User.entity";
import * as dotenv from 'dotenv';
dotenv.config();
@Injectable()
export class IngredientService {
    constructor(
        @InjectRepository(Ingredient)
        private ingredientRepository: Repository<Ingredient>,
        @InjectRepository(User)
        private userRepository: Repository<User>,
        private jwtService: JwtService
    ) {
    }

    // Retourne tous les ingrédients
    findAll(): Promise<Ingredient[]> {
        return this.ingredientRepository.find();
    }

    // Retourne un ingrédient en fonction de l'ID
    findOne(id: number): Promise<Ingredient | null> {
        return this.ingredientRepository.findOne({where: {id}});
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

            // Vérifier que le champ `price` est défini et attribuer une valeur par défaut si nécessaire
            if (ingredientData.price === undefined || ingredientData.price === null) {
                ingredientData.price = 0; // Définir une valeur par défaut de 0 pour `price`
            }

            // Associer l'utilisateur à l'ingrédient
            const ingredient = this.ingredientRepository.create({
                ...ingredientData,
                user: user, // Association de l'utilisateur récupéré à l'ingrédient
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
        return this.ingredientRepository.findOne({where: {id}});
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

    async findAllByIds(ids: number[]): Promise<Ingredient[]> {
        return this.ingredientRepository.find({
            where: {
                id: In(ids),
            },
        });
    }

    async seedDefaultIngredients() {
        const defaultIngredients = [
            {name: "Tomate", caloriesPerUnit: 18, unit: "grammes", defaultQuantity: 100},
            {name: "Pomme de terre", caloriesPerUnit: 77, unit: "grammes", defaultQuantity: 100},
            {name: "Carotte", caloriesPerUnit: 41, unit: "grammes", defaultQuantity: 100},
            {name: "Brocoli", caloriesPerUnit: 34, unit: "grammes", defaultQuantity: 100},
            {name: "Épinards", caloriesPerUnit: 23, unit: "grammes", defaultQuantity: 100},
            {name: "Poivron", caloriesPerUnit: 20, unit: "grammes", defaultQuantity: 100},
            {name: "Courgette", caloriesPerUnit: 17, unit: "grammes", defaultQuantity: 100},
            {name: "Aubergine", caloriesPerUnit: 25, unit: "grammes", defaultQuantity: 100},
            {name: "Concombre", caloriesPerUnit: 16, unit: "grammes", defaultQuantity: 100},
            {name: "Chou-fleur", caloriesPerUnit: 25, unit: "grammes", defaultQuantity: 100},
            {name: "Haricot vert", caloriesPerUnit: 31, unit: "grammes", defaultQuantity: 100},
            {name: "Oignon", caloriesPerUnit: 40, unit: "grammes", defaultQuantity: 100},
            {name: "Betterave", caloriesPerUnit: 43, unit: "grammes", defaultQuantity: 100},
            {name: "Radis", caloriesPerUnit: 16, unit: "grammes", defaultQuantity: 100},
            {name: "Fenouil", caloriesPerUnit: 31, unit: "grammes", defaultQuantity: 100},
            {name: "Chou", caloriesPerUnit: 25, unit: "grammes", defaultQuantity: 100},
            {name: "Petit pois", caloriesPerUnit: 81, unit: "grammes", defaultQuantity: 100},
            {name: "Céleri", caloriesPerUnit: 16, unit: "grammes", defaultQuantity: 100},
            {name: "Asperge", caloriesPerUnit: 20, unit: "grammes", defaultQuantity: 100},
            {name: "Poireau", caloriesPerUnit: 29, unit: "grammes", defaultQuantity: 100},
            {name: "Pomme", caloriesPerUnit: 52, unit: "grammes", defaultQuantity: 100},
            {name: "Banane", caloriesPerUnit: 89, unit: "grammes", defaultQuantity: 100},
            {name: "Fraise", caloriesPerUnit: 32, unit: "grammes", defaultQuantity: 100},
            {name: "Orange", caloriesPerUnit: 47, unit: "grammes", defaultQuantity: 100},
            {name: "Raisin", caloriesPerUnit: 69, unit: "grammes", defaultQuantity: 100},
            {name: "Cerise", caloriesPerUnit: 50, unit: "grammes", defaultQuantity: 100},
            {name: "Pêche", caloriesPerUnit: 39, unit: "grammes", defaultQuantity: 100},
            {name: "Abricot", caloriesPerUnit: 48, unit: "grammes", defaultQuantity: 100},
            {name: "Poire", caloriesPerUnit: 57, unit: "grammes", defaultQuantity: 100},
            {name: "Ananas", caloriesPerUnit: 50, unit: "grammes", defaultQuantity: 100},
            {name: "Mangue", caloriesPerUnit: 60, unit: "grammes", defaultQuantity: 100},
            {name: "Melon", caloriesPerUnit: 33, unit: "grammes", defaultQuantity: 100},
            {name: "Pastèque", caloriesPerUnit: 30, unit: "grammes", defaultQuantity: 100},
            {name: "Framboise", caloriesPerUnit: 52, unit: "grammes", defaultQuantity: 100},
            {name: "Myrtille", caloriesPerUnit: 57, unit: "grammes", defaultQuantity: 100},
            {name: "Kiwi", caloriesPerUnit: 61, unit: "grammes", defaultQuantity: 100},
            {name: "Citron", caloriesPerUnit: 29, unit: "grammes", defaultQuantity: 100},
            {name: "Litchi", caloriesPerUnit: 66, unit: "grammes", defaultQuantity: 100},
            {name: "Pamplemousse", caloriesPerUnit: 42, unit: "grammes", defaultQuantity: 100},
            {name: "Papaye", caloriesPerUnit: 43, unit: "grammes", defaultQuantity: 100},
            {name: "Blanc de poulet", caloriesPerUnit: 165, unit: "grammes", defaultQuantity: 100},
            {name: "Steak de bœuf", caloriesPerUnit: 271, unit: "grammes", defaultQuantity: 100},
            {name: "Jambon", caloriesPerUnit: 145, unit: "grammes", defaultQuantity: 100},
            {name: "Porc", caloriesPerUnit: 242, unit: "grammes", defaultQuantity: 100},
            {name: "Agneau", caloriesPerUnit: 294, unit: "grammes", defaultQuantity: 100},
            {name: "Saumon", caloriesPerUnit: 208, unit: "grammes", defaultQuantity: 100},
            {name: "Thon", caloriesPerUnit: 144, unit: "grammes", defaultQuantity: 100},
            {name: "Truite", caloriesPerUnit: 190, unit: "grammes", defaultQuantity: 100},
            {name: "Crevette", caloriesPerUnit: 99, unit: "grammes", defaultQuantity: 100},
            {name: "Homard", caloriesPerUnit: 89, unit: "grammes", defaultQuantity: 100},
            {name: "Canard", caloriesPerUnit: 337, unit: "grammes", defaultQuantity: 100},
            {name: "Dinde", caloriesPerUnit: 135, unit: "grammes", defaultQuantity: 100},
            {name: "Lapin", caloriesPerUnit: 173, unit: "grammes", defaultQuantity: 100},
            {name: "Moules", caloriesPerUnit: 86, unit: "grammes", defaultQuantity: 100},
            {name: "Sardine", caloriesPerUnit: 208, unit: "grammes", defaultQuantity: 100},
            {name: "Haddock", caloriesPerUnit: 90, unit: "grammes", defaultQuantity: 100},
            {name: "Anchois", caloriesPerUnit: 131, unit: "grammes", defaultQuantity: 100},
            {name: "Saint-Jacques", caloriesPerUnit: 79, unit: "grammes", defaultQuantity: 100},
            {name: "Calamar", caloriesPerUnit: 92, unit: "grammes", defaultQuantity: 100},
            {name: "Anguille", caloriesPerUnit: 184, unit: "grammes", defaultQuantity: 100},
            {name: "Lait", caloriesPerUnit: 42, unit: "grammes", defaultQuantity: 100},
            {name: "Yaourt", caloriesPerUnit: 59, unit: "grammes", defaultQuantity: 100},
            {name: "Fromage cheddar", caloriesPerUnit: 402, unit: "grammes", defaultQuantity: 100},
            {name: "Beurre", caloriesPerUnit: 717, unit: "grammes", defaultQuantity: 100},
            {name: "Crème fraîche", caloriesPerUnit: 292, unit: "grammes", defaultQuantity: 100},
            {name: "Fromage de chèvre", caloriesPerUnit: 364, unit: "grammes", defaultQuantity: 100},
            {name: "Fromage blanc", caloriesPerUnit: 97, unit: "grammes", defaultQuantity: 100},
            {name: "Parmesan", caloriesPerUnit: 431, unit: "grammes", defaultQuantity: 100},
            {name: "Mozzarella", caloriesPerUnit: 280, unit: "grammes", defaultQuantity: 100},
            {name: "Ricotta", caloriesPerUnit: 174, unit: "grammes", defaultQuantity: 100},
            {name: "Fromage bleu", caloriesPerUnit: 353, unit: "grammes", defaultQuantity: 100},
            {name: "Crème glacée", caloriesPerUnit: 207, unit: "grammes", defaultQuantity: 100},
            {name: "Petit-suisse", caloriesPerUnit: 69, unit: "grammes", defaultQuantity: 100},
            {name: "Fromage fondu", caloriesPerUnit: 271, unit: "grammes", defaultQuantity: 100},
            {name: "Kefir", caloriesPerUnit: 41, unit: "grammes", defaultQuantity: 100},
            {name: "Mascarpone", caloriesPerUnit: 435, unit: "grammes", defaultQuantity: 100},
            {name: "Faisselle", caloriesPerUnit: 52, unit: "grammes", defaultQuantity: 100},
            {name: "Feta", caloriesPerUnit: 264, unit: "grammes", defaultQuantity: 100},
            {name: "Fromage râpé", caloriesPerUnit: 389, unit: "grammes", defaultQuantity: 100},
            {name: "Lait concentré", caloriesPerUnit: 321, unit: "grammes", defaultQuantity: 100}

        ];
        for (const ingredient of defaultIngredients) {
            // Utilisez `ingredient.name` directement pour la recherche
            const existingIngredient = await this.ingredientRepository.findOne({
                where: {name: ingredient.name},
            });

            if (!existingIngredient) {
                await this.ingredientRepository.save(ingredient);
            }
        }
    }
}