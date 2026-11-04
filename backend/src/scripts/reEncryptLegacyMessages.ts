/**
 * One-time migration: legacy AES-CBC message rows -> AES-256-GCM (gcm:v2).
 *
 * The old CBC key material is NOT in the codebase anymore. The operator —
 * who knows the historical values from the pre-removal source — supplies
 * them only via environment for this single run:
 *
 *   LEGACY_CBC_SECRET='...' LEGACY_CBC_SALT='...' npm run security:re-encrypt-legacy
 *   LEGACY_CBC_SECRET='...' LEGACY_CBC_SALT='...' npm run security:re-encrypt-legacy -- --apply
 *
 * Default is a dry run: it inventories CBC rows and reports how many would
 * be migrated, without writing anything. With --apply, each row is
 * decrypted with the legacy key, re-encrypted with the current GCM key and
 * verified (decrypt(new) === original plaintext) before being saved.
 * Delete this script (and the env values) once production reports 0 rows.
 */
import crypto from 'crypto';
import { AppDataSource } from '../config/data-source';
import { Message } from '../modules/message/message.entity';
import { decrypt, encrypt } from '../shared/utils/encryption';

const CBC_PATTERN = /^[0-9a-fA-F]{32}:[0-9a-fA-F]+$/;

function legacyDecrypt(ciphertext: string, legacyKey: Buffer): string {
  const [ivHex, dataHex] = ciphertext.split(':');
  const decipher = crypto.createDecipheriv('aes-256-cbc', legacyKey, Buffer.from(ivHex, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(dataHex, 'hex')), decipher.final()]).toString('utf8');
}

async function main(): Promise<void> {
  const apply = process.argv.includes('--apply');
  const legacySecret = process.env.LEGACY_CBC_SECRET;
  const legacySalt = process.env.LEGACY_CBC_SALT;

  await AppDataSource.initialize();
  try {
    const repo = AppDataSource.getRepository(Message);
    const all = await repo.find({ select: ['id', 'content'] });
    const cbcRows = all.filter((m) => typeof m.content === 'string' && CBC_PATTERN.test(m.content));
    const gcmRows = all.filter((m) => typeof m.content === 'string' && m.content.startsWith('gcm:'));
    const plaintextRows = all.length - cbcRows.length - gcmRows.length;

    console.log(`messages total=${all.length} gcm=${gcmRows.length} legacy-cbc=${cbcRows.length} plaintext/other=${plaintextRows}`);

    if (cbcRows.length === 0) {
      console.log('Nothing to migrate. CBC removal is complete for this database.');
      return;
    }
    if (!legacySecret || !legacySalt) {
      console.error('CBC rows exist but LEGACY_CBC_SECRET / LEGACY_CBC_SALT are not set. Supply the historical key material via environment for this one run.');
      process.exitCode = 2;
      return;
    }

    const legacyKey = crypto.scryptSync(legacySecret, legacySalt, 32);
    let migrated = 0;
    const failed: string[] = [];

    for (const row of cbcRows) {
      try {
        const plain = legacyDecrypt(row.content, legacyKey);
        if (!apply) {
          migrated += 1;
          continue;
        }
        const reEncrypted = encrypt(plain);
        if (decrypt(reEncrypted) !== plain) throw new Error('verification failed after re-encryption');
        row.content = reEncrypted;
        await repo.save(row);
        migrated += 1;
      } catch {
        failed.push(row.id);
      }
    }

    console.log(
      apply
        ? `Re-encrypted ${migrated}/${cbcRows.length} CBC rows to GCM. Failed: ${failed.length}${failed.length ? ` (${failed.join(', ')})` : ''}`
        : `Dry run: ${migrated}/${cbcRows.length} CBC rows are decryptable and would be migrated. Re-run with -- --apply to write.`,
    );
    if (failed.length > 0) process.exitCode = 1;
  } finally {
    if (AppDataSource.isInitialized) await AppDataSource.destroy();
  }
}

main().catch((error) => {
  console.error('Legacy re-encryption failed:', error instanceof Error ? error.message : error);
  process.exit(1);
});
