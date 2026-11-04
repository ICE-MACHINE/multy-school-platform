import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('surahs')
export class Surah {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'int', unique: true })
  number!: number;

  @Column()
  nameArabic!: string;

  @Column()
  nameEnglish!: string;

  @Column({ type: 'int' })
  totalAyahs!: number;

  @Column({ type: 'int' })
  juz!: number;
}