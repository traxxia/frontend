import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { Save, Tag, FileText, AlertCircle } from 'lucide-react';
import axios from 'axios';

const SaveAnalysisModal = ({ 
  show, 
  onHide, 
  analysisData, 
  surveyData, 
  businessName,
  analysisType,
  analysisFramework,
  category,
  t // Translation function
}) => {
  const [saveDetails, setSaveDetails] = useState({
    title: '',
    description: '',
    tags: []
  });
  const [currentTag, setCurrentTag] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Get translation function
  const translate = (key) => {
    if (t) return t(key);
    if (window.getTranslation) return window.getTranslation(key);
    return key;
  };

  // Get API base URL and auth token
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
  const getAuthToken = () => sessionStorage.getItem('token');

  // Reset form when modal opens
  React.useEffect(() => {
    if (show) {
      setSaveDetails({
        title: `${businessName} - ${analysisFramework} Analysis`,
        description: '',
        tags: []
      });
      setCurrentTag('');
      setError('');
      setSuccess('');
    }
  }, [show, businessName, analysisFramework]);

  // Handle adding tags
  const handleAddTag = () => {
    if (currentTag.trim() && !saveDetails.tags.includes(currentTag.trim())) {
      setSaveDetails(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  // Handle removing tags
  const handleRemoveTag = (tagToRemove) => {
    setSaveDetails(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Handle key press for tags
  const handleTagKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // Validate form
  const isFormValid = () => {
    return saveDetails.title.trim().length > 0;
  };

  // Handle save
  const handleSave = async () => {
    if (!isFormValid()) {
      setError(translate('title_required') || 'Title is required');
      return;
    }

    setIsSaving(true);
    setError('');
    setSuccess('');

    try {
      const token = getAuthToken();
      if (!token) {
        throw new Error('No authentication token found. Please login again.');
      }

      // Prepare the audit trail data according to backend schema
      const auditTrailData = {
        business_name: businessName,
        
        // Survey data
        survey_data: {
          version: surveyData.version || 'unknown',
          questions: surveyData.questions || [],
          answers: surveyData.answers || [],
          completion_percentage: surveyData.completion_percentage || 0,
          submitted_at: surveyData.submitted_at || new Date().toISOString()
        },
        
        // Analysis data
        analysis_data: {
          analysis_type: analysisType,
          analysis_framework: analysisFramework,
          category: category,
          generated_result: analysisData,
          generated_at: new Date().toISOString(),
          groq_request_details: {
            model: 'llama-vision-free', // Default model
            tokens_used: 0, // You can track this if available
            response_time_ms: 0 // You can track this if available
          }
        },
        
        // Save details
        save_details: {
          title: saveDetails.title.trim(),
          description: saveDetails.description.trim(),
          tags: saveDetails.tags
        }
      };

      console.log('Saving audit trail data:', auditTrailData);

      // Call the backend API
      const response = await axios.post(
        `${API_BASE_URL}/api/audit-trail/save`,
        auditTrailData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('Save response:', response.data);

      setSuccess(translate('analysis_saved_successfully') || 'Analysis saved successfully!');
      
      // Close modal after short delay
      setTimeout(() => {
        onHide();
        // Reset form
        setSaveDetails({ title: '', description: '', tags: [] });
        setSuccess('');
      }, 1500);

    } catch (error) {
      console.error('Save analysis error:', error);
      
      let errorMessage = translate('save_failed') || 'Failed to save analysis';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      setError(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title className="d-flex align-items-center">
          <Save className="me-2" size={24} />
          {translate('save_analysis') || 'Save Analysis'}
        </Modal.Title>
      </Modal.Header>

      <Modal.Body>
        {error && (
          <Alert variant="danger" className="d-flex align-items-center">
            <AlertCircle className="me-2" size={20} />
            {error}
          </Alert>
        )}

        {success && (
          <Alert variant="success" className="d-flex align-items-center">
            <Save className="me-2" size={20} />
            {success}
          </Alert>
        )}

        <Form>
          {/* Business Name (Read-only) */}
          <Form.Group className="mb-3">
            <Form.Label>
              <strong>{translate('business_name') || 'Business Name'}</strong>
            </Form.Label>
            <Form.Control 
              type="text" 
              value={businessName} 
              readOnly 
              className="bg-light"
            />
          </Form.Group>

          {/* Analysis Type (Read-only) */}
          <Form.Group className="mb-3">
            <Form.Label>
              <strong>{translate('analysis_type') || 'Analysis Type'}</strong>
            </Form.Label>
            <Form.Control 
              type="text" 
              value={`${analysisFramework} (${category})`}
              readOnly 
              className="bg-light"
            />
          </Form.Group>

          {/* Title (Required) */}
          {/* <Form.Group className="mb-3">
            <Form.Label>
              <FileText className="me-1" size={16} />
              <strong>{translate('title') || 'Title'} *</strong>
            </Form.Label>
            <Form.Control
              type="text"
              placeholder={translate('enter_title') || 'Enter a title for this analysis...'}
              value={saveDetails.title}
              onChange={(e) => setSaveDetails(prev => ({ ...prev, title: e.target.value }))}
              isInvalid={!saveDetails.title.trim()}
              maxLength={100}
            />
            <Form.Control.Feedback type="invalid">
              {translate('title_required') || 'Title is required'}
            </Form.Control.Feedback>
            <Form.Text className="text-muted">
              {saveDetails.title.length}/100 {translate('characters') || 'characters'}
            </Form.Text>
          </Form.Group> */}

          {/* Description (Optional) */}
          <Form.Group className="mb-3">
            <Form.Label>
              <strong>{translate('description') || 'Description'}</strong> 
              <small className="text-muted ms-1">({translate('optional') || 'optional'})</small>
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              placeholder={translate('enter_description') || 'Enter a description for this analysis...'}
              value={saveDetails.description}
              onChange={(e) => setSaveDetails(prev => ({ ...prev, description: e.target.value }))}
              maxLength={500}
            />
            <Form.Text className="text-muted">
              {saveDetails.description.length}/500 {translate('characters') || 'characters'}
            </Form.Text>
          </Form.Group>
 

          {/* Survey Info */}
          <div className="bg-light p-3 rounded mb-3">
            <h6 className="mb-2">{translate('survey_information') || 'Survey Information'}</h6>
            <div className="row">
              {/* <div className="col-md-6">
                <small className="text-muted">
                  <strong>{translate('version') || 'Version'}:</strong> {surveyData.version || 'Unknown'}
                </small>
              </div> */}
              <div className="col-md-6">
                <small className="text-muted">
                  <strong>{translate('completion') || 'Completion'}:</strong> {surveyData.completion_percentage || 0}%
                </small>
              </div>
            </div>
          </div>
        </Form>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide} disabled={isSaving}>
          {translate('cancel') || 'Cancel'}
        </Button>
        <Button 
          variant="primary" 
          onClick={handleSave} 
          disabled={!isFormValid() || isSaving}
        >
          {isSaving ? (
            <>
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
                className="me-2"
              />
              {translate('saving') || 'Saving...'}
            </>
          ) : (
            <>
              <Save className="me-2" size={16} />
              {translate('save_analysis') || 'Save Analysis'}
            </>
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default SaveAnalysisModal;