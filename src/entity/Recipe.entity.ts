import {Entity, Column, PrimaryGeneratedColumn, ManyToOne, OneToMany, JoinTable, ManyToMany} from 'typeorm';
import {User} from "./User.entity";
import {Ingredient} from "./Ingredient.entity";
import {Category} from "./Category.entity";

@Entity()
export class Recipe {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    title!: string;

    @Column()
    description!: string

    @Column()
    instructions!: string

    @Column({ default: true })
    isPublished!: boolean

    @ManyToOne(() => User, (user) => user.recipes, { eager: true })
    user!: User;

    @ManyToMany(() => Ingredient, { eager: true, cascade: true })
    @JoinTable()
    ingredients!: Ingredient[];

    @ManyToMany(() => Category, { eager: true, cascade: true })
    @JoinTable()
    categories!: Category[];
}



