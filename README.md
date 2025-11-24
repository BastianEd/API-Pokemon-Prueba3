<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Variables de Entorno (.env)

```
    # --- Configuración del Servidor ---
    PORT=3000
    
    # --- Configuración de Base de Datos (MySQL) ---
    DB_HOST=localhost
    DB_PORT=3306
    DB_USER=root
    DB_PASSWORD=root      # Cambia esto por tu contraseña local de MySQL
    DB_NAME=pokemon_db
    
    # --- Configuración de Seguridad (JWT) ---
    JWT_SECRET=EstaEsUnaClaveSuperSecreta_CambialaEnProduccion
    JWT_EXPIRES_IN=1d
```
### Creación de Base de Datos
```
   CREATE DATABASE pokemon_db;
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

### 📑 Documentación (Swagger)
```
http://localhost:3000/docs
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

### 🛠 Tecnologías y Patrones
Framework: NestJS (Arquitectura modular)
Database: MySQL & TypeORM
Auth: Passport & JWT Strategy (Guardas personalizadas)
Validation: class-validator & class-transformer
Docs: OpenAPI (Swagger)

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Desarrollado por

- Author - Bastian Rubio

### 💡 Notas de Mentoría sobre este README:

1.  **Sección "Setup" clara:** He separado la instalación, las variables de entorno y la base de datos en pasos numerados. Esto reduce la fricción inicial.
2.  **Snippet `.env` listo para usar:** Proveer un bloque de código copiable para el `.env` evita errores tipográficos comunes (como escribir mal `DB_HOST`).
3.  **Advertencias de Seguridad:** He añadido comentarios como `# Cambia esto por tu contraseña...` para inculcar prácticas de seguridad desde el inicio.
4.  **Acceso rápido a Swagger:** Poner el link a la documentación (`/docs`) en una sección visible ayuda a que otros desarrolladores (o testers) prueben tu API rápidamente sin leer código.

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
