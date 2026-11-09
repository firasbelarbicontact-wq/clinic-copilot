export interface RatingSummary {
  doctorId: string;
  average: number;
  count: number;
  distribution: Record<string, number>;
}

export interface PublicReview {
  id: string;
  rating: number;
  comment: string | null;
  authorName: string;
  createdAt: string;
}

export interface MyReview {
  id: string;
  doctorId: string;
  rating: number;
  comment: string | null;
  authorName: string;
  status: 'PUBLISHED' | 'HIDDEN';
  createdAt: string;
  updatedAt: string;
}