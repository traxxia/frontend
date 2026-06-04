import React from 'react';
import { Info } from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

const DiagnosticBox = ({ diagnostic }) => {
  const { t } = useTranslation();
  if (!diagnostic || diagnostic === 'N/A') return null;
  return (
    <div className="DiagnosticBox diagnostic-box">
      <Info size={16} className="diagnostic-icon" /> {t("diagnostic")}:
      <div className="DiagnosticBox-right diagnostic-text">
        {diagnostic}
      </div>
    </div>
  );
};

export default DiagnosticBox;
