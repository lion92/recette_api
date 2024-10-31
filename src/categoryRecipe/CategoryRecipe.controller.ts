import {Controller, Get, Post, Put, Delete, Body, Param, Req, UnauthorizedException, Headers} from '@nestjs/common';
import { CategoryRecipeService } from './CategoryRecipe.service';
import { Category } from '../entity/Category.entity';
import * as jwt from 'jsonwebtoken';

@Controller('categories')
export class CategoryRecipeController {
    constructor(private readonly categoryService: CategoryRecipeService) {}

    @Get()
    findAll(): Promise<Category[]> {
        return this.categoryService.findAll();
    }

    @Get(':id')
    findOne(@Param('id') id: number):  Promise<Category | null> {
        return this.categoryService.findOne(id);
    }

    @Post()
    create(@Req() req:Request, @Body() category: Category, @Headers('Authorization') authorizationHeader: string): Promise<Category> {
        this.verifyToken(req);
        return this.categoryService.create(category, authorizationHeader);
    }

    @Put(':id')
    update(@Req() req:Request, @Param('id') id: number, @Body() category: Partial<Category>):  Promise<Category | null> {
        this.verifyToken(req);
        return this.categoryService.update(id, category);
    }

    @Delete(':id')
    delete(@Req() req:Request, @Param('id') id: number,  @Headers('Authorization') authorizationHeader: string): Promise<{
        message: string
    }> {
        this.verifyToken(req);
        return this.categoryService.delete(id, authorizationHeader);
    }

    // Méthode pour vérifier le token
    private verifyToken(req: any): void {
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
