import {User} from "../entity/User.entity";
import {Ingredient} from "../entity/Ingredient.entity";
import {Category} from "../entity/Category.entity";

export interface RecipeData {
  id?:number;
  title: string;
  description: string;
  ingredients: Ingredient[];
  instructions: string;
  category: Category[];
  jwt:string;
  user?:User;
  isPublished?: boolean; // Ce champ est optionnel
}
