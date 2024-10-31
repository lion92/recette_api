import {Column, Entity, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn} from "typeorm";
import {Ingredient} from "./Ingredient.entity";
import {Recipe} from "./Recipe.entity";
import {User} from "./User.entity";

@Entity()
export class Category {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

// Relation Many-to-One avec l'utilisateur
    @ManyToOne(() => User, (user) => user.categorie, { eager: true })
    user!: User;

}
