import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Paper,
  Typography,
  CircularProgress,
  List,
  ListItemText,
  Divider,
  Grid,
  Button,
  ListItemButton,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
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
  const navigate = useNavigate();
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
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Grid 
        container 
        spacing={3} 
        justifyContent="center"
        sx={{ 
          maxWidth: '1400px',
          margin: '0 auto',
        }}
      >
        <Grid item xs={12} md={8} sx={{ minWidth: '600px' }}>
          <Paper elevation={3} sx={{ p: 4, height: '100%' }}>
            <Typography variant="h5" gutterBottom>
              Job Details
            </Typography>
            <Box sx={{ mb: 3 }}>
              <Typography variant="body1" color="text.secondary" gutterBottom>
                Filename: {currentJob.filename}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Status: {STATUS_MESSAGES[currentJob.status]}
              </Typography>
            </Box>

            {currentJob.status === 'done' && currentJob.result && 'sheep_count' in currentJob.result && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Results
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  Sheep Count: {currentJob.result.sheep_count}
                </Typography>
                <Box 
                  sx={{ 
                    mt: 2,
                    borderRadius: 1,
                    overflow: 'hidden',
                    boxShadow: 1,
                  }}
                >
                  <img
                    src={`${API_BASE_URL}${currentJob.result.image}`}
                    alt="Processed image"
                    style={{ 
                      width: '100%',
                      height: 'auto',
                      display: 'block',
                    }}
                    onError={(e) => {
                      console.error('Error loading image:', e);
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

        <Grid item xs={12} md={4} sx={{ minWidth: '300px' }}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Recent Jobs
              </Typography>
              <Button
                variant="contained"
                fullWidth
                startIcon={<CloudUploadIcon />}
                onClick={() => navigate('/')}
                sx={{ mb: 2 }}
              >
                New Job
              </Button>
            </Box>
            <List sx={{ p: 0 }}>
              {recentJobs.map((job) => (
                <Box key={job.id}>
                  <ListItemButton
                    onClick={() => navigate(`/job/${job.id}`)}
                    selected={job.id === currentJob.id}
                    sx={{
                      py: 1.5,
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.12)',
                        },
                      },
                    }}
                  >
                    <ListItemText
                      primary={job.filename}
                      secondary={`Status: ${STATUS_MESSAGES[job.status]}`}
                      primaryTypographyProps={{
                        sx: { fontWeight: job.id === currentJob.id ? 600 : 400 },
                      }}
                    />
                  </ListItemButton>
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