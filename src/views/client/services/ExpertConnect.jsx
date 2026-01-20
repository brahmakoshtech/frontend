import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  ArrowLeftIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  CalendarIcon,
  ArrowRightIcon
} from '@heroicons/vue/24/outline';
import { useToast } from 'vue-toastification';
import expertCategoryService from '../../../services/expertCategoryService.js';

export default {
  name: 'ClientExpertConnect',
  setup() {
    const router = useRouter();
    const toast = useToast();
    const loading = ref(false);
    const showCategoryModal = ref(false);
    const showEditModal = ref(false);
    const showViewModal = ref(false);
    const activeDropdown = ref(null);
    const selectedCategory = ref(null);
    const editingCategory = ref(null);
    const expertCategories = ref([]);

    const categoryForm = ref({
      name: '',
      image: null,
      description: ''
    });
    const editForm = ref({
      name: '',
      image: null,
      description: ''
    });
    const imageUploaded = ref(false);
    const imageFileName = ref('');
    const editImageUploaded = ref(false);
    const editImageFileName = ref('');
    const editImagePreview = ref(null);
    const expandedDescriptions = ref(new Set());

    const toggleDescription = (categoryId) => {
      const expanded = expandedDescriptions.value;
      if (expanded.has(categoryId)) {
        expanded.delete(categoryId);
      } else {
        expanded.add(categoryId);
      }
      expandedDescriptions.value = new Set(expanded);
    };

    const truncateText = (text, maxLength = 100) => {
      if (!text || text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };

    const goBack = () => {
      router.push('/client/services');
    };

    const openCategoryModal = () => {
      showCategoryModal.value = true;
    };

    const handleImageUpload = (event, type) => {
      const file = event.target.files[0];
      if (file) {
        if (type === 'image') {
          categoryForm.value.image = file;
          imageUploaded.value = true;
          imageFileName.value = file.name;
        }
      }
    };

    const submitCategory = async () => {
      try {
        loading.value = true;
        toast.info('Creating expert category...');
        
        // Check if client token exists
        const token = localStorage.getItem('token_client');
        if (!token) {
          toast.error('Authentication required. Please login again.');
          router.push('/client/login');
          return;
        }
        
        const { image, ...categoryData } = categoryForm.value;
        const response = await expertCategoryService.createExpertCategory(categoryData);
        
        if (response.success && response.data) {
          let createdCategory = response.data;
          
          // Upload image if provided
          if (image && createdCategory._id) {
            try {
              toast.info('Uploading category image...');
              const imageResponse = await expertCategoryService.uploadCategoryImage(createdCategory._id, image);
              if (imageResponse.success && imageResponse.data) {
                createdCategory.image = imageResponse.data.imageUrl;
              }
            } catch (imageError) {
              toast.error('⚠️ Category created but image upload failed');
            }
          }
          
          toast.success('✓ Expert category created successfully!');
          showCategoryModal.value = false;
          
          // Reset form
          categoryForm.value = {
            name: '',
            image: null,
            description: ''
          };
          imageUploaded.value = false;
          imageFileName.value = '';
          
          // Refresh categories
          await fetchExpertCategories();
        } else {
          toast.error('❌ ' + (response.error || 'Failed to create category'));
        }
      } catch (error) {
        console.error('Submit category error:', error);
        if (error.status === 401) {
          toast.error('Authentication required. Please login again.');
          router.push('/client/login');
        } else {
          toast.error('❌ Failed to create category. Please try again.');
        }
      } finally {
        loading.value = false;
      }
    };

    const fetchExpertCategories = async () => {
      try {
        const token = localStorage.getItem('token_client');
        if (!token) {
          console.warn('No client token found - showing empty state');
          expertCategories.value = [];
          return;
        }
        
        try {
          const tokenParts = token.split('.');
          if (tokenParts.length !== 3) {
            throw new Error('Invalid token format');
          }
          const payload = JSON.parse(atob(tokenParts[1]));
          if (payload.exp && payload.exp < Date.now() / 1000) {
            throw new Error('Token expired');
          }
        } catch (tokenError) {
          console.warn('Invalid token detected, clearing:', tokenError.message);
          localStorage.removeItem('token_client');
          expertCategories.value = [];
          return;
        }
        
        const response = await expertCategoryService.getAllExpertCategories();
        
        if (response.success && response.data) {
          const actualData = response.data.data || response.data;
          let categoriesList = Array.isArray(actualData.data) ? actualData.data : 
                             Array.isArray(actualData) ? actualData : [];
          console.log('Categories loaded:', categoriesList);
          // Debug background images
          categoriesList.forEach(cat => {
            console.log('Category:', cat.name, 'Background Image:', cat.backgroundImage);
          });
          expertCategories.value = categoriesList;
        } else {
          expertCategories.value = [];
        }
      } catch (error) {
        console.error('Fetch categories error:', error);
        expertCategories.value = [];
      }
    };

    const toggleDropdown = (categoryId) => {
      activeDropdown.value = activeDropdown.value === categoryId ? null : categoryId;
    };

    const viewCategory = (category) => {
      selectedCategory.value = category;
      showViewModal.value = true;
    };

    const editCategory = (category) => {
      editingCategory.value = category;
      editForm.value = {
        name: category.name,
        description: category.description,
        image: null
      };
      // Reset preview states
      editImagePreview.value = null;
      editImageUploaded.value = false;
      editImageFileName.value = '';
      showEditModal.value = true;
      activeDropdown.value = null;
    };

    const updateCategory = async () => {
      try {
        loading.value = true;
        toast.info('Updating category...');
        
        // Find original category to preserve images
        const originalCategory = expertCategories.value.find(c => c._id === editingCategory.value._id);
        
        const { image, ...categoryData } = editForm.value;
        const response = await expertCategoryService.updateExpertCategory(editingCategory.value._id, categoryData);
        
        if (response.success) {
          let updatedCategory = response.data;
          
          // Upload new image if provided
          if (image) {
            try {
              const imageResponse = await expertCategoryService.uploadCategoryImage(editingCategory.value._id, image);
              if (imageResponse.success && imageResponse.data) {
                updatedCategory.image = imageResponse.data.imageUrl;
              }
            } catch (error) {
              toast.error('Category updated but image upload failed');
            }
          } else if (originalCategory && originalCategory.image) {
            // Preserve existing image if no new image uploaded
            updatedCategory.image = originalCategory.image;
          }
          
          const index = expertCategories.value.findIndex(c => c._id === editingCategory.value._id);
          if (index !== -1) {
            expertCategories.value[index] = { ...expertCategories.value[index], ...updatedCategory };
          }
          
          toast.success('✓ Category updated successfully!');
          showEditModal.value = false;
          editingCategory.value = null;
          editImageUploaded.value = false;
          editImagePreview.value = null;
        } else {
          toast.error('❌ Failed to update category');
        }
      } catch (error) {
        console.error('Update error:', error);
        toast.error('❌ Failed to update category');
      } finally {
        loading.value = false;
      }
    };

    const toggleCategoryStatus = async (category) => {
      try {
        const response = await expertCategoryService.toggleExpertCategoryStatus(category._id);
        if (response.success) {
          const index = expertCategories.value.findIndex(c => c._id === category._id);
          if (index !== -1) {
            expertCategories.value[index].isActive = response.data.isActive;
          }
          toast.success(`Category ${response.data.isActive ? 'enabled' : 'disabled'} successfully!`);
        } else {
          toast.error('Failed to toggle status');
        }
      } catch (error) {
        console.error('Toggle status error:', error);
        toast.error('Failed to toggle status');
      }
      activeDropdown.value = null;
    };

    const deleteCategory = async (categoryId) => {
      if (!confirm('Are you sure you want to delete this category?')) return;
      
      try {
        loading.value = true;
        const response = await expertCategoryService.deleteExpertCategory(categoryId);
        if (response.success) {
          expertCategories.value = expertCategories.value.filter(c => c._id !== categoryId);
          toast.success('✓ Category deleted successfully!');
        } else {
          toast.error('❌ Failed to delete category');
        }
      } catch (error) {
        console.error('Delete error:', error);
        toast.error('❌ Failed to delete category');
      } finally {
        loading.value = false;
      }
      activeDropdown.value = null;
    };

    onMounted(() => {
      fetchExpertCategories();
    });

    return () => (
      <div class="container-fluid px-3 px-lg-4">
        <style>{`
          .expert-category-card {
            transition: all 0.3s ease;
            border-radius: 16px;
          }
          .expert-category-card:not(.disabled) {
            cursor: pointer;
          }
          .expert-category-card:not(.disabled):hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
          }
          .expert-category-card.disabled {
            cursor: not-allowed;
          }
          .category-icon {
            transition: all 0.3s ease;
          }
          .expert-category-card:not(.disabled):hover .category-icon {
            transform: rotate(10deg) scale(1.1);
          }
          .arrow-btn {
            transition: all 0.3s ease;
          }
          .expert-category-card:not(.disabled):hover .arrow-btn {
            transform: scale(1.2);
            background-color: #8b5cf6 !important;
            color: white !important;
          }
          .hover-overlay {
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .expert-category-card:not(.disabled):hover .hover-overlay {
            opacity: 1;
          }
        `}</style>
        <div class="row">
          <div class="col-12">
            {/* Header */}
            <div class="bg-gradient-primary rounded-4 p-4 mb-4 text-white shadow-lg">
              <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
                <button 
                  class="btn btn-light btn-sm rounded-pill px-3" 
                  onClick={goBack}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                >
                  <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
                  <span>Back to Services</span>
                </button>
                <div class="flex-grow-1">
                  <h1 class="mb-1 fw-bold fs-2 text-dark">🌟 Expert Connect</h1>
                  <p class="mb-0 text-dark" style={{ opacity: 0.8 }}>
                    Connect with certified experts and spiritual guides
                  </p>
                </div>
                <button 
                  class="btn btn-light btn-lg rounded-pill px-4 shadow-sm"
                  onClick={openCategoryModal}
                  disabled={loading.value}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
                >
                  <PlusIcon style={{ width: '1.2rem', height: '1.2rem' }} />
                  <span class="d-none d-sm-inline">Create Expert Category</span>
                  <span class="d-sm-none">Create</span>
                </button>
              </div>
            </div>

            {/* Expert Categories Grid */}
            {loading.value ? (
              <div class="text-center py-5">
                <div class="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="text-muted">Loading expert categories...</p>
              </div>
            ) : expertCategories.value.length > 0 ? (
              <div class="row g-4">
                {expertCategories.value.map(category => (
                  <div key={category._id} class="col-xl-4 col-lg-6 col-md-6 col-sm-12">
                    <div 
                      class={`expert-category-card card h-100 border-0 shadow-sm position-relative overflow-hidden ${!category.isActive ? 'disabled opacity-50' : ''}`}
                      style={{
                        background: `linear-gradient(135deg, #8b5cf608 0%, #8b5cf615 30%, #f8fafc 100%)`,
                        borderRadius: '16px',
                        pointerEvents: category.isActive ? 'auto' : 'none'
                      }}
                      onClick={category.isActive ? () => {} : undefined}
                    >
                      {!category.isActive && (
                        <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.1)', zIndex: 1, pointerEvents: 'none' }}>
                          <span class="badge bg-secondary px-3 py-2 rounded-pill shadow">🔒 Disabled</span>
                        </div>
                      )}
                      {/* Status Badge */}
                      <div class="position-absolute top-0 end-0 m-3" style={{ zIndex: 2, pointerEvents: 'auto' }}>
                        <div class="dropdown position-relative">
                          <button 
                            class="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                            onClick={(e) => { e.stopPropagation(); toggleDropdown(category._id); }}
                            style={{ width: '32px', height: '32px', transition: 'all 0.2s ease' }}
                          >
                            <EllipsisVerticalIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                          </button>
                          {activeDropdown.value === category._id && (
                            <div class="dropdown-menu show position-absolute shadow-lg border-0 rounded-3" style={{ minWidth: '160px', right: '0', top: '100%', zIndex: 1000 }}>
                              {category.isActive ? (
                                <>
                                  <button 
                                    class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded-2"
                                    onClick={(e) => { e.stopPropagation(); viewCategory(category); }}
                                  >
                                    <EyeIcon style={{ width: '1rem', height: '1rem', color: '#0d6efd' }} />
                                    <span class="fw-medium">View Details</span>
                                  </button>
                                  <button 
                                    class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded-2"
                                    onClick={(e) => { e.stopPropagation(); editCategory(category); }}
                                  >
                                    <PencilIcon style={{ width: '1rem', height: '1rem', color: '#8b5cf6' }} />
                                    <span class="fw-medium">Edit Category</span>
                                  </button>
                                  <button 
                                    class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded-2"
                                    onClick={(e) => { e.stopPropagation(); toggleCategoryStatus(category); }}
                                  >
                                    <span class="rounded-circle bg-warning" style={{ width: '1rem', height: '1rem' }}></span>
                                    <span class="fw-medium">Disable</span>
                                  </button>
                                  <hr class="dropdown-divider my-1" />
                                  <button 
                                    class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-danger rounded-2"
                                    onClick={(e) => { e.stopPropagation(); deleteCategory(category._id); }}
                                  >
                                    <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                                    <span class="fw-medium">Delete</span>
                                  </button>
                                </>
                              ) : (
                                <button 
                                  class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded-2"
                                  onClick={(e) => { e.stopPropagation(); toggleCategoryStatus(category); }}
                                >
                                  <span class="rounded-circle bg-success" style={{ width: '1rem', height: '1rem' }}></span>
                                  <span class="fw-medium">Enable</span>
                                </button>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div class="card-body p-4">
                        {/* Icon */}
                        <div class="mb-4">
                          <div 
                            class="category-icon d-inline-flex align-items-center justify-content-center rounded-3"
                            style={{ 
                              width: '72px', 
                              height: '72px',
                              backgroundColor: '#8b5cf615',
                              border: '2px solid #8b5cf625'
                            }}
                          >
                            {category.image ? (
                              <img 
                                src={category.image} 
                                alt={category.name}
                                class="rounded-3"
                                style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextElementSibling.style.display = 'block';
                                }}
                              />
                            ) : null}
                            <span 
                              class="text-muted"
                              style={{ 
                                fontSize: '2rem',
                                color: '#8b5cf6',
                                display: category.image ? 'none' : 'block'
                              }}
                            >
                              📷
                            </span>
                          </div>
                        </div>

                        {/* Content */}
                        <div class="mb-4">
                          <h5 class="card-title fw-bold mb-2 text-dark">{category.name}</h5>
                          <div class="card-text text-muted mb-0 lh-base" style={{ fontSize: '0.95rem' }}>
                            {expandedDescriptions.value.has(category._id) ? (
                              <>
                                <p class="mb-1">{category.description}</p>
                                <button 
                                  class="btn btn-link p-0 text-primary" 
                                  style={{ fontSize: '0.85rem', textDecoration: 'none' }}
                                  onClick={(e) => { e.stopPropagation(); toggleDescription(category._id); }}
                                >
                                  See less
                                </button>
                              </>
                            ) : (
                              <>
                                <p class="mb-1">{truncateText(category.description, 100)}</p>
                                {category.description && category.description.length > 100 && (
                                  <button 
                                    class="btn btn-link p-0 text-primary" 
                                    style={{ fontSize: '0.85rem', textDecoration: 'none' }}
                                    onClick={(e) => { e.stopPropagation(); toggleDescription(category._id); }}
                                  >
                                    See more
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>

                        {/* Action Button */}
                        <div class="d-flex align-items-center justify-content-between">
                          <div class="d-flex align-items-center text-muted" style={{ fontSize: '0.85rem' }}>
                            <CalendarIcon style={{ width: '12px', height: '12px' }} class="me-1" />
                            <span>{category.createdAt ? new Date(category.createdAt).toLocaleDateString('en-US', { 
                              month: 'short', 
                              day: 'numeric' 
                            }) : 'No date'}</span>
                          </div>
                          <div 
                            class="arrow-btn d-flex align-items-center justify-content-center rounded-circle"
                            style={{
                              width: '40px',
                              height: '40px',
                              backgroundColor: '#8b5cf610',
                              color: '#8b5cf6',
                              cursor: category.isActive ? 'pointer' : 'not-allowed'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (category.isActive) {
                                router.push(`/client/experts?category=${category._id}`);
                              }
                            }}
                          >
                            <ArrowRightIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                          </div>
                        </div>
                      </div>

                      {/* Hover Effect Overlay */}
                      {category.isActive && (
                        <div 
                          class="hover-overlay position-absolute top-0 start-0 w-100 h-100"
                          style={{
                            background: 'linear-gradient(135deg, #8b5cf615 0%, #8b5cf625 100%)',
                            pointerEvents: 'none',
                            borderRadius: '16px'
                          }}
                        ></div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div class="text-center py-5">
                <div class="mb-4">
                  <div class="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                    <PlusIcon style={{ width: '2rem', height: '2rem', color: '#6c757d' }} />
                  </div>
                </div>
                <h4 class="fw-bold mb-2">No Expert Categories Yet</h4>
                <p class="text-muted mb-4">Create your first expert category to get started</p>
                <button 
                  class="btn btn-primary rounded-pill px-4"
                  onClick={openCategoryModal}
                >
                  Create Expert Category
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Category Modal */}
        {showCategoryModal.value && (
          <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div class="modal-dialog">
              <div class="modal-content">
                <div class="modal-header">
                  <h5 class="modal-title fw-bold">
                    Create Expert Category
                  </h5>
                  <button 
                    type="button" 
                    class="btn-close" 
                    onClick={() => showCategoryModal.value = false}
                  ></button>
                </div>
                <div class="modal-body">
                  <form onSubmit={(e) => { e.preventDefault(); submitCategory(); }}>
                    <div class="row g-3">
                      <div class="col-12">
                        <label class="form-label fw-semibold">Category Name *</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          v-model={categoryForm.value.name}
                          placeholder="e.g., Astrology, Tarot Reading, Life Coaching"
                          required 
                        />
                      </div>
                      
                      <div class="col-12">
                        <label class="form-label fw-semibold">Category Image *</label>
                        <input 
                          type="file" 
                          class="form-control" 
                          accept="image/*"
                          onChange={(e) => handleImageUpload(e, 'image')}
                          required 
                        />
                        {imageUploaded.value && (
                          <div class="mt-2">
                            <small class="text-success">
                              ✓ {imageFileName.value}
                            </small>
                          </div>
                        )}
                      </div>
                      
                      <div class="col-12">
                        <label class="form-label fw-semibold">Description *</label>
                        <textarea 
                          class="form-control" 
                          rows="4"
                          v-model={categoryForm.value.description}
                          placeholder="Describe the expert category and what services it includes..."
                          required
                        ></textarea>
                      </div>
                    </div>
                  </form>
                </div>
                <div class="modal-footer">
                  <button 
                    type="button" 
                    class="btn btn-secondary" 
                    onClick={() => showCategoryModal.value = false}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    class="btn btn-primary" 
                    onClick={submitCategory}
                    disabled={loading.value}
                  >
                    {loading.value ? (
                      <>
                        <span class="spinner-border spinner-border-sm me-2"></span>
                        Creating...
                      </>
                    ) : (
                      'Create Category'
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {showEditModal.value && (
          <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => showEditModal.value = false}>
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
              <div class="modal-content border-0 shadow-lg" style={{ borderRadius: '16px', maxHeight: '85vh' }}>
                <div class="modal-header">
                  <h5 class="modal-title">Edit Expert Category</h5>
                  <button class="btn-close" onClick={() => showEditModal.value = false}></button>
                </div>
                <div class="modal-body">
                  <div class="row">
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Category Name</label>
                        <input 
                          type="text" 
                          class="form-control rounded-3" 
                          placeholder="Enter category name"
                          v-model={editForm.value.name}
                        />
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Description</label>
                        <textarea 
                          class="form-control rounded-3" 
                          rows="3"
                          placeholder="Enter description"
                          v-model={editForm.value.description}
                        ></textarea>
                      </div>
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Category Image</label>
                    <input 
                      type="file" 
                      class="form-control rounded-3" 
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files[0];
                        if (file) {
                          editForm.value.image = file;
                          editImageUploaded.value = true;
                          editImageFileName.value = file.name;
                          const reader = new FileReader();
                          reader.onload = (e) => {
                            editImagePreview.value = e.target.result;
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                    {editImageUploaded.value && (
                      <div class="mt-2 p-2 bg-success bg-opacity-10 rounded">
                        <small class="text-success">
                          ✓ New image selected: {editImageFileName.value}
                        </small>
                      </div>
                    )}
                    {editingCategory.value?.image && !editImageUploaded.value && (
                      <div class="mt-2 p-2 bg-info bg-opacity-10 rounded">
                        <small class="text-info">
                          📷 Current image will be kept if no new image is selected
                        </small>
                      </div>
                    )}
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" onClick={() => showEditModal.value = false} disabled={loading.value}>Cancel</button>
                  <button 
                    class="btn btn-primary"
                    onClick={updateCategory}
                    disabled={loading.value}
                  >
                    {loading.value ? 'Updating...' : 'Update Category'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Modal */}
        {showViewModal.value && selectedCategory.value && (
          <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => showViewModal.value = false}>
            <div class="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }} onClick={(e) => e.stopPropagation()}>
              <div class="modal-content border-0 shadow-lg" style={{ borderRadius: '16px' }}>
                <div class="modal-header bg-primary text-white border-0" style={{ borderRadius: '16px 16px 0 0' }}>
                  <h5 class="mb-0 fw-bold d-flex align-items-center">
                    <EyeIcon style={{ width: '1.5rem', height: '1.5rem' }} class="me-2" />
                    Category Preview
                  </h5>
                  <button 
                    class="btn-close btn-close-white" 
                    onClick={() => showViewModal.value = false}
                  ></button>
                </div>
                <div class="modal-body p-4">
                  {selectedCategory.value.image && (
                    <div class="text-center mb-4">
                      <img 
                        src={selectedCategory.value.image}
                        alt={selectedCategory.value.name}
                        class="rounded-circle border border-3 border-white shadow-lg"
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      />
                    </div>
                  )}
                  <h4 class="mb-2 text-center fw-bold text-dark">{selectedCategory.value.name}</h4>
                  <p class="text-muted text-center mb-3">{selectedCategory.value.description}</p>

                  <div class="p-3 rounded-3 mb-4" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                    <div class="mb-3">
                      <label class="form-label fw-bold text-muted">Description</label>
                      <p class="mb-0">{selectedCategory.value.description}</p>
                    </div>
                    <div class="mb-0">
                      <label class="form-label fw-bold text-muted">Status</label>
                      <p class="mb-0">
                        <span class={`badge ${selectedCategory.value.isActive ? 'bg-success' : 'bg-secondary'} px-3 py-2 rounded-pill`}>
                          {selectedCategory.value.isActive ? '✅ Active' : '❌ Inactive'}
                        </span>
                      </p>
                    </div>
                  </div>
                  <hr class="my-3" />
                  <small class="text-muted d-flex align-items-center gap-1">
                    <CalendarIcon style={{ width: '14px', height: '14px' }} />
                    Created on {selectedCategory.value.createdAt ? new Date(selectedCategory.value.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No date'}
                  </small>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
};