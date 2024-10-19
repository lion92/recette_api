import {User} from "../entity/User.entity";

export interface RecipeData {
  id?:number;
  title: string;
  description: string;
  ingredients: string;
  instructions: string;
  jwt:string;
  user?:User;
  isPublished?: boolean; // Ce champ est optionnel
}
