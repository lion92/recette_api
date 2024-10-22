import {Column, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {RecipeDTO} from "./RecipeDTO";


export class UserDTO {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    username!: string

    @OneToMany(() => RecipeDTO, (recipe) => recipe.user)
    recipes!: RecipeDTO[];
}
