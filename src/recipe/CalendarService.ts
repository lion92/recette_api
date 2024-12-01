import {CalendarEvent} from "../entity/CalendarEvent.entity";
import {Injectable, NotFoundException} from "@nestjs/common";
import {Recipe} from "../entity/Recipe.entity";
import {Repository} from "typeorm";
import {InjectRepository} from "@nestjs/typeorm";
import {Ingredient} from "../entity/Ingredient.entity";

@Injectable()
export class CalendarService {
    constructor(
        @InjectRepository(CalendarEvent)
        private calendarEventRepository: Repository<CalendarEvent>,
        @InjectRepository(Recipe)
        private recipeRepository: Repository<Recipe>,
    ) {
    }

    async addRecipeToCalendar(recipeId: number, date: Date, userId: number): Promise<CalendarEvent> {
        const recipe = await this.recipeRepository.findOne({where: {id: recipeId}});

        if (!recipe) {
            throw new NotFoundException(`Recette avec l'ID ${recipeId} non trouvée`);
        }

        const calendarEvent = this.calendarEventRepository.create({
            date,
            recipe,
            user: {id: userId}, // Utilisez l'ID de l'utilisateur
        });

        return this.calendarEventRepository.save(calendarEvent);
    }

    async getCalendarEventsByUser(userId: number): Promise<CalendarEvent[]> {
        return this.calendarEventRepository.find({
            where: {user: {id: userId}},
            relations: ['recipe'],
        });
    }

    async getCalendarByUser(userId: number): Promise<CalendarEvent[]> {
        return this.calendarEventRepository.find({
            where: {user: {id: userId}},
            relations: ['recipe', 'recipe.categories', 'recipe.recipeIngredients', 'recipe.recipeIngredients.ingredient'],
        });
    }

    // Supprimer un événement du calendrier
    async deleteCalendarEvent(eventId: number, userId: number): Promise<void> {
        const event = await this.calendarEventRepository.findOne({
            where: {id: eventId, user: {id: userId}},
        });

        if (!event) {
            throw new NotFoundException(`Événement avec l'ID ${eventId} non trouvé pour cet utilisateur.`);
        }

        await this.calendarEventRepository.delete(eventId);
    }

    async getIngredientsWithPrices(userId: number) {


        // Récupérer les événements du calendrier pour l'utilisateur
        const events = await this.calendarEventRepository.find({
            where: {user: {id: userId}},
            relations: ['recipe', 'recipe.recipeIngredients', 'recipe.recipeIngredients.ingredient'],
        });

        console.log(userId)

        if (!events.length) {
            throw new NotFoundException('Aucun événement trouvé dans le calendrier de l\'utilisateur.');
        }

        // Map pour cumuler les quantités et coûts des ingrédients
        const ingredientMap = new Map<number, {
            name: string;
            price: number;
            totalQuantity: number;
        }>();

        events.forEach(event => {
            event.recipe.recipeIngredients.forEach(recipeIngredient => {
                const ingredientId = recipeIngredient.ingredient.id;

                if (ingredientMap.has(ingredientId)) {
                    // Si l'ingrédient existe déjà, on cumule la quantité
                    const current = ingredientMap.get(ingredientId);
                    if (current) {
                        current.totalQuantity += recipeIngredient.quantity;
                    }

                } else {
                    // Sinon, on l'ajoute
                    ingredientMap.set(ingredientId, {
                        name: recipeIngredient.ingredient.name,
                        price: recipeIngredient.ingredient.price,
                        totalQuantity: recipeIngredient.quantity,
                    });
                }
            });
        });

        // Calcul du coût total
        let totalCost = 0;
        const ingredientsList = Array.from(ingredientMap.values()).map(ingredient => {
            const cost = ingredient.totalQuantity * ingredient.price;
            totalCost += cost;

            return {
                name: ingredient.name,
                totalQuantity: ingredient.totalQuantity,
                pricePerUnit: ingredient.price,
                totalCost: cost,
            };
        });
        console.log(totalCost)
        console.log(ingredientsList)
        return {
            totalCost,
            ingredients: ingredientsList,
        };
    }

}
