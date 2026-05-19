import React, { useMemo } from 'react';
import MissingMetricsDisplay from './MissingMetricsDisplay';
import '../styles/AnalysisEmptyState.css';
const FinancialEmptyState = ({
  analysisType,
  documentInfo,
  hasUploadedDocument,
  uploadedFile
}) => {
  const hasDocumentUploaded = uploadedFile || hasUploadedDocument || documentInfo && documentInfo.has_document;
  const effectiveDocumentInfo = useMemo(() => documentInfo || {
    has_document: !!hasDocumentUploaded,
    filename: uploadedFile?.name || 'Financial Document',
    template_name: 'Standard',
    upload_date: new Date().toISOString()
  }, [documentInfo, hasDocumentUploaded, uploadedFile?.name]);
  return <div className="financial-empty-state financial-empty-state--s1">
      <div className="financial-empty-content">
        <MissingMetricsDisplay documentInfo={effectiveDocumentInfo} analysisType={analysisType} className="missing-metrics-section" />
      </div>
    </div>;
};
export default FinancialEmptyState;
