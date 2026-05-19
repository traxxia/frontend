import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore, useBusinessStore, useUIStore } from '../store';
import { useBusinesses, usePlanDetails } from './useQueries';
import { getUserLimits } from '../utils/authUtils';
import { useTranslation } from './useTranslation';

export const useDashboard = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const ENABLE_PMF = getUserLimits().pmf;

  const {
    isCreating: isCreatingBusiness,
    isDeleting: isDeletingBusiness,
    createError: businessError,
    deleteError: storeDeleteError,
    createBusiness: createBusinessAction,
    deleteBusiness: deleteBusinessAction,
    setSelectedBusinessId,
    selectBusiness,
    selectedBusinessId,
    clearErrors
  } = useBusinessStore();

  const { data: businessesData, isLoading: isLoadingBusinesses } = useBusinesses();
  const { data: planDetailsQuery } = usePlanDetails();
  const usage = planDetailsQuery?.usage;

  const ownedBusinesses = businessesData?.businesses || [];
  const collaboratingBusinesses = businessesData?.collaborating_businesses || [];
  const deletedBusinesses = businessesData?.deleted_businesses || [];
  const allBusinessesQuery = [...ownedBusinesses, ...collaboratingBusinesses];

  const {
    openModal,
    closeModal,
    isModalOpen,
    addToast
  } = useUIStore();

  const [newlyCreatedBusiness, setNewlyCreatedBusiness] = useState(null);
  const [businessFormData, setBusinessFormData] = useState({
    business_name: '',
    business_purpose: '',
    description: '',
    city: '',
    country: ''
  });
  const [statusFilter, setStatusFilter] = useState(['ALL', 'EXECUTION', 'CREATED', 'DELETED']);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [businessToDelete, setBusinessToDelete] = useState(null);
  const [activeSlide, setActiveSlide] = useState(0);

  const userName = useAuthStore(state => state.userName);
  const userRole = useAuthStore(state => state.userRole);
  const isViewer = useAuthStore(state => state.isViewer());
  const isCollaborator = userRole?.toLowerCase() === "collaborator";
  const isAdmin = useAuthStore(state => state.isAdmin);

  const allBusinesses = useMemo(() => {
    return [...ownedBusinesses, ...collaboratingBusinesses, ...deletedBusinesses];
  }, [ownedBusinesses, collaboratingBusinesses, deletedBusinesses]);

  const filteredBusinesses = useMemo(() => {
    return allBusinesses.filter(business => {
      const state = business.status === 'deleted' ? 'DELETED' : (business.has_projects ? 'EXECUTION' : 'CREATED');
      return statusFilter.includes(state);
    });
  }, [allBusinesses, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = { ALL: allBusinesses.length, EXECUTION: 0, CREATED: 0, DELETED: 0 };
    allBusinesses.forEach(business => {
      const state = business.status === 'deleted' ? 'DELETED' : (business.has_projects ? 'EXECUTION' : 'CREATED');
      counts[state]++;
    });
    return counts;
  }, [allBusinesses]);

  const toggleStatusFilter = (status) => {
    if (status === 'ALL') {
      if (statusFilter.length === 4) setStatusFilter([]);
      else setStatusFilter(['ALL', 'EXECUTION', 'CREATED', 'DELETED']);
      return;
    }

    setStatusFilter(prev => {
      let newFilter;
      if (prev.includes(status)) {
        newFilter = prev.filter(s => s !== status && s !== 'ALL');
      } else {
        newFilter = [...prev, status];
        if (newFilter.length === 3) {
          newFilter = ['ALL', 'EXECUTION', 'CREATED', 'DELETED'];
        }
      }
      return newFilter;
    });
  };

  const deleteBusiness = useCallback(async (businessId) => {
    try {
      clearErrors();
      await deleteBusinessAction(businessId);
      closeModal('deleteBusiness');
      setBusinessToDelete(null);
      addToast({ message: t('business_deleted_successfully'), type: 'success' });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['businesses'] }),
        queryClient.invalidateQueries({ queryKey: ['planDetails'] })
      ]);
    } catch (error) {
      console.error('Error deleting business:', error);
    }
  }, [deleteBusinessAction, t, closeModal, addToast, clearErrors, queryClient]);

  const createBusiness = useCallback(async () => {
    try {
      const data = await createBusinessAction(businessFormData);
      setNewlyCreatedBusiness(data.business);
      if (data.business && (data.business._id || data.business.id)) {
        setSelectedBusinessId(data.business._id || data.business.id);
      }

      // Close modal and show success toast immediately
      closeModal('createBusiness');
      addToast({ message: t('business_created_successfully'), type: 'success' });

      // Open PMF onboarding if enabled
      if (ENABLE_PMF) openModal('pmfOnboarding');

      // Clear form data
      setBusinessFormData({
        business_name: '',
        business_purpose: '',
        description: '',
        city: '',
        country: ''
      });

      // Refresh data in background
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['businesses'] }),
        queryClient.invalidateQueries({ queryKey: ['planDetails'] })
      ]);
    } catch (error) {
      console.error('Error creating business:', error);
    }
  }, [createBusinessAction, businessFormData, setSelectedBusinessId, t, ENABLE_PMF, closeModal, openModal, addToast, queryClient]);


  const validateForm = useCallback(() => {
    const errors = {};

    // Business Name validation
    const businessName = businessFormData.business_name.trim();

    if (!businessName) {
      errors.business_name = t('business_name_cannot_be_empty');
    }
    else if (businessName.length < 3) {
      errors.business_name = "Business name must be at least 3 characters";
    }
    else if (!/[A-Za-z]/.test(businessName)) {
      errors.business_name = "Business name must contain at least one letter";
    }
    else if (/[0-9]{5,}/.test(businessName)) {
      errors.business_name = "Too many consecutive numbers are not allowed";
    }
    else if (/[^A-Za-z0-9\s]{5,}/.test(businessName)) {
      errors.business_name = "Too many consecutive special characters are not allowed";
    }

    // Business purpose validation
    const businessPurpose = businessFormData.business_purpose.trim();

    if (!businessPurpose) {
      errors.business_purpose = t('business_purpose_required');
    }
    else if (businessPurpose.length < 10) {
      errors.business_purpose = "Business purpose must be at least 10 characters long";
    }
    else if (!/[A-Za-z]/.test(businessPurpose)) {
      errors.business_purpose =
        t('business_purpose_must_contain_alphabetic_characters') ||
        "Business purpose must contain alphabetic characters";
    }
    else if (/[0-9]{5,}/.test(businessPurpose)) {
      errors.business_purpose = "Too many consecutive numbers are not allowed";
    }
    else if (/[^A-Za-z0-9\s]{5,}/.test(businessPurpose)) {
      errors.business_purpose = "Too many consecutive special characters are not allowed";
    }

    // City validation (optional but if provided, must be valid)
    const cityTrimmed = businessFormData.city.trim();
    const cityHasSpecialChars = /[^a-zA-ZÀ-ÿ\s.-]/.test(cityTrimmed);

    if (businessFormData.city && cityTrimmed.length === 0) {
      errors.city = t('city_cannot_contain_only_spaces');
    } else if (cityTrimmed.length > 0 && cityTrimmed.length < 2) {
      errors.city = t('city_min_length');
    } else if (cityTrimmed.length > 20) {
      errors.city = t('city_max_length');
    } else {
      const hasNumber = /\d/.test(cityTrimmed);
      const hasSpecial = cityHasSpecialChars;

      if (hasNumber && hasSpecial) {
        errors.city = "Numeric and special characters are not allowed";
      } else if (hasNumber) {
        errors.city = "Numeric values not allowed.";
      } else if (hasSpecial) {
        errors.city = t('city_cannot_contain_special_characters');
      }
    }

    // Country validation (optional but if provided, must be valid)
    const countryTrimmed = businessFormData.country.trim();
    const countryHasSpecialChars = /[^a-zA-ZÀ-ÿ\s.-]/.test(countryTrimmed);

    if (businessFormData.country && countryTrimmed.length === 0) {
      errors.country = t('country_cannot_contain_only_spaces');
    } else if (countryTrimmed.length > 0 && countryTrimmed.length < 2) {
      errors.country = t('country_min_length');
    } else if (countryTrimmed.length > 20) {
      errors.country = t('country_max_length');
    } else {
      const hasNumber = /\d/.test(countryTrimmed);
      const hasSpecial = countryHasSpecialChars;

      if (hasNumber && hasSpecial) {
        errors.country = "Numeric and special characters are not allowed";
      } else if (hasNumber) {
        errors.country = t('Numeric_values_not_allowed');
      } else if (hasSpecial) {
        errors.country = t('country_cannot_contain_special_characters');
      }
    }

    const description = businessFormData.description?.trim() || "";

    if (description) {
      if (description.length < 10) {
        errors.description = t('description_min_length');
      }
      else if (!/[A-Za-z]/.test(description)) {
        errors.description = t('description_alphabetic_required');
      }
      else if (/[0-9]{5,}/.test(description)) {
        errors.description = t('description_consecutive_numbers');
      }
      else if (/[^A-Za-z0-9\s]{5,}/.test(description)) {
        errors.description = t('description_consecutive_special');
      }
      else if (/\s{3,}/.test(description)) {
        errors.description = t('description_consecutive_spaces');
      }
    }


    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [businessFormData, t]);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;

    const sanitizedValue =
      name === "business_name"
        ? value.replace(/\\u[0-9A-Fa-f]{4}/g, '')
        : value;

    setBusinessFormData((prev) => ({
      ...prev,
      [name]: sanitizedValue,
    }));

    // Clear error for this field when user starts typing
    setFormErrors(prev => {
      if (!prev[name]) return prev;
      return {
        ...prev,
        [name]: ''
      };
    });
  }, []);

  const handleBusinessClick = useCallback((business) => {
    const limits = getUserLimits();
    const hasAnyAccess = limits.pmf || limits.project || limits.strategic || limits.insight;
    if (!hasAnyAccess) {
      openModal('noFeatureAccess');
      return;
    }
    selectBusiness(business);
    let initialTab = 'advanced';
    if (limits.pmf) initialTab = 'executive';
    else if (limits.insight || limits.strategic) initialTab = 'advanced';
    else if (limits.project) initialTab = 'bets';
    navigate(`/businesspage?tab=${initialTab}`, { state: { business, initialTab } });
  }, [selectBusiness, navigate, openModal]);

  return {
    t, navigate,
    usage, isLoadingBusinesses,
    ownedBusinesses, collaboratingBusinesses, allBusinessesQuery,
    filteredBusinesses, statusFilter, isFilterOpen, setIsFilterOpen,
    toggleStatusFilter, statusCounts,
    userName, isViewer, isCollaborator, isAdmin,
    isModalOpen, openModal, closeModal,
    businessFormData, handleFormChange, formErrors,
    newlyCreatedBusiness, newlyCreatedBusinessId: newlyCreatedBusiness?._id || selectedBusinessId,
    businessToDelete, setBusinessToDelete,
    activeSlide, setActiveSlide,
    createBusiness, deleteBusiness,
    isCreatingBusiness, isDeletingBusiness,
    businessError, storeDeleteError,
    handleBusinessClick,
    validateForm,
    handleShowCreateModal: () => {
      if (usage && usage.workspaces?.current >= usage.workspaces?.limit) {
        openModal('planLimit');
        return;
      }
      openModal('createBusiness');
      clearErrors();
      setFormErrors({});
    }
  };
};
