import { Component, type ReactNode } from 'react';
import { Alert, Box, Button } from '@mui/material';
import i18n from '../../i18n';

interface RouteErrorBoundaryProps {
  resetKey: string;
  children: ReactNode;
}

interface RouteErrorBoundaryState {
  hasError: boolean;
  prevResetKey: string;
}

export default class RouteErrorBoundary extends Component<RouteErrorBoundaryProps, RouteErrorBoundaryState> {
  state: RouteErrorBoundaryState = { hasError: false, prevResetKey: this.props.resetKey };

  static getDerivedStateFromProps(
    props: RouteErrorBoundaryProps,
    state: RouteErrorBoundaryState,
  ): Partial<RouteErrorBoundaryState> | null {
    if (props.resetKey !== state.prevResetKey) {
      return { prevResetKey: props.resetKey, hasError: false };
    }
    return null;
  }

  static getDerivedStateFromError(): Partial<RouteErrorBoundaryState> {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box display="flex" justifyContent="center" py={6}>
          <Alert
            severity="error"
            action={
              <Button color="inherit" size="small" onClick={() => window.location.reload()}>
                {i18n.t('common.reloadPage')}
              </Button>
            }
          >
            {i18n.t('common.pageLoadFailed')}
          </Alert>
        </Box>
      );
    }
    return this.props.children;
  }
}
