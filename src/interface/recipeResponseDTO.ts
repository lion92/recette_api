import {RecipeIngredient} from "../entity/RecipeIngredient.entity";
import {Category} from "../entity/Category.entity";
import {User} from "../entity/User.entity";

export interface RecipeResponse {
    id: number;
    title: string;
    description: string;
    instructions: string;
    isPublished: boolean;
    user: Omit<User, 'password'>; // Utilisation d'un type Omit pour retirer le champ password
    totalCost: number;
    totalCalories: number;
    ingredients: {
        id: number;
        name: string;
        price: number;
        quantity: number;
        caloriesPerUnit:number
        defaultQuantity:number
    }[];
    categories: Category[];
    recipeIngredients?: RecipeIngredient[];
}
