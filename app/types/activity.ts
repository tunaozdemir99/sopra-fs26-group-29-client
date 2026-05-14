export interface Activity {
  activityId: number;
  name: string;
  date: string; // "YYYY-MM-DD"
  startTime: string; // "HH:MM:SS"
  endTime: string; // "HH:MM:SS"
  fromBucketItem: boolean;
  locationName: string | null;
  latitude: number | null;
  longitude: number | null;
  durationMinutes: number | null;
  travelTimeToNextActivity: number | null;
  gapToNextActivityMinutes: number | null;
  hasOverlapConflict?: boolean | null;
  hasTravelTimeConflict?: boolean | null;
}
