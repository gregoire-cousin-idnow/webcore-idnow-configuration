import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  Alert
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { versionsApi } from '../services/api';
import { Version, VersionFormData } from '../models';

const VersionsPage: React.FC = () => {
  const { shortname } = useParams<{ shortname: string }>();
  const navigate = useNavigate();
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [formData, setFormData] = useState<VersionFormData>({
    version: '',
    description: '',
    isActive: true
  });

  const fetchVersions = useCallback(async () => {
    if (!shortname) return;
    
    setLoading(true);
    try {
      const response = await versionsApi.getAll(shortname);
      setVersions(response.versions);
      setError(null);
    } catch (err) {
      console.error('Error fetching versions:', err);
      setError('Failed to load versions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [shortname]);

  useEffect(() => {
    fetchVersions();
  }, [shortname, fetchVersions]);

  const handleCreateVersion = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      version: '',
      description: '',
      isActive: true
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'isActive' ? checked : value
    });
  };

  const handleSubmit = async () => {
    if (!shortname) return;
    
    try {
      await versionsApi.create(shortname, formData);
      handleCloseDialog();
      fetchVersions();
    } catch (err) {
      console.error('Error creating version:', err);
      setError('Failed to create version. Please try again.');
    }
  };

  const handleVersionClick = (versionId: string) => {
    navigate(`/shortnames/${shortname}/versions/${versionId}`);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Versions for {shortname}</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<AddIcon />}
          onClick={handleCreateVersion}
        >
          Create Version
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Version</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Created At</TableCell>
                <TableCell>Updated At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {versions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No versions found. Create a new version to get started.
                  </TableCell>
                </TableRow>
              ) : (
                versions.map((version) => (
                  <TableRow 
                    key={version.versionId} 
                    hover 
                    onClick={() => handleVersionClick(version.versionId)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>{version.version}</TableCell>
                    <TableCell>{version.description}</TableCell>
                    <TableCell>{version.isActive ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell>{new Date(version.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{new Date(version.updatedAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>Create New Version</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            name="version"
            label="Version"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.version}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            name="description"
            label="Description"
            type="text"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={formData.description}
            onChange={handleInputChange}
            sx={{ mb: 2 }}
          />
          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive}
                onChange={handleInputChange}
                name="isActive"
              />
            }
            label="Active"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VersionsPage;
