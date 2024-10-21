import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Ingredient } from '../entity/Ingredient.entity';

@Injectable()
export class IngredientService {
    constructor(
        @InjectRepository(Ingredient)
        private ingredientRepository: Repository<Ingredient>,
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
    create(ingredient: Ingredient): Promise<Ingredient> {
        return this.ingredientRepository.save(ingredient);
    }

    // Met à jour un ingrédient
    async update(id: number, updatedIngredient: Partial<Ingredient>): Promise<Ingredient | null> {
        await this.ingredientRepository.update(id, updatedIngredient);
        return this.ingredientRepository.findOne({ where: { id } });
    }

    // Supprime un ingrédient en fonction de l'ID
    delete(id: number): Promise<void> {
        return this.ingredientRepository.delete(id).then(() => undefined);
    }
}
