import {Controller, Get, Post, Put, Delete, Body, Param, Req, UnauthorizedException, Headers} from '@nestjs/common';
import { Request } from 'express'; // Import du type Request
import { IngredientService } from './ingredient.service';
import { Ingredient } from '../entity/Ingredient.entity';
import * as jwt from 'jsonwebtoken';

@Controller('ingredients')
export class IngredientController {
    constructor(private readonly ingredientService: IngredientService) {}

    @Get()
    findAll(): Promise<Ingredient[]> {
        return this.ingredientService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: number): Promise<Ingredient | null> {
        return this.ingredientService.findOne(id);
    }

    @Post()
    create(@Req() req: Request, @Body() ingredient: Ingredient, @Headers('Authorization') authorizationHeader: string): Promise<Ingredient> {
        this.verifyToken(req);
        return this.ingredientService.create(ingredient, authorizationHeader);
    }

    @Put(':id')
    update(@Req() req: Request, @Param('id') id: number, @Body() ingredient: Partial<Ingredient>): Promise<Ingredient | null> {
        this.verifyToken(req);
        return this.ingredientService.update(id, ingredient);
    }

    @Delete(':id')
    delete(@Req() req: Request, @Param('id') id: number,  @Headers('Authorization') authorizationHeader: string): Promise<void> {
        this.verifyToken(req);
        return this.ingredientService.delete(id, authorizationHeader);
    }

    // Méthode pour vérifier le token
    private verifyToken(req: Request): void {
        const authHeader = req.headers['authorization'];
        if (!authHeader) {
            throw new UnauthorizedException('Token not provided');
        }

        const token = authHeader.split(' ')[1]; // Extraire le token du header

        try {
            jwt.verify(token, ""+process.env.SECRET); // Vérification du token
        } catch (err) {
            throw new UnauthorizedException('Invalid token');
        }
    }
}
