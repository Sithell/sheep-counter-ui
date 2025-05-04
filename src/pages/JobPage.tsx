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
  Chip,
  Card,
  CardContent,
  CardMedia,
  Tooltip,
  alpha,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import QueryStatsIcon from '@mui/icons-material/QueryStats';
import SheepIcon from '@mui/icons-material/Pets';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getJobStatus, listJobs, createJob } from '../services/api';
import { Job, JobStatus } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;

const STATUS_COLORS: Record<JobStatus, string> = {
  queued: '#f0c000',    // amber
  processing: '#2196f3', // blue
  done: '#4caf50',      // green
  error: '#f44336',     // red
};

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
  const jobsPerPage = 6;
  const pollingInterval = useRef<ReturnType<typeof setInterval>>(1000);
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
        await handleFileUpload({ target: { files: [file] } } as unknown as React.ChangeEvent<HTMLInputElement>);
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
      {/* @ts-ignore */}
        <Grid item xs={12} md={8} sx={{ minWidth: '600px' }}>
          <Paper 
            elevation={3} 
            sx={{ 
              p: 0,
              height: '100%', 
              overflow: 'hidden',
              borderRadius: 2,
            }}
          >
            {currentJob ? (
              <>
                <Box 
                  sx={{ 
                    p: 3, 
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h5" fontWeight="500">
                      Job Details
                    </Typography>
                    <Chip 
                      label={STATUS_MESSAGES[currentJob.status]} 
                      sx={{ 
                        ml: 2,
                        backgroundColor: alpha(STATUS_COLORS[currentJob.status], 0.15),
                        color: STATUS_COLORS[currentJob.status],
                        fontWeight: 500,
                      }} 
                    />
                  </Box>
                  <Button
                    startIcon={<ArrowBackIcon />}
                    onClick={() => navigate('/')}
                    color="inherit"
                    size="small"
                  >
                    Back to upload
                  </Button>
                </Box>

                <Box sx={{ p: 3 }}>
                  <Grid container spacing={3}>
                  {/* @ts-ignore */}
                    <Grid item xs={12} md={6}>
                      <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <InsertDriveFileIcon fontSize="small" /> File
                          </Typography>
                          <Typography variant="body1" fontWeight="500">{currentJob.filename}</Typography>
                        </CardContent>
                      </Card>
                      
                      <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon fontSize="small" /> Created
                          </Typography>
                          <Typography variant="body1">{new Date(currentJob.created_at).toLocaleString()}</Typography>
                        </CardContent>
                      </Card>
                    </Grid>

                    
                    {currentJob.status === 'done' && currentJob.result && 'sheep_count' in currentJob.result && (
                      // @ts-ignore
                      <Grid item xs={12} md={6}> 
                        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
                          <CardContent>
                            <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <QueryStatsIcon fontSize="small" /> Results
                            </Typography>
                            <Typography variant="h4" fontWeight="500" color="primary.main" sx={{ mb: 1 }}>
                              {currentJob.result.sheep_count} sheep
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              Processed in {(currentJob.result.duration / 1000).toFixed(2)} seconds
                            </Typography>
                            <Button
                              variant="contained"
                              startIcon={<DownloadIcon />}
                              onClick={() => {
                                if (currentJob.result && 'report' in currentJob.result) {
                                  window.open(`${API_BASE_URL}${currentJob.result.report}`, '_blank');
                                }
                              }}
                              sx={{ mt: 2, borderRadius: 6, px: 3 }}
                              color="primary"
                            >
                              Download Report (PDF)
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    )}
                  </Grid>

                  {currentJob.status === 'done' && currentJob.result && 'sheep_count' in currentJob.result && (
                    <Card 
                      sx={{ 
                        mt: 2,
                        borderRadius: 2,
                        overflow: 'hidden',
                        boxShadow: 'none',
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <CardMedia
                        component="img"
                        src={`${API_BASE_URL}${currentJob.result.image}`}
                        alt="Processed image"
                        sx={{ 
                          width: '100%',
                          height: 'auto',
                          maxHeight: '600px',
                          objectFit: 'contain',
                          bgcolor: 'black',
                        }}
                        onError={(e) => {
                          console.error('Error loading image:', e);
                        }}
                      />
                    </Card>
                  )}

                  {currentJob.status === 'error' && currentJob.result && 'error' in currentJob.result && (
                    <Box sx={{ mt: 3, p: 3, borderRadius: 2, bgcolor: alpha('#f44336', 0.1) }}>
                      <Typography color="error" variant="body1">
                        Error: {currentJob.result.error}
                      </Typography>
                    </Box>
                  )}
                </Box>
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
                    borderRadius: 3,
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
                    startIcon={<AddPhotoAlternateIcon />}
                    disabled={isUploading}
                    size="large"
                    sx={{ 
                      px: 4, 
                      py: 1.5, 
                      borderRadius: 6,
                      boxShadow: 2,
                    }}
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
        {/* @ts-ignore */}
        <Grid item xs={12} md={4} sx={{ minWidth: '300px' }}>
          <Paper 
            elevation={3} 
            sx={{ 
              height: '100%',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <Box 
              sx={{ 
                p: 3, 
                bgcolor: 'primary.main',
                color: '#fff',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <Typography variant="h6" gutterBottom fontWeight="500">
                Recent Jobs
              </Typography>
              
              <Button
                variant="contained"
                fullWidth
                startIcon={<CloudUploadIcon />}
                onClick={() => navigate('/')}
                sx={{ 
                  mt: 1,
                  bgcolor: '#fff',
                  color: 'primary.main',
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.9),
                  },
                  borderRadius: 6,
                  fontWeight: 500,
                  py: 1.2,
                }}
              >
                New Job
              </Button>
            </Box>

            <Box sx={{ maxHeight: '600px', overflow: 'auto' }}>
              <List sx={{ p: 0 }}>
                {recentJobs.map((job) => (
                  <Box key={job.id}>
                    <ListItemButton
                      onClick={() => navigate(`/job/${job.id}`)}
                      selected={job.id === currentJob?.id}
                      sx={{
                        p: 2,
                        borderLeft: '4px solid transparent',
                        borderLeftColor: job.id === currentJob?.id ? STATUS_COLORS[job.status] : 'transparent',
                        '&.Mui-selected': {
                          backgroundColor: alpha(STATUS_COLORS[job.status], 0.05),
                          '&:hover': {
                            backgroundColor: alpha(STATUS_COLORS[job.status], 0.1),
                          },
                        },
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <Typography variant="body1" sx={{ fontWeight: job.id === currentJob?.id ? 500 : 400 }}>
                              {job.filename}
                            </Typography>
                            <Tooltip title={STATUS_MESSAGES[job.status]} arrow>
                              <Box 
                                sx={{ 
                                  width: 10, 
                                  height: 10, 
                                  borderRadius: '50%', 
                                  bgcolor: STATUS_COLORS[job.status],
                                  ml: 1,
                                }}
                              />
                            </Tooltip>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 0.5 }}>
                            <Typography variant="body2" color="text.secondary">
                              {new Date(job.created_at).toLocaleString()}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItemButton>
                    <Divider />
                  </Box>
                ))}
              </List>
            </Box>

            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid', borderColor: 'divider' }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="small"
                sx={{
                  '& .MuiPaginationItem-root': {
                    borderRadius: 1,
                  }
                }}
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
} 