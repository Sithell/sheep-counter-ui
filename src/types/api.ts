export interface Job {
  id: string;
  filename: string;
  status: JobStatus;
  created_at: string;
  result: DetectionResult | JobError | null;
}

export interface DetectionResult {
  sheep_count: number;
  image: string;
  duration: number;
  report: string;
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