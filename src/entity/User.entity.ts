import {Column, Entity, OneToMany, PrimaryGeneratedColumn} from 'typeorm';
import {Recipe} from "./Recipe.entity";

@Entity()
export class User {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    username!: string

    @Column()
    @Column({ select: false })
    password!: string

    @OneToMany(() => Recipe, (recipe) => recipe.user)
    recipes!: Recipe[];
}
