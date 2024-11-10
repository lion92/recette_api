import { Controller, Get, Post, Put, Delete, Body, Param, Req, UnauthorizedException, Headers } from '@nestjs/common';
import { Request } from 'express'; // Import du type Request
import { IngredientService } from './Ingredient.service';
import { Ingredient } from '../entity/Ingredient.entity';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';
dotenv.config();

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
    async create(
        @Req() req: Request,
        @Body() ingredient: Ingredient,
        @Headers('Authorization') authorizationHeader: string
    ): Promise<Ingredient> {
        this.verifyToken(req); // Vérification du token avant de créer
        return this.ingredientService.create(ingredient, authorizationHeader); // Passer authorizationHeader
    }

    @Put(':id')
    async update(
        @Req() req: Request,
        @Param('id') id: number,
        @Body() ingredient: Partial<Ingredient>
    ): Promise<Ingredient | null> {
        this.verifyToken(req); // Vérification du token avant de mettre à jour
        return this.ingredientService.update(id, ingredient);
    }

    @Delete(':id')
    async delete(
        @Req() req: Request,
        @Param('id') id: number,
        @Headers('Authorization') authorizationHeader: string
    ): Promise<void> {
        this.verifyToken(req); // Vérification du token avant de supprimer
        return this.ingredientService.delete(id, authorizationHeader); // Passer authorizationHeader
    }

    // Méthode pour vérifier le token
    private verifyToken(req: Request): void {
        const authHeader = req.headers['authorization'];

        // Vérifier si l'header Authorization est présent
        if (!authHeader) {
            throw new UnauthorizedException('Token not provided');
        }

        // Extraire le token de l'header Authorization
        const token = authHeader.split(' ')[1];

        // Vérifier si le token est présent
        if (!token) {
            throw new UnauthorizedException('Token is malformed');
        }

        const secret = process.env.SECRET;

        // Vérifier si la clé secrète est définie dans l'environnement
        if (!secret) {
            throw new Error('Secret key is not defined in environment variables');
        }

        try {
            // Vérification du token avec la clé secrète
            jwt.verify(token, secret);
        } catch (err) {
            console.error('Token verification failed:', err);
            throw new UnauthorizedException('Invalid or expired token');
        }
    }
}
