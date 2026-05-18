import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building, Loader, ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight, Check, X } from 'lucide-react';
import PricingPlanCard from './PricingPlanCard';

const CompanyStep = ({
  form,
  handleChange,
  isNewCompany,
  setIsNewCompany,
  errors,
  loadingCompanies,
  isCompanyDropdownOpen,
  setIsCompanyDropdownOpen,
  companySearch,
  setCompanySearch,
  filteredCompanies,
  companies,
  companyDropdownRef,
  isRoleDropdownOpen,
  setIsRoleDropdownOpen,
  roleDropdownRef,
  plans,
  selectedPlanId,
  setSelectedPlanId,
  onNext,
  onBack,
  setShowTermsModal,
  setShowPrivacyModal,
  companyErrorRef,
  plansErrorRef,
  termsErrorRef,
  t
}) => {
  return (
    <motion.div
      key="company"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="tab-content"
    >
      <form className="register-form" onSubmit={(e) => { e.preventDefault(); onNext(); }}>
        <div className="register-form-grid fade-blur-in">
          <div className="form-group-custom full-width-field">
            <div className="selection-header">
              <label>{t("action_type")} <span className="required">*</span></label>
              <div className="action-selection-group">
                <div
                  className={`selection-pill-option ${!isNewCompany ? 'active' : ''}`}
                  onClick={() => setIsNewCompany(false)}
                >
                  {!isNewCompany && (
                    <motion.div
                      layoutId="active-pill"
                      className="active-pill-bg"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="pill-text"><User size={20} /> {t("join_existing")}</span>
                </div>
                <div
                  className={`selection-pill-option ${isNewCompany ? 'active' : ''}`}
                  onClick={() => setIsNewCompany(true)}
                >
                  {isNewCompany && (
                    <motion.div
                      layoutId="active-pill"
                      className="active-pill-bg"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <span className="pill-text"><Building size={20} /> {t("create_new")}</span>
                </div>
              </div>
            </div>

            <div className="selection-content">
              <AnimatePresence mode="wait" initial={false}>
                {isNewCompany ? (
                  <motion.div
                    key="create-new"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    layout
                    className="form-group-custom"
                  >
                    <label>{t("companyName")}  <span className="required">*</span></label>
                    <input type="text" name="company_name" placeholder={t("brandNamePlaceholder")} value={form.company_name} onChange={handleChange} className={errors.company_name ? 'error' : ''} required />
                  </motion.div>
                ) : (
                  <motion.div
                    key="join-existing"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    layout
                    className="form-group-custom"
                  >
                    <label>{t("select_company")} <span className="required">*</span></label>
                    <div className="custom-select-container" ref={companyDropdownRef}>
                      {loadingCompanies ? (
                        <div className="loading-select"><Loader className="animate-spin" size={16} /> Loading...</div>
                      ) : (
                        <>
                          <div
                            className={`custom-select-header ${isCompanyDropdownOpen ? 'open' : ''} ${errors.company_id ? 'error' : ''}`}
                            onClick={() => setIsCompanyDropdownOpen(!isCompanyDropdownOpen)}
                          >
                            <span>
                              {form.company_id
                                ? companies.find(c => c._id === form.company_id)?.company_name || t('select_a_company')
                                : t('select_a_company')}
                            </span>
                            {loadingCompanies ? <Loader className="animate-spin" size={16} /> : (isCompanyDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />)}
                          </div>

                          {isCompanyDropdownOpen && (
                            <div className="custom-select-dropdown">
                              <div className="search-box-wrapper">
                                <input
                                  type="text"
                                  placeholder={t('type_a_company') || 'Type a company'}
                                  value={companySearch}
                                  onChange={(e) => setCompanySearch(e.target.value)}
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                />
                                <Search className="search-icon" size={18} />
                              </div>

                              <div className="options-list">
                                {filteredCompanies.length > 0 ? (
                                  filteredCompanies.map((c) => (
                                    <div
                                      key={c._id}
                                      className={`option-item ${form.company_id === c._id ? 'selected' : ''}`}
                                      onClick={() => {
                                        handleChange({ target: { name: 'company_id', value: c._id } });
                                        setIsCompanyDropdownOpen(false);
                                        setCompanySearch('');
                                      }}
                                    >
                                      {c.company_name}
                                    </div>
                                  ))
                                ) : (
                                  <div className="no-options">{t('no_companies_found') || 'No companies found'}</div>
                                )}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div ref={companyErrorRef}>
              {(errors.company_name || errors.company_id) && <div className="error-message">{errors.company_name || errors.company_id}</div>}
            </div>

            {!isNewCompany && (
              <div className="form-group-custom full-width-field mt-3">
                <label>{t("role")} <span className="required">*</span></label>
                <div className="custom-select-container" ref={roleDropdownRef}>
                  <div
                    className={`custom-select-header ${isRoleDropdownOpen ? 'open' : ''}`}
                    onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
                  >
                    <span>
                      {form.role ? t(form.role === 'company_admin' ? 'Org_Admin' : form.role.charAt(0).toUpperCase() + form.role.slice(1)) : t('Select_Role')}
                    </span>
                    {isRoleDropdownOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>

                  {isRoleDropdownOpen && (
                    <div className="custom-select-dropdown">
                      <div className="options-list">
                        {[
                          { id: 'collaborator', name: t('Collaborator') },
                          { id: 'user', name: t('User') },
                          { id: 'viewer', name: t('Viewer') }
                        ].map((r) => (
                          <div
                            key={r.id}
                            className={`option-item ${form.role === r.id ? 'selected' : ''}`}
                            onClick={() => {
                              handleChange({ target: { name: 'role', value: r.id } });
                              setIsRoleDropdownOpen(false);
                            }}
                          >
                            {r.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <AnimatePresence>
            {isNewCompany && (
              <motion.div
                key="pricing-plans"
                initial={{ opacity: 0, height: 0, overflow: 'hidden' }}
                animate={{ opacity: 1, height: 'auto', overflow: 'visible' }}
                exit={{ opacity: 0, height: 0, overflow: 'hidden' }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="pricing-section full-width-field"
              >
                <label className="section-label">{t("chooseStrategyPlan")} <span className="required">*</span></label>
                <div className="st-plans-table-container">
                  <table className="st-plans-table">
                    <thead>
                      <tr>
                        <th>{t("Features")}</th>
                        {plans.map(p => (
                          <th key={p._id} className="st-table-plan-header">
                            <div className="st-table-plan-name">{t(p.name)}</div>
                            <div className="st-table-plan-price">
                              ${p.price}<span className="st-table-plan-period">/{p.period === "year" ? t("yr") : t("mo")}</span>
                            </div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { label: t("Workspaces"), key: "workspaces" },
                        { label: t("Collaborators"), key: "collaborators" },
                        { label: t("Viewers"), key: "viewers" },
                        { label: t("Users"), key: "users" },
                        { label: t("Projects"), key: "project", isBool: true },
                        { label: t("Insight Access"), key: "insight", isBool: true },
                        { label: t("Strategic Access"), key: "strategic", isBool: true },
                        { label: t("PMF Access"), key: "pmf", isBool: true },
                      ].map(feat => (
                        <tr key={feat.key}>
                          <td>{feat.label}</td>
                          {plans.map(p => {
                            const val = p.limits?.[feat.key];
                            return (
                              <td key={p._id} className="st-table-feature-cell">
                                {feat.isBool ? (
                                  val ? <Check size={18} className="st-table-check-on" /> : <X size={18} className="st-table-check-off" />
                                ) : (
                                  val || 0
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                      <tr>
                        <td></td>
                        {plans.map(p => (
                          <td key={p._id} className="st-table-action-cell">
                            <button 
                              type="button"
                              className={`st-table-btn-select ${selectedPlanId === p._id ? 'selected' : ''}`}
                              onClick={() => setSelectedPlanId(p._id)}
                            >
                              {selectedPlanId === p._id ? t("Selected") : t("Select_Plan")}
                            </button>
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div ref={plansErrorRef}>
                  {errors.selectedPlanId && <div className="error-message">{errors.selectedPlanId}</div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="checkbox-group full-width-field">
            <div className="checkbox-wrapper">
              <input type="checkbox" id="terms-checkbox" name="terms" checked={form.terms} onChange={handleChange} required />
              <label htmlFor="terms-checkbox" className="checkbox-label-text">
                {t("i_agree_to_the")}{" "}
                <a href="#terms" onClick={(e) => { e.preventDefault(); setShowTermsModal(true); }}>
                  {t("terms")}
                </a>{" "}
                {t("and")}{" "}
                <a href="#privacy" onClick={(e) => { e.preventDefault(); setShowPrivacyModal(true); }}>
                  {t("privacy_policy")}
                </a>
              </label>
            </div>
            <div ref={termsErrorRef}>
              {errors.terms && <div className="error-message">{errors.terms}</div>}
            </div>
          </div>
        </div>

        <div className="form-actions mt-4">
          <button type="button" className="btn-secondary" onClick={onBack}>
            <ChevronLeft size={18} /> {t('Previous')}
          </button>
          <button type="submit" className="btn-primary">
             {isNewCompany ? <>{t('next_step')} <ChevronRight size={18} /></> : t('register_title')}
          </button>
        </div>
      </form>
    </motion.div>
  );
};

export default CompanyStep;
