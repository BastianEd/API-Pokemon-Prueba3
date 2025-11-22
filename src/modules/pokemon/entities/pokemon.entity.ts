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

  @Column({ default: 0 })
  nivel: number; // Dato extra para v2

  @Column({ nullable: true })
  imagenUrl: string; // Para integración con API externa
}