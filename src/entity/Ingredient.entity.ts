import {Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn} from "typeorm";
import { User } from "./User.entity";
import {RecipeIngredient} from "./RecipeIngredient.entity";

@Entity()
export class Ingredient {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column('decimal', { precision: 10, scale: 2, default: 0 }) // Définir une valeur par défaut de 0 pour `price`
    price!: number;

    @Column('float')
    caloriesPerUnit!: number; // Calories pour 1 unité

    @Column()
    unit!: string; // Unité de mesure, ex : "grammes", "litres", etc.

    @Column('float', { default: 1 }) // Définir une valeur par défaut de 1 pour `defaultQuantity`
    defaultQuantity!: number; // Quantité par défaut en unités

    @ManyToOne(() => User, (user) => user.ingredient, { eager: true })
    user!: User;

    @OneToMany(() => RecipeIngredient, (recipeIngredient) => recipeIngredient.ingredient)
    recipeIngredients!: RecipeIngredient[];
}
