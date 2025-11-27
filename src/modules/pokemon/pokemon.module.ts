import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HttpModule } from '@nestjs/axios';
import { PokemonService } from './pokemon.service';
import { PokemonController } from './pokemon.controller';
import { Pokemon } from './entities/pokemon.entity';
import { PokeApiService } from './services/pokeapi.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Pokemon]),
    HttpModule, // Registramos el módulo HTTP
  ],
  controllers: [PokemonController],
  providers: [
    PokemonService,
    PokeApiService, // Registramos el servicio como proveedor
  ],
  exports: [PokemonService],
})
export class PokemonModule {}
