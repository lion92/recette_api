import {Controller, Post, Get, Body, Param, Headers, UnauthorizedException, Delete, Req} from '@nestjs/common';
import { CalendarService } from './CalendarService';
import { JwtService } from '@nestjs/jwt';

@Controller('calendar')
export class CalendarController {
    constructor(
        private calendarService: CalendarService,
        private jwtService: JwtService,
    ) {}

    @Post('/add')
    async addRecipeToCalendar(
        @Body('recipeId') recipeId: number,
        @Body('date') date: Date,
        @Headers('Authorization') authorizationHeader: string,
    ) {
        if (!authorizationHeader) {
            throw new UnauthorizedException('En-tête Authorization manquant');
        }

        const token = authorizationHeader.replace('Bearer ', '');
        const decryptToken = await this.jwtService.verifyAsync(token, { secret: process.env.SECRET });

        if (!decryptToken) {
            throw new UnauthorizedException('Token JWT invalide ou expiré');
        }

        const userId = decryptToken.id;
        return this.calendarService.addRecipeToCalendar(recipeId, date, userId);
    }

    @Get()
    async getCalendarEvents(@Headers('Authorization') authorizationHeader: string) {
        if (!authorizationHeader) {
            throw new UnauthorizedException('En-tête Authorization manquant');
        }

        const token = authorizationHeader.replace('Bearer ', '');
        const decryptToken = await this.jwtService.verifyAsync(token, { secret: process.env.SECRET });

        if (!decryptToken) {
            throw new UnauthorizedException('Token JWT invalide ou expiré');
        }

        const userId = decryptToken.id;
        return this.calendarService.getCalendarEventsByUser(userId);
    }

    @Get('/user')
    async getCalendarForUser(@Headers('Authorization') authorizationHeader: string) {
        if (!authorizationHeader) {
            throw new UnauthorizedException('En-tête Authorization manquant');
        }

        const token = authorizationHeader.replace('Bearer ', '');
        const decryptToken = await this.jwtService.verifyAsync(token, { secret: process.env.SECRET });

        if (!decryptToken) {
            throw new UnauthorizedException('Token JWT invalide ou expiré');
        }

        const userId = decryptToken.id;
        return this.calendarService.getCalendarByUser(userId);
    }

    @Delete('/delete/:id')
    async deleteCalendarEvent(
        @Param('id') id: number,
        @Headers('Authorization') authorizationHeader: string,
    ) {
        if (!authorizationHeader) {
            throw new UnauthorizedException('En-tête Authorization manquant');
        }

        const token = authorizationHeader.replace('Bearer ', '');
        const decryptToken = await this.jwtService.verifyAsync(token, { secret: process.env.SECRET });

        if (!decryptToken) {
            throw new UnauthorizedException('Token JWT invalide ou expiré');
        }

        const userId = decryptToken.id;
        await this.calendarService.deleteCalendarEvent(id, userId);

        return { message: `L'événement avec l'ID ${id} a été supprimé.` };
    }

    @Get('/ingredients/prices')
    async getIngredientsWithPrices(@Headers('Authorization') authorizationHeader: string) {
        if (!authorizationHeader) {
            throw new UnauthorizedException('En-tête Authorization manquant');
        }

        try {
            const token = authorizationHeader.replace('Bearer ', '');
            const { id: userId } = await this.jwtService.verifyAsync(token, { secret: process.env.SECRET });

            if (!userId) {
                throw new UnauthorizedException('Utilisateur non valide');
            }

            return this.calendarService.getIngredientsWithPrices(userId);
        } catch (error) {
            throw new UnauthorizedException('Token JWT invalide ou expiré');
        }
    }

}
