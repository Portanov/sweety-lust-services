import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FavoriteEntity } from './entities/favorite.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(FavoriteEntity)
    private readonly favoriteRepo: Repository<FavoriteEntity>,
  ) {}

  /* Obtener los favoritos */
  async getFavorites(userId: number) {
    const favorites = await this.favoriteRepo.find({
      where: { userId },
      relations: ['product'],
    });

    return favorites.map((fav) => ({
      id: fav.id,
      productId: fav.productId,
      created_at: fav.created_at,
      product: fav.product,
    }));
  }

  async addFavorite(userId: number, productId: number) {
    const existing = await this.favoriteRepo.findOne({
      where: { userId, productId },
    });

    if (existing) {
      throw new ConflictException('El producto ya está en favoritos');
    }

    const favorite = this.favoriteRepo.create({ userId, productId });
    const saved = await this.favoriteRepo.save(favorite);

    return this.favoriteRepo.findOne({
      where: { id: saved.id },
      relations: ['product'],
    });
  }

  async removeFavorite(userId: number, productId: number) {
    const favorite = await this.favoriteRepo.findOne({
      where: { userId, productId },
    });

    if (!favorite) {
      throw new NotFoundException('El producto no está en favoritos');
    }

    await this.favoriteRepo.remove(favorite);
    return { message: 'Producto eliminado de favoritos' };
  }
}
