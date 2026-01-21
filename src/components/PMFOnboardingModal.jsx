import React, { useState } from 'react';
import { Modal, Form, Button } from 'react-bootstrap';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Select from "react-select";
import { useTranslation } from '../hooks/useTranslation';
import {
  COUNTRIES,
  INDUSTRIES_BY_CATEGORY,
  STRATEGIC_OBJECTIVES,
  KEY_CHALLENGES,
  DIFFERENTIATION_OPTIONS,
  USAGE_CONTEXT_OPTIONS,
  TOTAL_STEPS
} from '../config/pmfOnboardingConfig';
import '../styles/pmf-onboarding.css';

const PMFOnboardingModal = ({ show, onHide, onSubmit }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    companyName: '',
    website: '',
    country: '',
    city: '',
    primaryIndustry: '',
    geography1: '',
    geography2: '',
    geography3: '',
    customerSegment1: '',
    customerSegment2: '',
    customerSegment3: '',
    productService1: '',
    productService2: '',
    productService3: '',
    channel1: '',
    channel2: '',
    channel3: '',
    strategicObjective: '',
    strategicObjectiveOther: '',
    keyChallenge: '',
    keyChallengeOther: '',
    differentiation: [],
    differentiationOther: '',
    usageContext: ''
  });
  const [errors, setErrors] = useState({});

  const progressPercentage = (currentStep / TOTAL_STEPS) * 100;
  const countryOptions = COUNTRIES.map(c => ({
    value: c,
    label: c
  }));

  const industryOptions = INDUSTRIES_BY_CATEGORY.map(group => ({
    label: group.category,
    options: group.industries.map(ind => ({
      value: ind,
      label: ind
    }))
  }));


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleRadioSelect = (value) => {
    setFormData(prev => ({
      ...prev,
      strategicObjective: value,
      strategicObjectiveOther: value === 'Other' ? prev.strategicObjectiveOther : ''
    }));
  };

  const handleRadioChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
      ...(value !== 'Other' && {
        [`${field}Other`]: ''
      })
    }));
  };

  const handleDifferentiationChange = (option) => {
    setFormData(prev => {
      const alreadySelected = prev.differentiation.includes(option);

      if (alreadySelected) {
        return {
          ...prev,
          differentiation: prev.differentiation.filter(o => o !== option),
          differentiationOther: option === 'Other' ? '' : prev.differentiationOther
        };
      }

      if (prev.differentiation.length >= 2) {
        return prev;
      }

      return {
        ...prev,
        differentiation: [...prev.differentiation, option]
      };
    });
  };


  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.companyName.trim()) {
      newErrors.companyName = t('company_name_required') || 'Company / Client Name is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors = {};
    if (!formData.country.trim()) {
      newErrors.country = t('country_required') || 'Country is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};
    if (!formData.primaryIndustry.trim()) {
      newErrors.primaryIndustry = t('primary_industry_required') || 'Primary Industry is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors = {};
    // At least one geography should be filled (optional but recommended)
    const hasAtLeastOneGeography = formData.geography1.trim() ||
      formData.geography2.trim() ||
      formData.geography3.trim();
    // This step seems optional based on the image, so we'll allow proceeding without validation
    setErrors(newErrors);
    return true; // Always allow proceeding, geographies are optional
  };

  const validateStep5 = () => {
    const newErrors = {};
    // Step 5 is optional - user can proceed without filling all fields
    setErrors(newErrors);
    return true; // Always allow proceeding
  };

  const validateStep6 = () => {
    const newErrors = {};

    if (!formData.strategicObjective) {
      newErrors.strategicObjective = 'Please select an objective';
    }

    if (
      formData.strategicObjective === 'Other' &&
      !formData.strategicObjectiveOther.trim()
    ) {
      newErrors.strategicObjectiveOther = 'Please specify';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep7 = () => {
    const newErrors = {};

    if (!formData.keyChallenge) {
      newErrors.keyChallenge = 'Please select a challenge';
    }

    if (
      formData.keyChallenge === 'Other' &&
      !formData.keyChallengeOther.trim()
    ) {
      newErrors.keyChallengeOther = 'Please specify';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep8 = () => {
    const newErrors = {};

    if (formData.differentiation.length === 0) {
      newErrors.differentiation = 'Select at least one option';
    }

    if (
      formData.differentiation.includes('Other') &&
      !formData.differentiationOther.trim()
    ) {
      newErrors.differentiation = 'Please specify for Other';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep9 = () => {
    const newErrors = {};
    if (!formData.usageContext) {
      newErrors.usageContext = 'Please select one option';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    // Validate current step before proceeding
    if (currentStep === 1) {
      if (!validateStep1()) {
        return;
      }
    } else if (currentStep === 2) {
      if (!validateStep2()) {
        return;
      }
    } else if (currentStep === 3) {
      if (!validateStep3()) {
        return;
      }
    } else if (currentStep === 4) {
      if (!validateStep4()) {
        return;
      }
    } else if (currentStep === 5) {
      if (!validateStep5()) {
        return;
      }
    } else if (currentStep === 6) {
      if (!validateStep6()) return;
    } else if (currentStep === 7) {
      if (!validateStep7()) return;
    } else if (currentStep === 8) {
      if (!validateStep8()) return;
    } else if (currentStep === 9) {
      if (!validateStep9()) return;
    }


    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(prev => prev + 1);
    } else {
      // On last step, submit the form
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(formData); // pass answers to parent
    }
    handleClose(); // close modal
  };



  const handleClose = () => {
    setCurrentStep(1);
    setFormData({
      companyName: '',
      website: '',
      country: '',
      city: '',
      primaryIndustry: '',
      geography1: '',
      geography2: '',
      geography3: '',
      customerSegment1: '',
      customerSegment2: '',
      customerSegment3: '',
      productService1: '',
      productService2: '',
      productService3: '',
      channel1: '',
      channel2: '',
      channel3: '',
      strategicObjective: '',
      strategicObjectiveOther: '',
      keyChallenge: '',
      keyChallengeOther: '',
      differentiation: [],
      differentiationOther: '',
      usageContext: ''
    });
    setErrors({});
    onHide();
  };


  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="pmf-step-content">
            <Form.Group className="mb-4">
              <Form.Label className="pmf-form-label">
                {t('company_client_name') || 'Company / Client Name'} <span className="text-danger">*</span>
              </Form.Label>
              <Form.Control
                type="text"
                name="companyName"
                value={formData.companyName}
                onChange={handleInputChange}
                placeholder={t('enter_company_name') || 'Enter company or client name'}
                className="pmf-form-control"
                isInvalid={!!errors.companyName}
                autoFocus
              />
              {errors.companyName && (
                <Form.Text className="text-danger d-block mt-1">
                  {errors.companyName}
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="pmf-form-label">
                {t('website') || 'Website'} ({t('optional') || 'optional'})
              </Form.Label>
              <Form.Control
                type="url"
                name="website"
                value={formData.website}
                onChange={handleInputChange}
                placeholder="https://example.com"
                className="pmf-form-control"
                isInvalid={!!errors.website}
              />
              {errors.website && (
                <Form.Text className="text-danger d-block mt-1">
                  {errors.website}
                </Form.Text>
              )}
            </Form.Group>
          </div>
        );
      case 2:
        return (
          <div className="pmf-step-content">
            <h5 className="pmf-step-question mb-4">
              {t('where_is_business_based') || 'Where is this business primarily based?'}
            </h5>

            <Form.Group className="mb-4">
              <Form.Label className="pmf-form-label">
                {t('country') || 'Country'} <span className="text-danger">*</span>
              </Form.Label>
              <Select
                classNamePrefix="pmf-select"
                placeholder={t('select_country') || 'Select country'}
                options={countryOptions}
                value={countryOptions.find(o => o.value === formData.country)}
                onChange={(selected) =>
                  setFormData(prev => ({
                    ...prev,
                    country: selected?.value || ''
                  }))
                }
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: base => ({
                    ...base,
                    zIndex: 9999
                  }),
                  menu: base => ({
                    ...base,
                    maxHeight: 200,
                    overflow: "hidden"
                  }),
                  menuList: base => ({
                    ...base,
                    maxHeight: 200,
                    padding: 0,
                    overflowY: "auto",
                    WebkitOverflowScrolling: "touch"
                  }),
                  option: (base, state) => ({
                    ...base,
                    padding: "10px 14px",
                    fontSize: "14px",
                    lineHeight: "18px",
                    backgroundColor: state.isSelected
                      ? "#217aff"
                      : state.isFocused
                      ? "#eef4ff"
                      : "#fff",
                    color: state.isSelected ? "#fff" : "#111",
                    cursor: "pointer"
                  }),
                  control: base => ({
                    ...base,
                    minHeight: 44,
                    borderRadius: 6
                  })
                }}

              />

              {errors.country && (
                <Form.Text className="text-danger d-block mt-1">
                  {errors.country}
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label className="pmf-form-label">
                {t('city') || 'City'} ({t('optional') || 'optional'})
              </Form.Label>
              <Form.Control
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                placeholder={t('enter_city') || 'Enter city'}
                className="pmf-form-control"
                isInvalid={!!errors.city}
              />
              {errors.city && (
                <Form.Text className="text-danger d-block mt-1">
                  {errors.city}
                </Form.Text>
              )}
            </Form.Group>
          </div>
        );
      case 3:
        return (
          <div className="pmf-step-content">
            <Form.Group className="mb-4">
              <Form.Label className="pmf-form-label">
                {t('primary_industry') || 'Primary Industry'} <span className="text-danger">*</span>
              </Form.Label>
              <Select
                classNamePrefix="pmf-select"
                placeholder={t('select_industry') || 'Select industry'}
                options={industryOptions}
                value={
                  industryOptions
                    .flatMap(g => g.options)
                    .find(o => o.value === formData.primaryIndustry)
                }
                onChange={(selected) =>
                  setFormData(prev => ({
                    ...prev,
                    primaryIndustry: selected?.value || ''
                  }))
                }
                menuPortalTarget={document.body}
                styles={{
                  menuPortal: base => ({
                    ...base,
                    zIndex: 9999
                  }),
                  menu: base => ({
                    ...base,
                    maxHeight: 200,
                    overflow: "hidden"
                  }),
                  menuList: base => ({
                    ...base,
                    maxHeight: 200,
                    padding: 0,
                    overflowY: "auto",
                    WebkitOverflowScrolling: "touch"
                  }),
                  option: (base, state) => ({
                    ...base,
                    padding: "10px 14px",
                    fontSize: "14px",
                    lineHeight: "18px",
                    backgroundColor: state.isSelected
                      ? "#217aff"
                      : state.isFocused
                      ? "#eef4ff"
                      : "#fff",
                    color: state.isSelected ? "#fff" : "#111",
                    cursor: "pointer"
                  }),
                  control: base => ({
                    ...base,
                    minHeight: 44,
                    borderRadius: 6
                  })
                }}
                />

              {errors.primaryIndustry && (
                <Form.Text className="text-danger d-block mt-1">
                  {errors.primaryIndustry}
                </Form.Text>
              )}
            </Form.Group>
          </div>
        );
      case 4:
        return (
          <div className="pmf-step-content">
            <h5 className="pmf-step-question mb-3">
              {t('which_geographies_strategic_answers') || 'Which geographies do you want strategic answers for?'}
            </h5>
            <p className="text-muted mb-4" style={{ fontSize: '14px' }}>
              {t('enter_up_to_3_geographies') || "Enter up to 3 specific geographies (e.g., 'United States', 'LATAM', 'Southeast Asia')"}
            </p>

            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                name="geography1"
                value={formData.geography1}
                onChange={handleInputChange}
                placeholder={`${t('geography') || 'Geography'} 1`}
                className="pmf-form-control"
                isInvalid={!!errors.geography1}
              />
              {errors.geography1 && (
                <Form.Text className="text-danger d-block mt-1">
                  {errors.geography1}
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Control
                type="text"
                name="geography2"
                value={formData.geography2}
                onChange={handleInputChange}
                placeholder={`${t('geography') || 'Geography'} 2`}
                className="pmf-form-control"
                isInvalid={!!errors.geography2}
              />
              {errors.geography2 && (
                <Form.Text className="text-danger d-block mt-1">
                  {errors.geography2}
                </Form.Text>
              )}
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Control
                type="text"
                name="geography3"
                value={formData.geography3}
                onChange={handleInputChange}
                placeholder={`${t('geography') || 'Geography'} 3`}
                className="pmf-form-control"
                isInvalid={!!errors.geography3}
              />
              {errors.geography3 && (
                <Form.Text className="text-danger d-block mt-1">
                  {errors.geography3}
                </Form.Text>
              )}
            </Form.Group>
          </div>
        );
      case 5:
        return (
          <div className="pmf-step-content">
            <h5 className="pmf-step-question mb-2">
              {t('where_does_profit_come_from') || 'Where does most of your profit come from today?'}
            </h5>
            <p className="text-muted mb-4" style={{ fontSize: '14px' }}>
              {t('your_best_estimate_enough') || 'Your best estimate is enough.'}
            </p>

            {/* Customer Segments Section */}
            <div className="mb-4">
              <Form.Label className="pmf-form-label mb-2">
                {t('customer_segments_max_3') || 'Customer segments (max 3)'}
              </Form.Label>
              <p className="text-muted mb-3" style={{ fontSize: '13px', marginTop: '-4px' }}>
                {t('customer_segments_example') || 'e.g., young adults, SMEs, enterprise'}
              </p>

              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  name="customerSegment1"
                  value={formData.customerSegment1}
                  onChange={handleInputChange}
                  placeholder={`${t('segment') || 'Segment'} 1`}
                  className="pmf-form-control"
                  isInvalid={!!errors.customerSegment1}
                />
                {errors.customerSegment1 && (
                  <Form.Text className="text-danger d-block mt-1">
                    {errors.customerSegment1}
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  name="customerSegment2"
                  value={formData.customerSegment2}
                  onChange={handleInputChange}
                  placeholder={`${t('segment') || 'Segment'} 2`}
                  className="pmf-form-control"
                  isInvalid={!!errors.customerSegment2}
                />
                {errors.customerSegment2 && (
                  <Form.Text className="text-danger d-block mt-1">
                    {errors.customerSegment2}
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Control
                  type="text"
                  name="customerSegment3"
                  value={formData.customerSegment3}
                  onChange={handleInputChange}
                  placeholder={`${t('segment') || 'Segment'} 3`}
                  className="pmf-form-control"
                  isInvalid={!!errors.customerSegment3}
                />
                {errors.customerSegment3 && (
                  <Form.Text className="text-danger d-block mt-1">
                    {errors.customerSegment3}
                  </Form.Text>
                )}
              </Form.Group>
            </div>

            {/* Products / Services Section */}
            <div className="mb-4">
              <Form.Label className="pmf-form-label mb-2">
                {t('products_services_max_3') || 'Products / services (max 3)'}
              </Form.Label>
              <p className="text-muted mb-3" style={{ fontSize: '13px', marginTop: '-4px' }}>
                {t('products_services_example') || 'e.g., ice cream, M&A advisory'}
              </p>

              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  name="productService1"
                  value={formData.productService1}
                  onChange={handleInputChange}
                  placeholder={(t('product_service') || 'Product/Service') + ' 1'}
                  className="pmf-form-control"
                  isInvalid={!!errors.productService1}
                />
                {errors.productService1 && (
                  <Form.Text className="text-danger d-block mt-1">
                    {errors.productService1}
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  name="productService2"
                  value={formData.productService2}
                  onChange={handleInputChange}
                  placeholder={`${t('product_service') || 'Product/Service'} 2`}
                  className="pmf-form-control"
                  isInvalid={!!errors.productService2}
                />
                {errors.productService2 && (
                  <Form.Text className="text-danger d-block mt-1">
                    {errors.productService2}
                  </Form.Text>
                )}
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Control
                  type="text"
                  name="productService3"
                  value={formData.productService3}
                  onChange={handleInputChange}
                  placeholder={`${t('product_service') || 'Product/Service'} 3`}
                  className="pmf-form-control"
                  isInvalid={!!errors.productService3}
                />
                {errors.productService3 && (
                  <Form.Text className="text-danger d-block mt-1">
                    {errors.productService3}
                  </Form.Text>
                )}
              </Form.Group>
            </div>
            {/* Channels Section */}
            <div className="mb-4">
              <Form.Label className="pmf-form-label mb-2">
                {t('channels_max_3') || 'Channels (max 3)'}
              </Form.Label>
              <p className="text-muted mb-3" style={{ fontSize: '13px', marginTop: '-4px' }}>
                {t('channels_example') || 'e.g., convenience stores, direct sales'}
              </p>

              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  name="channel1"
                  value={formData.channel1}
                  onChange={handleInputChange}
                  placeholder={t("Channel 1")}
                  className="pmf-form-control"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  name="channel2"
                  value={formData.channel2}
                  onChange={handleInputChange}
                  placeholder={t("Channel 2")}
                  className="pmf-form-control"
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Control
                  type="text"
                  name="channel3"
                  value={formData.channel3}
                  onChange={handleInputChange}
                  placeholder={t("Channel 3")}
                  className="pmf-form-control"
                />
              </Form.Group>
            </div>

            {/* Geographies Section */}
            <div className="mb-2">
              <Form.Label className="pmf-form-label mb-2">
                {t('geographies_max_3') || 'Geographies (max 3)'}
              </Form.Label>
              <p className="text-muted mb-3" style={{ fontSize: '13px', marginTop: '-4px' }}>
                {t('geographies_example') || 'e.g., Lima, nationwide'}
              </p>

              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  name="geography1"
                  value={formData.geography1}
                  onChange={handleInputChange}
                  placeholder={t("Geography 1")}
                  className="pmf-form-control"
                />
              </Form.Group>

              <Form.Group className="mb-3">
                <Form.Control
                  type="text"
                  name="geography2"
                  value={formData.geography2}
                  onChange={handleInputChange}
                  placeholder={t("Geography 2")}
                  className="pmf-form-control"
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Control
                  type="text"
                  name="geography3"
                  value={formData.geography3}
                  onChange={handleInputChange}
                  placeholder={t("Geography 3")}
                  className="pmf-form-control"
                />
              </Form.Group>
            </div>

          </div>
        );
      case 6:
        return (
          <div className="pmf-step-content">
            <h5 className="pmf-step-question mb-4">
              {t('strategic_objective') || 'Strategic Objective'}
            </h5>

            {STRATEGIC_OBJECTIVES.map((option) => (
              <div
                key={option}
                className={`pmf-radio-card ${formData.strategicObjective === option ? 'selected' : ''
                  }`}
                onClick={() => handleRadioSelect(option)}
              >
                <Form.Check
                  type="radio"
                  name="strategicObjective"
                  checked={formData.strategicObjective === option}
                  onChange={() => handleRadioSelect(option)}
                  label={
                    <span className="pmf-radio-label">
                      {option}
                    </span>
                  }
                />
              </div>
            ))}

            {/* Show input ONLY when Other is selected */}
            {formData.strategicObjective === 'Other' && (
              <Form.Group className="mt-3">
                <Form.Control
                  type="text"
                  placeholder="Please specify"
                  value={formData.strategicObjectiveOther}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      strategicObjectiveOther: e.target.value
                    }))
                  }
                  className="pmf-form-control"
                  isInvalid={!!errors.strategicObjectiveOther}
                />
                {errors.strategicObjectiveOther && (
                  <Form.Text className="text-danger">
                    {errors.strategicObjectiveOther}
                  </Form.Text>
                )}
              </Form.Group>
            )}

            {errors.strategicObjective && (
              <div className="text-danger mt-2">{errors.strategicObjective}</div>
            )}
          </div>
        );
      case 7:
        return (
          <div className="pmf-step-content">
            <h5 className="pmf-step-question mb-4">
              {t("Key challenges / constraints")}
            </h5>

            {KEY_CHALLENGES.map(option => (
              <div
                key={option}
                className={`pmf-radio-card ${formData.keyChallenge === option ? 'selected' : ''
                  }`}
                onClick={() => handleRadioChange('keyChallenge', option)}
              >
                <Form.Check
                  type="radio"
                  name="keyChallenge"
                  label={
                    <span className="pmf-radio-label">{option} </span>
                  }
                  checked={formData.keyChallenge === option}
                  onChange={() => handleRadioChange('keyChallenge', option)}
                />
              </div>
            ))}

            {/* Other input */}
            {formData.keyChallenge === 'Other' && (
              <Form.Group className="mt-3">
                <Form.Control
                  type="text"
                  placeholder="Please specify"
                  value={formData.keyChallengeOther}
                  onChange={(e) =>
                    setFormData(prev => ({
                      ...prev,
                      keyChallengeOther: e.target.value
                    }))
                  }
                  isInvalid={!!errors.keyChallengeOther}
                />
                <Form.Text className="text-danger">
                  {errors.keyChallengeOther}
                </Form.Text>
              </Form.Group>
            )}

            {errors.keyChallenge && (
              <div className="text-danger mt-2">{errors.keyChallenge}</div>
            )}
          </div>
        );
      case 8:
        return (
          <div className="pmf-step-content">
            <h5 className="pmf-step-question mb-2">
              {t("Today, you primarily differentiate through")}:
            </h5>

            <p className="text-muted mb-4" style={{ fontSize: '14px' }}>
              {t("Select up to")} 2
            </p>

            {DIFFERENTIATION_OPTIONS.map(option => (
              <div
                key={option}
                className={`pmf-checkbox-card ${formData.differentiation.includes(option) ? 'selected' : ''
                  }`}
              >
                <Form.Check
                  type="checkbox"
                  label={option}
                  checked={formData.differentiation.includes(option)}
                  onChange={() => handleDifferentiationChange(option)}
                  className="pmf-checkbox-input"
                />

                {/* 👇 SHOW ONLY FOR OTHER */}
                {option === 'Other' &&
                  formData.differentiation.includes('Other') && (
                    <Form.Control
                      type="text"
                      placeholder="Please specify"
                      value={formData.differentiationOther}
                      onChange={(e) =>
                        setFormData(prev => ({
                          ...prev,
                          differentiationOther: e.target.value
                        }))
                      }
                      className="pmf-form-control mt-3"
                    />
                  )}
              </div>
            ))}

            {errors.differentiation && (
              <div className="text-danger mt-2">
                {errors.differentiation}
              </div>
            )}
          </div>
        );

      case 9:
        return (
          <div className="pmf-step-content">
            <h5 className="pmf-step-question mb-4">
              {t("Usage Context")}
            </h5>

            {USAGE_CONTEXT_OPTIONS.map(option => (
              <div
                key={option}
                className={`pmf-radio-card ${formData.usageContext === option ? 'selected' : ''
                  }`}
                onClick={() =>
                  setFormData(prev => ({
                    ...prev,
                    usageContext: option
                  }))
                }
              >
                <Form.Check
                  type="radio"
                  name="usageContext"
                  label={option}
                  checked={formData.usageContext === option}
                  onChange={() =>
                    setFormData(prev => ({
                      ...prev,
                      usageContext: option
                    }))
                  }
                />
              </div>
            ))}
          </div>
        );

      // Add more steps here as needed
      default:
        return (
          <div className="pmf-step-content">
            <p>Step {currentStep} content - To be implemented</p>
          </div>
        );
    }
  };

  return (
    <Modal
      show={show}
      onHide={handleClose}
      centered
      size="lg"
      backdrop="static"
      className="pmf-onboarding-modal"
    >
      <Modal.Header className="pmf-modal-header">
        <div className="pmf-header-content">
          <Modal.Title className="pmf-modal-title">
            {t('pmf_onboarding') || 'PMF Onboarding'} - {t('step') || 'Step'} {currentStep} {t('of') || 'of'} {TOTAL_STEPS}
          </Modal.Title>
        </div>
        <button
          type="button"
          className="pmf-close-button"
          onClick={handleClose}
          aria-label="Close"
        >
          <X size={20} />
        </button>
      </Modal.Header>

      <Modal.Body className="pmf-modal-body">
        <div className="pmf-progress-container">
          <div className="pmf-progress-bar">
            <div
              className="pmf-progress-fill"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
        </div>

        {renderStepContent()}
      </Modal.Body>


      <Modal.Footer className="pmf-modal-footer">


        <Button
          variant="outline-secondary"
          onClick={handleBack}
          disabled={currentStep === 1}
          className="pmf-back-button"
        >
          <ChevronLeft size={18} className="me-1" />
          {t('back') || 'Back'}
        </Button>

        <Button
          variant="primary"
          onClick={handleNext}
          className="pmf-next-button"
        >
          {currentStep === TOTAL_STEPS
            ? (t('finish') || 'Complete Onboarding')
            : (t('next') || 'Next')}
          {currentStep < TOTAL_STEPS && (
            <ChevronRight size={18} className="ms-1" />
          )}
        </Button>
      </Modal.Footer>
    </Modal>
  );

};

export default PMFOnboardingModal;
