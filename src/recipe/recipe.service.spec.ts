import {NotFoundException, UnauthorizedException} from '@nestjs/common';
import {RecipeService} from './recipe.service';
import {Repository} from 'typeorm';
import {getRepositoryToken} from '@nestjs/typeorm';
import {Recipe} from '../entity/Recipe.entity';
import {Ingredient} from '../entity/Ingredient.entity';
import {Category} from '../entity/Category.entity';
import {RecipeIngredient} from '../entity/RecipeIngredient.entity';
import {RecipeDTO} from '../interface/RecipeDTO';
import {UserDTO} from '../interface/UserDTO';
import {Test} from '@nestjs/testing';
import {JwtService} from "@nestjs/jwt";

describe('RecipeService', () => {
    let service: RecipeService;
    let recipesRepository: Repository<Recipe>;
    let ingredientRepository: Repository<Ingredient>;
    let categoryRepository: Repository<Category>;

    beforeEach(async () => {
        const module = await Test.createTestingModule({
            providers: [
                RecipeService,
                {
                    provide: getRepositoryToken(Recipe),
                    useClass: Repository,
                },
                {
                    provide: getRepositoryToken(Ingredient),
                    useClass: Repository,
                },
                {
                    provide: getRepositoryToken(Category),
                    useClass: Repository,
                },
                {
                    provide: getRepositoryToken(RecipeIngredient),
                    useClass: Repository,
                },
                {
                    provide: JwtService,
                    useValue: {
                        verifyAsync: jest.fn().mockResolvedValue({ id: 1 }), // Mock d'une réponse valide
                        sign: jest.fn().mockReturnValue('mocked-jwt-token'), // Mock d'une signature
                    },
                },
            ],
        }).compile();

        service = module.get<RecipeService>(RecipeService);
        recipesRepository = module.get<Repository<Recipe>>(getRepositoryToken(Recipe));
        ingredientRepository = module.get<Repository<Ingredient>>(getRepositoryToken(Ingredient));
        categoryRepository = module.get<Repository<Category>>(getRepositoryToken(Category));
    });

    // === MÉTHODE : findAll ===
    describe('findAll', () => {
        it('should return a list of recipes with calculated total costs', async () => {
            const mockRecipes = [
                {
                    id: 1,
                    title: 'Recipe 1',
                    recipeIngredients: [
                        { quantity: 2, ingredient: { price: 5 } },
                        { quantity: 1, ingredient: { price: 3 } },
                    ],
                    user: { id: 1, email: 'user@example.com' },
                },
            ];

            jest.spyOn(recipesRepository, 'find').mockResolvedValue(mockRecipes as any);

            const result = await service.findAll();
            expect(result).toHaveLength(1);
            expect(result[0].totalCost).toBe(13);
        });
    });

    // === MÉTHODE : findOne ===
    describe('findOne', () => {
        it('should return a single recipe with calculated total cost', async () => {
            const mockRecipe = {
                id: 1,
                title: 'Recipe 1',
                recipeIngredients: [{ quantity: 2, ingredient: { price: 5 } }],
                user: { id: 1, email: 'user@example.com' },
            };

            jest.spyOn(recipesRepository, 'findOne').mockResolvedValue(mockRecipe as any);

            const result = await service.findOne(1);
            expect(result.totalCost).toBe(10);
        });

        it('should throw NotFoundException if recipe does not exist', async () => {
            jest.spyOn(recipesRepository, 'findOne').mockResolvedValue(null);

            await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
        });
    });

    // === MÉTHODE : createRecipe ===
    it('should create a recipe', async () => {
        const mockUser: UserDTO = { id: 1, email: 'user@example.com', recipes: [], isEmailVerified: true };
        const createRecipeDto: RecipeDTO = {
            id: 1,
            title: 'New Recipe',
            description: 'Description',
            instructions: 'Instructions',
            isPublished: true,
            user: mockUser,
            ingredients: [{ id: 1, quantity: 2 }],
            categories: [{ id: 1, name: 'Category 1' }] as Category[],
            totalCost: 0,
            imagePath: 'image.jpg',
        };

        const mockIngredient: Ingredient = {
            id: 1,
            name: 'Ingredient 1',
            price: 5,
            caloriesPerUnit: 50,
            unit: 'grams',
            defaultQuantity: 1,
            user: mockUser as any,
            recipeIngredients: [],
        };

        const mockCategory: Category = {
            id: 1,
            name: 'Category 1',
            user: mockUser as any,
        };

        jest.spyOn(ingredientRepository, 'findBy').mockResolvedValue([mockIngredient]);
        jest.spyOn(categoryRepository, 'findBy').mockResolvedValue([mockCategory]);
        jest.spyOn(recipesRepository, 'create').mockReturnValue(createRecipeDto as any);
        jest.spyOn(recipesRepository, 'save').mockResolvedValue(createRecipeDto as any);

        // Fournir un en-tête Authorization simulé
        const result = await service.createRecipe(createRecipeDto, 'Bearer validToken');
        expect(result).toMatchObject(createRecipeDto);
    });


    // === MÉTHODE : deleteRecipe ===
    describe('deleteRecipe', () => {
        it('should delete a recipe successfully', async () => {
            const mockRecipe = { id: 1, user: { id: 1 } };

            jest.spyOn(recipesRepository, 'findOne').mockResolvedValue(mockRecipe as any);
            jest.spyOn(recipesRepository, 'delete').mockResolvedValue({ affected: 1 } as any);

            const result = await service.deleteRecipe(1, 'Bearer validToken'); // Fournir un token simulé
            expect(result).toEqual({ affected: 1 });
        });

        it('should throw UnauthorizedException if Authorization header is missing', async () => {
            await expect(service.deleteRecipe(1, '')).rejects.toThrow(UnauthorizedException); // Test d'un en-tête manquant
        });

        it('should throw NotFoundException if recipe is not found', async () => {
            jest.spyOn(recipesRepository, 'findOne').mockResolvedValue(null);

            await expect(service.deleteRecipe(999, 'Bearer validToken')).rejects.toThrow(NotFoundException);
        });
    });
});
