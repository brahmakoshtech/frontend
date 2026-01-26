import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
  ArrowLeftIcon,
  ArrowRightIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  UserIcon,
  StarIcon,
  CurrencyRupeeIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  VideoCameraIcon,
  PhotoIcon,
  CreditCardIcon,
  ChartBarIcon,
  FunnelIcon
} from '@heroicons/vue/24/outline';
import { useToast } from 'vue-toastification';
import expertService from '../../../services/expertService.js';
import expertCategoryService from '../../../services/expertCategoryService.js';

export default {
  name: 'ExpertManagement',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const toast = useToast();
    const loading = ref(false);
    const showExpertModal = ref(false);
    const showEditModal = ref(false);
    const showViewModal = ref(false);
    const activeDropdown = ref(null);
    const selectedExpert = ref(null);
    const editingExpert = ref(null);
    const experts = ref([]);
    const categories = ref([]);
    const selectedCategoryId = ref('');
    
    // Initialize category from URL query if it's a valid ObjectId
    const initializeCategoryFromURL = () => {
      const categoryFromURL = route.query.category || '';
      // Only set if it's a valid ObjectId format (24 hex characters)
      if (categoryFromURL && /^[0-9a-fA-F]{24}$/.test(categoryFromURL)) {
        selectedCategoryId.value = categoryFromURL;
      } else {
        selectedCategoryId.value = '';
      }
    };
    
    initializeCategoryFromURL();
    const filteredExperts = ref([]);
    const pageTitle = ref('Expert Management');

    const expertForm = ref({
      name: '',
      experience: '',
      expertise: '',
      profileSummary: '',
      languages: ['Hindi'], // Array of selected languages
      customLanguage: '', // For "Other" option
      profilePhoto: null,
      backgroundBanner: null,
      chatCharge: '',
      voiceCharge: '',
      videoCharge: '',
      status: 'offline',
      categoryId: ''
    });

    const editForm = ref({
      name: '',
      experience: '',
      expertise: '',
      profileSummary: '',
      languages: ['Hindi'], // Array of selected languages
      customLanguage: '', // For "Other" option
      profilePhoto: null,
      backgroundBanner: null,
      chatCharge: '',
      voiceCharge: '',
      videoCharge: '',
      status: 'offline',
      categoryId: ''
    });

    const editProfilePhotoUploaded = ref(false);
    const editProfilePhotoFileName = ref('');
    const editBannerUploaded = ref(false);
    const editBannerFileName = ref('');

    const profilePhotoUploaded = ref(false);
    const profilePhotoFileName = ref('');
    const bannerUploaded = ref(false);
    const bannerFileName = ref('');

    const loadExperts = async (categoryId = null) => {
      try {
        loading.value = true;
        console.log('Loading experts with categoryId:', categoryId);
        const response = await expertService.getExperts(true, categoryId); // Include inactive experts
        console.log('Experts API response:', response);
        if (response.success) {
          console.log('Experts data:', response.data);
          // Debug: Check review counts in expert data
          response.data.forEach(expert => {
            console.log(`Expert ${expert.name}: rating=${expert.rating}, reviews=${expert.reviews}, reviewCount=${expert.reviewCount}`);
          });
          experts.value = response.data || [];
          // No need for client-side filtering anymore
          filteredExperts.value = experts.value;
        } else {
          console.error('Failed to load experts:', response);
          toast.error('Failed to load experts');
        }
      } catch (error) {
        console.error('Load experts error:', error);
        toast.error('Failed to load experts');
        experts.value = [];
        filteredExperts.value = [];
      } finally {
        loading.value = false;
      }
    };

    const loadCategories = async () => {
      try {
        const response = await expertCategoryService.getAllExpertCategories();
        if (response.success && response.data) {
          const actualData = response.data.data || response.data;
          let categoriesList = Array.isArray(actualData.data) ? actualData.data : 
                             Array.isArray(actualData) ? actualData : [];
          categories.value = categoriesList.filter(cat => cat.isActive);
        }
      } catch (error) {
        console.error('Load categories error:', error);
        categories.value = [];
      }
    };

    // Remove filterExperts function as we now use API filtering
    // const filterExperts = () => { ... } - REMOVED

    const onCategoryChange = () => {
      // Load experts with selected category filter
      loadExperts(selectedCategoryId.value || null);
      
      // Update page title based on selected category
      const selectedCategory = categories.value.find(cat => cat._id === selectedCategoryId.value);
      pageTitle.value = selectedCategory ? `${selectedCategory.name} Management` : 'Expert Management';
      
      // Update URL query parameter
      router.replace({ 
        query: selectedCategoryId.value ? { category: selectedCategoryId.value } : {} 
      });
    };

    const goBack = () => {
      router.push('/client/expert-connect');
    };

    const openExpertModal = () => {
      showExpertModal.value = true;
    };

    // Language handling functions
    const toggleLanguage = (language, isEdit = false) => {
      const form = isEdit ? editForm.value : expertForm.value;
      const index = form.languages.indexOf(language);
      
      if (index > -1) {
        // Remove language if already selected
        form.languages.splice(index, 1);
        // Clear custom language if "Other" is deselected
        if (language === 'Other') {
          form.customLanguage = '';
        }
      } else {
        // Add language
        form.languages.push(language);
      }
    };

    const isLanguageSelected = (language, isEdit = false) => {
      const form = isEdit ? editForm.value : expertForm.value;
      return form.languages.includes(language);
    };

    const handleImageUpload = (event, type) => {
      const file = event.target.files[0];
      if (file) {
        if (type === 'profilePhoto') {
          expertForm.value.profilePhoto = file;
          profilePhotoUploaded.value = true;
          profilePhotoFileName.value = file.name;
        } else if (type === 'backgroundBanner') {
          expertForm.value.backgroundBanner = file;
          bannerUploaded.value = true;
          bannerFileName.value = file.name;
        }
      }
    };

    const submitExpert = async () => {
      try {
        loading.value = true;
        toast.info('Creating expert profile...');
        
        const expertData = {
          name: expertForm.value.name,
          experience: expertForm.value.experience,
          expertise: expertForm.value.expertise,
          profileSummary: expertForm.value.profileSummary,
          languages: expertForm.value.languages,
          customLanguage: expertForm.value.customLanguage,
          chatCharge: expertForm.value.chatCharge,
          voiceCharge: expertForm.value.voiceCharge,
          videoCharge: expertForm.value.videoCharge,
          status: expertForm.value.status,
          categoryId: expertForm.value.categoryId
        };
        
        console.log('Creating expert with data:', expertData);
        
        const response = await expertService.createExpert(expertData);
        console.log('Create expert response:', response);
        
        if (response.success) {
          const newExpert = response.data;
          
          // Upload profile photo if provided
          if (expertForm.value.profilePhoto) {
            try {
              await expertService.uploadProfilePhoto(newExpert._id, expertForm.value.profilePhoto);
            } catch (uploadError) {
              console.warn('Profile photo upload failed:', uploadError);
            }
          }
          
          // Upload banner if provided
          if (expertForm.value.backgroundBanner) {
            try {
              await expertService.uploadBanner(newExpert._id, expertForm.value.backgroundBanner);
            } catch (uploadError) {
              console.warn('Banner upload failed:', uploadError);
            }
          }
          
          toast.success('✓ Expert profile created successfully!');
          showExpertModal.value = false;
          
          // Reset form
          expertForm.value = {
            name: '',
            experience: '',
            expertise: '',
            profileSummary: '',
            languages: ['Hindi'],
            customLanguage: '',
            profilePhoto: null,
            backgroundBanner: null,
            chatCharge: '',
            voiceCharge: '',
            videoCharge: '',
            status: 'offline',
            categoryId: ''
          };
          profilePhotoUploaded.value = false;
          profilePhotoFileName.value = '';
          bannerUploaded.value = false;
          bannerFileName.value = '';
          
          // Reload experts with current filter
          await loadExperts(selectedCategoryId.value || null);
        } else {
          toast.error('Failed to create expert profile');
        }
      } catch (error) {
        console.error('Submit expert error:', error);
        toast.error('❌ Failed to create expert profile');
      } finally {
        loading.value = false;
      }
    };

    const toggleDropdown = (expertId) => {
      activeDropdown.value = activeDropdown.value === expertId ? null : expertId;
    };

    const viewExpert = (expert) => {
      selectedExpert.value = expert;
      showViewModal.value = true;
      activeDropdown.value = null;
    };

    const viewExpertDetails = (expert) => {
      // Navigate to expert details page
      router.push(`/client/expert-details/${expert._id}`);
    };

    const editExpert = (expert) => {
      editingExpert.value = expert;
      editForm.value = {
        name: expert.name,
        experience: expert.experience,
        expertise: expert.expertise,
        profileSummary: expert.profileSummary,
        languages: expert.languages || ['Hindi'],
        customLanguage: expert.customLanguage || '',
        profilePhoto: null,
        backgroundBanner: null,
        chatCharge: expert.chatCharge,
        voiceCharge: expert.voiceCharge,
        videoCharge: expert.videoCharge,
        status: expert.status,
        categoryId: expert.categoryId || ''
      };
      editProfilePhotoUploaded.value = false;
      editProfilePhotoFileName.value = '';
      editBannerUploaded.value = false;
      editBannerFileName.value = '';
      showEditModal.value = true;
      activeDropdown.value = null;
    };

    const handleEditImageUpload = (event, type) => {
      const file = event.target.files[0];
      if (file) {
        if (type === 'profilePhoto') {
          editForm.value.profilePhoto = file;
          editProfilePhotoUploaded.value = true;
          editProfilePhotoFileName.value = file.name;
        } else if (type === 'backgroundBanner') {
          editForm.value.backgroundBanner = file;
          editBannerUploaded.value = true;
          editBannerFileName.value = file.name;
        }
      }
    };

    const assignAllUncategorizedExperts = () => {
      const uncategorizedExperts = experts.value.filter(e => !e.categoryId);
      uncategorizedExperts.forEach(expert => {
        assignExpertToCategory(expert._id, selectedCategoryId.value);
      });
    };

    const assignExpertToCategory = async (expertId, categoryId) => {
      try {
        const response = await expertService.updateExpert(expertId, { categoryId });
        if (response.success) {
          // Reload experts with current filter after assignment
          await loadExperts(selectedCategoryId.value || null);
          toast.success('Expert assigned to category successfully!');
        }
      } catch (error) {
        console.error('Assign expert error:', error);
        toast.error('Failed to assign expert to category');
      }
    };

    const updateExpert = async () => {
      try {
        loading.value = true;
        toast.info('Updating expert profile...');
        
        const expertData = {
          name: editForm.value.name,
          experience: editForm.value.experience,
          expertise: editForm.value.expertise,
          profileSummary: editForm.value.profileSummary,
          languages: editForm.value.languages,
          customLanguage: editForm.value.customLanguage,
          chatCharge: editForm.value.chatCharge,
          voiceCharge: editForm.value.voiceCharge,
          videoCharge: editForm.value.videoCharge,
          status: editForm.value.status,
          categoryId: editForm.value.categoryId
        };
        
        const response = await expertService.updateExpert(editingExpert.value._id, expertData);
        
        if (response.success) {
          // Upload profile photo if provided
          if (editForm.value.profilePhoto) {
            try {
              await expertService.uploadProfilePhoto(editingExpert.value._id, editForm.value.profilePhoto);
            } catch (uploadError) {
              console.warn('Profile photo upload failed:', uploadError);
            }
          }
          
          // Upload banner if provided
          if (editForm.value.backgroundBanner) {
            try {
              await expertService.uploadBanner(editingExpert.value._id, editForm.value.backgroundBanner);
            } catch (uploadError) {
              console.warn('Banner upload failed:', uploadError);
            }
          }
          
          toast.success('✓ Expert profile updated successfully!');
          showEditModal.value = false;
          
          // Reload experts with current filter
          await loadExperts(selectedCategoryId.value || null);
        } else {
          toast.error('Failed to update expert profile');
        }
      } catch (error) {
        console.error('Update expert error:', error);
        toast.error('❌ Failed to update expert profile');
      } finally {
        loading.value = false;
      }
    };

    const deleteExpert = async (expertId) => {
      if (!confirm('Are you sure you want to delete this expert?')) return;
      
      try {
        loading.value = true;
        const response = await expertService.deleteExpert(expertId);
        
        if (response.success) {
          toast.success('✓ Expert deleted successfully!');
          await loadExperts(selectedCategoryId.value || null);
        } else {
          toast.error('Failed to delete expert');
        }
      } catch (error) {
        console.error('Delete expert error:', error);
        toast.error('❌ Failed to delete expert');
      } finally {
        loading.value = false;
      }
      
      activeDropdown.value = null;
    };

    const toggleExpertStatus = async (expertId, currentStatus) => {
      try {
        const response = await expertService.toggleExpert(expertId);
        if (response.success) {
          // Reload experts with current filter
          await loadExperts(selectedCategoryId.value || null);
          toast.success(`Expert ${response.data.isActive ? 'enabled' : 'disabled'} successfully!`);
        } else {
          toast.error('Failed to toggle expert status');
        }
      } catch (error) {
        console.error('Toggle expert status error:', error);
        toast.error('Failed to toggle expert status');
      }
      activeDropdown.value = null;
    };

    // Refresh expert data to get updated review counts
    const refreshExpertData = async () => {
      await loadExperts(selectedCategoryId.value || null);
    };

    // Function to update expert review count locally
    const updateExpertReviewCount = (expertId, newCount, newRating = null) => {
      const expertIndex = experts.value.findIndex(e => e._id === expertId);
      if (expertIndex !== -1) {
        experts.value[expertIndex].reviews = newCount;
        if (newRating !== null) {
          experts.value[expertIndex].rating = newRating;
        }
        // Update filtered experts as well
        const filteredIndex = filteredExperts.value.findIndex(e => e._id === expertId);
        if (filteredIndex !== -1) {
          filteredExperts.value[filteredIndex].reviews = newCount;
          if (newRating !== null) {
            filteredExperts.value[filteredIndex].rating = newRating;
          }
        }
      }
    };

    const getStatusBadge = (status) => {
      const statusConfig = {
        online: { class: 'bg-success', text: 'Online', color: '#28a745' },
        offline: { class: 'bg-secondary', text: 'Offline', color: '#6c757d' },
        busy: { class: 'bg-warning', text: 'Busy', color: '#ffc107' },
        queue: { class: 'bg-info', text: 'In Queue', color: '#17a2b8' }
      };
      return statusConfig[status] || statusConfig.offline;
    };

    // Expose refresh function for external use (e.g., after adding review)
    window.refreshExpertData = refreshExpertData;
    window.updateExpertReviewCount = updateExpertReviewCount;



    onMounted(() => {
      loadCategories();
      // Load experts with category filter from URL if present
      loadExperts(selectedCategoryId.value || null);
      
      // Set initial page title if category is selected from URL
      if (selectedCategoryId.value) {
        setTimeout(() => {
          const selectedCategory = categories.value.find(cat => cat._id === selectedCategoryId.value);
          pageTitle.value = selectedCategory ? `${selectedCategory.name} Management` : 'Expert Management';
        }, 100);
      }
    });

    return () => (
      <div class="container-fluid px-2 px-sm-3 px-lg-4">
        <div class="row">
          <div class="col-12">
            {/* Header */}
            <div class="bg-gradient-primary rounded-3 rounded-lg-4 p-3 p-md-4 mb-3 mb-md-4 text-white shadow-lg">
              <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2 gap-md-3">
                <button 
                  class="btn btn-light btn-sm rounded-pill px-3" 
                  onClick={goBack}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
                >
                  <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
                  <span class="d-none d-sm-inline">Back to Categories</span>
                  <span class="d-sm-none">Back</span>
                </button>
                <div class="flex-grow-1">
                  <h1 class="mb-1 fw-bold fs-3 fs-md-2 text-dark">{pageTitle.value}</h1>
                  <p class="mb-0 text-dark d-none d-sm-block" style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                    Manage spiritual experts and their profiles
                  </p>
                </div>
                <div class="d-flex gap-2 align-items-center">
                  <select 
                    class="form-select form-select-sm" 
                    id="categoryFilter"
                    name="categoryFilter"
                    style={{ minWidth: '150px' }}
                    v-model={selectedCategoryId.value}
                    onChange={onCategoryChange}
                  >
                    <option value="">All Categories</option>
                    {categories.value.map(category => (
                      <option key={category._id} value={category._id}>{category.name}</option>
                    ))}
                  </select>
                  <button 
                    class="btn btn-light btn-sm btn-md-lg rounded-pill px-3 px-md-4 shadow-sm"
                    onClick={openExpertModal}
                    disabled={loading.value}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '600', minHeight: '40px', whiteSpace: 'nowrap' }}
                  >
                    <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                    <span class="d-none d-sm-inline">Add Expert</span>
                    <span class="d-sm-none">Add</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Cards */}
            <div class="row g-2 g-md-3 mb-3 mb-md-4">
              <div class="col-6 col-lg-3">
                <div class="card border-0 shadow-sm h-100">
                  <div class="card-body text-center p-2 p-md-3">
                    <div class="text-primary mb-1 mb-md-2">
                      <UserIcon style={{ width: '1.5rem', height: '1.5rem' }} class="d-md-none" />
                      <UserIcon style={{ width: '2rem', height: '2rem' }} class="d-none d-md-block" />
                    </div>
                    <h4 class="fw-bold mb-1 fs-5 fs-md-4">{filteredExperts.value.length}</h4>
                    <small class="text-muted" style={{ fontSize: '0.75rem' }}>Total Experts</small>
                  </div>
                </div>
              </div>
              <div class="col-6 col-lg-3">
                <div class="card border-0 shadow-sm h-100">
                  <div class="card-body text-center p-2 p-md-3">
                    <div class="text-success mb-1 mb-md-2">
                      <UserIcon style={{ width: '1.5rem', height: '1.5rem' }} class="d-md-none" />
                      <UserIcon style={{ width: '2rem', height: '2rem' }} class="d-none d-md-block" />
                    </div>
                    <h4 class="fw-bold mb-1 fs-5 fs-md-4">{filteredExperts.value.filter(e => e.status === 'online').length}</h4>
                    <small class="text-muted" style={{ fontSize: '0.75rem' }}>Online Now</small>
                  </div>
                </div>
              </div>
              <div class="col-6 col-lg-3">
                <div class="card border-0 shadow-sm h-100">
                  <div class="card-body text-center p-2 p-md-3">
                    <div class="text-warning mb-1 mb-md-2">
                      <StarIcon style={{ width: '1.5rem', height: '1.5rem' }} class="d-md-none" />
                      <StarIcon style={{ width: '2rem', height: '2rem' }} class="d-none d-md-block" />
                    </div>
                    <h4 class="fw-bold mb-1 fs-5 fs-md-4">4.7</h4>
                    <small class="text-muted" style={{ fontSize: '0.75rem' }}>Avg Rating</small>
                  </div>
                </div>
              </div>
              <div class="col-6 col-lg-3">
                <div class="card border-0 shadow-sm h-100">
                  <div class="card-body text-center p-2 p-md-3">
                    <div class="text-info mb-1 mb-md-2">
                      <CurrencyRupeeIcon style={{ width: '1.5rem', height: '1.5rem' }} class="d-md-none" />
                      <CurrencyRupeeIcon style={{ width: '2rem', height: '2rem' }} class="d-none d-md-block" />
                    </div>
                    <h4 class="fw-bold mb-1 fs-5 fs-md-4">₹65</h4>
                    <small class="text-muted" style={{ fontSize: '0.75rem' }}>Avg Price</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Fix for Uncategorized Experts */}
            {experts.value.some(e => !e.categoryId) && (
              <div class="alert alert-warning d-flex align-items-center gap-2 mb-3">
                <span>⚠️</span>
                <div class="flex-grow-1">
                  <strong>Uncategorized Experts Found:</strong> {experts.value.filter(e => !e.categoryId).length} experts need category assignment.
                </div>
                {selectedCategoryId.value && (
                  <button 
                    class="btn btn-warning btn-sm"
                    onClick={assignAllUncategorizedExperts}
                  >
                    Assign to Current Category
                  </button>
                )}
              </div>
            )}

            {/* Experts Grid */}
            <div class="row g-3">
              {filteredExperts.value.map(expert => (
                <div key={expert._id} class="col-12 col-md-6 col-xl-4">
                  <div class="card border-0 shadow-sm h-100 position-relative overflow-hidden" style={{ borderRadius: '12px' }}>
                    {/* Disabled Overlay */}
                    {expert.isActive === false && (
                      <div 
                        class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.7)',
                          zIndex: 5,
                          backdropFilter: 'blur(1px)',
                          pointerEvents: 'none'
                        }}
                      >
                        <div class="text-center">
                          <div class="text-muted mb-2" style={{ fontSize: '2rem' }}>⏸️</div>
                          <h6 class="text-muted fw-bold">Expert Disabled</h6>
                        </div>
                      </div>
                    )}
                    
                    {/* Background Banner */}
                    {expert.backgroundBanner && (
                      <div 
                        class="position-absolute top-0 start-0 w-100"
                        style={{ 
                          height: '60px',
                          backgroundImage: `url(${expert.backgroundBanner})`,
                          backgroundSize: 'cover',
                          backgroundPosition: 'center',
                          opacity: 0.2,
                          zIndex: 0
                        }}
                      ></div>
                    )}
                    
                    <div class="card-body p-3 position-relative" style={{ zIndex: 1 }}>
                      {/* Expert Header */}
                      <div class="d-flex align-items-start justify-content-between mb-3">
                        <div class="d-flex align-items-center gap-3 flex-grow-1">
                          <div class="position-relative">
                            <div 
                              class="rounded-circle bg-white d-flex align-items-center justify-content-center overflow-hidden shadow-sm"
                              style={{ width: '50px', height: '50px', minWidth: '50px', border: '2px solid #fff' }}
                            >
                              {expert.profilePhoto ? (
                                <img 
                                  src={expert.profilePhoto} 
                                  alt={expert.name}
                                  class="w-100 h-100 object-fit-cover"
                                  style={{ objectFit: 'cover' }}
                                />
                              ) : (
                                <UserIcon style={{ width: '1.5rem', height: '1.5rem', color: '#6c757d' }} />
                              )}
                            </div>
                            <span 
                              class="position-absolute bottom-0 end-0 rounded-circle border border-2 border-white"
                              style={{ 
                                width: '12px', 
                                height: '12px', 
                                backgroundColor: expert.status === 'online' ? '#10b981' : expert.status === 'busy' ? '#f59e0b' : '#6b7280'
                              }}
                            ></span>
                          </div>
                          <div class="flex-grow-1 min-w-0">
                            <h6 class="fw-bold mb-1 text-truncate">{expert.name}</h6>
                            <div class="d-flex align-items-center gap-1 mb-1">
                              <StarIcon style={{ width: '0.875rem', height: '0.875rem', color: '#fbbf24' }} />
                              <small class="text-muted">{expert.rating || 'N/A'} ({expert.reviews || expert.reviewCount || 0} reviews)</small>
                            </div>
                            <span 
                              class="badge rounded-pill px-2 py-1"
                              style={{ 
                                backgroundColor: getStatusBadge(expert.status).color + '20',
                                color: getStatusBadge(expert.status).color,
                                fontSize: '0.75rem'
                              }}
                            >
                              {getStatusBadge(expert.status).text}
                            </span>
                          </div>
                        </div>
                        <div class="dropdown">
                          <button 
                            class="btn btn-dark rounded-circle p-2 d-flex align-items-center justify-content-center"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(expert._id);
                            }}
                            style={{ 
                              width: '32px', 
                              height: '32px', 
                              border: 'none',
                              zIndex: 20,
                              position: 'relative'
                            }}
                          >
                            <EllipsisVerticalIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                          </button>
                          {activeDropdown.value === expert._id && (
                            <div 
                              class="dropdown-menu show position-absolute shadow" 
                              style={{ 
                                zIndex: 1050, 
                                borderRadius: '8px',
                                right: '0',
                                left: 'auto',
                                top: '100%',
                                minWidth: '150px'
                              }}
                              onClick={(e) => e.stopPropagation()}
                            >
                              {expert.isActive ? (
                                <>
                                  <button class="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => viewExpert(expert)}>
                                    <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                                    <span>View</span>
                                  </button>
                                  <button class="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => editExpert(expert)}>
                                    <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                                    <span>Edit</span>
                                  </button>
                                  <button 
                                    class="dropdown-item d-flex align-items-center gap-2 py-2" 
                                    onClick={() => toggleExpertStatus(expert._id, expert.isActive ? 'active' : 'inactive')}
                                  >
                                    <span>🔴</span>
                                    <span>Disable</span>
                                  </button>
                                  <hr class="dropdown-divider my-1" />
                                  <button class="dropdown-item text-danger d-flex align-items-center gap-2 py-2" onClick={() => deleteExpert(expert._id)}>
                                    <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                                    <span>Delete</span>
                                  </button>
                                </>
                              ) : (
                                <button 
                                  class="dropdown-item d-flex align-items-center gap-2 py-2" 
                                  onClick={() => toggleExpertStatus(expert._id, expert.isActive ? 'active' : 'inactive')}
                                >
                                  <span>🟢</span>
                                  <span>Enable</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expert Details */}
                      <div class="mb-3">
                        <div class="row g-2 mb-2">
                          <div class="col-12">
                            <small class="text-muted d-block"><strong>Experience:</strong> {expert.experience}</small>
                          </div>
                          <div class="col-12">
                            <small class="text-muted d-block"><strong>Expertise:</strong> {expert.expertise}</small>
                          </div>
                          <div class="col-12">
                            <small class="text-muted d-block">
                              <strong>Languages:</strong> 
                              {expert.languages ? expert.languages.join(', ') : 'Hindi'}
                              {expert.customLanguage && `, ${expert.customLanguage}`}
                            </small>
                          </div>
                        </div>
                        <div class="bg-light rounded p-2">
                          <small class="text-muted" style={{ lineHeight: '1.4' }}>
                            {(expert.profileSummary?.length || 0) > 80 
                              ? expert.profileSummary.substring(0, 80) + '...' 
                              : expert.profileSummary || 'No summary available'
                            }
                          </small>
                        </div>
                      </div>

                      {/* Pricing */}
                      <div class="row g-2">
                        <div class="col-4">
                          <div class="text-center p-2 bg-primary text-white rounded">
                            <ChatBubbleLeftRightIcon style={{ width: '1rem', height: '1rem' }} class="mb-1" />
                            <div class="fw-bold" style={{ fontSize: '0.75rem' }}>₹{expert.chatCharge}</div>
                            <div style={{ fontSize: '0.625rem', opacity: 0.9 }}>Chat</div>
                          </div>
                        </div>
                        <div class="col-4">
                          <div class="text-center p-2 bg-success text-white rounded">
                            <PhoneIcon style={{ width: '1rem', height: '1rem' }} class="mb-1" />
                            <div class="fw-bold" style={{ fontSize: '0.75rem' }}>₹{expert.voiceCharge}</div>
                            <div style={{ fontSize: '0.625rem', opacity: 0.9 }}>Voice</div>
                          </div>
                        </div>
                        <div class="col-4">
                          <div class="text-center p-2 bg-info text-white rounded">
                            <VideoCameraIcon style={{ width: '1rem', height: '1rem' }} class="mb-1" />
                            <div class="fw-bold" style={{ fontSize: '0.75rem' }}>₹{expert.videoCharge}</div>
                            <div style={{ fontSize: '0.625rem', opacity: 0.9 }}>Video</div>
                          </div>
                        </div>
                      </div>

                      {/* Arrow Button */}
                      <div class="d-flex justify-content-end mt-3">
                        <button 
                          class="btn btn-outline-primary btn-sm rounded-circle d-flex align-items-center justify-content-center"
                          style={{ width: '32px', height: '32px' }}
                          onClick={() => viewExpertDetails(expert)}
                          title="View Expert Details"
                        >
                          <ArrowRightIcon style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredExperts.value.length === 0 && (
              <div class="text-center py-5">
                <UserIcon style={{ width: '4rem', height: '4rem', color: '#dee2e6' }} class="mb-3" />
                <h5 class="text-muted mb-2">{selectedCategoryId.value ? 'No experts in this category' : 'No experts found'}</h5>
                <p class="text-muted mb-3">{selectedCategoryId.value ? 'Try selecting a different category or add experts to this category' : 'Start by adding your first expert to the system'}</p>
                <button class="btn btn-primary rounded-pill px-4" onClick={openExpertModal}>
                  <PlusIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                  Add {selectedCategoryId.value ? 'Expert to Category' : 'First Expert'}
                </button>
              </div>
            )}

            {/* Add Expert Modal */}
            {showExpertModal.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div class="modal-dialog modal-dialog-scrollable">
                  <div class="modal-content">
                    <div class="modal-header border-0 pb-0">
                      <h5 class="modal-title fw-bold">Add New Expert</h5>
                      <button 
                        type="button" 
                        class="btn-close" 
                        onClick={() => showExpertModal.value = false}
                      ></button>
                    </div>
                    <div class="modal-body px-3 px-md-4">
                      <form onSubmit={(e) => { e.preventDefault(); submitExpert(); }}>
                        <div class="row g-3">
                          {/* Expert Name */}
                          <div class="col-12 col-md-6">
                            <label class="form-label fw-semibold" for="expertName">
                              <UserIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                              Expert Name *
                            </label>
                            <input 
                              type="text" 
                              class="form-control" 
                              id="expertName"
                              name="expertName"
                              v-model={expertForm.value.name}
                              placeholder="Enter expert name"
                              required 
                            />
                          </div>

                          {/* Experience */}
                          <div class="col-12 col-md-6">
                            <label class="form-label fw-semibold" for="expertExperience">
                              <ChartBarIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                              Experience *
                            </label>
                            <input 
                              type="text" 
                              class="form-control" 
                              id="expertExperience"
                              name="expertExperience"
                              v-model={expertForm.value.experience}
                              placeholder="e.g., 10 years"
                              required 
                            />
                          </div>

                          {/* Expertise */}
                          <div class="col-12">
                            <label class="form-label fw-semibold" for="expertExpertise">
                              <StarIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                              Expertise *
                            </label>
                            <input 
                              type="text" 
                              class="form-control" 
                              id="expertExpertise"
                              name="expertExpertise"
                              v-model={expertForm.value.expertise}
                              placeholder="e.g., Astrology, Tarot Reading"
                              required 
                            />
                          </div>

                          {/* Profile Summary */}
                          <div class="col-12">
                            <label class="form-label fw-semibold" for="expertSummary">Profile Summary *</label>
                            <textarea 
                              class="form-control" 
                              id="expertSummary"
                              name="expertSummary"
                              rows="3"
                              v-model={expertForm.value.profileSummary}
                              placeholder="Brief description about the expert"
                              required
                            ></textarea>
                          </div>

                          {/* Languages */}
                          <div class="col-12">
                            <label class="form-label fw-semibold">Languages *</label>
                            <div class="border rounded p-3">
                              <div class="row g-2">
                                <div class="col-12 col-md-4">
                                  <div class="form-check">
                                    <input 
                                      class="form-check-input" 
                                      type="checkbox" 
                                      id="hindi"
                                      checked={isLanguageSelected('Hindi')}
                                      onChange={() => toggleLanguage('Hindi')}
                                    />
                                    <label class="form-check-label" for="hindi">Hindi</label>
                                  </div>
                                </div>
                                <div class="col-12 col-md-4">
                                  <div class="form-check">
                                    <input 
                                      class="form-check-input" 
                                      type="checkbox" 
                                      id="english"
                                      checked={isLanguageSelected('English')}
                                      onChange={() => toggleLanguage('English')}
                                    />
                                    <label class="form-check-label" for="english">English</label>
                                  </div>
                                </div>
                                <div class="col-12 col-md-4">
                                  <div class="form-check">
                                    <input 
                                      class="form-check-input" 
                                      type="checkbox" 
                                      id="other"
                                      checked={isLanguageSelected('Other')}
                                      onChange={() => toggleLanguage('Other')}
                                    />
                                    <label class="form-check-label" for="other">Other</label>
                                  </div>
                                </div>
                                {isLanguageSelected('Other') && (
                                  <div class="col-12">
                                    <input 
                                      type="text" 
                                      class="form-control mt-2" 
                                      placeholder="Enter custom language"
                                      v-model={expertForm.value.customLanguage}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Profile Photo */}
                          <div class="col-12 col-md-6">
                            <label class="form-label fw-semibold" for="expertPhoto">
                              <PhotoIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                              Profile Photo
                            </label>
                            <input 
                              type="file" 
                              class="form-control" 
                              id="expertPhoto"
                              name="expertPhoto"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'profilePhoto')}
                            />
                            {profilePhotoUploaded.value && (
                              <small class="text-success mt-1 d-block">✓ {profilePhotoFileName.value}</small>
                            )}
                          </div>

                          {/* Background Banner */}
                          <div class="col-12 col-md-6">
                            <label class="form-label fw-semibold" for="expertBanner">
                              <PhotoIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                              Background Banner
                            </label>
                            <input 
                              type="file" 
                              class="form-control" 
                              id="expertBanner"
                              name="expertBanner"
                              accept="image/*"
                              onChange={(e) => handleImageUpload(e, 'backgroundBanner')}
                            />
                            {bannerUploaded.value && (
                              <small class="text-success mt-1 d-block">✓ {bannerFileName.value}</small>
                            )}
                          </div>

                          {/* Pricing Plans */}
                          <div class="col-12">
                            <h6 class="fw-semibold mb-3">
                              <CreditCardIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                              Pricing Plans *
                            </h6>
                            <div class="row g-2 g-md-3">
                              <div class="col-12 col-md-4">
                                <label class="form-label" for="expertChatCharge">
                                  <ChatBubbleLeftRightIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                                  Chat (₹/min)
                                </label>
                                <input 
                                  type="number" 
                                  class="form-control" 
                                  id="expertChatCharge"
                                  name="expertChatCharge"
                                  v-model={expertForm.value.chatCharge}
                                  placeholder="50"
                                  required 
                                />
                              </div>
                              <div class="col-12 col-md-4">
                                <label class="form-label" for="expertVoiceCharge">
                                  <PhoneIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                                  Voice (₹/min)
                                </label>
                                <input 
                                  type="number" 
                                  class="form-control" 
                                  id="expertVoiceCharge"
                                  name="expertVoiceCharge"
                                  v-model={expertForm.value.voiceCharge}
                                  placeholder="80"
                                  required 
                                />
                              </div>
                              <div class="col-12 col-md-4">
                                <label class="form-label" for="expertVideoCharge">
                                  <VideoCameraIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                                  Video (₹/min)
                                </label>
                                <input 
                                  type="number" 
                                  class="form-control" 
                                  id="expertVideoCharge"
                                  name="expertVideoCharge"
                                  v-model={expertForm.value.videoCharge}
                                  placeholder="120"
                                  required 
                                />
                              </div>
                            </div>
                          </div>

                          {/* Status */}
                          <div class="col-12 col-md-6">
                            <label class="form-label fw-semibold" for="expertStatus">Status *</label>
                            <select class="form-select" id="expertStatus" name="expertStatus" v-model={expertForm.value.status} required>
                              <option value="offline">Offline</option>
                              <option value="online">Online</option>
                              <option value="busy">Busy</option>
                              <option value="queue">In Queue</option>
                            </select>
                          </div>

                          {/* Category */}
                          <div class="col-12 col-md-6">
                            <label class="form-label fw-semibold" for="expertCategory">
                              <FunnelIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                              Category *
                            </label>
                            <select class="form-select" id="expertCategory" name="expertCategory" v-model={expertForm.value.categoryId} required>
                              <option value="">Select Category</option>
                              {categories.value.map(category => (
                                <option key={category._id} value={category._id}>{category.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </form>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                      <button 
                        type="button" 
                        class="btn btn-secondary rounded-pill px-4" 
                        onClick={() => showExpertModal.value = false}
                        disabled={loading.value}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-primary rounded-pill px-4" 
                        onClick={submitExpert}
                        disabled={loading.value}
                      >
                        {loading.value ? (
                          <>
                            <span class="spinner-border spinner-border-sm me-2"></span>
                            Creating...
                          </>
                        ) : (
                          'Create Expert'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Expert Modal */}
            {showEditModal.value && editingExpert.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div class="modal-dialog modal-dialog-scrollable">
                  <div class="modal-content">
                    <div class="modal-header border-0 pb-0">
                      <h5 class="modal-title fw-bold">Edit Expert</h5>
                      <button 
                        type="button" 
                        class="btn-close" 
                        onClick={() => showEditModal.value = false}
                      ></button>
                    </div>
                    <div class="modal-body px-3 px-md-4">
                      <form onSubmit={(e) => { e.preventDefault(); updateExpert(); }}>
                        <div class="row g-3">
                          <div class="col-12 col-md-6">
                            <label class="form-label fw-semibold" for="editExpertName">
                              <UserIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                              Expert Name *
                            </label>
                            <input 
                              type="text" 
                              class="form-control" 
                              id="editExpertName"
                              name="editExpertName"
                              v-model={editForm.value.name}
                              placeholder="Enter expert name"
                              required 
                            />
                          </div>
                          <div class="col-12 col-md-6">
                            <label class="form-label fw-semibold" for="editExpertExperience">
                              <ChartBarIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                              Experience *
                            </label>
                            <input 
                              type="text" 
                              class="form-control" 
                              id="editExpertExperience"
                              name="editExpertExperience"
                              v-model={editForm.value.experience}
                              placeholder="e.g., 10 years"
                              required 
                            />
                          </div>
                          <div class="col-12">
                            <label class="form-label fw-semibold" for="editExpertExpertise">
                              <StarIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                              Expertise *
                            </label>
                            <input 
                              type="text" 
                              class="form-control" 
                              id="editExpertExpertise"
                              name="editExpertExpertise"
                              v-model={editForm.value.expertise}
                              placeholder="e.g., Astrology, Tarot Reading"
                              required 
                            />
                          </div>
                          <div class="col-12">
                            <label class="form-label fw-semibold" for="editExpertSummary">Profile Summary *</label>
                            <textarea 
                              class="form-control" 
                              id="editExpertSummary"
                              name="editExpertSummary"
                              rows="3"
                              v-model={editForm.value.profileSummary}
                              placeholder="Brief description about the expert"
                              required
                            ></textarea>
                          </div>

                          {/* Languages */}
                          <div class="col-12">
                            <label class="form-label fw-semibold">Languages *</label>
                            <div class="border rounded p-3">
                              <div class="row g-2">
                                <div class="col-12 col-md-4">
                                  <div class="form-check">
                                    <input 
                                      class="form-check-input" 
                                      type="checkbox" 
                                      id="editHindi"
                                      checked={isLanguageSelected('Hindi', true)}
                                      onChange={() => toggleLanguage('Hindi', true)}
                                    />
                                    <label class="form-check-label" for="editHindi">Hindi</label>
                                  </div>
                                </div>
                                <div class="col-12 col-md-4">
                                  <div class="form-check">
                                    <input 
                                      class="form-check-input" 
                                      type="checkbox" 
                                      id="editEnglish"
                                      checked={isLanguageSelected('English', true)}
                                      onChange={() => toggleLanguage('English', true)}
                                    />
                                    <label class="form-check-label" for="editEnglish">English</label>
                                  </div>
                                </div>
                                <div class="col-12 col-md-4">
                                  <div class="form-check">
                                    <input 
                                      class="form-check-input" 
                                      type="checkbox" 
                                      id="editOther"
                                      checked={isLanguageSelected('Other', true)}
                                      onChange={() => toggleLanguage('Other', true)}
                                    />
                                    <label class="form-check-label" for="editOther">Other</label>
                                  </div>
                                </div>
                                {isLanguageSelected('Other', true) && (
                                  <div class="col-12">
                                    <input 
                                      type="text" 
                                      class="form-control mt-2" 
                                      placeholder="Enter custom language"
                                      v-model={editForm.value.customLanguage}
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div class="col-12 col-md-6">
                            <label class="form-label fw-semibold" for="editExpertPhoto">
                              <PhotoIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                              Profile Photo
                            </label>
                            <input 
                              type="file" 
                              class="form-control" 
                              id="editExpertPhoto"
                              name="editExpertPhoto"
                              accept="image/*"
                              onChange={(e) => handleEditImageUpload(e, 'profilePhoto')}
                            />
                            {editProfilePhotoUploaded.value && (
                              <small class="text-success mt-1 d-block">✓ {editProfilePhotoFileName.value}</small>
                            )}
                          </div>
                          <div class="col-12 col-md-6">
                            <label class="form-label fw-semibold" for="editExpertBanner">
                              <PhotoIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                              Background Banner
                            </label>
                            <input 
                              type="file" 
                              class="form-control" 
                              id="editExpertBanner"
                              name="editExpertBanner"
                              accept="image/*"
                              onChange={(e) => handleEditImageUpload(e, 'backgroundBanner')}
                            />
                            {editBannerUploaded.value && (
                              <small class="text-success mt-1 d-block">✓ {editBannerFileName.value}</small>
                            )}
                          </div>
                          <div class="col-12">
                            <h6 class="fw-semibold mb-3">
                              <CreditCardIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                              Pricing Plans *
                            </h6>
                            <div class="row g-2 g-md-3">
                              <div class="col-12 col-md-4">
                                <label class="form-label" for="editExpertChatCharge">
                                  <ChatBubbleLeftRightIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                                  Chat (₹/min)
                                </label>
                                <input 
                                  type="number" 
                                  class="form-control" 
                                  id="editExpertChatCharge"
                                  name="editExpertChatCharge"
                                  v-model={editForm.value.chatCharge}
                                  placeholder="50"
                                  required 
                                />
                              </div>
                              <div class="col-12 col-md-4">
                                <label class="form-label" for="editExpertVoiceCharge">
                                  <PhoneIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                                  Voice (₹/min)
                                </label>
                                <input 
                                  type="number" 
                                  class="form-control" 
                                  id="editExpertVoiceCharge"
                                  name="editExpertVoiceCharge"
                                  v-model={editForm.value.voiceCharge}
                                  placeholder="80"
                                  required 
                                />
                              </div>
                              <div class="col-12 col-md-4">
                                <label class="form-label" for="editExpertVideoCharge">
                                  <VideoCameraIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                                  Video (₹/min)
                                </label>
                                <input 
                                  type="number" 
                                  class="form-control" 
                                  id="editExpertVideoCharge"
                                  name="editExpertVideoCharge"
                                  v-model={editForm.value.videoCharge}
                                  placeholder="120"
                                  required 
                                />
                              </div>
                            </div>
                          </div>
                          <div class="col-12 col-md-6">
                            <label class="form-label fw-semibold" for="editExpertStatus">Status *</label>
                            <select class="form-select" id="editExpertStatus" name="editExpertStatus" v-model={editForm.value.status} required>
                              <option value="offline">Offline</option>
                              <option value="online">Online</option>
                              <option value="busy">Busy</option>
                              <option value="queue">In Queue</option>
                            </select>
                          </div>
                          <div class="col-12 col-md-6">
                            <label class="form-label fw-semibold" for="editExpertCategory">
                              <FunnelIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                              Category *
                            </label>
                            <select class="form-select" id="editExpertCategory" name="editExpertCategory" v-model={editForm.value.categoryId} required>
                              <option value="">Select Category</option>
                              {categories.value.map(category => (
                                <option key={category._id} value={category._id}>{category.name}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </form>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                      <button 
                        type="button" 
                        class="btn btn-secondary rounded-pill px-4" 
                        onClick={() => showEditModal.value = false}
                        disabled={loading.value}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-primary rounded-pill px-4" 
                        onClick={updateExpert}
                        disabled={loading.value}
                      >
                        {loading.value ? (
                          <>
                            <span class="spinner-border spinner-border-sm me-2"></span>
                            Updating...
                          </>
                        ) : (
                          'Update Expert'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View Expert Modal */}
            {showViewModal.value && selectedExpert.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => showViewModal.value = false}>
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0 pb-2">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        <EyeIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                        {selectedExpert.value.name}
                      </h5>
                      <button type="button" class="btn-close" onClick={() => showViewModal.value = false}></button>
                    </div>
                    <div class="modal-body pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      <div class="text-center mb-4">
                        <div 
                          class="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3 overflow-hidden"
                          style={{ width: '80px', height: '80px' }}
                        >
                          {selectedExpert.value.profilePhoto ? (
                            <img 
                              src={selectedExpert.value.profilePhoto} 
                              alt={selectedExpert.value.name}
                              class="w-100 h-100 object-fit-cover"
                              style={{ objectFit: 'cover' }}
                            />
                          ) : (
                            <UserIcon style={{ width: '2.5rem', height: '2.5rem', color: '#6c757d' }} />
                          )}
                        </div>
                        <h4 class="fw-bold mb-1">{selectedExpert.value.name}</h4>
                        <div class="d-flex align-items-center justify-content-center gap-2 mb-2">
                          <StarIcon style={{ width: '1rem', height: '1rem', color: '#ffc107' }} />
                          <span class="small">{selectedExpert.value.rating || 'N/A'} ({selectedExpert.value.reviews || 0} reviews)</span>
                        </div>
                        <span 
                          class="badge rounded-pill px-3 py-2"
                          style={{ 
                            backgroundColor: getStatusBadge(selectedExpert.value.status).color + '20',
                            color: getStatusBadge(selectedExpert.value.status).color
                          }}
                        >
                          {getStatusBadge(selectedExpert.value.status).text}
                        </span>
                      </div>
                      
                      <div class="mb-3">
                        <h6 class="fw-semibold mb-2 small text-muted">Experience</h6>
                        <p class="mb-0">{selectedExpert.value.experience || 'Not specified'}</p>
                      </div>
                      
                      <div class="mb-3">
                        <h6 class="fw-semibold mb-2 small text-muted">Expertise</h6>
                        <p class="mb-0">{selectedExpert.value.expertise || 'Not specified'}</p>
                      </div>
                      
                      <div class="mb-3">
                        <h6 class="fw-semibold mb-2 small text-muted">Profile Summary</h6>
                        <p class="mb-0">{selectedExpert.value.profileSummary || 'No summary available'}</p>
                      </div>
                      
                      <div class="mb-3">
                        <h6 class="fw-semibold mb-2 small text-muted">Languages</h6>
                        <p class="mb-0">
                          {selectedExpert.value.languages ? (
                            selectedExpert.value.languages.map((lang, index) => (
                              <span key={index} class="badge bg-primary me-1">{lang}</span>
                            ))
                          ) : (
                            <span class="badge bg-primary me-1">Hindi</span>
                          )}
                          {selectedExpert.value.customLanguage && (
                            <span class="badge bg-secondary me-1">{selectedExpert.value.customLanguage}</span>
                          )}
                        </p>
                      </div>
                      
                      {selectedExpert.value.backgroundBanner && (
                        <div class="mb-3">
                          <h6 class="fw-semibold mb-2 small text-muted d-flex align-items-center gap-1">
                            <PhotoIcon style={{ width: '16px', height: '16px' }} />
                            Background Banner
                          </h6>
                          <img src={selectedExpert.value.backgroundBanner} alt="Background Banner" class="img-fluid rounded-3" />
                        </div>
                      )}
                      
                      <div class="mb-3">
                        <h6 class="fw-semibold mb-2 small text-muted d-flex align-items-center gap-1">
                          <CreditCardIcon style={{ width: '16px', height: '16px' }} />
                          Pricing Plans
                        </h6>
                        <div class="row g-2">
                          <div class="col-12 col-sm-4">
                            <div class="card border-0 bg-light text-center p-2">
                              <ChatBubbleLeftRightIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6c757d' }} class="mb-2 mx-auto" />
                              <h6 class="fw-bold mb-1">₹{selectedExpert.value.chatCharge || 0}</h6>
                              <small class="text-muted">per minute</small>
                              <div class="mt-1">
                                <small class="fw-semibold">Chat</small>
                              </div>
                            </div>
                          </div>
                          <div class="col-12 col-sm-4">
                            <div class="card border-0 bg-light text-center p-2">
                              <PhoneIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6c757d' }} class="mb-2 mx-auto" />
                              <h6 class="fw-bold mb-1">₹{selectedExpert.value.voiceCharge || 0}</h6>
                              <small class="text-muted">per minute</small>
                              <div class="mt-1">
                                <small class="fw-semibold">Voice Call</small>
                              </div>
                            </div>
                          </div>
                          <div class="col-12 col-sm-4">
                            <div class="card border-0 bg-light text-center p-2">
                              <VideoCameraIcon style={{ width: '1.25rem', height: '1.25rem', color: '#6c757d' }} class="mb-2 mx-auto" />
                              <h6 class="fw-bold mb-1">₹{selectedExpert.value.videoCharge || 0}</h6>
                              <small class="text-muted">per minute</small>
                              <div class="mt-1">
                                <small class="fw-semibold">Video Call</small>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="modal-footer border-0 pt-2">
                      <button type="button" class="btn btn-secondary rounded-pill px-3 btn-sm" onClick={() => showViewModal.value = false}>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};