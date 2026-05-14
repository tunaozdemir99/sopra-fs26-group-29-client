export interface Trip {
  tripId: number;
  title: string;
  location?: string;
  startDate: string;
  endDate: string;
  createdAt?: string;
  inviteUrl?: string;
  inviteActive?: boolean;
  adminUsername?: string;
  adminId?: number;
}
