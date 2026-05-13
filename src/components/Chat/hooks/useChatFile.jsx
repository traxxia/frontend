import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { detectTemplateType, validateAgainstTemplate } from '../../../utils/templateValidator';
import { useAuthStore } from '../../../store/authStore';

export const useChatFile = (selectedBusinessId, { onFileUploaded }) => {
  const [isFileUploading, setIsFileUploading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [uploadedFileInfo, setUploadedFileInfo] = useState(null);
  const [hasUploadedDocument, setHasUploadedDocument] = useState(false);
  const [businessUploadDecision, setBusinessUploadDecision] = useState({
    upload_decision_made: false,
    upload_decision: null
  });

  const queryClient = useQueryClient();
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
  const getAuthToken = () => useAuthStore.getState().token;

  const saveFileToDatabase = async (file, validationResult) => {
    const token = getAuthToken();
    const formData = new FormData();
    formData.append('document', file);
    
    const templateComplexityMap = {
      'simplified': 'simple',
      'standard': 'medium',
      'detailed': 'medium'
    };
    const backendTemplateType = templateComplexityMap[validationResult.templateType] || 'simple';
    
    formData.append('template_type', backendTemplateType);
    formData.append('template_name', validationResult.templateName || '');
    formData.append('validation_confidence', validationResult.confidence || 'high');
    formData.append('upload_mode', validationResult.uploadMode || 'auto-detect');

    const response = await fetch(`${API_BASE_URL}/api/businesses/${selectedBusinessId}/financial-document`, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}` },
      body: formData
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Failed to save file');
    
    queryClient.invalidateQueries({ queryKey: ['conversations', selectedBusinessId] });
    return result;
  };

  const handleFileUpload = useCallback(async (file, expectedTemplateType = null) => {
    setIsFileUploading(true);
    setIsValidating(true);
    
    try {
      let validationResult = null;
      if (expectedTemplateType) {
        const validation = await validateAgainstTemplate(file, expectedTemplateType);
        if (!validation.isValid) throw new Error("Template mismatch");
        validationResult = {
          templateType: expectedTemplateType,
          templateName: validation.templateName,
          validation,
          uploadMode: 'template-specific',
          confidence: 'high'
        };
      } else {
        const detection = await detectTemplateType(file);
        if (detection.confidence === 'none' || detection.score < 0.3) throw new Error("Template not detected");
        const validation = await validateAgainstTemplate(file, detection.type);
        validationResult = {
          templateType: detection.type,
          templateName: validation.templateName,
          validation,
          confidence: detection.confidence,
          uploadMode: 'auto-detect'
        };
      }

      await saveFileToDatabase(file, validationResult);
      setHasUploadedDocument(true);
      setUploadedFileInfo({
        name: file.name,
        size: file.size,
        uploadDate: new Date().toLocaleDateString(),
        template_name: validationResult.templateName,
        template_type: validationResult.templateType
      });

      if (onFileUploaded) onFileUploaded(file, validationResult);
      
    } finally {
      setIsFileUploading(false);
      setIsValidating(false);
    }
  }, [selectedBusinessId, onFileUploaded]);

  return {
    isFileUploading,
    isValidating,
    uploadedFileInfo,
    hasUploadedDocument,
    businessUploadDecision,
    handleFileUpload,
    setBusinessUploadDecision,
  };
};
