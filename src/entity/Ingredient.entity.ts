import {Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Recipe} from "./Recipe.entity";
import {User} from "./User.entity";

@Entity()
export class Ingredient {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price!: number;


    @ManyToOne(() => User, (user) => user.ingredient, { eager: true })
    user!: User;

}