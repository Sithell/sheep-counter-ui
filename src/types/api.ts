export interface Job {
  id: string;
  filename: string;
  status: JobStatus;
  result: DetectionResult | JobError | null;
}

export interface DetectionResult {
  sheep_count: number;
  image: string;
}

export interface JobError {
  error: string;
}

export type JobStatus = 'queued' | 'processing' | 'done' | 'error';

export interface JobsResponse {
  items: Job[];
  total: number;
  limit: number;
  offset: number;
} 