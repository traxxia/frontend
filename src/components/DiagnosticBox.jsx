import React from 'react';
import { Info } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';

const DiagnosticBox = ({ diagnostic }) => {
  const { t } = useTranslation();
  if (!diagnostic || diagnostic === 'N/A') return null;
  return (
    <div className="DiagnosticBox strategic-analysis--s2">
      <Info size={16} className="strategic-analysis--s3" /> {t("diagnostic")}:
      <div className="DiagnosticBox-right strategic-analysis--s4">
        {diagnostic}
      </div>
    </div>
  );
};

export default DiagnosticBox;
