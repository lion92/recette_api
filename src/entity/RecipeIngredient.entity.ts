import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { Recipe } from './Recipe.entity';
import { Ingredient } from './Ingredient.entity';

@Entity()
export class RecipeIngredient {
    @PrimaryGeneratedColumn()
    id!: number;

    @ManyToOne(() => Recipe, (recipe) => recipe.recipeIngredients, { onDelete: 'CASCADE' })
    recipe!: Recipe;

    @ManyToOne(() => Ingredient, (ingredient) => ingredient.recipeIngredients, { eager: true, onDelete: 'CASCADE' })
    ingredient!: Ingredient;

    @Column('float')
    quantity!: number; // Quantité spécifique pour cet ingrédient dans la recette
}
