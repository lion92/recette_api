import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entity/Category.entity';

@Injectable()
export class CategoryRecipeService {
    constructor(
        @InjectRepository(Category)
        private categoryRepository: Repository<Category>,
    ) {}

    // Retourne toutes les catégories
    findAll(): Promise<Category[]> {
        return this.categoryRepository.find();
    }

    // Retourne une catégorie en fonction de l'ID
    findOne(id: number) : Promise<Category | null>{
        return this.categoryRepository.findOne({ where: { id } });
    }

    // Crée une nouvelle catégorie
    create(category: Category): Promise<Category> {
        return this.categoryRepository.save(category);
    }

    // Met à jour une catégorie
    async update(id: number, updatedCategory: Partial<Category>):  Promise<Category | null>{
        await this.categoryRepository.update(id, updatedCategory);
        return this.categoryRepository.findOne({ where: { id } });
    }

    // Supprime une catégorie en fonction de l'ID
    delete(id: number): Promise<void> {
        return this.categoryRepository.delete(id).then(() => undefined);
    }
}
