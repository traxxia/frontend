import React from 'react';
import { Card, Alert, Button } from 'react-bootstrap';

const ErrorState = ({ error, onRetry }) => (
  <div className="business-detail-container">
    <Card>
      <Card.Body>
        <Alert variant="danger">
          <Alert.Heading>Error Loading Data</Alert.Heading>
          <p>{error}</p>
          <Button variant="outline-danger" onClick={onRetry}>
            Try Again
          </Button>
        </Alert>
      </Card.Body>
    </Card>
  </div>
);

export default ErrorState;