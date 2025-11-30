import { Test, TestingModule } from '@nestjs/testing';
import { PokemonService } from './pokemon.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Pokemon } from './entities/pokemon.entity';
import { PokeApiService } from './services/pokeapi.service';
import { NotFoundException, Logger } from '@nestjs/common';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { UpdatePokemonDto } from './dto/update-pokemon.dto';

/**
 * Nivel de documentación: Semi-senior
 * Definimos el objeto Mock con sus métodos como jest.Mock explícitos.
 * Esto ayuda a evitar errores de 'unbound method' en los expects.
 */
const mockPokemonRepository = {
  create: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  findOneBy: jest.fn(),
  preload: jest.fn(),
  remove: jest.fn(),
  count: jest.fn(),
  clear: jest.fn(),
};

const mockPokeApiService = {
  getTotalCount: jest.fn(),
  getPokemonList: jest.fn(),
  getPokemonByName: jest.fn(),
  getPokemonByType: jest.fn(),
};

describe('PokemonService', () => {
  let service: PokemonService;
  // Usamos 'typeof mockPokemonRepository' para que TS sepa que son funciones jest.Mock
  let repository: typeof mockPokemonRepository;
  let pokeApi: typeof mockPokeApiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PokemonService,
        {
          provide: getRepositoryToken(Pokemon),
          useValue: mockPokemonRepository,
        },
        {
          provide: PokeApiService,
          useValue: mockPokeApiService,
        },
      ],
    }).compile();

    service = module.get<PokemonService>(PokemonService);
    repository = module.get(getRepositoryToken(Pokemon));
    pokeApi = module.get(PokeApiService);

    jest.clearAllMocks();
    // Spies seguros para evitar logs en consola durante tests
    jest.spyOn(Logger.prototype, 'log').mockImplementation(() => {});
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear y guardar un pokemon exitosamente', async () => {
      // Arrange
      // Usamos cast seguro (unknown -> Type) o Partial para evitar 'unsafe assignment of any'
      const createDto = {
        nombre: 'Pikachu',
        tipo: 'Eléctrico',
        precio: 100,
        imagenUrl: 'http://img.com',
      } as unknown as CreatePokemonDto;

      const expectedPokemon = { id: 1, ...createDto } as Pokemon;

      repository.create.mockReturnValue(expectedPokemon);
      repository.save.mockResolvedValue(expectedPokemon);

      // Act
      const result = await service.create(createDto);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(createDto);
      expect(repository.save).toHaveBeenCalledWith(expectedPokemon);
      expect(result).toEqual(expectedPokemon);
    });
  });

  describe('findAllBasic', () => {
    it('debe retornar un array de pokemones con select específico', async () => {
      const mockPokemons = [
        { id: 1, nombre: 'Bulbasaur' },
        { id: 2, nombre: 'Ivysaur' },
      ];
      repository.find.mockResolvedValue(mockPokemons);

      const result = await service.findAllBasic();

      expect(repository.find).toHaveBeenCalledWith({
        select: ['id', 'nombre'],
      });
      expect(result).toEqual(mockPokemons);
    });
  });

  describe('findOne', () => {
    it('debe retornar un pokemon si existe', async () => {
      const mockPokemon = { id: 1, nombre: 'Charizard' };
      repository.findOneBy.mockResolvedValue(mockPokemon);

      const result = await service.findOne(1);

      expect(repository.findOneBy).toHaveBeenCalledWith({ id: 1 });
      expect(result).toEqual(mockPokemon);
    });

    it('debe lanzar NotFoundException si el pokemon no existe', async () => {
      repository.findOneBy.mockResolvedValue(null);
      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('debe actualizar un pokemon si existe', async () => {
      const updateDto = { nombre: 'Charizard X' } as UpdatePokemonDto;
      const updatedPokemon = { id: 1, nombre: 'Charizard X', tipo: 'Fuego' };

      repository.preload.mockResolvedValue(updatedPokemon);
      repository.save.mockResolvedValue(updatedPokemon);

      const result = await service.update(1, updateDto);

      expect(repository.preload).toHaveBeenCalledWith({
        id: 1,
        ...updateDto,
      });
      expect(repository.save).toHaveBeenCalledWith(updatedPokemon);
      expect(result).toEqual(updatedPokemon);
    });

    it('debe lanzar NotFoundException si preload retorna null', async () => {
      repository.preload.mockResolvedValue(null);
      const updateDto = { nombre: 'Test' } as UpdatePokemonDto;
      await expect(service.update(1, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('debe eliminar un pokemon si existe', async () => {
      const mockPokemon = { id: 1, nombre: 'Squirtle' };
      repository.findOneBy.mockResolvedValue(mockPokemon);
      repository.remove.mockResolvedValue(mockPokemon);

      const result = await service.remove(1);

      expect(repository.remove).toHaveBeenCalledWith(mockPokemon);
      expect(result).toEqual(mockPokemon);
    });
  });

  describe('getFromPokeApi', () => {
    it('debe llamar al servicio PokeApiService correctamente', async () => {
      const mockApiData = { name: 'mew', id: 151 };
      pokeApi.getPokemonByName.mockResolvedValue(mockApiData);

      const result = await service.getFromPokeApi('mew');

      expect(pokeApi.getPokemonByName).toHaveBeenCalledWith('mew');
      expect(result).toEqual(mockApiData);
    });
  });
});
