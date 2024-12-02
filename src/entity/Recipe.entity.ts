import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable, OneToMany} from 'typeorm';
import { User } from './User.entity';
import { Ingredient } from './Ingredient.entity';
import { Category } from './Category.entity';
import {RecipeIngredient} from "./RecipeIngredient.entity";

@Entity()
export class Recipe {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    title!: string;

    @Column()
    description!: string;

    @Column()
    instructions!: string;

    @Column({ default: true })
    isPublished!: boolean;

    // Relation Many-to-One avec l'utilisateur
    @ManyToOne(() => User, (user) => user.recipes, { eager: true })
    user!: User;

    @Column('float', { default: 0 })
    totalCalories!: number; // Ajout du champ totalCalories

    @Column('longtext')
    imagePath!:string
    // Relation Many-to-Many avec les ingrédients
    @ManyToMany(() => Ingredient,  Ingredient=>Ingredient.id)
    @JoinTable()
    ingredients!: Ingredient[];

    // Relation Many-to-Many avec les catégories
    @ManyToMany(() => Category,  Category=>Category.id)
    @JoinTable()
    categories!: Category[];

    totalCost!: number;

    @OneToMany(() => RecipeIngredient, (recipeIngredient) => recipeIngredient.recipe, { cascade: true })
    recipeIngredients!: RecipeIngredient[];


}
