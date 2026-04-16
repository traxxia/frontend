import React, { useState, useEffect, useRef } from "react";
import {
  Check,
  CreditCard,
  Plus,
  Trash2,
  Star,
  TrendingUp,
  Layers,
  Target,
  Zap,
  Users,
  Briefcase,
  Eye,
  FolderOpen,
  ChevronRight,
  Lock,
  AlertCircle,
  X,
  Trash,
} from "lucide-react";
import { Modal, Button, Spinner, Alert } from "react-bootstrap";
// Stripe imports removed for lazy loading
import PaymentForm from "./PaymentForm";
import { useTranslation } from "../hooks/useTranslation";
import { useAuthStore } from "../store/authStore";
import UpgradeModal from "./UpgradeModal";
import AdminTable from "./AdminTable";
import { usePlanDetails } from "../hooks/useQueries";
import { useQueryClient } from "@tanstack/react-query";
import "../styles/SubscriptionTab.css";

/* --- helpers --- */

const getDaysRemaining = (end) => {
  if (!end) return 0;
  const a = new Date();
  a.setHours(0, 0, 0, 0);
  const b = new Date(end);
  b.setHours(0, 0, 0, 0);
  return Math.max(0, Math.floor((b - a) / 86400000));
};

const fmtDate = (
  iso,
  opts = { year: "numeric", month: "short", day: "numeric" },
) => (iso ? new Date(iso).toLocaleDateString(undefined, opts) : "N/A");

const fmtTime = (iso) =>
  iso
    ? new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
    : "";

const buildFeatureRows = (limits = {}) => [
  {
    label: `${limits.workspaces || 0} Workspace${limits.workspaces !== 1 ? "s" : ""}`,
    active: !!limits.workspaces,
  },
  {
    label: `${limits.collaborators || 0} Collaborator${limits.collaborators !== 1 ? "s" : ""}`,
    active: !!limits.collaborators,
  },
  {
    label: limits.viewers
      ? `${limits.viewers} Viewer${limits.viewers !== 1 ? "s" : ""}`
      : "Viewers",
    active: !!limits.viewers,
  },
  {
    label: limits.users
      ? `${limits.users} User${limits.users !== 1 ? "s" : ""}`
      : "Users",
    active: !!limits.users,
  },
  { label: "Projects", active: !!limits.project },
  { label: "Insight Access", active: !!limits.insight },
  { label: "Strategic Access", active: !!limits.strategic },
  { label: "PMF Access", active: !!limits.pmf },
];

/* --- sub-components --- */
const UsageBar = ({ label, current, limit, color, icon: Icon }) => {
  const unlimited = limit === true;
  const pct = unlimited || !limit ? 0 : Math.min(100, (current / limit) * 100);
  const isHigh = pct >= 80;
  return (
    <div className="st-u-row">
      <div className="st-u-top">
        <span className="st-u-label">
          {Icon && <Icon size={13} className={`st-u-icon st-icon-${color}`} />}
          {label}
        </span>
        <span className={`st-u-count ${isHigh ? "st-count-warn" : ""}`}>
          {current}
          <span className="st-u-limit"> / {unlimited ? "∞" : limit || 0}</span>
        </span>
      </div>
      <div className="st-u-track">
        <div
          className={`st-u-fill st-fill-${color}`}
          style={{
            width: `${pct}%`,
            ...(isHigh ? { background: "#ef4444" } : {}),
          }}
        />
      </div>
    </div>
  );
};

const FeatureRow = ({ label, active }) => (
  <li className={`st-feat-row ${active ? "st-feat-on" : "st-feat-off"}`}>
    <span
      className={`st-feat-check ${active ? "st-feat-check-on" : "st-feat-check-off"}`}
    >
      {active ? <Check size={10} strokeWidth={3} /> : <span>–</span>}
    </span>
    {label}
  </li>
);

