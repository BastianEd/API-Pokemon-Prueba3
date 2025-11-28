import {
  Injectable,
  NotFoundException,
  Logger,
  OnModuleInit, // 1. Importamos la interfaz del ciclo de vida
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';
import { PokeApiService } from './services/pokeapi.service';

@Injectable()
export class PokemonService implements OnModuleInit {
  // 2. Implementamos la interfaz
  private readonly logger = new Logger(PokemonService.name);

  constructor(
    @InjectRepository(Pokemon)
    private readonly pokemonRepository: Repository<Pokemon>,
    private readonly pokeApiService: PokeApiService,
  ) {}

  // 3. Metodo del ciclo de vida: Se ejecuta al iniciar el módulo
  async onModuleInit() {
    // 🔹 CONFIGURACIÓN: Aquí defines cuántos quieres importar al inicio.
    // Poner 300 es un buen balance entre tener datos y velocidad de inicio.
    await this.autoSeed(300);
  }

  // Utilidad para esperar (delay) y no saturar la API
  private delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Ejecuta el seed automático con un límite configurable.
   * @param limitRequested Cantidad máxima de pokémones a importar.
   */
  private async autoSeed(limitRequested: number) {
    try {
      const count = await this.pokemonRepository.count();

      if (count === 0) {
        this.logger.log(
          `📉 BD vacía. Preparando carga inicial de ${limitRequested} Pokémon...`,
        );

        // 1. Obtenemos el total real de la API para validar
        const apiTotal = await this.pokeApiService.getTotalCount();

        // 🔹 LÓGICA SENIOR: Defensive Programming
        // Si pides 300 pero la API solo tiene 150, usamos 150.
        // Si pides 300 y la API tiene 1300, usamos 300.
        const totalToImport = Math.min(limitRequested, apiTotal);

        this.logger.log(
          `🎯 Objetivo: Importar ${totalToImport} registros (de ${apiTotal} disponibles en API).`,
        );

        const BATCH_SIZE = 50;

        await this.pokemonRepository.clear();

        // 2. Iteramos solo hasta llegar a 'totalToImport' (ej: 300)
        for (let offset = 0; offset < totalToImport; offset += BATCH_SIZE) {
          // Ajustamos el limit del último lote para no pasarnos del totalToImport
          const limit = Math.min(BATCH_SIZE, totalToImport - offset);

          this.logger.log(
            `⏳ Procesando lote: Offset ${offset} - Trayendo ${limit} ítems...`,
          );

          const pokemonList = await this.pokeApiService.getPokemonList(
            limit,
            offset,
          );

          const entities = pokemonList.map((pokeData) => {
            const tipo = Array.isArray(pokeData.types)
              ? pokeData.types.join(', ')
              : (pokeData.types ?? '');

            return this.pokemonRepository.create({
              nombre: pokeData.name,
              tipo,
              imagenUrl: pokeData.image,
              precio: pokeData.price,
              descripcion: pokeData.description,
            });
          });

          await this.pokemonRepository.save(entities);

          // Pausa breve para no saturar
          await this.delay(500);
        }

        this.logger.log(
          `🚀 ¡Seed completado! Se han insertado los primeros ${totalToImport} Pokémon.`,
        );
      } else {
        this.logger.log(
          `✅ Base de datos ya tiene ${count} registros. Seed omitido.`,
        );
      }
    } catch (error) {
      this.logger.error('❌ Error durante el seed limitado', error);
    }
  }
  // ═══════════════════════════════════════════════════════════════
  // METODOS CRUD
  // ═══════════════════════════════════════════════════════════════
  async create(createPokemonDto: CreatePokemonDto): Promise<Pokemon> {
    const pokemon = this.pokemonRepository.create(createPokemonDto);
    return await this.pokemonRepository.save(pokemon);
  }

  async findAllBasic(): Promise<Pokemon[]> {
    return await this.pokemonRepository.find({
      select: ['id', 'nombre'],
    });
  }

  async findAllDetailed(): Promise<Pokemon[]> {
    return await this.pokemonRepository.find();
  }

  async findOne(id: number): Promise<Pokemon> {
    const pokemon = await this.pokemonRepository.findOneBy({ id });
    if (!pokemon) {
      throw new NotFoundException(`Pokemon #${id} no encontrado`);
    }
    return pokemon;
  }

  async update(
    id: number,
    updatePokemonDto: UpdatePokemonDto,
  ): Promise<Pokemon> {
    const pokemon = await this.pokemonRepository.preload({
      id: id,
      ...updatePokemonDto,
    });
    if (!pokemon) {
      throw new NotFoundException(`Pokemon #${id} no encontrado`);
    }
    return await this.pokemonRepository.save(pokemon);
  }

  async remove(id: number): Promise<Pokemon> {
    const pokemon = await this.findOne(id);
    return await this.pokemonRepository.remove(pokemon);
  }

  // ═══════════════════════════════════════════════════════════════
  // MÉTODOS DE INTEGRACIÓN API EXTERNA
  // ═══════════════════════════════════════════════════════════════

  async getFromPokeApi(nameOrId: string | number) {
    this.logger.log(`Consultando PokéAPI para: ${nameOrId}`);
    return await this.pokeApiService.getPokemonByName(nameOrId);
  }

  async getListFromPokeApi(limit = 20, offset = 0) {
    this.logger.log(
      `Obteniendo lista de ${limit} Pokémon desde PokéAPI (offset: ${offset})`,
    );
    return await this.pokeApiService.getPokemonList(limit, offset);
  }

  async getByTypeFromPokeApi(type: string, limit = 20) {
    this.logger.log(`Buscando Pokémon de tipo '${type}' en PokéAPI`);
    return await this.pokeApiService.getPokemonByType(type, limit);
  }

  async seedFromPokeApi(limit = 20): Promise<Pokemon[]> {
    this.logger.log(`Iniciando seed con ${limit} Pokémon con descripciones...`);

    const pokemonList = await this.pokeApiService.getPokemonList(limit, 0);

    const entities = pokemonList.map((pokeData) => {
      const tipo = Array.isArray(pokeData.types)
        ? pokeData.types.join(', ')
        : (pokeData.types ?? '');
      return this.pokemonRepository.create({
        nombre: pokeData.name,
        tipo,
        imagenUrl: pokeData.image,
        precio: pokeData.price,
        descripcion: pokeData.description,
      });
    });
    // NOTA: .clear() es peligroso en producción real sin backups, úsalo con cuidado.
    // Para este ejercicio académico está bien.
    //await this.pokemonRepository.clear();

    const savedPokemons = await this.pokemonRepository.save(entities);
    this.logger.log(`✅ ${savedPokemons.length} Pokémon guardados con éxito.`);

    return savedPokemons;
  }

  async importFromPokeApi(nameOrId: string | number): Promise<Pokemon> {
    this.logger.log(`Importando '${nameOrId}' desde PokéAPI a BD local...`);
    const pokeData = await this.pokeApiService.getPokemonByName(nameOrId);

    const newPokemon = this.pokemonRepository.create({
      nombre: pokeData.name,
      tipo: pokeData.types.join(', '),
      imagenUrl: pokeData.image,
      precio: pokeData.price,
      descripcion: pokeData.description,
    });

    const savedPokemon = await this.pokemonRepository.save(newPokemon);

    this.logger.log(
      `✅ Pokémon '${savedPokemon.nombre}' importado con ID ${savedPokemon.id}`,
    );
    return savedPokemon;
  }
}
