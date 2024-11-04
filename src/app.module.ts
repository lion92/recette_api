import {Module, OnModuleInit} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {JwtModule} from '@nestjs/jwt';
import {MulterModule} from '@nestjs/platform-express';
import {AuthModule} from "./auth/auth.module";
import {RecipeModule} from "./recipe/recipe.module";
import {IngredientModule} from "./ingredient/Ingredient.module";
import {CategoryRecipeModule} from "./categoryRecipe/CategoryRecipe.module";
import {IngredientService} from "./ingredient/Ingredient.service";
import {Ingredient} from "./entity/Ingredient.entity";
import {User} from "./entity/User.entity";
import * as dotenv from 'dotenv';
dotenv.config();
@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
    TypeOrmModule.forFeature([Ingredient, User]),

    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: 'root',
      database: '',
      entities: ['src/../**/*.entity.js'],
      synchronize: true,
    }),
    JwtModule.register({
      secret: ""+process.env.SECRET,
      signOptions: { expiresIn: '24d' },
    }),
      AuthModule,
      RecipeModule,
      IngredientModule,
     CategoryRecipeModule
  ],
  controllers: [AppController],
  providers: [AppService, IngredientService],
})
export class AppModule implements OnModuleInit {
  constructor(private readonly ingredientService: IngredientService) {}

  async onModuleInit() {
    await this.ingredientService.seedDefaultIngredients();
  }
}
