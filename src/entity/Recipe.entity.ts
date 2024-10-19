import {Entity, Column, PrimaryGeneratedColumn, ManyToOne} from 'typeorm';
import {User} from "./User.entity";

@Entity()
export class Recipe {
    @PrimaryGeneratedColumn()
    id!: number

    @Column()
    title!: string;

    @Column()
    description!: string

    @Column()
    ingredients!: string

    @Column()
    instructions!: string

    @Column({ default: true })
    isPublished!: boolean

    @ManyToOne(() => User, (user) => user.recipes, { eager: true })
    user!: User;
}
