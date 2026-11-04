import { Request } from 'express';

export function getSchoolId(req: Request): string {
  return (req as any).resolvedSchoolId || req.params.schoolId;
}
