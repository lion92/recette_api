import {Column, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {RecipeDTO} from "./RecipeDTO";


export class UserDTO {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    email!: string

    @OneToMany(() => RecipeDTO, (recipe) => recipe.user)
    recipes!: RecipeDTO[];

    @Column({ default: false })
    isEmailVerified!: boolean;
}
