import { Test, TestingModule } from '@nestjs/testing';
import { PokemonController } from './pokemon.controller';
import { PokemonService } from './pokemon.service';
import { CreatePokemonDto } from './dto/create-pokemon.dto';
import { Pokemon } from './entities/pokemon.entity';
import { RolesGuard } from '../auth/guards/roles.guard';

/**
 * Mock del PokemonService con métodos tipados como jest.Mock
 */
const mockPokemonService = {
  findAllBasic: jest.fn(),
  create: jest.fn(),
  findAllDetailed: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getFromPokeApi: jest.fn(),
};

describe('PokemonController', () => {
  let controller: PokemonController;
  let service: typeof mockPokemonService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PokemonController],
      providers: [
        {
          provide: PokemonService,
          useValue: mockPokemonService,
        },
      ],
    })
      // Usamos el import estático en lugar de require()
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get<PokemonController>(PokemonController);
    service = module.get(PokemonService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAllV1', () => {
    it('debe retornar lista básica desde el servicio', async () => {
      const resultMock = [{ id: 1, nombre: 'Test' }] as Pokemon[];
      service.findAllBasic.mockResolvedValue(resultMock);

      const result = await controller.findAllV1();

      expect(service.findAllBasic).toHaveBeenCalled();
      expect(result).toEqual(resultMock);
    });
  });

  describe('create', () => {
    it('debe llamar a service.create con el DTO correcto', async () => {
      // Usamos cast seguro para evitar 'unsafe assignment'
      const dto = {
        nombre: 'Mewtwo',
        tipo: 'Psíquico',
        precio: 999,
        imagenUrl: 'url',
      } as CreatePokemonDto;

      const createdMock = { id: 1, ...dto } as Pokemon;

      service.create.mockResolvedValue(createdMock);

      const result = await controller.create(dto);

      expect(service.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(createdMock);
    });
  });

  describe('findOne', () => {
    it('debe retornar un pokemon por id', async () => {
      const mockPoke = { id: 5, nombre: 'Charmeleon' } as Pokemon;
      service.findOne.mockResolvedValue(mockPoke);

      const result = await controller.findOne(5);

      expect(service.findOne).toHaveBeenCalledWith(5);
      expect(result).toEqual(mockPoke);
    });
  });

  describe('getFromPokeApi', () => {
    it('debe integrar la llamada al servicio externo via controller', async () => {
      const apiResponse = { name: 'snorlax', id: 143 };
      service.getFromPokeApi.mockResolvedValue(apiResponse);

      const result = await controller.getFromPokeApi('snorlax');

      expect(service.getFromPokeApi).toHaveBeenCalledWith('snorlax');
      expect(result).toEqual(apiResponse);
    });
  });
});
