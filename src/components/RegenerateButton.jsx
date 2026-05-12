import React from 'react';
import { RefreshCw, Loader } from 'lucide-react';
import { useTranslation } from "../hooks/useTranslation";

const SIZES = {
  small: {
    padding: "5px",
    fontSize: "13px",
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

const RegenerateButton = ({
  onRegenerate,
  isRegenerating = false,
  canRegenerate = true,
  sectionName = "Analysis",
  size = "medium",
  hideRegenerateButtons = false
}) => {
  const currentSize = SIZES[size] || SIZES.small;
  const { t } = useTranslation();
  if (hideRegenerateButtons) {
    return null;
  }
  if (isRegenerating || !canRegenerate) {
    return null;
  }

  return (
    <button
      onClick={onRegenerate}
      style={{
        backgroundColor: "rgb(26, 115, 232)",
        color: "#fff",
        border: "none",
        borderRadius: "8px",
        padding: currentSize.padding,
        fontSize: currentSize.fontSize,
        fontWeight: 500,
        display: "flex",
        gap:"5px",
        alignItems: "center",
        cursor: "pointer",
        transition: "all 0.2s ease",
        marginLeft: "auto"
      }}
    >
      <RefreshCw size={currentSize.iconSize} />
      {t("regenerate")}
    </button>
  );
};

export default RegenerateButton;
