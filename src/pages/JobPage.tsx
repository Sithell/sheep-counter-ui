import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Divider,
  Grid,
} from '@mui/material';
import { getJobStatus, listJobs } from '../services/api';
import { Job, JobStatus } from '../types/api';

const API_BASE_URL = 'http://localhost:8000'; // Match this with your backend URL

const STATUS_MESSAGES: Record<JobStatus, string> = {
  queued: 'Job is in queue',
  processing: 'Processing image...',
  done: 'Processing complete',
  error: 'An error occurred',
};

export default function JobPage() {
  const { id } = useParams<{ id: string }>();
  const [currentJob, setCurrentJob] = useState<Job | null>(null);
  const [recentJobs, setRecentJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        const [job, jobsResponse] = await Promise.all([
          getJobStatus(id),
          listJobs(10, 0),
        ]);
        setCurrentJob(job);
        setRecentJobs(jobsResponse.items);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!currentJob) {
    return (
      <Container>
        <Typography variant="h5" color="error">
          Job not found
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Job Details
            </Typography>
            <Typography variant="body1" gutterBottom>
              Filename: {currentJob.filename}
            </Typography>
            <Typography variant="body1" gutterBottom>
              Status: {STATUS_MESSAGES[currentJob.status]}
            </Typography>

            {currentJob.status === 'done' && currentJob.result && 'sheep_count' in currentJob.result && (
              <Box mt={2}>
                <Typography variant="h6" gutterBottom>
                  Results
                </Typography>
                <Typography variant="body1">
                  Sheep Count: {currentJob.result.sheep_count}
                </Typography>
                <Box mt={2}>
                  <img
                    src={`${API_BASE_URL}${currentJob.result.image}`}
                    alt="Processed image"
                    style={{ maxWidth: '100%', height: 'auto' }}
                    onError={(e) => {
                      console.error('Error loading image:', e);
                      // You can add a fallback image or error message here
                    }}
                  />
                </Box>
              </Box>
            )}

            {currentJob.status === 'error' && currentJob.result && 'error' in currentJob.result && (
              <Typography color="error" mt={2}>
                Error: {currentJob.result.error}
              </Typography>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Jobs
            </Typography>
            <List>
              {recentJobs.map((job) => (
                <Box key={job.id}>
                  <ListItem>
                    <ListItemText
                      primary={job.filename}
                      secondary={`Status: ${STATUS_MESSAGES[job.status]}`}
                    />
                  </ListItem>
                  <Divider />
                </Box>
              ))}
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
} 