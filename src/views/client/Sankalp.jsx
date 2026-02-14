import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useToast } from 'vue-toastification';
import { PlusIcon, PencilIcon, TrashIcon, CheckCircleIcon, XCircleIcon, ArrowLeftIcon, ChartBarIcon, EllipsisVerticalIcon, EyeIcon, RectangleStackIcon, CheckBadgeIcon, UsersIcon, SparklesIcon } from '@heroicons/vue/24/outline';
import sankalpService from '../../services/sankalpService';

export default {
  name: 'ClientSankalp',
  setup() {
    const router = useRouter();
    const toast = useToast();
    const loading = ref(false);
    const sankalpList = ref([]);
    const showModal = ref(false);
    const isEdit = ref(false);
    const selectedSankalp = ref(null);
    const showDropdown = ref({});

    const categories = ref({
      'Meditation': ['Morning Practice', 'Evening Practice', 'Guided Meditation', 'Silent Meditation', 'Other'],
      'Seva': ['Community Service', 'Temple Service', 'Elderly Care', 'Food Distribution', 'Other'],
      'Jap': ['Mantra Chanting', 'Gayatri Mantra', 'Om Chanting', 'Mala Jap', 'Other'],
      'Study': ['Bhagavad Gita', 'Vedas', 'Upanishads', 'Spiritual Books', 'Other'],
      'Fasting': ['Ekadashi', 'Navratri', 'Weekly Fast', 'Partial Fast', 'Other'],
      'Yoga': ['Hatha Yoga', 'Pranayama', 'Surya Namaskar', 'Asanas', 'Other'],
      'Other': ['Miscellaneous', 'Other']
    });

    const selectedCategory = ref('');
    const availableSubcategories = ref([]);
    const showCustomCategory = ref(false);
    const customCategoryName = ref('');
    const showCustomSubcategory = ref(false);
    const customSubcategoryName = ref('');
    const bannerUploaded = ref(false);
    const bannerFileName = ref('');

    const formData = ref({
      title: '',
      description: '',
      category: 'Meditation',
      subcategory: '',
      durationType: 'Fixed',
      totalDays: 7,
      completionRule: 'Daily',
      karmaPointsPerDay: 5,
      completionBonusKarma: 50,
      bannerImage: null,
      dailyMotivationMessage: '',
      completionMessage: '',
      status: 'Active',
      visibility: 'Public',
      slug: ''
    });

    // Helper function to decode HTML entities
    const decodeHtmlEntities = (str) => {
      if (!str) return str;
      const textarea = document.createElement('textarea');
      textarea.innerHTML = str;
      return textarea.value;
    };

    const fetchSankalpList = async () => {
      loading.value = true;
      try {
        const response = await sankalpService.getAll();
        const decodedList = (response.data || []).map(sankalp => ({
          ...sankalp,
          bannerImage: sankalp.bannerImage ? decodeHtmlEntities(sankalp.bannerImage) : null
        }));
        sankalpList.value = decodedList;
      } catch (error) {
        console.error('Error loading sankalpas:', error);
        toast.error('Error loading sankalpas');
      } finally {
        loading.value = false;
      }
    };

    const openAddModal = () => {
      isEdit.value = false;
      formData.value = {
        title: '',
        description: '',
        category: 'Meditation',
        subcategory: '',
        durationType: 'Fixed',
        totalDays: 7,
        completionRule: 'Daily',
        karmaPointsPerDay: 5,
        completionBonusKarma: 50,
        bannerImage: null,
        dailyMotivationMessage: '',
        completionMessage: '',
        status: 'Active',
        visibility: 'Public',
        slug: ''
      };
      selectedCategory.value = '';
      availableSubcategories.value = [];
      showCustomCategory.value = false;
      showCustomSubcategory.value = false;
      customCategoryName.value = '';
      customSubcategoryName.value = '';
      bannerUploaded.value = false;
      bannerFileName.value = '';
      showModal.value = true;
    };

    const handleBannerUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        formData.value.bannerImage = file;
        bannerUploaded.value = true;
        bannerFileName.value = file.name;
      }
    };

    const handleCategoryChange = (category) => {
      if (category === 'CREATE_NEW') {
        showCustomCategory.value = true;
        return;
      }
      formData.value.category = category;
      formData.value.subcategory = '';
      selectedCategory.value = category;
      availableSubcategories.value = categories.value[category] || [];
    };

    const handleSubcategoryChange = (subcategory) => {
      if (subcategory === 'CREATE_NEW') {
        showCustomSubcategory.value = true;
        return;
      }
      formData.value.subcategory = subcategory;
    };

    const addNewCategory = () => {
      if (!customCategoryName.value.trim()) {
        toast.error('Please enter category name');
        return;
      }
      if (categories.value[customCategoryName.value]) {
        toast.error('Category already exists');
        return;
      }
      categories.value[customCategoryName.value] = ['Other'];
      formData.value.category = customCategoryName.value;
      selectedCategory.value = customCategoryName.value;
      availableSubcategories.value = ['Other'];
      customCategoryName.value = '';
      showCustomCategory.value = false;
      toast.success('Category added!');
    };

    const addNewSubcategory = () => {
      if (!customSubcategoryName.value.trim()) {
        toast.error('Please enter subcategory name');
        return;
      }
      const currentCategory = selectedCategory.value || formData.value.category;
      if (!currentCategory) {
        toast.error('Please select a category first');
        return;
      }
      if (categories.value[currentCategory].includes(customSubcategoryName.value)) {
        toast.error('Subcategory already exists');
        return;
      }
      categories.value[currentCategory].push(customSubcategoryName.value);
      availableSubcategories.value = categories.value[currentCategory];
      formData.value.subcategory = customSubcategoryName.value;
      customSubcategoryName.value = '';
      showCustomSubcategory.value = false;
      toast.success('Subcategory added!');
    };

    const openEditModal = (sankalp) => {
      isEdit.value = true;
      selectedSankalp.value = sankalp;
      
      // Copy entire object like SpiritualRewards.jsx does
      formData.value = { ...sankalp };
      
      selectedCategory.value = sankalp.category;
      availableSubcategories.value = categories.value[sankalp.category] || [];
      bannerUploaded.value = false;
      bannerFileName.value = '';
      showModal.value = true;
    };

    const closeModal = () => {
      showModal.value = false;
      formData.value = {
        title: '',
        description: '',
        category: 'Meditation',
        subcategory: '',
        durationType: 'Fixed',
        totalDays: 7,
        completionRule: 'Daily',
        karmaPointsPerDay: 5,
        completionBonusKarma: 50,
        bannerImage: null,
        dailyMotivationMessage: '',
        completionMessage: '',
        status: 'Active',
        visibility: 'Public',
        slug: ''
      };
    };

    const handleSubmit = async () => {
      if (!formData.value.title || !formData.value.description) {
        toast.error('Please fill all required fields');
        return;
      }
      
      loading.value = true;
      try {
        let bannerImageUrl = null;
        
        // Only upload if new file is selected (File object)
        if (formData.value.bannerImage && formData.value.bannerImage instanceof File) {
          const { uploadUrl, fileUrl } = await sankalpService.getUploadUrl(
            formData.value.bannerImage.name,
            formData.value.bannerImage.type
          );
          
          await sankalpService.uploadToS3(
            uploadUrl,
            formData.value.bannerImage
          );
          
          bannerImageUrl = fileUrl;
        }
        
        const data = {
          title: formData.value.title,
          description: formData.value.description,
          category: formData.value.category,
          subcategory: formData.value.subcategory,
          durationType: formData.value.durationType,
          totalDays: Number(formData.value.totalDays),
          completionRule: formData.value.completionRule,
          karmaPointsPerDay: Number(formData.value.karmaPointsPerDay),
          completionBonusKarma: Number(formData.value.completionBonusKarma),
          dailyMotivationMessage: formData.value.dailyMotivationMessage,
          completionMessage: formData.value.completionMessage,
          status: formData.value.status,
          visibility: formData.value.visibility,
          slug: formData.value.slug
        };
        
        // Only add bannerImage if new file was uploaded
        if (bannerImageUrl) {
          data.bannerImage = bannerImageUrl;
        }
        
        if (isEdit.value) {
          await sankalpService.update(selectedSankalp.value._id, data);
          toast.success('Sankalp updated successfully!');
        } else {
          await sankalpService.create(data);
          toast.success('Sankalp created successfully!');
        }
        
        closeModal();
        fetchSankalpList();
      } catch (error) {
        console.error('Error saving sankalp:', error);
        toast.error('Error saving sankalp');
      } finally {
        loading.value = false;
      }
    };

    const deleteSankalp = async (id) => {
      if (!confirm('Are you sure you want to delete this Sankalp?')) return;
      try {
        await sankalpService.delete(id);
        toast.success('Sankalp deleted successfully!');
        fetchSankalpList();
      } catch (error) {
        console.error('Error deleting sankalp:', error);
        toast.error('Error deleting sankalp');
      }
    };

    const toggleStatus = async (sankalp) => {
      try {
        await sankalpService.toggleStatus(sankalp._id);
        toast.success(`Sankalp ${sankalp.status === 'Active' ? 'disabled' : 'enabled'} successfully!`);
        fetchSankalpList();
      } catch (error) {
        console.error('Error toggling status:', error);
        toast.error('Error updating status');
      }
    };

    const toggleDropdown = (id) => {
      showDropdown.value = {
        ...showDropdown.value,
        [id]: !showDropdown.value[id]
      };
    };

    const viewSankalp = (sankalp) => {
      toast.info(`Viewing: ${sankalp.title}`);
      showDropdown.value = {};
    };

    const goBack = () => {
      router.push('/client/tools');
    };

    onMounted(() => {
      fetchSankalpList();
    });

    return () => (
      <div class="container-fluid px-3 px-lg-4">
        <style>{`
          .sankalp-card {
            transition: all 0.3s ease;
            border-radius: 12px;
            border: 1px solid #e5e7eb;
          }
          .sankalp-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.1);
          }
          .status-badge {
            font-size: 0.75rem;
            padding: 0.25rem 0.75rem;
            border-radius: 12px;
            font-weight: 600;
          }
          .stat-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.875rem;
            color: #6b7280;
          }
          .action-btn {
            padding: 0.5rem;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            background: white;
            cursor: pointer;
            transition: all 0.2s;
          }
          .action-btn:hover {
            background: #f9fafb;
            border-color: #9333ea;
          }
        `}</style>

        {/* Header */}
        <div class="bg-gradient-primary rounded-4 p-4 mb-4 text-white shadow-lg">
          <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
            <button 
              class="btn btn-light btn-sm rounded-pill px-3" 
              onClick={goBack}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
              <span class="d-none d-sm-inline">Back to Tools</span>
              <span class="d-sm-none">Back</span>
            </button>
            <div class="flex-grow-1">
              <h1 class="mb-1 fw-bold fs-2 text-dark">🙏 संकल्प Management</h1>
              <p class="mb-0 text-dark" style={{ opacity: 0.8 }}>Create and manage spiritual resolutions for users</p>
              {!loading.value && sankalpList.value.length > 0 && (
                <small class="text-dark d-block mt-1" style={{ opacity: 0.8 }}>
                  <ChartBarIcon style={{ width: '16px', height: '16px' }} class="me-1" />
                  {sankalpList.value.length} total sankalpas • {sankalpList.value.filter(s => s.status === 'Active').length} active
                </small>
              )}
            </div>
            <button 
              class="btn btn-light btn-lg rounded-pill px-4 shadow-sm"
              onClick={openAddModal}
              disabled={loading.value}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
            >
              <PlusIcon style={{ width: '1.2rem', height: '1.2rem' }} />
              <span class="d-none d-sm-inline">Add Sankalp</span>
              <span class="d-sm-none">Add</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div class="row g-3 mb-4">
          <div class="col-md-3">
            <div class="card border-0 shadow-sm" style="background: white;">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <p class="mb-1 text-muted" style="font-size: 0.875rem;">Total Sankalpas</p>
                    <h3 class="mb-0 fw-bold text-dark">{sankalpList.value.length}</h3>
                  </div>
                  <RectangleStackIcon style="width: 2.5rem; height: 2.5rem; color: #9333ea;" />
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm" style="background: white;">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <p class="mb-1 text-muted" style="font-size: 0.875rem;">Active</p>
                    <h3 class="mb-0 fw-bold text-dark">{sankalpList.value.filter(s => s.status === 'Active').length}</h3>
                  </div>
                  <CheckBadgeIcon style="width: 2.5rem; height: 2.5rem; color: #10b981;" />
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm" style="background: white;">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <p class="mb-1 text-muted" style="font-size: 0.875rem;">Total Participants</p>
                    <h3 class="mb-0 fw-bold text-dark">{sankalpList.value.reduce((sum, s) => sum + (s.participantsCount || 0), 0)}</h3>
                  </div>
                  <UsersIcon style="width: 2.5rem; height: 2.5rem; color: #f59e0b;" />
                </div>
              </div>
            </div>
          </div>
          <div class="col-md-3">
            <div class="card border-0 shadow-sm" style="background: white;">
              <div class="card-body">
                <div class="d-flex justify-content-between align-items-center">
                  <div>
                    <p class="mb-1 text-muted" style="font-size: 0.875rem;">Potential Karma Rewards</p>
                    <h3 class="mb-0 fw-bold text-dark">{sankalpList.value.reduce((sum, s) => sum + ((Number(s.karmaPointsPerDay) || 0) * (Number(s.totalDays) || 0) + (Number(s.completionBonusKarma) || 0)), 0)}</h3>
                  </div>
                  <SparklesIcon style="width: 2.5rem; height: 2.5rem; color: #3b82f6;" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sankalp List */}
        {loading.value ? (
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status" style="color: #9333ea !important;"></div>
          </div>
        ) : sankalpList.value.length === 0 ? (
          <div class="text-center py-5">
            <div style="font-size: 4rem; opacity: 0.3; margin-bottom: 1rem;">🙏</div>
            <h5 class="text-muted">No Sankalpas yet</h5>
            <p class="text-muted">Create your first Sankalp to get started</p>
          </div>
        ) : (
          <div class="row g-4">
            {sankalpList.value.map(sankalp => (
              <div key={sankalp._id} class="col-xl-4 col-lg-6 col-md-6">
                <div class={`card h-100 border-0 shadow-sm ${sankalp.status !== 'Active' ? 'opacity-50' : ''}`} style="border-radius: 12px; overflow: hidden;">
                  
                  {/* Banner Image */}
                  {sankalp.bannerImage && (
                    <div style="height: 180px; overflow: hidden;">
                      <img src={sankalp.bannerImage} alt={sankalp.title} class="w-100 h-100" style="object-fit: cover;" />
                    </div>
                  )}
                  
                  {/* Status Badge */}
                  {sankalp.status !== 'Active' && (
                    <div class="position-absolute top-0 start-0 m-3" style="z-index: 1;">
                      <span class="badge bg-secondary px-2 py-1 rounded-pill">{sankalp.status}</span>
                    </div>
                  )}
                  
                  {/* Dropdown Menu */}
                  <div class="position-absolute top-0 end-0 m-3" style="z-index: 2;">
                    <div class="dropdown">
                      <button 
                        class="btn btn-light btn-sm rounded-circle"
                        onClick={() => toggleDropdown(sankalp._id)}
                        style="width: 32px; height: 32px;"
                      >
                        <EllipsisVerticalIcon style="width: 1rem; height: 1rem;" />
                      </button>
                      {showDropdown.value[sankalp._id] && (
                        <div class="dropdown-menu show position-absolute shadow-lg" style="right: 0; z-index: 1000;">
                          {sankalp.status === 'Active' ? (
                            <>
                              <button class="dropdown-item" onClick={() => viewSankalp(sankalp)}>
                                <EyeIcon style="width: 1rem; height: 1rem;" class="me-2" />
                                View Details
                              </button>
                              <button class="dropdown-item" onClick={() => { openEditModal(sankalp); showDropdown.value = {}; }}>
                                <PencilIcon style="width: 1rem; height: 1rem;" class="me-2" />
                                Edit
                              </button>
                              <button class="dropdown-item" onClick={() => { toggleStatus(sankalp); showDropdown.value = {}; }}>
                                <span class="rounded-circle bg-warning me-2" style="width: 1rem; height: 1rem; display: inline-block;"></span>
                                Disable
                              </button>
                              <hr class="dropdown-divider" />
                              <button class="dropdown-item text-danger" onClick={() => { deleteSankalp(sankalp._id); showDropdown.value = {}; }}>
                                <TrashIcon style="width: 1rem; height: 1rem;" class="me-2" />
                                Delete
                              </button>
                            </>
                          ) : (
                            <button class="dropdown-item" onClick={() => { toggleStatus(sankalp); showDropdown.value = {}; }}>
                              <span class="rounded-circle bg-success me-2" style="width: 1rem; height: 1rem; display: inline-block;"></span>
                              Enable
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div class="card-body p-4">
                    {/* Title and Category */}
                    <div class="mb-3">
                      <h5 class="card-title fw-bold mb-2">{sankalp.title}</h5>
                      <div class="d-flex flex-wrap gap-1 mb-2">
                        <span class="badge bg-primary bg-opacity-10 text-primary px-2 py-1 small">{sankalp.category}</span>
                        {sankalp.subcategory && <span class="badge bg-secondary bg-opacity-10 text-secondary px-2 py-1 small">{sankalp.subcategory}</span>}
                        <span class="badge bg-info bg-opacity-10 text-info px-2 py-1 small">{sankalp.visibility}</span>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p class="card-text text-muted mb-3" style="font-size: 0.9rem;">{sankalp.description}</p>

                    {/* Duration & Completion */}
                    <div class="d-flex flex-wrap gap-2 mb-3 pb-3" style="border-bottom: 1px solid #e5e7eb;">
                      <div class="stat-item">
                        <span>📅</span>
                        <span>{sankalp.totalDays} days ({sankalp.durationType})</span>
                      </div>
                      <div class="stat-item">
                        <span>✅</span>
                        <span>{sankalp.completionRule}</span>
                      </div>
                    </div>

                    {/* Karma Points - Highlighted */}
                    <div class="mb-3 p-3 rounded" style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 2px solid #86efac; box-shadow: 0 2px 8px rgba(134, 239, 172, 0.3);">
                      <div class="d-flex justify-content-between align-items-center">
                        <div class="d-flex align-items-center gap-2">
                          <span style="font-size: 1.2rem;">✨</span>
                          <span class="text-success fw-bold" style="font-size: 0.95rem;">{sankalp.karmaPointsPerDay} pts/day</span>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                          <span style="font-size: 1.2rem;">🎁</span>
                          <span class="text-success fw-bold" style="font-size: 0.95rem;">+{sankalp.completionBonusKarma} bonus</span>
                        </div>
                      </div>
                    </div>

                    {/* Participants & Completed */}
                    <div class="d-flex gap-3 mb-3">
                      <div class="stat-item">
                        <span>👥</span>
                        <span>{sankalp.participantsCount} joined</span>
                      </div>
                      <div class="stat-item">
                        <span>🏆</span>
                        <span>{sankalp.completedCount} completed</span>
                      </div>
                    </div>

                    {/* Messages - Highlighted */}
                    {sankalp.dailyMotivationMessage && (
                      <div class="mb-2 p-2 rounded" style="background: #fef3c7; border-left: 3px solid #f59e0b;">
                        <small class="text-dark fw-semibold d-block" style="font-size: 0.8rem;">💬 Daily: {sankalp.dailyMotivationMessage}</small>
                      </div>
                    )}
                    {sankalp.completionMessage && (
                      <div class="p-2 rounded" style="background: #dbeafe; border-left: 3px solid #3b82f6;">
                        <small class="text-dark fw-semibold d-block" style="font-size: 0.8rem;">🎊 Completion: {sankalp.completionMessage}</small>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal.value && (
          <div class="modal show d-block" style="background: rgba(0,0,0,0.5);" onClick={closeModal}>
            <div class="modal-dialog modal-lg modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
              <div class="modal-content" style="border-radius: 12px; border: none;">
                <div class="modal-header" style="border-bottom: 1px solid #e5e7eb;">
                  <h5 class="modal-title fw-bold">{isEdit.value ? 'Edit' : 'Add'} Sankalp</h5>
                  <button type="button" class="btn-close" onClick={closeModal}></button>
                </div>
                <div class="modal-body p-4" style="max-height: 70vh; overflow-y: auto;">
                  {/* Basic Info */}
                  <div class="mb-3">
                    <label class="form-label fw-semibold">1. Sankalp Title *</label>
                    <input type="text" class="form-control" v-model={formData.value.title} placeholder="e.g., Daily Meditation" style="border-radius: 8px;" />
                  </div>
                  
                  <div class="mb-3">
                    <label class="form-label fw-semibold">2. Description *</label>
                    <textarea class="form-control" rows="3" v-model={formData.value.description} placeholder="Describe the sankalp purpose and benefits..." style="border-radius: 8px;"></textarea>
                  </div>

                  {/* Category Section */}
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label fw-semibold">3. Category *</label>
                      <select class="form-select" v-model={formData.value.category} onChange={(e) => handleCategoryChange(e.target.value)} style="border-radius: 8px;">
                        <option value="">Select Category</option>
                        {Object.keys(categories.value).map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                        <option value="CREATE_NEW" class="text-primary fw-bold">+ Create New Category</option>
                      </select>
                      {showCustomCategory.value && (
                        <div class="mt-2 p-2 border rounded bg-light">
                          <div class="d-flex gap-2">
                            <input type="text" class="form-control form-control-sm" placeholder="Enter new category" v-model={customCategoryName.value} />
                            <button class="btn btn-primary btn-sm" onClick={addNewCategory}>Add</button>
                            <button class="btn btn-secondary btn-sm" onClick={() => showCustomCategory.value = false}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="form-label fw-semibold">4. Subcategory *</label>
                      <select class="form-select" v-model={formData.value.subcategory} onChange={(e) => handleSubcategoryChange(e.target.value)} disabled={!selectedCategory.value && !formData.value.category} style="border-radius: 8px;">
                        <option value="">Select Subcategory</option>
                        {availableSubcategories.value.map(subcat => (
                          <option key={subcat} value={subcat}>{subcat}</option>
                        ))}
                        {(selectedCategory.value || formData.value.category) && (
                          <option value="CREATE_NEW" class="text-primary fw-bold">+ Create New Subcategory</option>
                        )}
                      </select>
                      {showCustomSubcategory.value && (
                        <div class="mt-2 p-2 border rounded bg-light">
                          <div class="d-flex gap-2">
                            <input type="text" class="form-control form-control-sm" placeholder="Enter new subcategory" v-model={customSubcategoryName.value} />
                            <button class="btn btn-primary btn-sm" onClick={addNewSubcategory}>Add</button>
                            <button class="btn btn-secondary btn-sm" onClick={() => showCustomSubcategory.value = false}>Cancel</button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Duration Section */}
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label fw-semibold">5. Duration Type *</label>
                      <select class="form-select" v-model={formData.value.durationType} style="border-radius: 8px;">
                        <option value="Fixed">Fixed</option>
                        <option value="Custom">Custom</option>
                      </select>
                      <small class="text-muted">{formData.value.durationType === 'Fixed' ? 'Predefined spiritual durations' : 'Enter any number of days'}</small>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="form-label fw-semibold">6. Total Days *</label>
                      {formData.value.durationType === 'Custom' ? (
                        <input 
                          type="number" 
                          class="form-control" 
                          v-model={formData.value.totalDays} 
                          min="1" 
                          max="365" 
                          placeholder="Enter number of days" 
                          style="border-radius: 8px;" 
                        />
                      ) : (
                        <select class="form-select" v-model={formData.value.totalDays} style="border-radius: 8px;">
                          <option value={1}>1 day</option>
                          <option value={2}>2 days</option>
                          <option value={3}>3 days</option>
                          <option value={4}>4 days</option>
                          <option value={5}>5 days</option>
                          <option value={6}>6 days</option>
                          <option value={7}>7 days</option>
                          <option value={21}>21 days</option>
                          <option value={40}>40 days</option>
                          <option value={108}>108 days</option>
                        </select>
                      )}
                    </div>
                  </div>

                  {/* Completion & Karma Section */}
                  <div class="mb-3">
                    <label class="form-label fw-semibold">7. Completion Rule *</label>
                    <select class="form-select" v-model={formData.value.completionRule} style="border-radius: 8px;">
                      <option value="Daily">Daily Complete</option>
                      <option value="Alternate">Alternate Days</option>
                    </select>
                  </div>

                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label fw-semibold">8. Karma Points Per Day *</label>
                      <input type="number" class="form-control" v-model={formData.value.karmaPointsPerDay} min="0" placeholder="5" style="border-radius: 8px;" />
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="form-label fw-semibold">9. Completion Bonus Karma *</label>
                      <input type="number" class="form-control" v-model={formData.value.completionBonusKarma} min="0" placeholder="50" style="border-radius: 8px;" />
                    </div>
                  </div>

                  {/* Media Section */}
                  <div class="mb-3">
                    <label class="form-label fw-semibold">10. Banner Image</label>
                    {isEdit.value && formData.value.bannerImage && typeof formData.value.bannerImage === 'string' && (
                      <div class="mb-2 p-2 border rounded bg-light d-flex align-items-center gap-2">
                        <img src={formData.value.bannerImage} alt="Current banner" style="width: 60px; height: 60px; object-fit: cover; border-radius: 4px;" />
                        <small class="text-muted">Current banner (upload new to replace)</small>
                      </div>
                    )}
                    <input type="file" class="form-control" accept="image/*" onChange={handleBannerUpload} style="border-radius: 8px;" />
                    {bannerUploaded.value && (
                      <small class="text-success mt-1 d-block">✓ {bannerFileName.value} will replace current banner</small>
                    )}
                    <small class="text-muted">Max 5MB (JPG, PNG)</small>
                  </div>

                  {/* Messages Section */}
                  <div class="mb-3">
                    <label class="form-label fw-semibold">11. Daily Motivation Message</label>
                    <textarea class="form-control" rows="2" v-model={formData.value.dailyMotivationMessage} placeholder="Congratulations! Complete today's sankalp..." style="border-radius: 8px;"></textarea>
                  </div>

                  <div class="mb-3">
                    <label class="form-label fw-semibold">12. Completion Message</label>
                    <textarea class="form-control" rows="2" v-model={formData.value.completionMessage} placeholder="Congratulations! You have completed the sankalp!" style="border-radius: 8px;"></textarea>
                  </div>

                  {/* Status & Visibility Section */}
                  <div class="row">
                    <div class="col-md-6 mb-3">
                      <label class="form-label fw-semibold">13. Status *</label>
                      <select class="form-select" v-model={formData.value.status} style="border-radius: 8px;">
                        <option value="Draft">Draft</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                    </div>
                    <div class="col-md-6 mb-3">
                      <label class="form-label fw-semibold">14. Visibility *</label>
                      <select class="form-select" v-model={formData.value.visibility} style="border-radius: 8px;">
                        <option value="Public">Public</option>
                        <option value="Private">Private</option>
                      </select>
                    </div>
                  </div>

                  {/* Slug Section */}
                  <div class="mb-3">
                    <label class="form-label fw-semibold">15. Slug (URL-friendly name)</label>
                    <input type="text" class="form-control" v-model={formData.value.slug} placeholder="daily-meditation" style="border-radius: 8px;" />
                    <small class="text-muted">Auto-generated from title if left empty</small>
                  </div>
                </div>
                <div class="modal-footer" style="border-top: 1px solid #e5e7eb;">
                  <button type="button" class="btn btn-secondary" onClick={closeModal} style="border-radius: 8px;" disabled={loading.value}>Cancel</button>
                  <button type="button" class="btn btn-primary" onClick={handleSubmit} style="background: #9333ea; border: none; border-radius: 8px;" disabled={loading.value}>
                    {loading.value ? (
                      <>
                        <span class="spinner-border spinner-border-sm me-2" role="status"></span>
                        {isEdit.value ? 'Updating...' : 'Creating...'}
                      </>
                    ) : (
                      isEdit.value ? 'Update' : 'Create'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
};
