import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  name: string;

  @Column({ type: 'varchar', unique: true }) // El email no se puede repetir
  email: string;

  @Column({ type: 'varchar', select: false }) // select: false para que NO devuelva la password al hacer consultas por defecto
  password: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;
}