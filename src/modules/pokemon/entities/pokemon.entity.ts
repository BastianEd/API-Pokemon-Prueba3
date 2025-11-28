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

  @Column({ type: 'varchar', nullable: true })
  imagenUrl: string | null;

  @Column('int', { default: 100 }) // Default para que registros viejos no queden nulos
  precio: number;

  // Permitimos texto largo y nulos (por si la API falla)
  @Column({ type: 'text', nullable: true })
  descripcion: string | null;
}
