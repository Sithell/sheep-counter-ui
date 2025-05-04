import { useState, useEffect, useRef } from 'react';
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
  Pagination,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import SheepIcon from '@mui/icons-material/Pets';
import { getJobStatus, listJobs, createJob } from '../services/api';
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
  const [isUploading, setIsUploading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const jobsPerPage = 5;
  const pollingInterval = useRef<NodeJS.Timeout>();
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Function to check if job status is final
  const isFinalStatus = (status: JobStatus) => {
    return status === 'done' || status === 'error';
  };

  // Function to start polling for job status
  const startPolling = (jobId: string) => {
    // Clear any existing interval
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    // Start new polling interval
    pollingInterval.current = setInterval(async () => {
      try {
        const updatedJob = await getJobStatus(jobId);
        setCurrentJob(updatedJob);
        
        // Update the job in recent jobs list
        setRecentJobs(prevJobs => 
          prevJobs.map(job => job.id === updatedJob.id ? updatedJob : job)
        );

        // Stop polling if job is in final state
        if (isFinalStatus(updatedJob.status)) {
          clearInterval(pollingInterval.current);
        }
      } catch (error) {
        console.error('Error polling job status:', error);
        clearInterval(pollingInterval.current);
      }
    }, 2000); // Poll every 2 seconds
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const jobsResponse = await listJobs(jobsPerPage, (currentPage - 1) * jobsPerPage);
        // Sort jobs by creation date, newest first
        const sortedJobs = [...jobsResponse.items].sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        setRecentJobs(sortedJobs);
        setTotalPages(Math.ceil(jobsResponse.total / jobsPerPage));

        if (id) {
          const job = await getJobStatus(id);
          setCurrentJob(job);
          
          // Start polling if job is not in final state
          if (!isFinalStatus(job.status)) {
            startPolling(id);
          }
        } else {
          setCurrentJob(null);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Cleanup function to clear interval when component unmounts or id changes
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [id, currentPage]);

  const handlePageChange = (_event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const job = await createJob(file);
      navigate(`/job/${job.id}`);
    } catch (error) {
      console.error('Error uploading file:', error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      const file = files[0];
      if (file.type.startsWith('image/')) {
        await handleFileUpload({ target: { files: [file] } } as React.ChangeEvent<HTMLInputElement>);
      }
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
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
            {currentJob ? (
              <>
                <Typography variant="h5" gutterBottom>
                  Job Details
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Filename: {currentJob.filename}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    Status: {STATUS_MESSAGES[currentJob.status]}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    Created: {new Date(currentJob.created_at).toLocaleString()}
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
                    <Typography variant="body1" sx={{ mb: 2 }}>
                      Processing Time: {(currentJob.result.duration / 1000).toFixed(2)} seconds
                    </Typography>
                    <Button
                      variant="contained"
                      startIcon={<DownloadIcon />}
                      onClick={() => window.open(`${API_BASE_URL}${currentJob.result.report}`, '_blank')}
                      sx={{ mb: 2 }}
                    >
                      Download Report (.pdf)
                    </Button>
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
              </>
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  py: 8,
                  height: '100%',
                  minHeight: '500px',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    mb: 2,
                  }}
                >
                  <SheepIcon 
                    sx={{ 
                      fontSize: 80, 
                      color: 'primary.main',
                      opacity: 0.8,
                      mb: 2
                    }} 
                  />
                  <Typography variant="h4" component="h1" fontWeight="500" gutterBottom>
                    Sheep Counter
                  </Typography>
                  <Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 450, mb: 3 }}>
                    Upload an image to automatically count sheep using AI detection.
                    Our model identifies and counts sheep in various landscapes.
                  </Typography>
                </Box>
                
                <Box 
                  sx={{ 
                    border: '2px dashed',
                    borderColor: isDragging ? 'primary.main' : 'rgba(25, 118, 210, 0.4)',
                    borderRadius: 2,
                    p: 6,
                    width: '100%',
                    maxWidth: 500,
                    textAlign: 'center',
                    backgroundColor: isDragging ? 'rgba(25, 118, 210, 0.08)' : 'rgba(25, 118, 210, 0.04)',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      backgroundColor: 'rgba(25, 118, 210, 0.08)',
                    }
                  }}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDragOver={handleDragOver}
                  onDrop={handleDrop}
                >
                  <Button
                    variant="contained"
                    component="span"
                    startIcon={<CloudUploadIcon />}
                    disabled={isUploading}
                    size="large"
                    sx={{ px: 4, py: 1.5, borderRadius: 2 }}
                    onClick={handleButtonClick}
                  >
                    {isUploading ? (
                      <CircularProgress size={24} color="inherit" />
                    ) : (
                      'Select Image'
                    )}
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={handleFileUpload}
                  />
                  
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                    {isDragging ? 'Drop image here' : 'or drag and drop an image here'}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    Supported formats: JPG, PNG, GIF (max 10MB)
                  </Typography>
                </Box>
                
                <Box sx={{ mt: 4, textAlign: 'center', maxWidth: 500 }}>
                  <Typography variant="body2" color="text.secondary">
                    Our AI model has been trained on thousands of sheep images in various environments.
                    Simply upload your image and receive detailed counting results within seconds.
                  </Typography>
                </Box>
              </Box>
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
                    selected={job.id === currentJob?.id}
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
                      secondary={
                        <>
                          Status: {STATUS_MESSAGES[job.status]}
                          <br />
                          Created: {new Date(job.created_at).toLocaleString()}
                        </>
                      }
                      primaryTypographyProps={{
                        sx: { fontWeight: job.id === currentJob?.id ? 600 : 400 },
                      }}
                    />
                  </ListItemButton>
                  <Divider />
                </Box>
              ))}
            </List>
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="small"
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
} 