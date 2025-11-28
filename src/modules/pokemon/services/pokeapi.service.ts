import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

// ═══════════════════════════════════════════════════════════════
// INTERFACES (Tipado fuerte para respuestas externas)
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
  base_experience: number; // Usado para calcular precio base si quieres
}

// Nueva interfaz para la respuesta de Especies (Descripciones)
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

// ═══════════════════════════════════════════════════════════════
// DTO INTERNO (Lo que devuelve este servicio)
// ═══════════════════════════════════════════════════════════════

export interface SimplifiedPokemon {
  name: string;
  types: string[]; // Array de strings simple ['fire', 'flying']
  image: string | null;
  price: number;
  description: string; // 👈 Campo nuevo
}

@Injectable()
export class PokeApiService {
  private readonly logger = new Logger(PokeApiService.name);
  private readonly baseUrl = 'https://pokeapi.co/api/v2';

  constructor(private readonly httpService: HttpService) {}

  // Genera un precio aleatorio (o podrías basarlo en la experiencia base)
  private generateRandomPrice(min = 1000, max = 1000000): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // Metodo auxiliar para limpiar la descripción
  private getSpanishDescription(speciesData: PokeApiSpeciesResponse): string {
    const entry = speciesData.flavor_text_entries.find(
      (e) => e.language.name === 'es',
    );
    // Limpiamos saltos de línea (\n, \f) que trae la API
    return entry
      ? entry.flavor_text.replace(/[\n\f\r]/g, ' ')
      : 'Sin descripción disponible.';
  }

  /**
   * Obtiene un Pokémon por Nombre o ID con descripción.
   * Realiza 2 peticiones en paralelo (Pokemon + Species).
   */
  async getPokemonByName(
    nameOrId: string | number,
  ): Promise<SimplifiedPokemon> {
    try {
      this.logger.log(`Consultando PokéAPI para: ${nameOrId}`);

      // Preparamos las dos peticiones (Observables convertidos a Promesas)
      const pokemonRequest = firstValueFrom(
        this.httpService.get<PokeApiPokemonDetail>(
          `${this.baseUrl}/pokemon/${nameOrId}`,
        ),
      );

      const speciesRequest = firstValueFrom(
        this.httpService.get<PokeApiSpeciesResponse>(
          `${this.baseUrl}/pokemon-species/${nameOrId}`,
        ),
      );

      // Ejecutamos en paralelo para máxima velocidad ⚡️
      const [pokemonRes, speciesRes] = await Promise.all([
        pokemonRequest,
        speciesRequest,
      ]);

      const data = pokemonRes.data;
      const species = speciesRes.data;

      // Mapeamos los tipos a un array simple de strings
      const types = data.types.map((t) => t.type.name);

      // Priorizamos la imagen de arte oficial, si no, la default
      const image =
        data.sprites.other?.['official-artwork']?.front_default ||
        data.sprites.front_default;

      return {
        name: data.name,
        types: types,
        image: image,
        price: this.generateRandomPrice(),
        description: this.getSpanishDescription(species),
      };
    } catch (error) {
      this.handleError(error, nameOrId);
    }
  }

  /**
   * Obtiene una lista de Pokémon.
   * CUIDADO: Hace (limit * 2) peticiones. Si pides 20, hace 41 llamadas.
   */
  async getPokemonList(limit = 20, offset = 0): Promise<SimplifiedPokemon[]> {
    try {
      const validLimit = Math.min(limit, 50); // Limitamos a 50 para no saturar
      const url = `${this.baseUrl}/pokemon?limit=${validLimit}&offset=${offset}`;

      this.logger.log(`Obteniendo lista base: ${url}`);
      const response = await firstValueFrom(
        this.httpService.get<PokeApiListResponse>(url),
      );

      // Por cada resultado, obtenemos el detalle completo
      const detailPromises = response.data.results.map((pokemon) =>
        this.getPokemonByName(pokemon.name),
      );

      const pokemonList = await Promise.all(detailPromises);
      return pokemonList;
    } catch (error) {
      this.logger.error(`Error en getPokemonList: ${error.message}`);
      throw new HttpException(
        'Error al obtener lista de PokéAPI',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  /**
   * Busca por tipo y obtiene detalles.
   */
  async getPokemonByType(
    typeName: string,
    limit = 20,
  ): Promise<SimplifiedPokemon[]> {
    try {
      const url = `${this.baseUrl}/type/${typeName}`;
      this.logger.log(`Buscando por tipo: ${typeName}`);

      const response = await firstValueFrom(
        this.httpService.get<any>(url), // 'any' porque la estructura de /type es compleja
      );

      // La respuesta de type tiene estructura diferente: pokemon[].pokemon.name
      const pokemonNames = response.data.pokemon
        .slice(0, limit)
        .map((p: any) => p.pokemon.name);

      const detailPromises = pokemonNames.map((name: string) =>
        this.getPokemonByName(name),
      );

      return await Promise.all(detailPromises);
    } catch (error) {
      // Si falla el tipo, probablemente es 404
      if (error.response?.status === 404) {
        throw new HttpException(
          `El tipo '${typeName}' no existe`,
          HttpStatus.NOT_FOUND,
        );
      }
      this.logger.error(`Error en getPokemonByType: ${error.message}`);
      throw new HttpException(
        'Error al buscar por tipo',
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  // Manejo centralizado de errores
  private handleError(error: any, context: string | number): never {
    if (error.response?.status === 404) {
      this.logger.warn(`Pokémon '${context}' no encontrado.`);
      throw new HttpException(
        `Pokémon '${context}' no encontrado`,
        HttpStatus.NOT_FOUND,
      );
    }

    this.logger.error(
      `Error externo PokéAPI con '${context}': ${error.message}`,
    );
    throw new HttpException(
      'Error de comunicación con PokéAPI',
      HttpStatus.SERVICE_UNAVAILABLE,
    );
  }
}
