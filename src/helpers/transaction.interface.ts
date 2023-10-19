export interface Transaction {
  id?: number; 
  categoryId: number;
  userId: number;
  isShared: boolean;
  value: number;
  registerDate: Date;
  description: string;
}
