import {  Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import {Ingredient} from "../entity/Ingredient.entity";
import {Category} from "../entity/Category.entity";
import {UserDTO} from "./UserDTO";



export class RecipeDTO {
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
    @ManyToOne(() => UserDTO, (user) => user.recipes, { eager: true })
    user!: UserDTO;

    // Relation Many-to-Many avec les ingrédients
    @ManyToMany(() => Ingredient,  Ingredient=>Ingredient.id)
    @JoinTable()
    ingredients!: Ingredient[];

    // Relation Many-to-Many avec les catégories
    @ManyToMany(() => Category,  Category=>Category.id)
    @JoinTable()
    categories!: Category[];

    totalCost!: number;
}