/* --- Payment Methods Section --- */
/* --- Add Card Modal Content (using Stripe hooks) --- */
const AddCardModalContent = ({
  onHide,
  onAddSuccess,
  apiBase,
  token,
  onToast,
  stripeComponents,
  stripe,
  elements,
  paymentMethods = [],
}) => {
  const { t } = useTranslation();
  const { CardNumberElement, CardExpiryElement, CardCvcElement } =
    stripeComponents || {};
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cardHolderName, setCardHolderName] = useState("");
  const [error, setError] = useState(null);

  const handleLocalSubmit = async () => {
    if (!stripe || !elements) return;

    if (!cardHolderName.trim()) {
      setError(t("Please enter card holder name."));
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const cardElement = elements.getElement(CardNumberElement);
      const { error: stripeError, paymentMethod } =
        await stripe.createPaymentMethod({
          type: "card",
          card: cardElement,
          billing_details: { name: cardHolderName },
        });

      if (stripeError) {
        setError(stripeError.message);
        setIsSubmitting(false);
        return;
      }

      // Local duplicate check
      const card = paymentMethod.card;
      const isDuplicate = paymentMethods.some(
        (pm) =>
          pm.last4 === card.last4 &&
          pm.brand === card.brand &&
          pm.exp_month === card.exp_month &&
          pm.exp_year === card.exp_year,
      );

      if (isDuplicate) {
        setError(t("This card is already linked to your account."));
        setIsSubmitting(false);
        return;
      }

      // Attach to customer on backend
      const res = await fetch(
        `${apiBase}/api/subscription/payment-methods/add`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            paymentMethodId: paymentMethod.id,
            setAsDefault: true,
          }),
        },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add card");

      if (onToast)
        onToast(
          t("card_added_success") || "Card added successfully",
          "success",
        );
      onAddSuccess(data);
      onHide();
    } catch (err) {
      setError(err.message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-card-modal-inner">
      <Modal.Header closeButton className="border-0 pb-0">
        <Modal.Title className="fw-bold">{t("Add New Card")}</Modal.Title>
      </Modal.Header>
      <Modal.Body className="pt-2">
        <PaymentForm
          cardHolderName={cardHolderName}
          onCardHolderNameChange={setCardHolderName}
          isSubmitting={isSubmitting}
          error={error}
          hideHeader={true}
          stripeComponents={stripeComponents}
        />
      </Modal.Body>
      <Modal.Footer className="border-0 pt-0 d-flex justify-content-end align-items-center">
        <Button
          variant="link"
          onClick={onHide}
          className="text-decoration-none text-muted me-2"
        >
          {t("Cancel")}
        </Button>
        <Button
          variant="primary"
          onClick={handleLocalSubmit}
          disabled={isSubmitting || !stripe}
          className="px-4 py-2 fw-bold"
        >
          {isSubmitting ? (
            <Spinner animation="border" size="sm" />
          ) : (
            t("Save Card")
          )}
        </Button>
      </Modal.Footer>
    </div>
  );
};

const AddCardStripeWrapper = (props) => {
  const { stripeComponents } = props;
  const stripe = stripeComponents.useStripe();
  const elements = stripeComponents.useElements();
  return <AddCardModalContent {...props} stripe={stripe} elements={elements} />;
};

const AddCardModal = ({
  show,
  onHide,
  onAddSuccess,
  apiBase,
  token,
  onToast,
  paymentMethods,
}) => {
  const [stripeComponents, setStripeComponents] = useState(null);

  const stripePromise = React.useMemo(async () => {
    if (!show) return null;
    const [stripeJs, reactStripeJs] = await Promise.all([
      import("@stripe/stripe-js"),
      import("@stripe/react-stripe-js"),
    ]);
    setStripeComponents(reactStripeJs);
    return stripeJs.loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
  }, [show]);

  if (!show) return null;
  return (
    <Modal show={show} onHide={onHide} centered backdrop="static" size="lg">
      {stripeComponents && (
        <stripeComponents.Elements stripe={stripePromise}>
          <AddCardStripeWrapper
            onHide={onHide}
            onAddSuccess={onAddSuccess}
            apiBase={apiBase}
            token={token}
            onToast={onToast}
            stripeComponents={stripeComponents}
            paymentMethods={paymentMethods}
          />
        </stripeComponents.Elements>
      )}
    </Modal>
  );
};

