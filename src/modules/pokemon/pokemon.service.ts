import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';
import { PokeApiService } from './services/pokeapi.service';

@Injectable()
export class PokemonService {
  private readonly logger = new Logger(PokemonService.name);

  constructor(
    @InjectRepository(Pokemon)
    private readonly pokemonRepository: Repository<Pokemon>,
    private readonly pokeApiService: PokeApiService,
  ) {}

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
    this.logger.log(`Iniciando seed con ${limit} Pokémon desde PokéAPI...`);
    const pokemonList = await this.pokeApiService.getPokemonList(limit, 0);

    // CAMBIO: Usamos .create() primero para asegurar tipado correcto
    const entities = pokemonList.map((pokeData) => {
      return this.pokemonRepository.create({
        nombre: pokeData.name,
        tipo: pokeData.types[0],
        imagenUrl: pokeData.image, // Ahora compatible gracias al cambio en entity
        precio: pokeData.price,
      });
    });

    // Guardamos las entidades ya creadas
    const savedPokemons = await this.pokemonRepository.save(entities);
    this.logger.log(`✅ Se guardaron ${savedPokemons.length} Pokémon en la BD`);

    return savedPokemons;
  }

  async importFromPokeApi(nameOrId: string | number): Promise<Pokemon> {
    this.logger.log(`Importando '${nameOrId}' desde PokéAPI a BD local...`);
    const pokeData = await this.pokeApiService.getPokemonByName(nameOrId);

    // CAMBIO: Usamos .create() primero
    const newPokemon = this.pokemonRepository.create({
      nombre: pokeData.name,
      tipo: pokeData.types.join(', '),
      imagenUrl: pokeData.image,
      precio: pokeData.price,
    });

    // Guardamos la entidad
    const savedPokemon = await this.pokemonRepository.save(newPokemon);

    this.logger.log(
      `✅ Pokémon '${savedPokemon.nombre}' importado con ID ${savedPokemon.id}`,
    );
    return savedPokemon;
  }
}
