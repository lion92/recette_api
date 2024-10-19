import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Recipe } from '../entity/Recipe.entity';
import {User} from "../entity/User.entity";
import {RecipeDTO} from "../interface/RecipeDTO";

@Injectable()
export class RecipeService {
    constructor(
        @InjectRepository(Recipe)
        private recipesRepository: Repository<Recipe>,
    ) {}

// Création d'une recette liée à un utilisateur
    async createRecipe(createRecipeDto: RecipeDTO, user: User): Promise<Recipe> {
        const { title, description } = createRecipeDto;

        const recipe = this.recipesRepository.create({
            title,
            description,
            user,  // Associe la recette à l'utilisateur
        });

        await this.recipesRepository.save(recipe);
        return recipe;
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
