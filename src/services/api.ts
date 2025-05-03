import axios from 'axios';
import { Job, JobsResponse } from '../types/api';

const API_BASE_URL = 'http://localhost:8000'; // Update this with your actual API URL

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Include credentials in requests
});

// Add a response interceptor to handle CORS errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message === 'Network Error') {
      console.error('Network Error: Please check if the backend server is running and CORS is properly configured');
    }
    return Promise.reject(error);
  }
);

export const createJob = async (file: File): Promise<Job> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post<Job>('/job', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const getJobStatus = async (id: string): Promise<Job> => {
  const response = await api.get<Job>(`/job?id=${id}`);
  return response.data;
};

export const listJobs = async (limit: number = 10, offset: number = 0): Promise<JobsResponse> => {
  const response = await api.get<JobsResponse>(`/jobs?limit=${limit}&offset=${offset}`);
  return response.data;
}; 