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
      closeModal('createBusiness');
      addToast({ message: t('business_created_successfully'), type: 'success' });
      if (ENABLE_PMF) openModal('pmfOnboarding');
      setBusinessFormData({
        business_name: '',
        business_purpose: '',
        description: '',
        city: '',
        country: ''
      });
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
    const businessName = businessFormData.business_name.trim();
    if (!businessName) errors.business_name = t('business_name_cannot_be_empty');
    else if (businessName.length < 3) errors.business_name = "Business name must be at least 3 characters";

    const businessPurpose = businessFormData.business_purpose.trim();
    if (!businessPurpose) errors.business_purpose = t('business_purpose_required');
    else if (businessPurpose.length < 10) errors.business_purpose = "Business purpose must be at least 10 characters long";

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [businessFormData, t]);

  const handleFormChange = useCallback((e) => {
    const { name, value } = e.target;
    setBusinessFormData(prev => ({ ...prev, [name]: value }));
    setFormErrors(prev => ({ ...prev, [name]: '' }));
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
    navigate('/businesspage', { state: { business, initialTab } });
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
