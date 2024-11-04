import { User } from "../entity/User.entity";
import { Ingredient } from "../entity/Ingredient.entity";
import { Category } from "../entity/Category.entity";

export interface RecipeData {
  id?: number;
  title: string;
  description: string;
  ingredients: Ingredient[]; // Liste des ingrédients associés
  instructions: string;
  category: Category[]; // Liste des catégories associées
  jwt: string; // Token JWT pour l'authentification
  totalCalories: number; // Calories totales (nombre)
  user?: User; // Utilisateur associé (optionnel)
  isPublished?: boolean; // Statut de publication (optionnel)
}
