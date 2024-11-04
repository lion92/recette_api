import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User.entity";

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
}
