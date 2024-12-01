import {CalendarEvent} from "../entity/CalendarEvent.entity";
import {Injectable, NotFoundException} from "@nestjs/common";
import {Recipe} from "../entity/Recipe.entity";
import {Repository} from "typeorm";
import {InjectRepository} from "@nestjs/typeorm";

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
            where: { user: { id: userId } },
            relations: ['recipe', 'recipe.categories', 'recipe.recipeIngredients', 'recipe.recipeIngredients.ingredient'],
        });
    }

    // Supprimer un événement du calendrier
    async deleteCalendarEvent(eventId: number, userId: number): Promise<void> {
        const event = await this.calendarEventRepository.findOne({
            where: { id: eventId, user: { id: userId } },
        });

        if (!event) {
            throw new NotFoundException(`Événement avec l'ID ${eventId} non trouvé pour cet utilisateur.`);
        }

        await this.calendarEventRepository.delete(eventId);
    }
}
