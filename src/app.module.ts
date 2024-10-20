import {Module} from '@nestjs/common';
import {AppController} from './app.controller';
import {AppService} from './app.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import {JwtModule} from '@nestjs/jwt';
import {MulterModule} from '@nestjs/platform-express';
import {AuthModule} from "./auth/auth.module";
import {RecipeModule} from "./recipe/recipe.module";
import {IngredientModule} from "./ingredient/Ingredient.module";
import {CategoryRecipeModule} from "./categoryRecipe/CategoryRecipe.module";

@Module({
  imports: [
    MulterModule.register({
      dest: './uploads',
    }),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: 'localhost',
      port: 3306,
      username: 'root',
      password: '',
      database: 'base2',
      entities: ['src/../**/*.entity.js'],
      synchronize: true,
    }),
    JwtModule.register({
      secret: process.env.SECRET,
      signOptions: { expiresIn: '24d' },
    }),
      AuthModule,
      RecipeModule,
      IngredientModule,
     CategoryRecipeModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  constructor() {}
}
