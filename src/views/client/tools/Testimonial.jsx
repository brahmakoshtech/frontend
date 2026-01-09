import { ref, onMounted } from 'vue';
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
          testimonials.value = Array.isArray(response.data.data) ? response.data.data : [];
        } else {
          testimonials.value = [];
        }
      } catch (error) {
        console.error('Failed to fetch testimonials:', error);
        toast.error('Failed to load testimonials');
        testimonials.value = [];
      } finally {
        loading.value = false;
      }
    };

    const addTestimonial = async () => {
      try {
        loading.value = true;
        const { image, ...testimonialData } = newTestimonial.value;
        const response = await testimonialService.createTestimonial(testimonialData);
        
        if (response.success && response.data && response.data.data) {
          let createdTestimonial = response.data.data;
          
          // Upload image if provided and testimonial ID exists
          if (image && createdTestimonial._id) {
            try {
              const imageResponse = await testimonialService.uploadImage(createdTestimonial._id, image);
              if (imageResponse.success && imageResponse.data && imageResponse.data.data) {
                createdTestimonial.image = imageResponse.data.data.imageUrl;
              }
            } catch (imageError) {
              console.error('Failed to upload image:', imageError);
              toast.error('Testimonial created but image upload failed');
            }
          }
          
          testimonials.value.unshift(createdTestimonial);
          newTestimonial.value = { name: '', rating: 5, message: '', image: null };
          showAddModal.value = false;
          toast.success('Testimonial added successfully!');
        } else {
          toast.error(response.error || 'Failed to create testimonial');
        }
      } catch (error) {
        console.error('Failed to create testimonial:', error);
        toast.error('Failed to create testimonial. Please try again.');
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
              const imageResponse = await testimonialService.uploadImage(updatedTestimonial._id, image);
              if (imageResponse.success) {
                updatedTestimonial.image = imageResponse.data.imageUrl;
              }
            } catch (imageError) {
              console.error('Failed to upload image:', imageError);
              toast.error('Testimonial updated but image upload failed');
            }
          }
          
          const index = testimonials.value.findIndex(t => (t.id || t._id) === (editingTestimonial.value.id || editingTestimonial.value._id));
          if (index !== -1) {
            testimonials.value[index] = updatedTestimonial;
          }
          showEditModal.value = false;
          editingTestimonial.value = null;
          toast.success('Testimonial updated successfully!');
        }
      } catch (error) {
        console.error('Failed to update testimonial:', error);
        toast.error('Failed to update testimonial. Please try again.');
      } finally {
        loading.value = false;
      }
    };

    const deleteTestimonial = async (id) => {
      if (!confirm('Are you sure you want to delete this testimonial?')) return;
      
      try {
        loading.value = true;
        console.log('Deleting testimonial with ID:', id);
        const response = await testimonialService.deleteTestimonial(id);
        
        if (response.success) {
          testimonials.value = testimonials.value.filter(t => (t.id || t._id) !== id);
          toast.success('Testimonial deleted successfully!');
        } else {
          toast.error(response.message || 'Failed to delete testimonial');
        }
      } catch (error) {
        console.error('Failed to delete testimonial:', error);
        toast.error('Failed to delete testimonial. Please try again.');
      } finally {
        loading.value = false;
      }
    };

    const handleImageUpload = async (event, testimonialId) => {
      const file = event.target.files[0];
      if (!file) return;

      try {
        loading.value = true;
        const response = await testimonialService.uploadImage(testimonialId, file);
        
        if (response.success && response.data && response.data.data) {
          const index = testimonials.value.findIndex(t => (t.id || t._id) === testimonialId);
          if (index !== -1) {
            testimonials.value[index].image = response.data.data.imageUrl;
          }
          toast.success('Image uploaded successfully!');
        } else {
          toast.error('Failed to upload image');
        }
      } catch (error) {
        console.error('Failed to upload image:', error);
        toast.error('Failed to upload image. Please try again.');
      } finally {
        loading.value = false;
      }
    };

    const renderStars = (rating) => {
      return Array.from({ length: 5 }, (_, i) => (
        <StarIcon 
          key={i}
          style={{ 
            width: '1rem', 
            height: '1rem',
            color: i < rating ? '#ffc107' : '#e9ecef'
          }}
          fill={i < rating ? '#ffc107' : 'none'}
        />
      ));
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
                  <div class="card border-0 shadow-sm h-100">
                    <div class="card-body p-4">
                      <div class="d-flex align-items-start mb-3">
                        <div class="position-relative me-3">
                          <img 
                            src={testimonial.image && testimonial.image.trim() ? testimonial.image : 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZGVlMmU2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNmM3NTdkIiBmb250LXNpemU9IjEyIj5ObyBJbWFnZTwvdGV4dD4KPHN2Zz4='} 
                            alt={testimonial.name}
                            class="rounded-circle"
                            style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                            onError={(e) => {
                              e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjYwIiBoZWlnaHQ9IjYwIiBmaWxsPSIjZGVlMmU2Ii8+Cjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBkb21pbmFudC1iYXNlbGluZT0ibWlkZGxlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjNmM3NTdkIiBmb250LXNpemU9IjEyIj5ObyBJbWFnZTwvdGV4dD4KPHN2Zz4=';
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
                            class="position-absolute bottom-0 end-0 btn btn-sm btn-primary rounded-circle p-1"
                            style={{ width: '24px', height: '24px', fontSize: '10px' }}
                          >
                            📷
                          </label>
                        </div>
                        <div class="flex-grow-1">
                          <h5 class="mb-1">{testimonial.name}</h5>
                          <div class="d-flex align-items-center mb-2">
                            {renderStars(testimonial.rating)}
                            <span class="ms-2 text-muted">({testimonial.rating}/5)</span>
                          </div>
                        </div>
                        <div class="dropdown position-relative">
                          <button 
                            class="btn btn-sm btn-outline-secondary dropdown-toggle" 
                            type="button" 
                            onClick={() => toggleDropdown(testimonial.id || testimonial._id)}
                          >
                            Actions
                          </button>
                          {showDropdown.value[testimonial.id || testimonial._id] && (
                            <ul class="dropdown-menu show position-absolute" style={{ top: '100%', left: '0', zIndex: 1000 }}>
                              <li>
                                <button 
                                  class="dropdown-item" 
                                  onClick={() => {
                                    editTestimonial(testimonial);
                                    toggleDropdown(testimonial.id || testimonial._id);
                                  }}
                                >
                                  <PencilIcon style={{ width: '1rem', height: '1rem' }} class="me-2" />
                                  Edit
                                </button>
                              </li>
                              <li>
                                <button 
                                  class="dropdown-item text-danger" 
                                  onClick={() => {
                                    deleteTestimonial(testimonial.id || testimonial._id);
                                    toggleDropdown(testimonial.id || testimonial._id);
                                  }}
                                >
                                  <TrashIcon style={{ width: '1rem', height: '1rem' }} class="me-2" />
                                  Delete
                                </button>
                              </li>
                            </ul>
                          )}
                        </div>
                      </div>
                      <blockquote class="mb-3">
                        <p class="mb-0">"{testimonial.message}"</p>
                      </blockquote>
                      <small class="text-muted">
                        Added on {new Date(testimonial.date || testimonial.createdAt).toLocaleDateString()}
                      </small>
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
                      <button class="btn-close" onClick={() => showEditModal.value = false}></button>
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