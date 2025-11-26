import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';
import axios from 'axios';

// Interfaces para tipar la respuesta de PokeAPI y calmar a ESLint
interface PokeApiResult {
  name: string;
  url: string;
}

interface PokeApiResponse {
  results: PokeApiResult[];
}

interface PokeApiDetailResponse {
  types: { type: { name: string } }[];
  sprites: { front_default: string };
}

@Injectable()
export class PokemonService {
  constructor(
    @InjectRepository(Pokemon)
    private readonly pokemonRepository: Repository<Pokemon>,
  ) {}

  async create(createPokemonDto: CreatePokemonDto) {
    const pokemon = this.pokemonRepository.create(createPokemonDto);
    return await this.pokemonRepository.save(pokemon);
  }

  async findAllBasic() {
    return await this.pokemonRepository.find({
      select: ['id', 'nombre'],
    });
  }

  async findAllDetailed() {
    return await this.pokemonRepository.find();
  }

  async findOne(id: number) {
    const pokemon = await this.pokemonRepository.findOneBy({ id });
    if (!pokemon) throw new NotFoundException(`Pokemon #${id} no encontrado`);
    return pokemon;
  }

  // Este es el metodo update que faltaba definir para el Controller
  async update(id: number, updatePokemonDto: UpdatePokemonDto) {
    // preload busca por id y "parcha" el objeto con los datos nuevos
    const pokemon = await this.pokemonRepository.preload({
      id: id,
      ...updatePokemonDto,
    });

    if (!pokemon) throw new NotFoundException(`Pokemon #${id} no encontrado`);

    return await this.pokemonRepository.save(pokemon);
  }

  async remove(id: number) {
    const pokemon = await this.findOne(id);
    return await this.pokemonRepository.remove(pokemon);
  }

  // Metodo corregido con tipado para evitar errores de ESLint
  async seedFromPokeApi() {
    // 1. Tipamos la respuesta del axios.get<Tipo>(...)
    const { data } = await axios.get<PokeApiResponse>(
      'https://pokeapi.co/api/v2/pokemon?limit=5',
    );

    const promesas = data.results.map(async (p) => {
      // 2. Tipamos también la llamada de detalle
      const detalles = await axios.get<PokeApiDetailResponse>(p.url);

      return this.pokemonRepository.save({
        nombre: p.name,
        // 3. Ahora TypeScript sabe que .types existe y es un array
        tipo: detalles.data.types[0].type.name,
        imagenUrl: detalles.data.sprites.front_default,
        precio: Math.floor(Math.random() * 1000) + 100,
      });
    });

    return await Promise.all(promesas);
  }
}
