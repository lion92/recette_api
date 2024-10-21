import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, ManyToMany, JoinTable } from 'typeorm';
import { User } from './User.entity';
import { Ingredient } from './Ingredient.entity';
import { Category } from './Category.entity';

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

    // Relation Many-to-Many avec les ingrédients
    @ManyToMany(() => Recipe)
    @JoinTable({
        name: "Recipe_Ingredient",
        joinColumn: {
            name: "Recipe",
            referencedColumnName: "id",
        },
        inverseJoinColumn: {
            name: "Ingredient",
            referencedColumnName: "id",
        },
    })
    ingredients!: Ingredient[];

    @ManyToMany(() => Recipe)
    @JoinTable({
        name: "Recipe_Category",
        joinColumn: {
            name: "RecipeId",
            referencedColumnName: "id",
        },
        inverseJoinColumn: {
            name: "Category",
            referencedColumnName: "id",
        },
    })
    categories!: Category[];
}
