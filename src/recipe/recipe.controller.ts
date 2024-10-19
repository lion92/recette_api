import { Controller, Get, Post, Put, Delete, Param, Body } from '@nestjs/common';
import { RecipeService } from './recipe.service';
import {RecipeData} from "../interface/Recipe";
import {User} from "../entity/User.entity";

@Controller('recipes')
export class RecipeController {
    constructor(private recipeService: RecipeService) {}

    @Post()
    createRecipe(@Body() body:{recipeData:RecipeData, user:User}) {
        return this.recipeService.createRecipe(body.recipeData, body.user);
    }

    @Get()
    findAll() {
        return this.recipeService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: number) {
        return this.recipeService.findOne(id);
    }

    @Put(':id')
    updateRecipe(@Param('id') id: number, @Body() updateData:RecipeData) {
        return this.recipeService.updateRecipe(id, updateData);
    }

    @Delete(':id')
    deleteRecipe(@Param('id') id: number) {
        return this.recipeService.deleteRecipe(id);
    }
}
