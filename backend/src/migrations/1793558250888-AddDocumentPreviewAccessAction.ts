import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentPreviewAccessAction1793558250888 implements MigrationInterface {
    name = 'AddDocumentPreviewAccessAction1793558250888'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`ai_document_access_logs\` MODIFY \`action\` enum ('upload', 'view', 'download_decrypted', 'preview', 'confirm', 'approve', 'reject') NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`ai_document_access_logs\` MODIFY \`action\` enum ('upload', 'view', 'download_decrypted', 'confirm', 'approve', 'reject') NOT NULL`);
    }

}
