export interface BucketItem {
  bucketItemId: number;
  name: string;
  description?: string;
  location?: string;
  /** Available once the backend exposes these fields on BucketItem */
  latitude?: number;
  longitude?: number;
  addedBy: { id: number; username: string };
  voteScore: number;
}
