export interface BucketItem {
  bucketItemId: number;
  name: string;
  description?: string;
  location?: string;
  /** Available once the backend exposes these fields on BucketItem */
  latitude?: number;
  longitude?: number;
  addedBy: string;
  voteScore: number;
}
