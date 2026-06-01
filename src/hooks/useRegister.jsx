import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from './useTranslation';
import { usePlans, useCompanies } from './useQueries';

export const useRegister = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

  const [activeTab, setActiveTab] = useState(1);
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    company_id: '',
    company_name: '',
    job_title: '',
    role: 'user',
    terms: false,
  });

  const [isNewCompany, setIsNewCompany] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [companySearch, setCompanySearch] = useState('');
  const [submitError, setSubmitError] = useState(null);
  const [isCompanyDropdownOpen, setIsCompanyDropdownOpen] = useState(false);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);

  const { data: plans = [] } = usePlans();
  const { data: companies = [], isLoading: loadingCompanies } = useCompanies();

  const filteredCompanies = useMemo(() => {
    return companies.filter(c =>
      c.company_name.toLowerCase().includes(companySearch.toLowerCase())
    );
  }, [companies, companySearch]);

  useEffect(() => {
    if (plans.length > 0 && !selectedPlanId) {
      const sorted = [...plans].sort((a, b) => a.price - b.price);
      setSelectedPlanId(sorted[0]._id);
    }
  }, [plans, selectedPlanId]);

  const handleChange = (e) => {
    let { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value });
    if (errors[name]) setErrors({ ...errors, [name]: '' });
  };

  const validateTab1 = () => {
    const newErrors = {};
    if (!form.name.trim()) {
      newErrors.name = t('first_name_required') || 'Name is required';
    } else {
      const name = form.name.trim();
      const hasLetter = /[a-zA-Z\u00C0-\u017F]/.test(name);
      if (name.length < 2) {
        newErrors.name = t('Name_must_be_at_least_2_characters_long') || 'Name must be at least 2 characters long';
      } else if (!hasLetter) {
        newErrors.name = t('Name_must_contain_at_least_one_letter') || 'Name must contain at least one letter';
      }
    }

    if (!form.email.trim()) newErrors.email = t('email_required') || 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = t('email_invalid') || 'Invalid email';

    if (!form.password) {
      newErrors.password = t('password_required') || 'Password is required';
    } else if (
      form.password.length < 8 ||
      !/(?=.*[a-z])/.test(form.password) ||
      !/(?=.*[A-Z])/.test(form.password) ||
      !/(?=.*\d)/.test(form.password) ||
      !/(?=.*[^A-Za-z0-9])/.test(form.password)
    ) {
      newErrors.password = t("password_rule_missing") || "Password rule is missing";
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = t('confirm_password_required') || 'Please confirm your password';
    } else if (form.password !== form.confirmPassword) {
      newErrors.confirmPassword = t('passwords_do_not_match') || 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateTab2 = () => {
    const newErrors = {};
    if (isNewCompany) {
      if (!form.company_name.trim()) {
        newErrors.company_name = t('company_name_required') || 'Company name is required';
      }
      if (!selectedPlanId) newErrors.selectedPlanId = t('plan_selection_required') || 'Please select a pricing plan';
    } else if (!form.company_id) {
      newErrors.company_id = t('Company_selection_is_required') || 'Company selection is required';
    }
    if (!form.terms) newErrors.terms = t('You_must_agree_to_the_Terms_&_Conditions_and_Privacy_Policy_to_proceed') || 'You must agree to the Terms & Conditions and Privacy Policy to proceed';

    setErrors(newErrors);
    return newErrors;
  };

  const handleNext = async () => {
    if (activeTab === 1) {
      if (validateTab1()) {
        try {
          setIsCheckingEmail(true);
          await axios.post(`${API_BASE_URL}/api/check-email`, { email: form.email.trim() });
          setActiveTab(2);
        } catch (err) {
          setErrors(prev => ({
            ...prev,
            email: err.response?.data?.error || err.response?.data?.message || t('email_already_exists') || 'Email is already in use'
          }));
        } finally {
          setIsCheckingEmail(false);
        }
      }
    } else if (activeTab === 2) {
      const tab2Errors = validateTab2();
      if (Object.keys(tab2Errors).length === 0) {
        if (isNewCompany) {
          setActiveTab(3);
        } else {
          handleSubmit();
        }
      }
      return tab2Errors;
    }
  };

  const handleBack = () => {
    setActiveTab(prev => prev - 1);
  };

  const handleSubmit = async (paymentMethodId, saveCard) => {
    setIsSubmitting(true);
    setErrors({});
    setSubmitError(null);

    try {
      const userData = {
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        terms_accepted: form.terms,
        job_title: form.job_title.trim() || undefined
      };

      if (isNewCompany) {
        userData.company_name = form.company_name.trim();
        userData.plan_id = selectedPlanId;
        if (paymentMethodId) {
          userData.paymentMethodId = paymentMethodId;
          userData.saveCard = saveCard;
        }
      } else {
        userData.company_id = form.company_id;
        userData.role = form.role;
      }

      const response = await axios.post(`${API_BASE_URL}/api/register`, userData);
      setModalMessage(response.data.message || 'Success!');
      setIsError(false);
      setShowSuccessModal(true);

      setTimeout(() => {
        setShowSuccessModal(false);
        navigate('/login');
      }, 2000);

    } catch (err) {
      setIsSubmitting(false);
      const errorMessage = err.response?.data?.error || 'Registration failed.';
      setSubmitError(errorMessage);
      setIsError(true);
      setModalMessage(errorMessage);
    }
  };

  return {
    activeTab, setActiveTab,
    form, setForm,
    isNewCompany, setIsNewCompany,
    selectedPlanId, setSelectedPlanId,
    errors, setErrors,
    isSubmitting,
    showPassword, setShowPassword,
    showConfirmPassword, setShowConfirmPassword,
    showSuccessModal, setShowSuccessModal,
    modalMessage,
    isError,
    isCheckingEmail,
    companySearch, setCompanySearch,
    submitError, setSubmitError,
    isCompanyDropdownOpen, setIsCompanyDropdownOpen,
    isRoleDropdownOpen, setIsRoleDropdownOpen,
    plans,
    companies, loadingCompanies,
    filteredCompanies,
    handleChange,
    handleNext,
    handleBack,
    handleSubmit,
    t
  };
};
