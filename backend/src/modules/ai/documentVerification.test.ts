import assert from 'node:assert';
import { ageInYearsAt, buildVerification, parseAgeYears } from './documentVision.service';

const student = { firstName: 'Amine', lastName: 'Benali', dateOfBirth: '2015-06-15' };

assert.strictEqual(parseAgeYears('10'), 10);
assert.strictEqual(parseAgeYears('10 years'), 10);
assert.strictEqual(parseAgeYears(10.8), 10);
assert.strictEqual(parseAgeYears('unknown'), null);
assert.strictEqual(ageInYearsAt('2015-06-15', new Date(Date.UTC(2026, 0, 20))), 10);
assert.strictEqual(ageInYearsAt('2015-06-15', new Date(Date.UTC(2026, 5, 15))), 11);
assert.strictEqual(ageInYearsAt('not-a-date', new Date()), null);

const match = buildVerification({
  student,
  fields: {
    title: 'Medical certificate',
    firstName: 'Amine',
    lastName: 'Benali',
    dateOfBirth: '2015-06-15',
    ageYears: '10',
    issueDate: '2026-01-20',
    startDate: '2026-01-19',
    endDate: '2026-01-20',
    issuer: 'Clinic',
  },
  confidence: 0.95,
  extractionSkipped: false,
});
assert.strictEqual(match.firstNameMatches, true);
assert.strictEqual(match.lastNameMatches, true);
assert.strictEqual(match.studentNameMatches, true);
assert.strictEqual(match.dateOfBirthMatches, true);
assert.strictEqual(match.ageMatches, true, 'stated age 10 at issue date 2026-01-20 (birthday in June)');
assert.strictEqual(match.documentAgeYears, 10);
assert.strictEqual(match.studentAgeYears, 10);
assert.strictEqual(match.issueDateValid, true);

const mismatch = buildVerification({
  student,
  fields: {
    firstName: 'Yasmine',
    lastName: 'Benali',
    dateOfBirth: '2014-06-15',
    ageYears: '9',
    issueDate: '2026-01-20',
    startDate: '2026-01-19',
  },
  confidence: 0.9,
  extractionSkipped: false,
});
assert.strictEqual(mismatch.firstNameMatches, false);
assert.strictEqual(mismatch.dateOfBirthMatches, false);
assert.strictEqual(mismatch.ageMatches, false);
assert.ok(mismatch.checks.includes('first_name_mismatch'));
assert.ok(mismatch.checks.includes('date_of_birth_mismatch'));
assert.ok(mismatch.checks.includes('age_mismatch'));

const arabic = buildVerification({
  student: { firstName: 'امين', lastName: 'بن علي', dateOfBirth: '2015-06-15' },
  fields: { studentName: 'أمين بن علي', dateOfBirth: '2015-06-15', issueDate: '2026-01-20', startDate: '2026-01-19' },
  confidence: 0.9,
  extractionSkipped: false,
});
assert.strictEqual(arabic.studentNameMatches, true, 'Arabic diacritic/alef variants must match');

const missing = buildVerification({
  student,
  fields: { firstName: 'Amine', lastName: 'Benali', startDate: '2026-01-19' },
  confidence: null,
  extractionSkipped: true,
});
assert.strictEqual(missing.dateOfBirthMatches, null);
assert.strictEqual(missing.issueDateValid, false);
assert.ok(missing.checks.includes('date_of_birth_missing'));
assert.ok(missing.checks.includes('issue_date_missing_or_invalid'));

const noStudent = buildVerification({
  student: null,
  fields: { firstName: 'Someone', dateOfBirth: '2015-06-15', issueDate: '2026-01-20', startDate: '2026-01-19' },
  confidence: 0.9,
  extractionSkipped: false,
});
assert.strictEqual(noStudent.studentNameMatches, null);
assert.strictEqual(noStudent.dateOfBirthMatches, null);
assert.strictEqual(noStudent.ageMatches, null);
assert.strictEqual(noStudent.documentAgeYears, 10);

console.log('document verification tests passed');
