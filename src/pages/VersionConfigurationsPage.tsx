import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
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
  Alert,
  Tabs,
  Tab,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import { configurationsApi, versionsApi } from '../services/api';
import { Configuration, Shortname } from '../models';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`shortname-tabpanel-${index}`} aria-labelledby={`shortname-tab-${index}`} {...other} >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const VersionConfigurationsPage: React.FC = () => {
  const { version } = useParams<{ version: string }>();
  const navigate = useNavigate();
  
  const [shortnames, setShortnames] = useState<Shortname[]>([]);
  const [configurations, setConfigurations] = useState<{ [shortname: string]: Configuration[] }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [allConfigurations, setAllConfigurations] = useState<Configuration[]>([]);

  const fetchData = useCallback(async () => {
    if (!version) return;
    
    setLoading(true);
    try {
      const shortnamesResponse = await versionsApi.getVersionShortnames(version);
      setShortnames(shortnamesResponse.shortnames || []);
      
      const configsMap: { [shortname: string]: Configuration[] } = {};
      const allConfigsList: Configuration[] = [];
      
      for (const shortname of shortnamesResponse.shortnames || []) {
        try {
          const configsResponse = await configurationsApi.getAll(shortname.shortname, version);
          configsMap[shortname.shortname] = configsResponse.configurations || [];
          allConfigsList.push(...(configsResponse.configurations || []));
        } catch (err) {
          console.error(`Error fetching configurations for ${shortname.shortname}:`, err);
        }
      }
      
      setConfigurations(configsMap);
      setAllConfigurations(allConfigsList);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [version]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const renderConfigurationsTable = (configs: Configuration[]) => {
    if (configs.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No configurations found.
        </Alert>
      );
    }

    return (
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Value</TableCell>
              <TableCell>Description</TableCell>
              <TableCell>Shortname</TableCell>
              <TableCell>Updated At</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {configs.map((config) => (
              <TableRow key={config.configId}>
                <TableCell>{config.key}</TableCell>
                <TableCell>{typeof config.value === 'object' ? JSON.stringify(config.value) : config.value}</TableCell>
                <TableCell>{config.description}</TableCell>
                <TableCell>{config.shortname}</TableCell>
                <TableCell>{new Date(config.updatedAt).toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Configurations for Version: {version}</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          component={Link}
          to={`/versions/${version}/shortnames`}
        >
          Manage Shortnames
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
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={tabValue} onChange={handleTabChange} aria-label="shortname tabs">
              <Tab label="All Configurations" />
              {shortnames.map((shortname, index) => (
                <Tab key={shortname.shortname} label={shortname.shortname} />
              ))}
            </Tabs>
          </Box>
          
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              All Configurations
            </Typography>
            {renderConfigurationsTable(allConfigurations)}
          </TabPanel>
          
          {shortnames.map((shortname, index) => (
            <TabPanel key={shortname.shortname} value={tabValue} index={index + 1}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {shortname.shortname}
                </Typography>
                <Button 
                  variant="outlined" 
                  component={Link}
                  to={`/versions/${version}/shortnames/${shortname.shortname}/configurations`}
                >
                  Manage Configurations
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary" paragraph>
                {shortname.description || 'No description'}
              </Typography>
              <Divider sx={{ my: 2 }} />
              {renderConfigurationsTable(configurations[shortname.shortname] || [])}
            </TabPanel>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default VersionConfigurationsPage;
