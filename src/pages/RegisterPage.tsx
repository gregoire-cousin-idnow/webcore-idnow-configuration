import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  Paper,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  SelectChangeEvent,
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userType, setUserType] = useState<'admin' | 'user'>('user');
  const [adminKey, setAdminKey] = useState('');
  
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [adminKeyError, setAdminKeyError] = useState('');
  
  const { state, register, clearError } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (state.isAuthenticated) {
      navigate('/dashboard');
    }
  }, [state.isAuthenticated, navigate]);

  // Clear errors when unmounting
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  const validateForm = (): boolean => {
    let isValid = true;

    // Validate email
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email is invalid');
      isValid = false;
    } else {
      setEmailError('');
    }

    // Validate password
    if (!password) {
      setPasswordError('Password is required');
      isValid = false;
    } else if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      isValid = false;
    } else {
      setPasswordError('');
    }

    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError('Confirm password is required');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      isValid = false;
    } else {
      setConfirmPasswordError('');
    }

    // Validate admin key if user type is admin
    if (userType === 'admin') {
      if (!adminKey) {
        setAdminKeyError('Admin key is required');
        isValid = false;
      } else {
        setAdminKeyError('');
      }
    }

    return isValid;
  };

  const handleUserTypeChange = (event: SelectChangeEvent<string>) => {
    setUserType(event.target.value as 'admin' | 'user');
    if (event.target.value === 'user') {
      setAdminKeyError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (validateForm()) {
      await register(email, password, userType, userType === 'admin' ? adminKey : undefined);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5">
            Register
          </Typography>
          {state.error && (
            <Alert severity="error" sx={{ width: '100%', mt: 2 }}>
              {state.error}
            </Alert>
          )}
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1, width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={!!emailError}
              helperText={emailError}
              disabled={state.loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={!!passwordError}
              helperText={passwordError}
              disabled={state.loading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={!!confirmPasswordError}
              helperText={confirmPasswordError}
              disabled={state.loading}
            />
            <FormControl fullWidth margin="normal" disabled={state.loading}>
              <InputLabel id="user-type-label">User Type</InputLabel>
              <Select
                labelId="user-type-label"
                id="user-type"
                value={userType}
                label="User Type"
                onChange={handleUserTypeChange}
              >
                <MenuItem value="user">User</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
            {userType === 'admin' && (
              <TextField
                margin="normal"
                required
                fullWidth
                name="adminKey"
                label="Admin Key"
                type="password"
                id="adminKey"
                value={adminKey}
                onChange={(e) => setAdminKey(e.target.value)}
                error={!!adminKeyError}
                helperText={adminKeyError}
                disabled={state.loading}
              />
            )}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={state.loading}
            >
              {state.loading ? <CircularProgress size={24} /> : 'Register'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link to="/login">
                <Typography variant="body2">Already have an account? Sign In</Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default RegisterPage;
