import React from 'react';
import { Container, Card, Button } from 'react-bootstrap';
import { XCircle, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import MenuBar from '../components/MenuBar';

const StripeCancel = () => {
    const navigate = useNavigate();

    return (
        <div className="dashboard-layout">
            <MenuBar />
            <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
                <Card className="text-center p-5 shadow-sm border-0" style={{ maxWidth: '500px' }}>
                    <div className="mb-4">
                        <XCircle size={80} className="text-danger" />
                    </div>
                    <h2 className="fw-bold mb-3">Payment Cancelled</h2>
                    <p className="text-muted mb-4 fs-5">
                        Your subscription process was cancelled. No charges were made to your account.
                    </p>
                    <div className="d-flex gap-3 justify-content-center">
                        <Button
                            variant="outline-secondary"
                            size="lg"
                            onClick={() => navigate('/dashboard')}
                            className="px-4 py-2"
                        >
                            Return to Dashboard
                        </Button>
                        <Button
                            variant="primary"
                            size="lg"
                            onClick={() => navigate('/dashboard?showUpgrade=true')}
                            className="px-4 py-2 fw-bold"
                        >
                            Try Again
                        </Button>
                    </div>
                </Card>
            </Container>
        </div>
    );
};

export default StripeCancel;
