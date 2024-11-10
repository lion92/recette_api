import { Ingredient } from "../entity/Ingredient.entity";
import { Category } from "../entity/Category.entity";
import { UserDTO } from "./UserDTO";

export class RecipeDTO {
    id!: number;
    title!: string;
    description!: string;
    instructions!: string;
    isPublished!: boolean;
    user!: UserDTO; // Utilisation du type UserDTO pour représenter l'utilisateur
    ingredients!: { id: number; quantity: number }[]; // Tableau d'objets contenant l'ID et la quantité des ingrédients
    categories!: Category[]; // Tableau de catégories
    totalCost!: number;
}
