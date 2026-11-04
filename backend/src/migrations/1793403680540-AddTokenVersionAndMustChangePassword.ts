import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTokenVersionAndMustChangePassword1793403680540 implements MigrationInterface {
    name = 'AddTokenVersionAndMustChangePassword1793403680540'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`super_admins\` ADD \`tokenVersion\` int NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`super_admins\` ADD \`mustChangePassword\` tinyint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE \`school_admins\` ADD \`tokenVersion\` int NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`parents\` ADD \`tokenVersion\` int NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`teachers\` ADD \`tokenVersion\` int NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`teachers\` DROP COLUMN \`tokenVersion\``);
        await queryRunner.query(`ALTER TABLE \`parents\` DROP COLUMN \`tokenVersion\``);
        await queryRunner.query(`ALTER TABLE \`school_admins\` DROP COLUMN \`tokenVersion\``);
        await queryRunner.query(`ALTER TABLE \`super_admins\` DROP COLUMN \`mustChangePassword\``);
        await queryRunner.query(`ALTER TABLE \`super_admins\` DROP COLUMN \`tokenVersion\``);
    }

}