const PaymentMethodsSection = ({
  paymentMethods,
  defaultId,
  apiBase,
  token,
  onUpdate,
  onToast,
}) => {
  const { t } = useTranslation();
  const [isRemoving, setIsRemoving] = useState(null);
  const [isSettingDefault, setIsSettingDefault] = useState(null);
  const [isAdding, setIsAdding] = useState(false);

  const handleSetDefault = async (pmId) => {
    if (pmId === defaultId) return;
    setIsSettingDefault(pmId);
    try {
      const res = await fetch(
        `${apiBase}/api/subscription/payment-methods/set-default`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ paymentMethodId: pmId }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to set default card");

      onToast?.(
        t("default_card_updated") || "Default payment method updated",
        "success",
      );
      onUpdate(data);
    } catch (err) {
      onToast?.(err.message, "error");
    } finally {
      setIsSettingDefault(null);
    }
  };

  const handleRemove = async (e, pmId) => {
    e.stopPropagation();
    if (!window.confirm(t("confirm_remove_card") || "Remove this card?"))
      return;
    setIsRemoving(pmId);
    try {
      const res = await fetch(
        `${apiBase}/api/subscription/payment-methods/${pmId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to remove card");
      onUpdate(data);
      onToast?.(
        t("card_removed_success") || "Card removed successfully!",
        "success",
      );
    } catch (err) {
      onToast?.(err.message, "error");
    } finally {
      setIsRemoving(null);
    }
  };

  return (
    <div className="st-card st-payments-wrapper">
      <div className="st-card-header st-payments-header-row">
        <div>
          <div className="st-card-title">Payment Methods</div>
          <div className="st-card-subtitle">
            Manage your subscription billing
          </div>
        </div>
        <button className="st-add-card-btn" onClick={() => setIsAdding(true)}>
          <Plus size={14} /> Add New Card
        </button>
      </div>

      <div className="st-pm-grid">
        {paymentMethods.map((m) => {
          const isDefault = m.id === defaultId;
          const isLoading = isRemoving === m.id || isSettingDefault === m.id;

          return (
            <div
              key={m.id}
              className={`st-pm-item ${isDefault ? "st-pm-active" : ""} ${isLoading ? "st-pm-busy" : ""}`}
              onClick={() => handleSetDefault(m.id)}
            >
              <div className="st-pm-content">
                <div className="st-pm-icon">
                  <CreditCard size={18} />
                </div>
                <div className="st-pm-info">
                  <div className="st-pm-number">•••• •••• •••• {m.last4}</div>
                  <div className="st-pm-meta">
                    <span
                      className="st-pm-brand"
                      style={{ textTransform: "capitalize" }}
                    >
                      {m.brand}
                    </span>
                    <span className="st-pm-sep">•</span>
                    <span className="st-pm-exp">
                      {t("Expires")} {m.exp_month}/{m.exp_year}
                    </span>
                  </div>
                </div>
                {isDefault && (
                  <div className="st-pm-check">
                    <Check size={14} strokeWidth={3} />
                  </div>
                )}
              </div>

              {!isDefault && (
                <button
                  className="st-pm-remove-btn"
                  onClick={(e) => handleRemove(e, m.id)}
                  disabled={isLoading}
                >
                  {isRemoving === m.id ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <Trash2 size={13} />
                  )}
                </button>
              )}

              {isLoading && (
                <div className="st-pm-busy-overlay">
                  <Spinner animation="border" size="sm" variant="primary" />
                </div>
              )}
            </div>
          );
        })}

        {paymentMethods.length === 0 && (
          <div className="st-pm-empty">
            <CreditCard size={32} />
            <p>{t("no_payment_methods") || "No payment methods added yet"}</p>
          </div>
        )}
      </div>

      <AddCardModal
        show={isAdding}
        onHide={() => setIsAdding(false)}
        onAddSuccess={onUpdate}
        apiBase={apiBase}
        token={token}
        onToast={onToast}
        paymentMethods={paymentMethods}
      />
    </div>
  );
};

/* --- main --- */
const SubscriptionTab = ({ onToast }) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

  // --- TanStack Query Hook ---
  const { data: subscription, isLoading: loading, error: queryError } = usePlanDetails();

  const handlePaymentMethodsUpdate = (data) => {
    queryClient.invalidateQueries({ queryKey: ["planDetails"] });
  };

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const handleSelectPlan = (id) => {
    setSelectedPlanId(id);
    setShowUpgradeModal(true);
  };

  // Loading state moved into the main render to preserve header
  if (queryError) return <Alert variant="danger">{queryError.message || "Failed to load subscription details"}</Alert>;
  if (!subscription && !loading) return null;

  const {
    plan = "Free",
    usage = {},
    available_plans = [],
    billing_history = [],
    payment_methods = [],
    default_payment_method_id = null,
    company_name = "N/A",
    start_date = null,
    end_date = null,
    is_unlimited = false,
    billing_cycle = "monthly",
    total_days = 31,
  } = subscription || {};

  const currentPlanName = plan.toLowerCase();
  const currentPlanData = available_plans.find(
    (p) => p.name.toLowerCase() === currentPlanName,
  );
  const displayLimits =
    currentPlanData?.limits || subscription?.original_plan_limits || {};
  const displayPrice =
    currentPlanData?.price ||
    subscription?.original_plan_price ||
    subscription?.plan_price ||
    0;

  const daysRemaining = getDaysRemaining(end_date);
  const totalDays = total_days || 31;
  const usedDays = Math.max(0, totalDays - daysRemaining);
  const renewalPct = Math.min(100, Math.max(0, (usedDays / totalDays) * 100));

  const totalItems = billing_history.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const paginatedHistory = billing_history.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const billingColumns = [
    {
      key: "date",
      label: t("date") || "Date",
      render: (_, row) => (
        <div>
          <div className="admin-cell-primary">{fmtDate(row.date)}</div>
          <div className="admin-cell-secondary">{fmtTime(row.date)}</div>
        </div>
      ),
    },
    {
      key: "plan",
      label: t("plan") || "Plan",
      render: (_, row) => (
        <span
          className="admin-cell-primary"
          style={{ textTransform: "capitalize" }}
        >
          {row.plan_name} plan
        </span>
      ),
    },
    {
      key: "amount",
      label: t("amount") || "Amount",
      render: (_, row) => (
        <span className="admin-cell-primary">${row.amount}.00</span>
      ),
    },
  ];

  const accessFeatures = [
    {
      icon: TrendingUp,
      label: "Insight Access",
      desc: "Data-driven business insights",
      active: usage.insight,
    },
    {
      icon: Layers,
      label: "Strategic Access",
      desc: "Strategic planning tools",
      active: usage.strategic,
    },
    {
      icon: Target,
      label: "PMF Access",
      desc: "Product-market fit analysis",
      active: usage.pmf,
    },
    {
      icon: FolderOpen,
      label: "Project Access",
      desc: "Project creation & management",
      active:
        usage.projects?.original_limit ??
        usage.projects?.limit ??
        usage.project,
    },
  ];

  const defaultPM = payment_methods.find(
    (m) => m.id === default_payment_method_id,
  );

  return (
    <div className="st-root">
      <div className="st-disclaimer-banner">
        <Alert
          variant="info"
          className="d-flex align-items-center py-2 px-3 border-0 shadow-sm"
          style={{
            background: "#eff6ff",
            color: "#1e40af",
            borderRadius: "12px",
          }}
        >
          <AlertCircle size={18} className="me-2 flex-shrink-0" />
          <div style={{ fontSize: "0.875rem", fontWeight: "500" }}>
            {t("super_admin_modify_note") ||
              "Note: The Super Admin may modify plan limits independently, so they may not always match the limits of your current existing plan."}
          </div>
        </Alert>
      </div>
      
      {/* ---- Premium Loading Bar ---- */}
      {loading && (
        <div className="admin-loading-bar-container" style={{ marginBottom: '1rem' }}>
          <div className="admin-loading-bar" />
        </div>
      )}

      {/* === HEADER === */}
      <div className="st-header-clean">
        <div className="st-header-main">
          <div className="st-header-info">
            <div className="st-header-badge">
              <span className="st-dot-active" />
              {is_unlimited
                ? "Unlimited Plan"
                : t("active_subscription") || "Active Subscription"}
            </div>
            <h2 className="st-header-title">
              {currentPlanName.charAt(0).toUpperCase() +
                currentPlanName.slice(1)}{" "}
              Plan
            </h2>
            <p className="st-header-sub">
              {company_name} •{" "}
              {billing_cycle === "yearly" ? "Billed yearly" : "Billed monthly"}
            </p>
          </div>

          <div className="st-header-stats">
            <div className="st-h-stat">
              <span className="st-h-label">
                {billing_cycle === "yearly" ? "Yearly" : "Monthly"} Billing
              </span>
              <span className="st-h-value">${displayPrice}</span>
            </div>
          </div>

          <div className="st-header-stats">
            {!is_unlimited && end_date && (
              <div className="st-h-stat">
                <span className="st-h-label">Renews On</span>
                <span className="st-h-value">{fmtDate(end_date)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === BODY GRID === */}
      <div className="st-body-grid">
        {/* ── Usage Metrics ── */}
        <div className="st-card st-usage-card">
          <div className="st-card-header">
            <div className="st-card-title">Usage Metrics</div>
            <div className="st-card-subtitle">Current billing period</div>
          </div>
          <div className="st-usage-list">
            <UsageBar
              icon={Briefcase}
              label="Workspaces"
              current={usage.workspaces?.current ?? 0}
              limit={usage.workspaces?.limit}
              color="primary"
            />
            <UsageBar
              icon={Users}
              label="Collaborators"
              current={usage.collaborators?.current ?? 0}
              limit={usage.collaborators?.limit}
              color="primary"
            />
            <UsageBar
              icon={Users}
              label="Users"
              current={usage.users?.current ?? 0}
              limit={usage.users?.limit}
              color="primary"
            />
            <UsageBar
              icon={Eye}
              label="Viewers"
              current={usage.viewers?.current ?? 0}
              limit={usage.viewers?.limit}
              color="primary"
            />
            <UsageBar
              icon={FolderOpen}
              label="Projects"
              current={usage.projects?.current ?? 0}
              limit={usage.projects?.limit}
              color="primary"
            />
          </div>
        </div>

        {/* ── Feature Access ── */}
        <div className="st-card st-access-card">
          <div className="st-card-header">
            <div className="st-card-title">Feature Access</div>
            <div className="st-card-subtitle">Included in your plan</div>
          </div>
          <div className="st-access-list">
            {accessFeatures.map(({ icon: Icon, label, desc, active }) => (
              <div
                key={label}
                className={`st-access-item ${active ? "st-ai-on" : "st-ai-off"}`}
              >
                <div
                  className={`st-ai-icon-wrap ${active ? "st-ai-icon-on" : "st-ai-icon-off"}`}
                >
                  <Icon size={16} />
                </div>
                <div className="st-ai-text">
                  <div className="st-ai-label">{label}</div>
                  <div className="st-ai-desc">{desc}</div>
                </div>
                <div
                  className={`st-ai-status ${active ? "st-ais-on" : "st-ais-off"}`}
                >
                  {active ? (
                    <>
                      <Check size={10} strokeWidth={3} /> Enabled
                    </>
                  ) : (
                    <>
                      <Lock size={10} /> Locked
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Plan Summary ── */}
        {currentPlanData && (
          <div className="st-card st-plan-summary-card">
            <div className="st-card-header">
              <div className="st-card-title">Plan Details</div>
              <div
                className="st-card-subtitle"
                style={{ textTransform: "capitalize" }}
              >
                {currentPlanData.name} tier
              </div>
            </div>
            <div className="st-ps-price-row">
              <span className="st-ps-amount">${displayPrice}</span>
              <span className="st-ps-mo">
                /{currentPlanData?.period === "year" ? "year" : "month"}
              </span>
            </div>
            <p className="st-ps-desc">{currentPlanData?.description || ""}</p>
            <div className="st-ps-limits">
              {[
                {
                  icon: Briefcase,
                  label: "Workspaces",
                  val: displayLimits.workspaces,
                },
                {
                  icon: Users,
                  label: "Collaborators",
                  val: displayLimits.collaborators,
                },
                { icon: Eye, label: "Viewers", val: displayLimits.viewers },
                { icon: Users, label: "Users", val: displayLimits.users },
              ].map(({ icon: Icon, label, val }) => (
                <div key={label} className="st-ps-limit-item">
                  <div className="st-ps-limit-val">{val ?? 0}</div>
                  <div className="st-ps-limit-label">
                    <Icon size={11} /> {label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* === PAYMENT METHODS === */}
      <PaymentMethodsSection
        paymentMethods={payment_methods}
        defaultId={default_payment_method_id}
        apiBase={API_BASE_URL}
        token={token}
        onUpdate={handlePaymentMethodsUpdate}
        onToast={onToast}
      />

      {/* === AVAILABLE PLANS === */}
      <div className="st-card st-plans-wrapper">
        <div className="st-card-header st-plans-header-row">
          <div>
            <div className="st-card-title">Available Plans</div>
            <div className="st-card-subtitle">
              Choose the right plan for your business
            </div>
          </div>
        </div>
        <div className="st-plans-grid">
          {available_plans.map((p) => {
            return (
              <div
                key={p._id}
                className="st-plan-card"
                onClick={() => handleSelectPlan(p._id)}
              >
                <div className="st-pc-header">
                  <div
                    className="st-pc-name"
                    style={{ textTransform: "capitalize" }}
                  >
                    {p.name}
                  </div>
                  <div className="st-pc-price">
                    <span className="st-pc-amt">${p.price}</span>
                    <span className="st-pc-mo">
                      /{p.period === "year" ? "yr" : "mo"}
                    </span>
                  </div>
                </div>
                <p className="st-pc-desc">{p.description}</p>
                <div className="st-pc-divider" />
                <ul className="st-pc-feats">
                  {buildFeatureRows(p.limits).map((f, i) => (
                    <FeatureRow key={i} label={f.label} active={f.active} />
                  ))}
                </ul>
                <div className="st-pc-action">
                  <button className="st-pc-btn-select">Select Plan</button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* === BILLING HISTORY === */}
      <AdminTable
        title={t("billing_history") || "Billing History"}
        count={totalItems}
        countLabel={t("Records") || "Records"}
        columns={billingColumns}
        data={paginatedHistory}
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        loading={loading}
        emptyMessage={t("no_billing_history") || "No billing history found"}
      />

      <UpgradeModal
        show={showUpgradeModal}
        onHide={() => setShowUpgradeModal(false)}
        availablePlans={available_plans}
        currentPlanName={currentPlanName}
        paymentMethod={payment_methods}
        initialPlanId={selectedPlanId}
        onUpgradeSuccess={(updatedSub) => {
          queryClient.invalidateQueries({ queryKey: ["planDetails"] });
          // Plan changes can affect business access_mode/status — refresh admin view
          queryClient.invalidateQueries({ queryKey: ["adminBusinesses"] });
          queryClient.invalidateQueries({ queryKey: ["businesses"] });
          if (onToast)
            onToast(
              t("plan_updated_success") || "Plan updated successfully!",
              "success",
            );
        }}
      />
    </div>
  );
};

export default SubscriptionTab;
