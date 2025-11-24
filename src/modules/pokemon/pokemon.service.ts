import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';
import axios from 'axios'; // Para conectar con API externa si hace falta

@Injectable()
export class PokemonService {
  // Inyectamos el repositorio para poder hablar con la BD
  constructor(
    @InjectRepository(Pokemon)
    private readonly pokemonRepository: Repository<Pokemon>,
  ) {}

  async create(createPokemonDto: CreatePokemonDto) {
    // Crea la instancia
    const pokemon = this.pokemonRepository.create(createPokemonDto);
    // Guarda en BD
    return await this.pokemonRepository.save(pokemon);
  }

  // Versión básica (v1)
  async findAllBasic() {
    // Select solo devuelve campos específicos
    return await this.pokemonRepository.find({
      select: ['id', 'nombre'],
    });
  }

  // Versión detallada (v2)
  async findAllDetailed() {
    return await this.pokemonRepository.find();
  }

  async findOne(id: number) {
    const pokemon = await this.pokemonRepository.findOneBy({ id });
    if (!pokemon) throw new NotFoundException(`Pokemon #${id} no encontrado`);
    return pokemon;
  }

  async remove(id: number) {
    const pokemon = await this.findOne(id);
    return await this.pokemonRepository.remove(pokemon);
  }

  // Método actualizado
  async seedFromPokeApi() {
    const { data } = await axios.get(
      'https://pokeapi.co/api/v2/pokemon?limit=5',
    );

    const promesas = data.results.map(async (p: any) => {
      const detalles = await axios.get(p.url);

      return this.pokemonRepository.save({
        nombre: p.name,
        tipo: detalles.data.types[0].type.name,
        imagenUrl: detalles.data.sprites.front_default,
        precio: Math.floor(Math.random() * 1000) + 100, // Genera precio aleatorio entre 100 y 1100
      });
    });

    return await Promise.all(promesas);
  }
}
