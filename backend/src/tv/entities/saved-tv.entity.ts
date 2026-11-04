import {
  Entity,
  PrimaryColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('saved_tvs')
export class SavedTvEntity {
  @PrimaryColumn({ type: 'varchar', length: 64 })
  ip: string;

  @Column({ type: 'varchar', length: 128, default: 'Android TV' })
  name: string;

  @Column({ type: 'varchar', length: 128, default: 'Android TV' })
  model: string;

  @Column({ type: 'jsonb', nullable: true })
  certificate: any;

  @Column({ type: 'bigint', default: () => 'extract(epoch from now()) * 1000' })
  pairedAt: number;

  @Column({ type: 'bigint', nullable: true })
  lastConnected: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

