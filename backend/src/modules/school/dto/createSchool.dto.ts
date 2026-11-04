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

export interface UpdateSchoolDTO {
  name?: string;
  phone?: string;
  address?: string;
  monthlyFee?: number;
  maxUsers?: number;
  maxMessages?: number;
  isActive?: boolean;
}