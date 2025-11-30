import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

/**
 * Mock del AppService.
 * Incluso para servicios simples, es buena práctica mockear las dependencias
 * en los tests unitarios para garantizar aislamiento total.
 */
const mockAppService = {
  getHello: jest.fn(),
};

describe('AppController', () => {
  let appController: AppController;
  let appService: typeof mockAppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: mockAppService,
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    appService = app.get(AppService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  describe('root', () => {
    it('debe retornar "Hello World!" desde el servicio', () => {
      // 1. Arrange
      const expectedResult = 'Hello World!';
      mockAppService.getHello.mockReturnValue(expectedResult);

      // 2. Act
      const result = appController.getHello();

      // 3. Assert
      expect(appService.getHello).toHaveBeenCalled();
      expect(result).toBe(expectedResult);
    });
  });
});
