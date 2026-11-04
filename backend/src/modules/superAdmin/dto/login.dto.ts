export interface LoginDTO {
  phone: string;
  password: string;
}

export interface CreateSchoolDTO {
  name: string;
  slug: string;
  type: 'quranic' | 'private' | 'kindergarten';
  phone: string;
  address: string;
  monthlyFee: number;
  maxUsers?: number;
  maxMessages?: number;
}