import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {Recipe} from "./Recipe.entity";
import {Category} from "./Category.entity";
import {Ingredient} from "./Ingredient.entity";
import {IsEmail} from "class-validator";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    @IsEmail()
    email!: string

    @Column()
    password!: string

    @OneToMany(() => Recipe, (recipe) => recipe.user)
    recipes!: Recipe[];

    @OneToMany(() => Category, (categorie) => categorie.user)
    categorie!: Recipe[];

    @OneToMany(() => Ingredient, (ingredient) => ingredient.user)
    ingredient!: Recipe[];

    @Column({ default: false })
    isEmailVerified!: boolean;

    @Column({ nullable: true })
    emailVerificationToken?: string;






}
