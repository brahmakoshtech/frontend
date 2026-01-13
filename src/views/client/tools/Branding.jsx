import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, PlusIcon, PhotoIcon, TrashIcon, EyeIcon, PencilIcon, EllipsisVerticalIcon, CalendarIcon, ChartBarIcon, SwatchIcon, GlobeAltIcon, ShareIcon } from '@heroicons/vue/24/outline';
import brandAssetService from '../../../services/brandAssetService.js';

export default {
  name: 'ClientBranding',
  setup() {
    const router = useRouter();
    const brandAssets = ref([]);
    const loading = ref(false);
    const showUploadModal = ref(false);
    const showEditModal = ref(false);
    const selectedAsset = ref(null);
    const showViewModal = ref(false);
    const activeDropdown = ref(null);
    const editingAsset = ref(null);
    const formData = ref({
      headingText: '',
      brandLogoName: '',
      brandLogoImage: null,
      webLinkUrl: '',
      socialLink: ''
    });
    const editFormData = ref({
      headingText: '',
      brandLogoName: '',
      webLinkUrl: '',
      socialLink: '',
      brandLogoImage: null
    });
    const imageUploaded = ref(false);
    const imageFileName = ref('');
    const editImageUploaded = ref(false);
    const editImageFileName = ref('');

    // Generate placeholder image as data URL
    const generatePlaceholder = (text, bgColor = '007bff', textColor = 'ffffff') => {
      const canvas = document.createElement('canvas');
      canvas.width = 100;
      canvas.height = 100;
      const ctx = canvas.getContext('2d');
      
      // Fill background
      ctx.fillStyle = `#${bgColor}`;
      ctx.fillRect(0, 0, 100, 100);
      
      // Add text
      ctx.fillStyle = `#${textColor}`;
      ctx.font = 'bold 40px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text.charAt(0).toUpperCase(), 50, 50);
      
      return canvas.toDataURL();
    };
    const loadBrandAssets = async () => {
      loading.value = true;
      try {
        const response = await brandAssetService.getAllBrandAssets();
        if (response.success) {
          let assetsList = response.data.data || [];
          
          // Convert S3 URLs to presigned URLs with better error handling
          assetsList = await Promise.all(
            assetsList.map(async (asset) => {
              if (asset.brandLogoImage) {
                try {
                  const presignedUrl = await brandAssetService.getPresignedImageUrl(asset.brandLogoImage);
                  // Only use presigned URL if it's valid
                  if (presignedUrl && presignedUrl.startsWith('http')) {
                    return { ...asset, brandLogoImage: presignedUrl };
                  } else {
                    // Use null to show placeholder instead of broken image
                    return { ...asset, brandLogoImage: null };
                  }
                } catch (error) {
                  // Keep original URL as fallback
                  return { ...asset, brandLogoImage: null };
                }
              }
              return asset;
            })
          );
          
          brandAssets.value = assetsList;
        } else {
          // Failed to load brand assets
        }
      } catch (error) {
        // Error loading brand assets
      } finally {
        loading.value = false;
      }
    };

    // Add new brand asset
    const addBrandAsset = async () => {
      if (!formData.value.headingText || !formData.value.brandLogoName || !formData.value.webLinkUrl || !formData.value.socialLink) {
        alert('Please fill all required fields');
        return;
      }

      loading.value = true;
      try {
        // First create brand asset without image
        const { brandLogoImage, ...assetData } = formData.value;
        const response = await brandAssetService.createBrandAsset(assetData);
        
        if (response.success && response.data) {
          let createdAsset = response.data;
          
          // Upload image if provided and asset ID exists
          if (brandLogoImage && createdAsset._id) {
            try {
              const imageResponse = await brandAssetService.uploadImage(createdAsset._id, brandLogoImage);
              
              if (imageResponse.success && imageResponse.data) {
                // Update the created asset with the image URL from response
                if (imageResponse.data.brandAsset && imageResponse.data.brandAsset.brandLogoImage) {
                  let imageUrl = imageResponse.data.brandAsset.brandLogoImage;
                  // Get presigned URL for S3 images
                  try {
                    const presignedUrl = await brandAssetService.getPresignedImageUrl(imageUrl);
                    createdAsset.brandLogoImage = presignedUrl || imageUrl;
                  } catch (error) {
                    createdAsset.brandLogoImage = imageUrl;
                  }
                } else if (imageResponse.data.imageUrl) {
                  let imageUrl = imageResponse.data.imageUrl;
                  // Get presigned URL for S3 images
                  try {
                    const presignedUrl = await brandAssetService.getPresignedImageUrl(imageUrl);
                    createdAsset.brandLogoImage = presignedUrl || imageUrl;
                  } catch (error) {
                    createdAsset.brandLogoImage = imageUrl;
                  }
                }
              }
            } catch (imageError) {
              alert('Brand asset created but image upload failed');
            }
          }
          
          brandAssets.value.unshift(createdAsset);
          formData.value = { headingText: '', brandLogoName: '', brandLogoImage: null, webLinkUrl: '', socialLink: '' };
          imageUploaded.value = false;
          imageFileName.value = '';
          showUploadModal.value = false;
        } else {
          alert('Failed to create brand asset: ' + response.error);
        }
      } catch (error) {
        alert('Error creating brand asset');
      } finally {
        loading.value = false;
      }
    };

    // Edit brand asset
    const editAsset = (asset) => {
      editingAsset.value = asset;
      editFormData.value = {
        headingText: asset.headingText,
        brandLogoName: asset.brandLogoName,
        webLinkUrl: asset.webLinkUrl,
        socialLink: asset.socialLink
      };
      showEditModal.value = true;
    };

    // Update brand asset
    const updateBrandAsset = async () => {
      if (!editFormData.value.headingText || !editFormData.value.brandLogoName || !editFormData.value.webLinkUrl || !editFormData.value.socialLink) {
        alert('Please fill all required fields');
        return;
      }

      loading.value = true;
      try {
        // First update text fields
        const { brandLogoImage, ...textData } = editFormData.value;
        const response = await brandAssetService.updateBrandAsset(
          editingAsset.value._id || editingAsset.value.id, 
          textData
        );
        
        if (response.success) {
          let updatedAsset = response.data;
          
          // Upload new image if provided
          if (brandLogoImage) {
            try {
              const imageResponse = await brandAssetService.uploadImage(
                editingAsset.value._id || editingAsset.value.id, 
                brandLogoImage
              );
              
              if (imageResponse.success && imageResponse.data) {
                if (imageResponse.data.brandAsset && imageResponse.data.brandAsset.brandLogoImage) {
                  let imageUrl = imageResponse.data.brandAsset.brandLogoImage;
                  try {
                    const presignedUrl = await brandAssetService.getPresignedImageUrl(imageUrl);
                    updatedAsset.brandLogoImage = presignedUrl || imageUrl;
                  } catch (error) {
                    updatedAsset.brandLogoImage = imageUrl;
                  }
                } else if (imageResponse.data.imageUrl) {
                  let imageUrl = imageResponse.data.imageUrl;
                  try {
                    const presignedUrl = await brandAssetService.getPresignedImageUrl(imageUrl);
                    updatedAsset.brandLogoImage = presignedUrl || imageUrl;
                  } catch (error) {
                    updatedAsset.brandLogoImage = imageUrl;
                  }
                }
              }
            } catch (imageError) {
              alert('Asset updated but image upload failed');
            }
          }
          
          const index = brandAssets.value.findIndex(a => (a._id || a.id) === (editingAsset.value._id || editingAsset.value.id));
          if (index !== -1) {
            brandAssets.value[index] = { ...brandAssets.value[index], ...updatedAsset };
          }
          
          showEditModal.value = false;
          editingAsset.value = null;
          editImageUploaded.value = false;
          editImageFileName.value = '';
        } else {
          alert('Failed to update brand asset: ' + response.error);
        }
      } catch (error) {
        alert('Error updating brand asset');
      } finally {
        loading.value = false;
      }
    };

    // Delete brand asset
    const deleteAsset = async (id) => {
      if (!confirm('Are you sure you want to delete this brand asset?')) return;
      
      loading.value = true;
      try {
        const response = await brandAssetService.deleteBrandAsset(id);
        if (response.success) {
          brandAssets.value = brandAssets.value.filter(a => (a._id || a.id) !== id);
        } else {
          alert('Failed to delete brand asset: ' + response.error);
        }
      } catch (error) {
        console.error('Error deleting brand asset:', error);
        alert('Error deleting brand asset');
      } finally {
        loading.value = false;
      }
    };

    // Simple functions to prevent rerenders
    const goBack = () => {
      router.push('/client/tools');
    };

    const toggleDropdown = (assetId) => {
      activeDropdown.value = activeDropdown.value === assetId ? null : assetId;
    };

    const viewAsset = (asset) => {
      selectedAsset.value = asset;
    };

    // Load brand assets on component mount
    onMounted(() => {
      // Console log all tokens for debugging
      const clientToken = localStorage.getItem('token_client');
      const userToken = localStorage.getItem('token_user');
      const adminToken = localStorage.getItem('token_admin');
      const superAdminToken = localStorage.getItem('token_super_admin');
      
      console.log('=== TOKEN DEBUG ===');
      console.log('Client Token:', clientToken);
      console.log('User Token:', userToken);
      console.log('Admin Token:', adminToken);
      console.log('Super Admin Token:', superAdminToken);
      console.log('Current URL:', window.location.href);
      console.log('Current Role Context:', window.location.pathname.includes('/client') ? 'CLIENT' : 'OTHER');
      console.log('==================');
      
      loadBrandAssets();
    });

    return () => (
      <div class="container-fluid px-3 px-lg-4">
        <div class="row">
          <div class="col-12">
            {/* Enhanced Header */}
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
                  <h1 class="mb-1 fw-bold fs-2 text-dark">
                    <SwatchIcon style={{ width: '2rem', height: '2rem' }} class="me-2" />
                    Brand Management
                  </h1>
                  <p class="mb-0 text-dark" style={{ opacity: 0.8 }}>Manage your brand assets and guidelines</p>
                  {!loading.value && brandAssets.value.length > 0 && (
                    <small class="text-dark d-block mt-1" style={{ opacity: 0.8 }}>
                      <ChartBarIcon style={{ width: '16px', height: '16px' }} class="me-1" />
                      {brandAssets.value.length} brand assets
                    </small>
                  )}
                </div>
                <button 
                  class="btn btn-light btn-lg rounded-pill px-4 shadow-sm"
                  onClick={() => showUploadModal.value = true}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
                >
                  <PlusIcon style={{ width: '1.2rem', height: '1.2rem' }} />
                  <span class="d-none d-sm-inline">Upload Asset</span>
                  <span class="d-sm-none">Upload</span>
                </button>
              </div>
            </div>

            {loading.value && (
              <div class="text-center py-5">
                <div class="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="text-muted">Loading brand assets...</p>
              </div>
            )}

            <div class="row g-4">
              {brandAssets.value.map(asset => (
                <div key={asset._id || asset.id} class="col-xl-3 col-lg-4 col-md-6 col-sm-12">
                  <div 
                    class="card border-0 shadow-lg h-100 position-relative overflow-hidden"
                    style={{ 
                      transition: 'all 0.3s ease',
                      background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
                      borderRadius: '16px'
                    }}
                  >
                    <div class="position-absolute top-0 end-0 p-3" style={{ opacity: 0.08, fontSize: '3rem', color: '#007bff' }}>🎨</div>
                    
                    <div class="card-img-top bg-light d-flex align-items-center justify-content-center position-relative" style={{ height: '120px', borderRadius: '16px 16px 0 0' }}>
                      <img 
                        src={asset.brandLogoImage || generatePlaceholder(asset.brandLogoName || 'Brand')} 
                        alt={asset.brandLogoName || 'Brand Asset'}
                        class="img-fluid rounded-3 shadow-sm" 
                        style={{ maxHeight: '100px', maxWidth: '90%', objectFit: 'contain' }}
                        onError={(e) => {
                          e.target.src = generatePlaceholder(asset.brandLogoName || 'B', 'dc3545');
                        }}
                      />
                    </div>
                    
                    <div class="card-body p-3">
                      <div class="d-flex justify-content-between align-items-start mb-2">
                        <div class="flex-grow-1">
                          <h5 class="mb-1 fw-bold text-dark" style={{ fontSize: '1rem' }}>{asset.headingText || 'Brand Asset'}</h5>
                          <p class="mb-2 text-primary fw-semibold" style={{ fontSize: '0.9rem' }}>{asset.brandLogoName || 'Logo Name'}</p>
                          <div class="d-flex align-items-center gap-1 mb-2">
                            <a 
                              href={asset.webLinkUrl} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              class="badge bg-primary-subtle text-primary px-2 py-1 rounded-pill fw-semibold text-decoration-none d-flex align-items-center gap-1" 
                              style={{ fontSize: '0.7rem', cursor: 'pointer' }}
                              title="Visit Website"
                            >
                              <GlobeAltIcon style={{ width: '12px', height: '12px' }} />
                              Website
                            </a>
                            <a 
                              href={asset.socialLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              class="badge bg-info-subtle text-info px-2 py-1 rounded-pill fw-semibold text-decoration-none d-flex align-items-center gap-1" 
                              style={{ fontSize: '0.7rem', cursor: 'pointer' }}
                              title="Visit Social Profile"
                            >
                              <ShareIcon style={{ width: '12px', height: '12px' }} />
                              Social
                            </a>
                          </div>
                          <span class="badge bg-success-subtle text-success px-2 py-1 rounded-pill fw-semibold" style={{ fontSize: '0.75rem' }}>
                            ✅ {asset.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div class="dropdown position-relative">
                          <button 
                            class="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                            onClick={() => toggleDropdown(asset._id || asset.id)}
                            style={{ width: '40px', height: '40px', transition: 'all 0.2s ease' }}
                          >
                            <EllipsisVerticalIcon style={{ width: '2rem', height: '2rem' }} />
                          </button>
                          {activeDropdown.value === (asset._id || asset.id) && (
                            <div class="dropdown-menu show position-absolute shadow-lg border-0 rounded-3" style={{ minWidth: '160px', right: '0', top: '100%', zIndex: 1000 }}>
                              <button 
                                class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded-2"
                                onClick={() => { editAsset(asset); toggleDropdown(null); }}
                              >
                                <PencilIcon style={{ width: '1rem', height: '1rem', color: '#8b5cf6' }} />
                                <span class="fw-medium">Edit Asset</span>
                              </button>
                              <hr class="dropdown-divider my-1" />
                              <button 
                                class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-danger rounded-2"
                                onClick={() => { deleteAsset(asset._id || asset.id); toggleDropdown(null); }}
                              >
                                <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                                <span class="fw-medium">Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div class="d-flex align-items-center justify-content-between pt-2 border-top border-light">
                        <small class="text-muted d-flex align-items-center" style={{ fontSize: '0.75rem' }}>
                          <CalendarIcon style={{ width: '12px', height: '12px' }} class="me-1" />
                          {asset.createdAt ? new Date(asset.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          }) : 'No date'}
                        </small>
                        <button 
                          class="btn btn-primary btn-sm px-2 py-1 fw-semibold rounded-pill"
                          onClick={() => viewAsset(asset)}
                          style={{ fontSize: '0.75rem' }}
                        >
                          <EyeIcon style={{ width: '12px', height: '12px' }} class="me-1" />
                          View
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {brandAssets.value.length === 0 && !loading.value && (
                <div class="col-12">
                  <div class="text-center py-5">
                    <div class="mb-4 p-4 rounded-circle bg-light d-inline-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                      <SwatchIcon style={{ width: '4rem', height: '4rem', color: '#6c757d' }} />
                    </div>
                    <h4 class="text-muted mb-3">
                      🎨 No brand assets yet
                    </h4>
                    <p class="text-muted mb-4">Start building your brand identity by uploading your first asset</p>
                    <button 
                      class="btn btn-primary btn-lg rounded-pill px-4 shadow-sm"
                      onClick={() => showUploadModal.value = true}
                      style={{ fontWeight: '600' }}
                    >
                      <PlusIcon style={{ width: '1.2rem', height: '1.2rem' }} class="me-2" />
                      Upload First Asset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Modal */}
            {showUploadModal.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div class="modal-dialog modal-lg">
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header bg-white border-bottom rounded-top-4 p-4">
                      <h5 class="modal-title fw-bold d-flex align-items-center text-dark">
                        <SwatchIcon style={{ width: '1.5rem', height: '1.5rem' }} class="me-2" />
                        Upload Brand Asset
                      </h5>
                      <button class="btn-close" onClick={() => showUploadModal.value = false}></button>
                    </div>
                    <div class="modal-body p-4">
                      <div class="row">
                        <div class="col-md-6">
                          <div class="mb-3">
                            <label class="form-label fw-semibold">Heading Text</label>
                            <input 
                              type="text" 
                              class="form-control rounded-3" 
                              placeholder="Enter heading text"
                              v-model={formData.value.headingText}
                            />
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div class="mb-3">
                            <label class="form-label fw-semibold">Brand Logo Name</label>
                            <input 
                              type="text" 
                              class="form-control rounded-3" 
                              placeholder="Enter brand logo name"
                              v-model={formData.value.brandLogoName}
                            />
                          </div>
                        </div>
                      </div>
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Brand Logo Image</label>
                        <input 
                          type="file" 
                          class="form-control rounded-3" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              formData.value.brandLogoImage = file;
                              imageUploaded.value = true;
                              imageFileName.value = file.name;
                            }
                          }}
                        />
                        {imageUploaded.value && (
                          <div class="mt-2 p-2 bg-success bg-opacity-10 rounded">
                            <small class="text-success">
                              ✓ Image uploaded: {imageFileName.value}
                            </small>
                          </div>
                        )}
                      </div>
                      <div class="row">
                        <div class="col-md-6">
                          <div class="mb-3">
                            <label class="form-label fw-semibold">Web Link URL</label>
                            <input 
                              type="url" 
                              class="form-control rounded-3" 
                              placeholder="https://example.com"
                              v-model={formData.value.webLinkUrl}
                            />
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div class="mb-3">
                            <label class="form-label fw-semibold">Social Link</label>
                            <input 
                              type="url" 
                              class="form-control rounded-3" 
                              placeholder="https://social-platform.com/profile"
                              v-model={formData.value.socialLink}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="modal-footer border-0 p-4">
                      <button class="btn btn-secondary rounded-pill px-4" onClick={() => showUploadModal.value = false}>Cancel</button>
                      <button 
                        class="btn btn-primary rounded-pill px-4 fw-semibold"
                        onClick={addBrandAsset}
                        disabled={loading.value}
                      >
                        {loading.value ? 'Creating...' : 'Upload Asset'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Modal */}
            {showEditModal.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div class="modal-dialog modal-lg">
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header bg-white border-bottom rounded-top-4 p-4">
                      <h5 class="modal-title fw-bold d-flex align-items-center text-dark">
                        <PencilIcon style={{ width: '1.5rem', height: '1.5rem' }} class="me-2" />
                        Edit Brand Asset
                      </h5>
                      <button class="btn-close" onClick={() => showEditModal.value = false}></button>
                    </div>
                    <div class="modal-body p-4">
                      <div class="row">
                        <div class="col-md-6">
                          <div class="mb-3">
                            <label class="form-label fw-semibold">Heading Text</label>
                            <input 
                              type="text" 
                              class="form-control rounded-3" 
                              placeholder="Enter heading text"
                              v-model={editFormData.value.headingText}
                            />
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div class="mb-3">
                            <label class="form-label fw-semibold">Brand Logo Name</label>
                            <input 
                              type="text" 
                              class="form-control rounded-3" 
                              placeholder="Enter brand logo name"
                              v-model={editFormData.value.brandLogoName}
                            />
                          </div>
                        </div>
                      </div>
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Brand Logo Image</label>
                        <input 
                          type="file" 
                          class="form-control rounded-3" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              editFormData.value.brandLogoImage = file;
                              editImageUploaded.value = true;
                              editImageFileName.value = file.name;
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
                        {editingAsset.value?.brandLogoImage && !editImageUploaded.value && (
                          <div class="mt-2 p-2 bg-info bg-opacity-10 rounded">
                            <small class="text-info">
                              📷 Current image will be kept if no new image is selected
                            </small>
                          </div>
                        )}
                      </div>
                      <div class="row">
                        <div class="col-md-6">
                          <div class="mb-3">
                            <label class="form-label fw-semibold">Web Link URL</label>
                            <input 
                              type="url" 
                              class="form-control rounded-3" 
                              placeholder="https://example.com"
                              v-model={editFormData.value.webLinkUrl}
                            />
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div class="mb-3">
                            <label class="form-label fw-semibold">Social Link</label>
                            <input 
                              type="url" 
                              class="form-control rounded-3" 
                              placeholder="https://social-platform.com/profile"
                              v-model={editFormData.value.socialLink}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="modal-footer border-0 p-4">
                      <button class="btn btn-secondary rounded-pill px-4" onClick={() => showEditModal.value = false}>Cancel</button>
                      <button 
                        class="btn btn-primary rounded-pill px-4 fw-semibold"
                        onClick={updateBrandAsset}
                        disabled={loading.value}
                      >
                        {loading.value ? 'Updating...' : 'Update Asset'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View Modal */}
            {selectedAsset.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div class="modal-dialog modal-lg">
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header bg-white border-bottom rounded-top-4 p-4">
                      <h5 class="modal-title fw-bold d-flex align-items-center text-dark">
                        <EyeIcon style={{ width: '1.5rem', height: '1.5rem' }} class="me-2" />
                        View Brand Asset
                      </h5>
                      <button class="btn-close" onClick={() => selectedAsset.value = null}></button>
                    </div>
                    <div class="modal-body p-4">
                      <div class="row">
                        <div class="col-md-6">
                          <div class="text-center mb-4">
                            <img 
                              src={selectedAsset.value.brandLogoImage || generatePlaceholder(selectedAsset.value.brandLogoName || 'Brand', '007bff')}
                              alt={selectedAsset.value.brandLogoName}
                              class="img-fluid rounded-3 shadow"
                              style={{ maxHeight: '200px', maxWidth: '100%', objectFit: 'contain' }}
                            />
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div class="mb-3">
                            <label class="form-label fw-bold text-muted">Heading Text</label>
                            <p class="fs-5 fw-semibold">{selectedAsset.value.headingText}</p>
                          </div>
                          <div class="mb-3">
                            <label class="form-label fw-bold text-muted">Brand Logo Name</label>
                            <p class="fs-6 text-primary fw-semibold">{selectedAsset.value.brandLogoName}</p>
                          </div>
                          <div class="mb-3">
                            <label class="form-label fw-bold text-muted">Web Link</label>
                            <p>
                              <a href={selectedAsset.value.webLinkUrl} target="_blank" class="text-decoration-none">
                                {selectedAsset.value.webLinkUrl}
                              </a>
                            </p>
                          </div>
                          <div class="mb-3">
                            <label class="form-label fw-bold text-muted">Social Link</label>
                            <p>
                              <a href={selectedAsset.value.socialLink} target="_blank" class="text-decoration-none">
                                {selectedAsset.value.socialLink}
                              </a>
                            </p>
                          </div>
                          <div class="mb-3">
                            <label class="form-label fw-bold text-muted">Status</label>
                            <p>
                              <span class={`badge ${selectedAsset.value.isActive ? 'bg-success' : 'bg-secondary'} px-3 py-2 rounded-pill`}>
                                {selectedAsset.value.isActive ? '✅ Active' : '❌ Inactive'}
                              </span>
                            </p>
                          </div>
                          <div class="mb-3">
                            <label class="form-label fw-bold text-muted">Created Date</label>
                            <p class="text-muted">
                              {selectedAsset.value.createdAt ? new Date(selectedAsset.value.createdAt).toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : 'No date available'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="modal-footer border-0 p-4">
                      <button class="btn btn-secondary rounded-pill px-4" onClick={() => selectedAsset.value = null}>Close</button>
                      <button 
                        class="btn btn-primary rounded-pill px-4 fw-semibold"
                        onClick={() => { editAsset(selectedAsset.value); selectedAsset.value = null; }}
                      >
                        <PencilIcon style={{ width: '1rem', height: '1rem' }} class="me-1" />
                        Edit Asset
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