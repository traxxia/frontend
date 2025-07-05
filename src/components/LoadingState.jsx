import React from 'react';
import { Card, Spinner } from 'react-bootstrap';

const LoadingState = ({ message = "Loading business data..." }) => (
  <div className="business-detail-container">
    <Card className="text-center p-4">
      <Card.Body>
        <Spinner animation="border" role="status" className="mb-3">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p>{message}</p>
      </Card.Body>
    </Card>
  </div>
);

export default LoadingState;