import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Interfaces para tipar las respuestas de PokéAPI v2.
 */
interface PokeApiType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

interface PokeApiSprites {
  front_default: string | null;
  front_shiny?: string | null;
  front_female?: string | null;
  back_default?: string | null;
}

interface PokeApiPokemonDetail {
  id: number;
  name: string;
  types: PokeApiType[];
  sprites: PokeApiSprites;
  height: number;
  weight: number;
}

interface PokeApiListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{
    name: string;
    url: string;
  }>;
}

/**
 * DTO simplificado interno del servicio.
 */
export interface SimplifiedPokemon {
  name: string;
  types: string[];
  image: string | null;
  price: number;
}

@Injectable()
export class PokeApiService {
  private readonly logger = new Logger(PokeApiService.name);
  private readonly baseUrl = 'https://pokeapi.co/api/v2';

  constructor(private readonly httpService: HttpService) {}

  private generateRandomPrice(min = 1000, max = 1000000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async getPokemonByName(
    nameOrId: string | number,
  ): Promise<SimplifiedPokemon> {
    try {
      const url = `${this.baseUrl}/pokemon/${nameOrId}`;
      this.logger.log(`Consultando PokéAPI: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get<PokeApiPokemonDetail>(url),
      );
      const data = response.data;

      const types = data.types.map((t) => t.type.name);

      return {
        name: data.name,
        types: types,
        image: data.sprites.front_default,
        price: this.generateRandomPrice(),
      };
    } catch (error) {
      if (error.response?.status === 404) {
        this.logger.warn(`Pokémon '${nameOrId}' no encontrado en PokéAPI`);
        throw new HttpException(
          `Pokémon '${nameOrId}' no existe`,
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.error(
        `Error al consultar PokéAPI para '${nameOrId}': ${error.message}`,
      );
      throw new HttpException(
        'Error al comunicarse con PokéAPI',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getPokemonList(limit = 20, offset = 0): Promise<SimplifiedPokemon[]> {
    try {
      const validLimit = Math.min(limit, 100);
      const url = `${this.baseUrl}/pokemon?limit=${validLimit}&offset=${offset}`;
      this.logger.log(`Consultando lista de Pokémon: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get<PokeApiListResponse>(url),
      );

      // Paralelismo: Pedimos el detalle de todos los pokemones al mismo tiempo
      const detailPromises = response.data.results.map((pokemon) =>
        this.getPokemonByName(pokemon.name),
      );

      const pokemonList = await Promise.all(detailPromises);
      this.logger.log(
        `Se obtuvieron ${pokemonList.length} Pokémon exitosamente`,
      );
      return pokemonList;
    } catch (error) {
      this.logger.error(`Error al obtener lista de Pokémon: ${error.message}`);
      throw new HttpException(
        'Error al obtener lista de Pokémon desde PokéAPI',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  async getPokemonByType(
    typeName: string,
    limit = 20,
  ): Promise<SimplifiedPokemon[]> {
    try {
      const url = `${this.baseUrl}/type/${typeName}`;
      this.logger.log(`Consultando Pokémon de tipo '${typeName}': ${url}`);

      const response = await firstValueFrom(
        this.httpService.get<{
          pokemon: Array<{ pokemon: { name: string; url: string } }>;
        }>(url),
      );

      const pokemonNames = response.data.pokemon
        .slice(0, limit)
        .map((p) => p.pokemon.name);

      const detailPromises = pokemonNames.map((name) =>
        this.getPokemonByName(name),
      );

      return await Promise.all(detailPromises);
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException(
          `Tipo '${typeName}' no existe`,
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.error(
        `Error al buscar Pokémon por tipo '${typeName}': ${error.message}`,
      );
      throw new HttpException(
        'Error al buscar Pokémon por tipo',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }
}