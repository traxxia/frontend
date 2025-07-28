import React from 'react';
import { RefreshCw, Loader } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";

const RegenerateButton = ({ 
  onRegenerate, 
  isRegenerating = false, 
  canRegenerate = true, 
  sectionName = "Analysis",
  size = "medium" // "small", "medium", "large"
}) => {
  const sizes = {
    small: {
      padding: "6px 12px",
      fontSize: "12px",
      iconSize: 12
    },
    medium: {
      padding: "8px 16px",
      fontSize: "14px",
      iconSize: 14
    },
    large: {
      padding: "10px 18px",
      fontSize: "16px",
      iconSize: 16
    }
  };

  const currentSize = sizes[size] || sizes.small;
  const { t } = useTranslation();

  return (
    <button
      onClick={onRegenerate}
      disabled={isRegenerating || !canRegenerate}
      style={{
        backgroundColor: isRegenerating ? "#f3f4f6" : "#6366f1",
        color: isRegenerating ? "#6b7280" : "#fff",
        border: "none",
        borderRadius: "8px",
        padding: currentSize.padding,
        fontSize: currentSize.fontSize,
        fontWeight: 500,
        display: "flex",
        alignItems: "center",
        cursor: isRegenerating || !canRegenerate ? "not-allowed" : "pointer",
        gap: "6px",
        transition: "all 0.2s ease",
        marginLeft: "auto",
        opacity: !canRegenerate ? 0.5 : 1
      }}
      title={`Regenerate ${sectionName}`}
    >
      {isRegenerating ? (
        <>
          <Loader size={currentSize.iconSize} className="animate-spin" />
          Regenerating...
        </>
      ) : (
        <>
          <RefreshCw size={currentSize.iconSize} />
          {t("regenerate")}
        </>
      )}
    </button>
  );
};

export default RegenerateButton;