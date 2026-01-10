import { ref, onMounted, h } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, PlusIcon, StarIcon, TrashIcon, PencilIcon } from '@heroicons/vue/24/outline';
import { useToast } from 'vue-toastification';
import testimonialService from '../../../services/testimonialService.js';

export default {
  name: 'ClientTestimonial',
  setup() {
    const router = useRouter();
    const toast = useToast();
    const testimonials = ref([]);
    const loading = ref(false);
    const showAddModal = ref(false);
    const showEditModal = ref(false);
    const showDropdown = ref({});
    const editingTestimonial = ref(null);

    const toggleDropdown = (testimonialId) => {
      showDropdown.value = {
        ...showDropdown.value,
        [testimonialId]: !showDropdown.value[testimonialId]
      };
    };

    const toggleTestimonialStatus = async (id) => {
      try {
        const response = await testimonialService.toggleTestimonialStatus(id);
        if (response.success) {
          // Update local state
          const index = testimonials.value.findIndex(t => (t.id || t._id) === id);
          if (index !== -1) {
            testimonials.value[index] = {
              ...testimonials.value[index],
              isActive: response.data.isActive
            };
          }
          toast.success(`✓ Testimonial ${response.data.isActive ? 'enabled' : 'disabled'} successfully!`);
        } else {
          toast.error('❌ ' + (response.error || 'Failed to toggle testimonial status'));
        }
      } catch (error) {
        toast.error('❌ Failed to toggle testimonial status. Please try again.');
      }
    };

    const newTestimonial = ref({
      name: '',
      rating: 5,
      message: '',
      image: null
    });

    const goBack = () => {
      router.push('/client/tools');
    };

    const fetchTestimonials = async () => {
      loading.value = true;
      try {
        const response = await testimonialService.getAllTestimonials();
        if (response.success && response.data && response.data.data) {
          let testimonialsList = Array.isArray(response.data.data) ? response.data.data : [];
          
          // Convert S3 URLs to presigned URLs for better access
          testimonialsList = await Promise.all(
            testimonialsList.map(async (testimonial) => {
              if (testimonial.image) {
                try {
                  const presignedUrl = await testimonialService.getPresignedImageUrl(testimonial.image);
                  return { ...testimonial, image: presignedUrl };
                } catch (error) {
                  // console.warn('Failed to get presigned URL for testimonial image:', error);
                  return testimonial;
                }
              }
              return testimonial;
            })
          );
          
          testimonials.value = testimonialsList;
        } else {
          testimonials.value = [];
        }
      } catch (error) {
        toast.error('Failed to load testimonials');
        testimonials.value = [];
      } finally {
        loading.value = false;
      }
    };

    const addTestimonial = async () => {
      try {
        loading.value = true;
        toast.info('Creating testimonial...');
        const { image, ...testimonialData } = newTestimonial.value;
        const response = await testimonialService.createTestimonial(testimonialData);
        
        if (response.success && response.data) {
          let createdTestimonial = response.data;
          
          // Upload image if provided and testimonial ID exists
          if (image && createdTestimonial._id) {
            try {
              toast.info('Uploading image...');
              const imageResponse = await testimonialService.uploadImage(createdTestimonial._id, image);
              
              if (imageResponse.success && imageResponse.data) {
                // Backend returns {success: true, data: {imageUrl: "..."}}
                // testimonialService extracts it: response.data.data = {imageUrl: "..."}
                // So imageResponse.data = {imageUrl: "..."}
                let imageUrl = imageResponse.data.imageUrl;
                
                if (imageUrl) {
                  // Get presigned URL for S3 images
                  try {
                    const presignedUrl = await testimonialService.getPresignedImageUrl(imageUrl);
                    imageUrl = presignedUrl || imageUrl;
                  } catch (error) {
                    // console.warn('Failed to get presigned URL, using original:', error);
                  }
                  
                  // Set the image property on the testimonial object
                  createdTestimonial.image = imageUrl;
                } else {
                  // console.error('No imageUrl found in response.data:', imageResponse.data);
                }
              } else {
                toast.error('⚠️ Image upload response invalid');
              }
            } catch (imageError) {
              toast.error('⚠️ Testimonial created but image upload failed');
            }
          }
          
          // Ensure image is set before adding to list
          if (!createdTestimonial.image && image) {
            // console.warn('Image was not set after upload, testimonial:', createdTestimonial);
          }
          
          // Force Vue reactivity by creating a new object
          const testimonialToAdd = {
            ...createdTestimonial,
            image: createdTestimonial.image || null
          };
          
          testimonials.value.unshift(testimonialToAdd);
          newTestimonial.value = { name: '', rating: 5, message: '', image: null };
          showAddModal.value = false;
          toast.success('✓ Testimonial added successfully!');
        } else {
          toast.error('❌ ' + (response.error || 'Failed to create testimonial'));
        }
      } catch (error) {
        toast.error('❌ Failed to create testimonial. Please try again.');
      } finally {
        loading.value = false;
      }
    };

    const editTestimonial = (testimonial) => {
      editingTestimonial.value = { ...testimonial };
      showEditModal.value = true;
    };

    const updateTestimonial = async () => {
      try {
        loading.value = true;
        toast.info('Updating testimonial...');
        const { image, ...testimonialData } = editingTestimonial.value;
        const response = await testimonialService.updateTestimonial(
          editingTestimonial.value.id || editingTestimonial.value._id, 
          testimonialData
        );
        
        if (response.success) {
          let updatedTestimonial = response.data;
          
          // Upload image if provided
          if (image && typeof image !== 'string') {
            try {
              toast.info('Uploading new image...');
              const imageResponse = await testimonialService.uploadImage(updatedTestimonial._id, image);
              if (imageResponse.success && imageResponse.data && imageResponse.data.imageUrl) {
                // Get presigned URL for S3 images
                let imageUrl = imageResponse.data.imageUrl;
                try {
                  const presignedUrl = await testimonialService.getPresignedImageUrl(imageUrl);
                  imageUrl = presignedUrl || imageUrl;
                } catch (error) {
                  // console.warn('Failed to get presigned URL, using original:', error);
                }
                updatedTestimonial.image = imageUrl;
              }
            } catch (imageError) {
              toast.error('⚠️ Testimonial updated but image upload failed');
            }
          }
          
          const index = testimonials.value.findIndex(t => (t.id || t._id) === (editingTestimonial.value.id || editingTestimonial.value._id));
          if (index !== -1) {
            // Force Vue reactivity by creating a new object
            testimonials.value[index] = {
              ...updatedTestimonial,
              image: updatedTestimonial.image || null
            };
          }
          showEditModal.value = false;
          editingTestimonial.value = null;
          toast.success('✓ Testimonial updated successfully!');
        }
      } catch (error) {
        toast.error('❌ Failed to update testimonial. Please try again.');
      } finally {
        loading.value = false;
      }
    };

    const deleteTestimonial = async (id) => {
      // Simple confirmation with toast
      const confirmed = confirm('Are you sure you want to delete this testimonial?');
      if (!confirmed) {
        toast.info('Delete cancelled');
        return;
      }
      
      try {
        loading.value = true;
        toast.info('Deleting testimonial...');
        const response = await testimonialService.deleteTestimonial(id);
        
        if (response.success) {
          testimonials.value = testimonials.value.filter(t => (t.id || t._id) !== id);
          toast.success('✓ Testimonial deleted successfully!');
        } else {
          toast.error('❌ ' + (response.message || 'Failed to delete testimonial'));
        }
      } catch (error) {
        toast.error('❌ Failed to delete testimonial. Please try again.');
      } finally {
        loading.value = false;
      }
    };

    const handleImageUpload = async (event, testimonialId) => {
      const file = event.target.files[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Only image files allowed');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }

      try {
        loading.value = true;
        toast.info('Uploading image...');
        const response = await testimonialService.uploadImage(testimonialId, file);
        
        if (response.success && response.data && response.data.imageUrl) {
          let imageUrl = response.data.imageUrl;
          
          // Get presigned URL for S3 images
          try {
            const presignedUrl = await testimonialService.getPresignedImageUrl(imageUrl);
            imageUrl = presignedUrl || imageUrl;
          } catch (error) {
            // console.warn('Failed to get presigned URL, using original:', error);
          }
          
          const index = testimonials.value.findIndex(t => (t.id || t._id) === testimonialId);
          if (index !== -1) {
            // Force Vue reactivity by creating a new object
            testimonials.value[index] = {
              ...testimonials.value[index],
              image: imageUrl
            };
            // console.log('Image updated in testimonials array:', testimonials.value[index]);
          }
          toast.success('✓ Image uploaded successfully!');
        } else {
          toast.error('❌ Failed to upload image');
        }
      } catch (error) {
        toast.error('❌ Failed to upload image. Please try again.');
      } finally {
        loading.value = false;
      }
    };

    const renderStars = (rating) => {
      return Array.from({ length: 5 }).map((_, i) =>
        h(StarIcon, {
          key: i,
          style: {
            width: '1rem',
            height: '1rem',
            color: i < rating ? '#ffc107' : '#e9ecef'
          },
          fill: i < rating ? '#ffc107' : 'none'
        })
      );
    };

    onMounted(() => {
      fetchTestimonials();
    });

    return () => (
      <div class="container-fluid">
        <div class="row">
          <div class="col-12">
            <div class="d-flex align-items-center mb-4">
              <button 
                class="btn btn-outline-secondary me-3" 
                onClick={goBack}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
                Back to Tools
              </button>
              <div class="flex-grow-1">
                <h1 class="mb-0 text-primary">Testimonials</h1>
                <p class="text-muted mb-0">Manage customer testimonials and reviews</p>
              </div>
              <button 
                class="btn btn-primary"
                onClick={() => showAddModal.value = true}
                disabled={loading.value}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                Add New Testimonial
              </button>
            </div>

            {loading.value && (
              <div class="text-center py-4">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
              </div>
            )}

            <div class="row g-4">
              {testimonials.value.map(testimonial => (
                <div key={testimonial._id || testimonial.id} class="col-lg-6 col-md-12">
                  <div 
                    class={`card border-0 shadow-sm h-100 position-relative overflow-hidden ${!testimonial.isActive ? 'opacity-50' : ''}`}
                    onClick={() => {
                      if (!testimonial.isActive) {
                        toggleTestimonialStatus(testimonial.id || testimonial._id);
                      }
                    }}
                    style={{ cursor: !testimonial.isActive ? 'pointer' : 'default' }}
                  >
                    {!testimonial.isActive && (
                      <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.1)', zIndex: 1 }}>
                        <span class="badge bg-secondary px-3 py-2">Disabled - Click to Enable</span>
                      </div>
                    )}
                    {/* Quote decoration */}
                    <div class="position-absolute top-0 end-0 p-3" style={{ opacity: 0.1, fontSize: '3rem', color: '#007bff' }}>"</div>
                    
                    <div class="card-body p-4">
                      <div class="d-flex align-items-start mb-3">
                        <div class="position-relative me-3">
                          <img 
                            src={testimonial.image && testimonial.image.trim() ? testimonial.image : `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=007bff&color=fff&size=60`} 
                            alt={testimonial.name}
                            class="rounded-circle border border-2 border-light shadow-sm"
                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                            onError={(e) => {
                              const currentSrc = e.target.src;
                              const isLocalUrl = currentSrc.includes('localhost') || currentSrc.includes('127.0.0.1') || currentSrc.startsWith('/uploads/');
                              const isS3Url = currentSrc.includes('s3.amazonaws.com') || currentSrc.includes('amazonaws.com');
                              
                              // For local URLs (old testimonials), immediately fallback to avatar
                              if (isLocalUrl) {
                                // console.warn('Local image URL not accessible (old testimonial):', currentSrc, 'Falling back to avatar');
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=6c757d&color=fff&size=60`;
                                return;
                              }
                              
                              // For S3 URLs, retry once before falling back (might be CORS or timing issue)
                              if (isS3Url && !e.target.dataset.retried) {
                                e.target.dataset.retried = 'true';
                                // Retry with cache busting
                                setTimeout(() => {
                                  e.target.src = currentSrc + (currentSrc.includes('?') ? '&' : '?') + 't=' + Date.now();
                                }, 1000);
                              } else {
                                // Final fallback to avatar only if not S3 or retry failed
                                // console.warn('Image failed to load:', currentSrc, 'Falling back to avatar');
                                e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(testimonial.name)}&background=6c757d&color=fff&size=60`;
                              }
                            }}
                            onLoad={(e) => {
                              // Reset retry flag on successful load
                              if (e.target) {
                                e.target.dataset.retried = 'false';
                              }
                            }}
                          />
                          <input 
                            type="file" 
                            accept="image/*"
                            style={{ display: 'none' }}
                            id={`image-upload-${testimonial.id || testimonial._id}`}
                            onChange={(e) => handleImageUpload(e, testimonial.id || testimonial._id)}
                          />
                          <label 
                            for={`image-upload-${testimonial.id || testimonial._id}`}
                            class="position-absolute bottom-0 end-0 btn btn-sm btn-primary rounded-circle d-flex align-items-center justify-content-center"
                            style={{ width: '24px', height: '24px', fontSize: '10px', cursor: 'pointer' }}
                            title="Change photo"
                            onClick={(e) => e.stopPropagation()}
                          >
                            📷
                          </label>
                        </div>
                        <div class="flex-grow-1">
                          <h5 class="mb-1 fw-bold text-dark">{testimonial.name}</h5>
                          <div class="d-flex align-items-center mb-2">
                            <div class="d-flex me-2">
                              {renderStars(testimonial.rating)}
                            </div>
                            <span class="badge bg-primary-subtle text-primary px-2 py-1 rounded-pill">
                              {testimonial.rating}/5
                            </span>
                          </div>
                          <small class="text-muted d-flex align-items-center">
                            ✓ Verified Customer
                          </small>
                        </div>
                        <div class="dropdown">
                          <button 
                            class="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center" 
                            type="button" 
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleDropdown(testimonial.id || testimonial._id);
                            }}
                            style={{ width: '36px', height: '36px', fontSize: '18px', fontWeight: 'bold' }}
                            title="More options"
                          >
                            ⋮
                          </button>
                          {showDropdown.value[testimonial.id || testimonial._id] && (
                            <ul class="dropdown-menu show position-absolute shadow-lg border-0" style={{ top: '100%', right: '0', zIndex: 1000, minWidth: '140px' }}>
                              <li>
                                <button 
                                  class="dropdown-item d-flex align-items-center py-2" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    editTestimonial(testimonial);
                                    toggleDropdown(testimonial.id || testimonial._id);
                                  }}
                                >
                                  <PencilIcon style={{ width: '16px', height: '16px' }} class="me-2 text-primary" />
                                  Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  class={`dropdown-item d-flex align-items-center py-2 ${!testimonial.isActive ? 'text-success' : 'text-warning'}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleTestimonialStatus(testimonial.id || testimonial._id);
                                    toggleDropdown(testimonial.id || testimonial._id);
                                  }}
                                >
                                  {!testimonial.isActive ? (
                                    <>
                                      <svg style={{ width: '16px', height: '16px' }} class="me-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                      </svg>
                                      Enable
                                    </>
                                  ) : (
                                    <>
                                      <svg style={{ width: '16px', height: '16px' }} class="me-2" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                                      </svg>
                                      Disable
                                    </>
                                  )}
                                </button>
                              </li>
                              <li>
                                <button 
                                  class="dropdown-item d-flex align-items-center py-2 text-danger" 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteTestimonial(testimonial.id || testimonial._id);
                                    toggleDropdown(testimonial.id || testimonial._id);
                                  }}
                                >
                                  <TrashIcon style={{ width: '16px', height: '16px' }} class="me-2" />
                                  Delete
                                </button>
                              </li>
                            </ul>
                          )}
                        </div>
                      </div>
                      
                      <div class="testimonial-content mb-3">
                        <blockquote class="mb-0 position-relative">
                          <p class="mb-0 fst-italic text-dark lh-base" style={{ fontSize: '0.95rem' }}>
                            "{testimonial.message}"
                          </p>
                        </blockquote>
                      </div>
                      
                      <div class="d-flex align-items-center justify-content-between pt-2 border-top border-light">
                        <small class="text-muted d-flex align-items-center">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="me-1">
                            <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2-7h-3V2h-2v2H8V2H6v2H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H3V8h14v12z"/>
                          </svg>
                          {new Date(testimonial.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </small>
                        <div class="d-flex align-items-center">
                          <span class="badge bg-success-subtle text-success px-2 py-1 rounded-pill">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="me-1">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            Featured
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {testimonials.value.length === 0 && !loading.value && (
              <div class="text-center py-5">
                <div class="mb-4">
                  <StarIcon style={{ width: '4rem', height: '4rem', color: '#dee2e6' }} />
                </div>
                <h4 class="text-muted">No testimonials yet</h4>
                <p class="text-muted">Start by adding your first customer testimonial</p>
                <button 
                  class="btn btn-primary"
                  onClick={() => showAddModal.value = true}
                >
                  Add First Testimonial
                </button>
              </div>
            )}

            {/* Add Modal */}
            {showAddModal.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div class="modal-dialog">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title">Add New Testimonial</h5>
                      <button class="btn-close" onClick={() => showAddModal.value = false}></button>
                    </div>
                    <div class="modal-body">
                      <div class="mb-3">
                        <label class="form-label">Customer Name</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          v-model={newTestimonial.value.name}
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Rating</label>
                        <select class="form-select" v-model={newTestimonial.value.rating}>
                          <option value={5}>5 Stars - Excellent</option>
                          <option value={4}>4 Stars - Very Good</option>
                          <option value={3}>3 Stars - Good</option>
                          <option value={2}>2 Stars - Fair</option>
                          <option value={1}>1 Star - Poor</option>
                        </select>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Testimonial Message</label>
                        <textarea 
                          class="form-control" 
                          rows="4"
                          v-model={newTestimonial.value.message}
                          placeholder="Enter testimonial message"
                        ></textarea>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Profile Image</label>
                        <input 
                          type="file" 
                          class="form-control" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              newTestimonial.value.image = file;
                            }
                          }}
                        />
                        <small class="form-text text-muted">Max file size: 5MB (JPG, PNG, GIF)</small>
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button class="btn btn-secondary" onClick={() => showAddModal.value = false}>Cancel</button>
                      <button 
                        class="btn btn-primary" 
                        onClick={addTestimonial}
                        disabled={loading.value}
                      >
                        {loading.value ? 'Adding...' : 'Add Testimonial'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Modal */}
            {showEditModal.value && editingTestimonial.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div class="modal-dialog">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title">Edit Testimonial</h5>
                      <button 
                        class="btn-close" 
                        onClick={() => {
                          showEditModal.value = false;
                          editingTestimonial.value = null;
                        }}
                      ></button>
                    </div>
                    <div class="modal-body">
                      <div class="mb-3">
                        <label class="form-label">Customer Name</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          v-model={editingTestimonial.value.name}
                          placeholder="Enter customer name"
                        />
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Rating</label>
                        <select class="form-select" v-model={editingTestimonial.value.rating}>
                          <option value={5}>5 Stars - Excellent</option>
                          <option value={4}>4 Stars - Very Good</option>
                          <option value={3}>3 Stars - Good</option>
                          <option value={2}>2 Stars - Fair</option>
                          <option value={1}>1 Star - Poor</option>
                        </select>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Testimonial Message</label>
                        <textarea 
                          class="form-control" 
                          rows="4"
                          v-model={editingTestimonial.value.message}
                          placeholder="Enter testimonial message"
                        ></textarea>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Profile Image</label>
                        <input 
                          type="file" 
                          class="form-control" 
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                              editingTestimonial.value.image = file;
                            }
                          }}
                        />
                        <small class="form-text text-muted">Max file size: 5MB (JPG, PNG, GIF)</small>
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button class="btn btn-secondary" onClick={() => showEditModal.value = false}>Cancel</button>
                      <button 
                        class="btn btn-primary" 
                        onClick={updateTestimonial}
                        disabled={loading.value}
                      >
                        {loading.value ? 'Updating...' : 'Update Testimonial'}
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