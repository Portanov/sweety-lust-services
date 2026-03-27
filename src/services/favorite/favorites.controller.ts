import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { AddToFavorite } from './dto/add-to-favorite.dto';
import { RemoveFavoriteDto } from './dto/remove-favorite.dto';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Get()
  getFavorites(@Request() req: { user: { id: number } }) {
    return this.favoritesService.getFavorites(req.user.id);
  }

  @Post()
  addFavorite(
    @Body() dto: AddToFavorite,
    @Request() req: { user: { id: number } },
  ) {
    return this.favoritesService.addFavorite(req.user.id, dto.productId);
  }

  @Delete()
  removeFavorite(
    @Body() dto: RemoveFavoriteDto,
    @Request() req: { user: { id: number } },
  ) {
    return this.favoritesService.removeFavorite(req.user.id, dto.productId);
  }
}
