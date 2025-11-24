import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

// @Entity le dice a TypeORM que esto es una tabla en la BD
@Entity()
export class Pokemon {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column()
  tipo: string;

  @Column({ nullable: true })
  imagenUrl: string; // Para integración con API externa

  @Column('int', { default: 100 }) // Default para que registros viejos no queden nulos
  precio: number;
}