import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  CircularProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { createJob } from '../services/api';

export default function HomePage() {
  const [isUploading, setIsUploading] = useState(false);
  const navigate = useNavigate();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const job = await createJob(file);
      navigate(`/job/${job.id}`);
    } catch (error) {
      console.error('Error uploading file:', error);
      // TODO: Add error handling UI
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            p: 4,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="h4" component="h1" gutterBottom>
            Sheep Counter
          </Typography>
          <Typography variant="body1" color="text.secondary" align="center">
            Upload an image to count the number of sheep
          </Typography>
          <Button
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            disabled={isUploading}
          >
            {isUploading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Upload Image'
            )}
            <input
              type="file"
              hidden
              accept="image/*"
              onChange={handleFileUpload}
            />
          </Button>
        </Paper>
      </Box>
    </Container>
  );
} 