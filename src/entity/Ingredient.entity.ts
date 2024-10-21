import {Column, Entity, PrimaryGeneratedColumn} from "typeorm";

@Entity()
export class Ingredient {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    name!: string;

    @Column()
    type!: string;

    @Column('decimal', { precision: 10, scale: 2 })
    price!: number;
}