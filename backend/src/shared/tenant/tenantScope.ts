import { ApiError } from '../utils/ApiError';

export interface TenantActor {
  id: string;
  role: string;
  schoolId?: string;
  slug?: string;
}

export function actorMatchesSchool(
  actor: TenantActor,
  resolvedSchoolId: string | undefined,
  schoolSlug?: string,
): boolean {
  if (!resolvedSchoolId) return true;
  if (!actor.schoolId) return actor.role === 'super_admin';
  return actor.schoolId === resolvedSchoolId || (Boolean(schoolSlug) && actor.slug === schoolSlug);
}

export function assertActorSchoolAccess(
  actor: TenantActor,
  resolvedSchoolId: string | undefined,
  schoolSlug?: string,
): void {
  if (!actorMatchesSchool(actor, resolvedSchoolId, schoolSlug)) {
    throw ApiError.forbidden('Access denied for this school');
  }
}

export function scopedWhere<T extends Record<string, unknown>>(
  schoolId: string,
  where: T = {} as T,
): T & { schoolId: string } {
  return { ...where, schoolId };
}

export function assertEntityInSchool(
  entitySchoolId: string | null | undefined,
  schoolId: string,
  label = 'Resource',
): void {
  if (!entitySchoolId || entitySchoolId !== schoolId) {
    throw ApiError.notFound(`${label} not found`);
  }
}

export function assertParentOwnsStudent(studentParentId: string | null | undefined, actor: TenantActor): void {
  if (actor.role !== 'parent') return;
  if (!studentParentId || studentParentId !== actor.id) {
    throw ApiError.forbidden('You do not have access to this student');
  }
}

export class TenantScopedRepository<T extends { schoolId?: string | null }> {
  constructor(private readonly repo: {
    findOne(options: unknown): Promise<T | null>;
    find(options: unknown): Promise<T[]>;
    createQueryBuilder(alias: string): unknown;
  }) {}

  async getByIdOrThrow(schoolId: string, id: string, label = 'Resource'): Promise<T> {
    const entity = await this.repo.findOne({ where: { id, schoolId } });
    if (!entity) throw ApiError.notFound(`${label} not found`);
    return entity;
  }

  async findInSchool(schoolId: string, where: Record<string, unknown> = {}): Promise<T[]> {
    return this.repo.find({ where: scopedWhere(schoolId, where) });
  }
}
