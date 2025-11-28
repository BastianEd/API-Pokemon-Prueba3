import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { isAxiosError } from 'axios'; //

// ═══════════════════════════════════════════════════════════════
// INTERFACES (Contratos de datos)
// ═══════════════════════════════════════════════════════════════

interface PokeApiType {
  slot: number;
  type: {
    name: string;
    url: string;
  };
}

interface PokeApiSprites {
  front_default: string | null;
  other?: {
    'official-artwork'?: {
      front_default: string | null;
    };
  };
}

interface PokeApiPokemonDetail {
  id: number;
  name: string;
  types: PokeApiType[];
  sprites: PokeApiSprites;
  base_experience: number;
}

interface PokeApiSpeciesEntry {
  flavor_text: string;
  language: {
    name: string;
    url: string;
  };
}

interface PokeApiSpeciesResponse {
  flavor_text_entries: PokeApiSpeciesEntry[];
}

interface PokeApiListResponse {
  count: number;
  results: Array<{
    name: string;
    url: string;
  }>;
}

// Interfaces para la respuesta de búsqueda por Tipo
interface PokeApiTypeRelation {
  pokemon: {
    name: string;
    url: string;
  };
}

interface PokeApiTypeResponse {
  pokemon: PokeApiTypeRelation[];
}

// ═══════════════════════════════════════════════════════════════
// DTO INTERNO (Lo que entrega este servicio)
// ═══════════════════════════════════════════════════════════════

export interface SimplifiedPokemon {
  name: string;
  types: string[];
  image: string | null;
  price: number;
  description: string;
}

@Injectable()
export class PokeApiService {
  private readonly logger = new Logger(PokeApiService.name);
  private readonly baseUrl = 'https://pokeapi.co/api/v2';

  // Diccionario de traducción
  private readonly typeTranslations: Record<string, string> = {
    normal: 'Normal',
    fighting: 'Lucha',
    flying: 'Volador',
    poison: 'Veneno',
    ground: 'Tierra',
    rock: 'Roca',
    bug: 'Bicho',
    ghost: 'Fantasma',
    steel: 'Acero',
    fire: 'Fuego',
    water: 'Agua',
    grass: 'Planta',
    electric: 'Eléctrico',
    psychic: 'Psíquico',
    ice: 'Hielo',
    dragon: 'Dragón',
    dark: 'Siniestro',
    fairy: 'Hada',
    unknown: 'Desconocido',
    shadow: 'Sombra',
  };

  constructor(private readonly httpService: HttpService) {}

  private generateRandomPrice(min = 1000, max = 1000000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Sanitización de descripción
  private getSpanishDescription(speciesData: PokeApiSpeciesResponse): string {
    const entry = speciesData.flavor_text_entries.find(
      (e) => e.language.name === 'es',
    );
    return entry
      ? entry.flavor_text.replace(/[\n\f\r]/g, ' ')
      : 'Sin descripción disponible.';
  }

  // Traducción de tipos con validación
  private translateTypes(types: PokeApiType[]): string[] {
    return types.map((t) => {
      const englishName = t.type.name.toLowerCase();
      const spanishName = this.typeTranslations[englishName];
      // Si no hay traducción, capitalizamos el inglés
      return (
        spanishName ||
        englishName.charAt(0).toUpperCase() + englishName.slice(1)
      );
    });
  }

  /**
   * Obtiene Pokémon por nombre/ID con llamadas paralelas
   */
  async getPokemonByName(
    nameOrId: string | number,
  ): Promise<SimplifiedPokemon> {
    try {
      this.logger.log(`Consultando PokéAPI para: ${nameOrId}`);

      // Tipamos las llamadas HTTP para evitar 'any'
      const [pokemonRes, speciesRes] = await Promise.all([
        firstValueFrom(
          this.httpService.get<PokeApiPokemonDetail>(
            `${this.baseUrl}/pokemon/${nameOrId}`,
          ),
        ),
        firstValueFrom(
          this.httpService.get<PokeApiSpeciesResponse>(
            `${this.baseUrl}/pokemon-species/${nameOrId}`,
          ),
        ),
      ]);

      const data = pokemonRes.data;
      const species = speciesRes.data;

      // Traducción aplicada aquí
      const translatedTypes = this.translateTypes(data.types);

      const image =
        data.sprites.other?.['official-artwork']?.front_default ??
        data.sprites.front_default;

      const capitalizedName =
        data.name.charAt(0).toUpperCase() + data.name.slice(1);

      return {
        name: capitalizedName,
        types: translatedTypes,
        image: image,
        price: this.generateRandomPrice(),
        description: this.getSpanishDescription(species),
      };
    } catch (error: unknown) {
      this.handleError(error, nameOrId);
    }
  }

  /**
   * Obtiene lista paginada
   */
  async getPokemonList(limit = 20, offset = 0): Promise<SimplifiedPokemon[]> {
    try {
      const validLimit = Math.min(limit, 50);
      const url = `${this.baseUrl}/pokemon?limit=${validLimit}&offset=${offset}`;

      this.logger.log(`Obteniendo lista base: ${url}`);

      const response = await firstValueFrom(
        this.httpService.get<PokeApiListResponse>(url),
      );

      const detailPromises = response.data.results.map((pokemon) =>
        this.getPokemonByName(pokemon.name),
      );

      return await Promise.all(detailPromises);
    } catch (error: unknown) {
      // Manejo seguro del error sin usar 'any'
      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error en getPokemonList: ${msg}`);
      throw new HttpException(
        'Error al obtener lista de PokéAPI',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Busca por tipo
   */
  async getPokemonByType(
    typeName: string,
    limit = 20,
  ): Promise<SimplifiedPokemon[]> {
    try {
      const url = `${this.baseUrl}/type/${typeName.toLowerCase()}`;
      this.logger.log(`Buscando por tipo: ${typeName}`);

      // Tipado explícito de la respuesta de Tipo
      const response = await firstValueFrom(
        this.httpService.get<PokeApiTypeResponse>(url)
      );

      const pokemonNames = response.data.pokemon
        .slice(0, limit)
        .map((p) => p.pokemon.name);

      const detailPromises = pokemonNames.map((name) =>
        this.getPokemonByName(name),
      );

      return await Promise.all(detailPromises);
    } catch (error: unknown) {
      if (isAxiosError(error) && error.response?.status === 404) {
        throw new HttpException(
          `El tipo '${typeName}' no existe`,
          HttpStatus.NOT_FOUND,
        );
      }

      const msg = error instanceof Error ? error.message : 'Error desconocido';
      this.logger.error(`Error en getPokemonByType: ${msg}`);
      throw new HttpException(
        'Error al buscar por tipo',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Manejo centralizado de errores con Type Guards
   */
  private handleError(error: unknown, context: string | number): never {
    if (isAxiosError(error)) {
      if (error.response?.status === 404) {
        this.logger.warn(`Pokémon '${context}' no encontrado.`);
        throw new HttpException(
          `Pokémon '${context}' no encontrado`,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    const msg = error instanceof Error ? error.message : 'Error desconocido';
    this.logger.error(`Error externo PokéAPI con '${context}': ${msg}`);

    throw new HttpException(
      'Error de comunicación con PokéAPI',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}