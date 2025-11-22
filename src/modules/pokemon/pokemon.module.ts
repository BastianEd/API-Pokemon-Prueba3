import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PokemonService } from './pokemon.service';
import { PokemonController } from './pokemon.controller';
import { Pokemon } from './entities/pokemon.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Pokemon])], // ¡Importante!
  controllers: [PokemonController],
  providers: [PokemonService],
})
export class PokemonModule {}