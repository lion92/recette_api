import { Entity, PrimaryGeneratedColumn, ManyToOne, Column } from 'typeorm';
import { Recipe } from './Recipe.entity';
import { User } from './User.entity';

@Entity()
export class CalendarEvent {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column()
    date!: Date;

    @ManyToOne(() => Recipe, (recipe) => recipe.id, { eager: true })
    recipe!: Recipe;

    @ManyToOne(() => User, (user) => user.id)
    user!: User;
}
