import React from 'react';
import { Box, Typography, Button, Breadcrumbs, Link as MuiLink } from '@mui/material';
import { Link } from 'react-router-dom';

/**
 * Props for the PageHeader component
 */
export interface PageHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: React.ReactNode;
  breadcrumbs?: Array<{ label: string; path?: string; }>;
  children?: React.ReactNode;
}

/**
 * A reusable page header component with title, action button, and breadcrumbs
 */
const PageHeader: React.FC<PageHeaderProps> = ({
  title, subtitle, actionLabel, onAction, actionIcon, breadcrumbs, children,
}) => {
  return (
    <Box sx={{ mb: 4 }}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
          {breadcrumbs.map((crumb, index) => {
            const isLast = index === breadcrumbs.length - 1;
            
            if (isLast || !crumb.path) return <Typography key={crumb.label} color="text.primary">{crumb.label}</Typography>;
            
            return (
              <MuiLink key={crumb.label} component={Link} to={crumb.path} 
                       color="inherit" underline="hover">{crumb.label}</MuiLink>
            );
          })}
        </Breadcrumbs>
      )}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', 
                 alignItems: 'center', mb: subtitle ? 1 : 3 }}>
        <Typography variant="h4" component="h1">{title}</Typography>
        
        {actionLabel && onAction && (
          <Button variant="contained" color="primary" onClick={onAction} startIcon={actionIcon}>
            {actionLabel}
          </Button>
        )}
      </Box>
      
      {subtitle && (
        <Typography variant="subtitle1" color="text.secondary" sx={{ mb: 3 }}>
          {subtitle}
        </Typography>
      )}
      
      {children}
    </Box>
  );
};

export default PageHeader;
