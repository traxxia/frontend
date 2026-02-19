import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Spinner } from 'react-bootstrap';
import { CheckCircle, ArrowRight } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import MenuBar from '../components/MenuBar';

const StripeSuccess = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // We could verify the session here if needed, 
        // but the webhook will handle the database update.
        // For now, we just show success and redirect.
        const timer = setTimeout(() => {
            setLoading(false);
        }, 2000);

        return () => clearTimeout(timer);
    }, [sessionId]);

    return (
        <div className="dashboard-layout">
            <MenuBar />
            <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '80vh' }}>
                <Card className="text-center p-5 shadow-sm border-0" style={{ maxWidth: '500px' }}>
                    {loading ? (
                        <div className="py-4">
                            <Spinner animation="border" variant="primary" />
                            <h4 className="mt-3">Processing your subscription...</h4>
                            <p className="text-muted">Please wait while we finalize your payment.</p>
                        </div>
                    ) : (
                        <>
                            <div className="mb-4">
                                <CheckCircle size={80} className="text-success" />
                            </div>
                            <h2 className="fw-bold mb-3">Subscription Successful!</h2>
                            <p className="text-muted mb-4 fs-5">
                                Thank you for your purchase. Your account has been upgraded and your new features are now available.
                            </p>
                            <Button
                                variant="primary"
                                size="lg"
                                onClick={() => navigate('/dashboard')}
                                className="px-5 py-2 fw-bold"
                            >
                                Go to Dashboard <ArrowRight size={20} className="ms-2" />
                            </Button>
                        </>
                    )}
                </Card>
            </Container>
        </div>
    );
};

export default StripeSuccess;
