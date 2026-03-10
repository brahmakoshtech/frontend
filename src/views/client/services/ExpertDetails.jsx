import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
  ArrowLeftIcon,
  UserIcon,
  CurrencyRupeeIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  VideoCameraIcon,
  PhotoIcon,
  CreditCardIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon
} from '@heroicons/vue/24/outline';
import { StarIcon } from '@heroicons/vue/24/solid';
import { useToast } from 'vue-toastification';
import expertService from '../../../services/expertService.js';
import reviewService from '../../../services/reviewService.js';
import testimonialService from '../../../services/testimonialService.js';

export default {
  name: 'ExpertDetails',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const toast = useToast();
    const loading = ref(false);
    const expert = ref(null);
    const expertId = route.params.id;
    const activeTab = ref('profile');
    const showAddReviewModal = ref(false);
    const showEditReviewModal = ref(false);
    const showViewReviewModal = ref(false);
    const showDropdown = ref({});
    const editingReview = ref(null);
    const viewingReview = ref(null);
    const editImageUploaded = ref(false);
    const editImageFileName = ref('');
    const reviews = ref([]);
    const newReview = ref({
      userName: '',
      userImage: null,
      description: '',
      rating: 5
    });
    const newImageUploaded = ref(false);
    const newImageFileName = ref('');

    const renderStars = (rating) => {
      const stars = [];
      const fullStars = Math.floor(rating);
      const hasHalfStar = rating % 1 !== 0;
      
      // Full stars
      for (let i = 0; i < fullStars; i++) {
        stars.push(
          <StarIcon 
            key={`full-${i}`}
            style={{ width: '1rem', height: '1rem', color: '#ffc107' }}
          />
        );
      }
      
      // Half star
      if (hasHalfStar) {
        stars.push(
          <div key="half" style={{ position: 'relative', display: 'inline-block', width: '1rem', height: '1rem' }}>
            <StarIcon style={{ width: '1rem', height: '1rem', color: '#e9ecef', position: 'absolute' }} />
            <StarIcon 
              style={{ 
                width: '1rem', 
                height: '1rem', 
                color: '#ffc107', 
                position: 'absolute',
                clipPath: 'inset(0 50% 0 0)'
              }} 
            />
          </div>
        );
      }
      
      // Empty stars
      const emptyStars = 5 - Math.ceil(rating);
      for (let i = 0; i < emptyStars; i++) {
        stars.push(
          <StarIcon 
            key={`empty-${i}`}
            style={{ width: '1rem', height: '1rem', color: '#e9ecef' }}
          />
        );
      }
      
      return stars;
    };

    const toggleDropdown = (reviewId) => {
      showDropdown.value = {
        ...showDropdown.value,
        [reviewId]: !showDropdown.value[reviewId]
      };
    };

    const fetchReviews = async () => {
      try {
        console.log('=== FETCH REVIEWS DEBUG ===');
        console.log('Expert ID from route:', expertId);
        console.log('Route params:', route.params);
        
        if (!expertId) {
          console.error('Expert ID is missing!');
          reviews.value = [];
          return;
        }
        
        // Check if we have authentication token
        const token = localStorage.getItem('token_client') || localStorage.getItem('token_user');
        if (!token) {
          console.warn('No authentication token found');
          reviews.value = [];
          return;
        }

        const response = await reviewService.getExpertReviews(expertId);
        if (response.success && response.data) {
          let reviewsList = Array.isArray(response.data.data) ? response.data.data : [];
          
          // Process reviews and get presigned URLs for S3 images
          reviewsList = await Promise.all(reviewsList.map(async (review) => {
            let imageUrl = review.signedImageUrl || review.userImage || null;
            
            // If it's an S3 URL, try to get presigned URL
            if (imageUrl && (imageUrl.includes('s3.amazonaws.com') || imageUrl.includes('amazonaws.com'))) {
              try {
                console.log('Getting presigned URL for:', imageUrl);
                const presignedUrl = await testimonialService.getPresignedImageUrl(imageUrl);
                console.log('Presigned URL received:', presignedUrl);
                if (presignedUrl) {
                  imageUrl = presignedUrl;
                }
              } catch (error) {
                console.error('Error getting presigned URL for review:', review._id, error);
                // Keep original URL if presigned fails
              }
            }
            
            return {
              ...review,
              id: review.id || review._id,
              userImage: imageUrl
            };
          }));
          
          reviews.value = reviewsList;
          console.log('Reviews loaded:', reviewsList.map(r => ({ id: r.id || r._id, rating: r.rating, userName: r.userName })));
        } else {
          console.error('Backend reviews not available:', response.error);
          console.log('Response structure:', response);
          reviews.value = [];
        }
      } catch (error) {
        console.error('API error:', error);
        reviews.value = [];
      }
    };

    // Mock reviews data - fallback until backend is ready
    const mockReviews = [
      {
        _id: '1',
        userName: 'Rajesh Kumar',
        rating: 5,
        description: 'Excellent guidance and very accurate predictions. Highly recommended!',
        createdAt: '2024-01-15',
        consultationType: 'Chat',
        isActive: true
      },
      {
        _id: '2',
        userName: 'Priya Sharma',
        rating: 4,
        description: 'Good consultation, helped me understand my problems better.',
        createdAt: '2024-01-10',
        consultationType: 'Voice',
        isActive: true
      },
      {
        _id: '3',
        userName: 'Amit Singh',
        rating: 5,
        description: 'Amazing experience! Very knowledgeable and patient.',
        createdAt: '2024-01-08',
        consultationType: 'Video',
        isActive: true
      }
    ];

    const loadExpertDetails = async () => {
      try {
        loading.value = true;
        const response = await expertService.getExpertById(expertId);
        if (response.success) {
          expert.value = response.data;
          
          // Update expert review count after loading reviews
          await fetchReviews();
          if (expert.value && reviews.value.length > 0) {
            expert.value.reviews = reviews.value.length;
            // Calculate average rating from reviews
            const totalRating = reviews.value.reduce((sum, review) => sum + (review.rating || 0), 0);
            expert.value.rating = (totalRating / reviews.value.length).toFixed(1);
          }
        } else {
          toast.error('Failed to load expert details');
          router.push('/client/experts');
        }
      } catch (error) {
        console.error('Load expert details error:', error);
        toast.error('Failed to load expert details');
        router.push('/client/experts');
      } finally {
        loading.value = false;
      }
    };

    const goBack = () => {
      router.push('/client/experts');
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



    const addReview = async () => {
      try {
        loading.value = true;
        toast.info('Adding review...');
        
        console.log('=== ADD REVIEW DEBUG ===');
        console.log('Expert ID:', expertId);
        console.log('New Review Data:', newReview.value);
        
        const { userImage, ...reviewData } = newReview.value;
        const response = await reviewService.createReview(expertId, reviewData);
        console.log('Create review response:', response);
        
        if (response.success && response.data) {
          let createdReview = response.data.data || response.data; // Handle nested response
          const reviewId = createdReview._id || createdReview.id;
          
          if (userImage && reviewId) {
            try {
              toast.info('Uploading image...');
              const imageResponse = await reviewService.uploadReviewImage(reviewId, userImage);
              if (imageResponse.success && imageResponse.data) {
                createdReview.userImage = imageResponse.data.imageUrl;
              } else {
                console.error('Image upload failed:', imageResponse.error);
              }
            } catch (imageError) {
              console.error('Image upload error:', imageError);
              toast.error('⚠️ Review created but image upload failed');
            }
          } else if (userImage && !reviewId) {
            console.error('Cannot upload image: Review ID is missing from response');
            console.error('Response structure:', JSON.stringify(response, null, 2));
            toast.error('⚠️ Review created but image upload failed - no review ID');
          }
          
          newReview.value = { userName: '', userImage: null, description: '', rating: 5 };
          newImageUploaded.value = false;
          newImageFileName.value = '';
          showAddReviewModal.value = false;
          
          toast.success('✓ Review added successfully!');
          await fetchReviews();
        } else {
          console.error('Create review failed:', response);
          toast.error('❌ ' + (response.error || 'Failed to create review'));
        }
      } catch (error) {
        console.error('Add review error:', error);
        toast.error('❌ Failed to add review. Please try again.');
      } finally {
        loading.value = false;
      }
    };

    const editReview = (review) => {
      editingReview.value = { ...review };
      showEditReviewModal.value = true;
    };

    const viewReview = (review) => {
      viewingReview.value = { ...review };
      showViewReviewModal.value = true;
    };

    const updateReview = async () => {
      try {
        loading.value = true;
        toast.info('Updating review...');
        const { userImage, ...reviewData } = editingReview.value;
        
        const reviewId = editingReview.value.id || editingReview.value._id;
        const response = await reviewService.updateReview(reviewId, reviewData);
        
        if (response.success) {
          let updatedReview = response.data;
          const updatedReviewId = updatedReview._id || updatedReview.id || reviewId;
          
          if (userImage && typeof userImage !== 'string' && updatedReviewId) {
            try {
              const imageResponse = await reviewService.uploadReviewImage(updatedReviewId, userImage);
              if (imageResponse.success && imageResponse.data) {
                updatedReview.userImage = imageResponse.data.imageUrl;
              }
            } catch (imageError) {
              console.error('Image upload error:', imageError);
              toast.error('⚠️ Review updated but image upload failed');
            }
          } else if (userImage && typeof userImage !== 'string' && !updatedReviewId) {
            console.error('Cannot upload image: Review ID is missing');
            toast.error('⚠️ Review updated but image upload failed - no review ID');
          }
          
          showEditReviewModal.value = false;
          editingReview.value = null;
          editImageUploaded.value = false;
          editImageFileName.value = '';
          toast.success('✓ Review updated successfully!');
          await fetchReviews();
        }
      } catch (error) {
        console.error('Update review error:', error);
        toast.error('❌ Failed to update review. Please try again.');
      } finally {
        loading.value = false;
      }
    };

    const deleteReview = async (id) => {
      const confirmed = confirm('Are you sure you want to delete this review?');
      if (!confirmed) return;
      
      try {
        loading.value = true;
        const response = await reviewService.deleteReview(id);
        
        if (response.success) {
          reviews.value = reviews.value.filter(r => (r.id || r._id) !== id);
          toast.success('✓ Review deleted successfully!');
        } else {
          toast.error('❌ ' + (response.error || 'Failed to delete review'));
        }
      } catch (error) {
        toast.error('❌ Failed to delete review. Please try again.');
      } finally {
        loading.value = false;
      }
    };

    const toggleReviewStatus = async (review) => {
      try {
        const response = await reviewService.toggleReviewStatus(review.id || review._id);
        if (response.success) {
          const index = reviews.value.findIndex(r => (r.id || r._id) === (review.id || review._id));
          if (index !== -1) {
            reviews.value[index] = {
              ...reviews.value[index],
              isActive: response.data.isActive
            };
          }
          showDropdown.value = {};
          toast.success(`✓ Review ${response.data.isActive ? 'enabled' : 'disabled'} successfully!`);
        } else {
          toast.error('❌ ' + (response.error || 'Failed to toggle review status'));
        }
      } catch (error) {
        toast.error('❌ Failed to toggle review status. Please try again.');
      }
    };

    const handleImageUpload = async (event, reviewId) => {
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
        const response = await reviewService.uploadReviewImage(reviewId, file);
        
        if (response.success && response.data && response.data.imageUrl) {
          let imageUrl = response.data.imageUrl;
          
          // Get presigned URL for S3 images
          try {
            const presignedUrl = await testimonialService.getPresignedImageUrl(imageUrl);
            imageUrl = presignedUrl || imageUrl;
          } catch (error) {
            // console.warn('Failed to get presigned URL, using original:', error);
          }
          
          const index = reviews.value.findIndex(r => (r.id || r._id) === reviewId);
          if (index !== -1) {
            // Force Vue reactivity by creating a new array
            reviews.value = reviews.value.map((r, i) => 
              i === index ? { ...r, userImage: imageUrl } : r
            );
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

    const handleReviewImageUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          toast.error('Only image files allowed');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image must be under 5MB');
          return;
        }
        newReview.value.userImage = file;
        newImageUploaded.value = true;
        newImageFileName.value = file.name;
      }
    };

    const handleEditImageUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        if (!file.type.startsWith('image/')) {
          toast.error('Only image files allowed');
          return;
        }
        if (file.size > 5 * 1024 * 1024) {
          toast.error('Image must be under 5MB');
          return;
        }
        editingReview.value.userImage = file;
        editImageUploaded.value = true;
        editImageFileName.value = file.name;
      }
    };

    onMounted(() => {
      loadExpertDetails();
      // fetchReviews(); // Remove this as it's now called from loadExpertDetails
    });

    return () => (
      <div class="container-fluid px-2 px-sm-3 px-lg-4">
        <div class="row">
          <div class="col-12">
            {loading.value ? (
              <div class="text-center py-5">
                <div class="spinner-border text-primary" role="status">
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-muted">Loading expert details...</p>
              </div>
            ) : expert.value ? (
              <>
                {/* Header */}
                <div class="bg-primary rounded-3 p-3 p-md-4 mb-3 mb-md-4 text-white shadow">
                  <div class="d-flex flex-column flex-sm-row align-items-start align-items-sm-center gap-2 gap-sm-3">
                    <button 
                      class="btn btn-light btn-sm rounded-pill px-3" 
                      onClick={goBack}
                    >
                      <ArrowLeftIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                      Back
                    </button>
                    <div>
                      <h1 class="mb-1 fw-bold fs-3 fs-md-2">Expert Details</h1>
                      <p class="mb-0 opacity-75 small">Complete profile information</p>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div class="row g-4">
                  {/* Left Sidebar - Expert Profile */}
                  <div class="col-12 col-lg-4">
                    <div class="card border-0 shadow-sm position-lg-sticky" style={{ top: '20px' }}>
                      <div class="card-body text-center p-3 p-md-4">
                        <div class="mb-4 position-relative">
                          {/* Background Banner */}
                          {expert.value.backgroundBanner && (
                            <div 
                              class="position-absolute w-100 rounded-3"
                              style={{ 
                                height: '150px',
                                backgroundImage: `url(${expert.value.backgroundBanner})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                filter: 'brightness(0.7)',
                                zIndex: 1,
                                top: '-20px'
                              }}
                            ></div>
                          )}
                          
                          {/* Profile Photo */}
                          <div 
                            class="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3 overflow-hidden shadow position-relative"
                            style={{ width: '120px', height: '120px', zIndex: 2, marginTop: '40px' }}
                          >
                            {expert.value.profilePhoto ? (
                              <img 
                                src={expert.value.profilePhoto} 
                                alt={expert.value.name}
                                class="w-100 h-100"
                                style={{ objectFit: 'cover' }}
                              />
                            ) : (
                              <UserIcon style={{ width: '3rem', height: '3rem', color: '#6c757d' }} />
                            )}
                          </div>
                          <h3 class="fw-bold mb-2">{expert.value.name}</h3>
                          <div class="d-flex align-items-center justify-content-center gap-2 mb-3">
                            <StarIcon style={{ width: '1.25rem', height: '1.25rem', color: '#ffc107' }} />
                            <span class="fw-semibold">{expert.value.rating || 'N/A'}</span>
                            <span class="text-muted">({expert.value.reviews || 0} reviews)</span>
                          </div>
                          <span 
                            class={`badge rounded-pill px-3 py-2 ${getStatusBadge(expert.value.status).class}`}
                          >
                            {getStatusBadge(expert.value.status).text}
                          </span>
                        </div>

                        <div class="row g-2 text-center">
                          <div class="col-4">
                            <div class="bg-light rounded p-2">
                              <div class="fw-bold text-primary small">{expert.value.experience}</div>
                              <small class="text-muted">Exp.</small>
                            </div>
                          </div>
                          <div class="col-4">
                            <div class="bg-light rounded p-2">
                              <div class="fw-bold text-success small">₹{expert.value.chatCharge}</div>
                              <small class="text-muted">Chat</small>
                            </div>
                          </div>
                          <div class="col-4">
                            <div class="bg-light rounded p-2">
                              <div class="fw-bold text-info small">₹{expert.value.videoCharge}</div>
                              <small class="text-muted">Video</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Content Area */}
                  <div class="col-12 col-lg-8">
                    {/* Tab Navigation */}
                    <div class="card border-0 shadow-sm mb-3 mb-md-4">
                      <div class="card-body p-0">
                        <ul class="nav nav-tabs border-0 flex-nowrap overflow-auto">
                          <li class="nav-item">
                            <button 
                              class={`nav-link px-3 px-md-4 py-2 py-md-3 border-0 fw-semibold ${activeTab.value === 'profile' ? 'active text-primary bg-light' : 'text-muted'}`}
                              onClick={() => activeTab.value = 'profile'}
                            >
                              Profile
                            </button>
                          </li>
                          <li class="nav-item">
                            <button 
                              class={`nav-link px-3 px-md-4 py-2 py-md-3 border-0 fw-semibold ${activeTab.value === 'reviews' ? 'active text-primary bg-light' : 'text-muted'}`}
                              onClick={() => activeTab.value = 'reviews'}
                            >
                              Reviews ({reviews.value.length})
                            </button>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Tab Content */}
                    <div class="tab-content">
                      {activeTab.value === 'profile' && (
                        <div class="tab-pane fade show active">
                          <div class="row g-4">
                            {/* Basic Information */}
                            <div class="col-12">
                              <div class="card border-0 shadow-sm">
                                <div class="card-header bg-light border-0">
                                  <h5 class="fw-bold mb-0 text-primary">Basic Information</h5>
                                </div>
                                <div class="card-body">
                                  <div class="row g-3">
                                    <div class="col-12 col-md-6">
                                      <label class="form-label fw-semibold text-muted small">Full Name</label>
                                      <p class="mb-0 fw-medium">{expert.value.name}</p>
                                    </div>
                                    <div class="col-12 col-md-6">
                                      <label class="form-label fw-semibold text-muted small">Experience</label>
                                      <p class="mb-0 fw-medium">{expert.value.experience}</p>
                                    </div>
                                    <div class="col-12">
                                      <label class="form-label fw-semibold text-muted small">Expertise</label>
                                      <p class="mb-0">{expert.value.expertise}</p>
                                    </div>
                                    <div class="col-12">
                                      <label class="form-label fw-semibold text-muted small">Languages</label>
                                      <div class="d-flex flex-wrap gap-2">
                                        {expert.value.languages ? (
                                          expert.value.languages.map((lang, index) => (
                                            <span key={index} class="badge bg-primary rounded-pill">{lang}</span>
                                          ))
                                        ) : (
                                          <span class="badge bg-primary rounded-pill">Hindi</span>
                                        )}
                                        {expert.value.customLanguage && (
                                          <span class="badge bg-secondary rounded-pill">{expert.value.customLanguage}</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Profile Summary */}
                            <div class="col-12">
                              <div class="card border-0 shadow-sm">
                                <div class="card-header bg-light border-0">
                                  <h5 class="fw-bold mb-0 text-primary">Profile Summary</h5>
                                </div>
                                <div class="card-body">
                                  <p class="mb-0 lh-lg text-muted">{expert.value.profileSummary || 'No summary available'}</p>
                                </div>
                              </div>
                            </div>

                            {/* Pricing Plans */}
                            <div class="col-12">
                              <div class="card border-0 shadow-sm">
                                <div class="card-header bg-light border-0">
                                  <h5 class="fw-bold mb-0 text-primary d-flex align-items-center gap-2">
                                    <CreditCardIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                                    Pricing Plans
                                  </h5>
                                </div>
                                <div class="card-body">
                                  <div class="row g-2 g-md-3">
                                    <div class="col-12 col-md-4">
                                      <div class="card border-0 bg-primary text-white text-center p-2 p-md-3 h-100">
                                        <ChatBubbleLeftRightIcon style={{ width: '2rem', height: '2rem' }} class="mb-2" />
                                        <h4 class="fw-bold mb-1">₹{expert.value.chatCharge || 0}</h4>
                                        <small class="opacity-75">per minute</small>
                                        <div class="mt-2">
                                          <small class="fw-semibold">Chat</small>
                                        </div>
                                      </div>
                                    </div>
                                    <div class="col-12 col-md-4">
                                      <div class="card border-0 bg-success text-white text-center p-2 p-md-3 h-100">
                                        <PhoneIcon style={{ width: '2rem', height: '2rem' }} class="mb-2" />
                                        <h4 class="fw-bold mb-1">₹{expert.value.voiceCharge || 0}</h4>
                                        <small class="opacity-75">per minute</small>
                                        <div class="mt-2">
                                          <small class="fw-semibold">Voice</small>
                                        </div>
                                      </div>
                                    </div>
                                    <div class="col-12 col-md-4">
                                      <div class="card border-0 bg-info text-white text-center p-2 p-md-3 h-100">
                                        <VideoCameraIcon style={{ width: '2rem', height: '2rem' }} class="mb-2" />
                                        <h4 class="fw-bold mb-1">₹{expert.value.videoCharge || 0}</h4>
                                        <small class="opacity-75">per minute</small>
                                        <div class="mt-2">
                                          <small class="fw-semibold">Video</small>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>


                          </div>
                        </div>
                      )}

                      {activeTab.value === 'reviews' && (
                        <div class="tab-pane fade show active">
                          <div class="card border-0 shadow-sm">
                            <div class="card-header bg-white border-bottom p-3">
                              <div class="d-flex flex-column flex-sm-row justify-content-between align-items-start align-items-sm-center gap-2 gap-sm-0">
                                <div>
                                  <h5 class="fw-bold mb-1 text-dark">User Reviews</h5>
                                  <div class="d-flex align-items-center gap-2 flex-wrap">
                                    <div class="d-flex align-items-center">
                                      {renderStars(Math.floor(expert.value?.rating || 4.5))}
                                    </div>
                                    <span class="fw-semibold">{expert.value?.rating || '4.5'}</span>
                                    <span class="text-muted">({reviews.value.length} reviews)</span>
                                  </div>
                                </div>
                                <button 
                                  class="btn btn-primary btn-sm px-3 w-100 w-sm-auto"
                                  onClick={() => showAddReviewModal.value = true}
                                >
                                  <PlusIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                                  Add Review
                                </button>
                              </div>
                            </div>
                            <div class="card-body p-2 p-md-3">
                              {reviews.value.length > 0 ? (
                                <div class="row g-3 g-md-4">
                                  {reviews.value.map(review => (
                                    <div key={review.id || review._id} class="col-12">
                                      <div class={`card border-0 shadow-sm h-100 position-relative overflow-hidden ${!review.isActive ? 'opacity-75' : ''}`} style={{ transition: 'all 0.3s ease' }}>
                                        {!review.isActive && (
                                          <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.1)', zIndex: 1, pointerEvents: 'none' }}>
                                            <span class="badge bg-secondary px-3 py-2 rounded-pill shadow">🔒 Disabled</span>
                                          </div>
                                        )}
                                        
                                        <div class="card-body p-3 p-md-4">
                                          <div class="d-flex flex-column flex-sm-row gap-3">
                                            <div class="position-relative">
                                              <img 
                                                src={review.userImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName)}&background=007bff&color=fff&size=64`}
                                                alt={review.userName}
                                                class="rounded-circle border border-3 border-white shadow-sm"
                                                style={{ width: '64px', height: '64px', objectFit: 'cover' }}
                                                onError={(e) => {
                                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(review.userName)}&background=007bff&color=fff&size=64`;
                                                }}
                                              />
                                              <div class="position-absolute bottom-0 end-0">
                                                <span class={`badge rounded-pill px-2 py-1 ${review.isActive ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '0.7rem' }}>
                                                  {review.isActive ? '✓ Active' : '✗ Disabled'}
                                                </span>
                                              </div>
                                            </div>
                                            
                                            <div class="flex-grow-1">
                                              <div class="d-flex justify-content-between align-items-start mb-2">
                                                <div>
                                                  <h5 class="fw-bold mb-1 text-dark">{review.userName}</h5>
                                                  <div class="d-flex align-items-center gap-2 mb-2">
                                                    <div class="d-flex align-items-center">
                                                      {renderStars(review.rating || 0)}
                                                    </div>
                                                    <span class="badge bg-warning-subtle text-warning px-2 py-1 rounded-pill fw-semibold">
                                                      ⭐ {review.rating || 0}/5
                                                    </span>
                                                    <span class="badge bg-light text-dark border small d-flex align-items-center gap-1">
                                                      {review.consultationType === 'Chat' && (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="text-primary">
                                                          <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                                                        </svg>
                                                      )}
                                                      {review.consultationType === 'Voice' && (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="text-success">
                                                          <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
                                                        </svg>
                                                      )}
                                                      {review.consultationType === 'Video' && (
                                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="text-info">
                                                          <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
                                                        </svg>
                                                      )}
                                                      {review.consultationType || 'Chat'}
                                                    </span>
                                                  </div>
                                                </div>
                                                
                                                <div class="dropdown">
                                                  <button 
                                                    class="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center shadow-sm" 
                                                    type="button" 
                                                    onClick={(e) => {
                                                      e.stopPropagation();
                                                      toggleDropdown(review.id || review._id);
                                                    }}
                                                    style={{ width: '36px', height: '36px', fontSize: '16px', fontWeight: 'bold' }}
                                                    title="More options"
                                                  >
                                                    ⋮
                                                  </button>
                                                  {showDropdown.value[review.id || review._id] && (
                                                    <ul class="dropdown-menu show position-absolute shadow border-0 rounded-2" style={{ top: '100%', right: '0', zIndex: 1000, minWidth: '120px', fontSize: '0.8rem' }}>
                                                      {review.isActive && (
                                                        <>
                                                          <li>
                                                            <button 
                                                              class="dropdown-item d-flex align-items-center py-1 px-2 rounded-1" 
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                viewReview(review);
                                                                toggleDropdown(review.id || review._id);
                                                              }}
                                                            >
                                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="me-1 text-info">
                                                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                                                              </svg>
                                                              View
                                                            </button>
                                                          </li>
                                                          <li>
                                                            <button 
                                                              class="dropdown-item d-flex align-items-center py-1 px-2 rounded-1" 
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                editReview(review);
                                                                toggleDropdown(review.id || review._id);
                                                              }}
                                                            >
                                                              <PencilIcon style={{ width: '12px', height: '12px' }} class="me-1 text-primary" />
                                                              Edit
                                                            </button>
                                                          </li>
                                                        </>
                                                      )}
                                                      <li>
                                                        <button 
                                                          class="dropdown-item d-flex align-items-center py-1 px-2 rounded-1" 
                                                          onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleReviewStatus(review);
                                                            toggleDropdown(review.id || review._id);
                                                          }}
                                                        >
                                                          <span class="me-1" style={{ fontSize: '0.7rem' }}>{review.isActive ? '🔴' : '🟢'}</span>
                                                          {review.isActive ? 'Disable' : 'Enable'}
                                                        </button>
                                                      </li>
                                                      {review.isActive && (
                                                        <>
                                                          <div class="dropdown-divider"></div>
                                                          <li>
                                                            <button 
                                                              class="dropdown-item d-flex align-items-center py-1 px-2 text-danger rounded-1" 
                                                              onClick={(e) => {
                                                                e.stopPropagation();
                                                                deleteReview(review.id || review._id);
                                                                toggleDropdown(review.id || review._id);
                                                              }}
                                                            >
                                                              <TrashIcon style={{ width: '12px', height: '12px' }} class="me-1" />
                                                              Delete
                                                            </button>
                                                          </li>
                                                        </>
                                                      )}
                                                    </ul>
                                                  )}
                                                </div>
                                              </div>
                                              
                                              <div class="review-content mb-3">
                                                <blockquote class="mb-0 position-relative">
                                                  <div class="quote-content p-3 rounded-3" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                                                    <p class="mb-0 fst-italic text-dark lh-base" style={{ fontSize: '0.95rem' }}>
                                                      "{review.description || review.comment}"
                                                    </p>
                                                  </div>
                                                </blockquote>
                                              </div>
                                              
                                              <div class="d-flex align-items-center justify-content-between pt-2 border-top border-light">
                                                <small class="text-muted d-flex align-items-center">
                                                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="me-1">
                                                    <path d="M9 11H7v6h2v-6zm4 0h-2v6h2v-6zm4 0h-2v6h2v-6zm2-7h-3V2h-2v2H8V2H6v2H3c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H3V8h14v12z"/>
                                                  </svg>
                                                  {new Date(review.createdAt || review.date).toLocaleDateString('en-US', { 
                                                    year: 'numeric', 
                                                    month: 'short', 
                                                    day: 'numeric' 
                                                  })}
                                                </small>
                                                <div class="d-flex align-items-center gap-2">
                                                  <span class="badge bg-success-subtle text-success px-3 py-2 rounded-pill fw-semibold">
                                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" class="me-1">
                                                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                                    </svg>
                                                    Verified
                                                  </span>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div class="text-center py-5">
                                  <div class="mb-4 p-4 rounded-circle bg-light d-inline-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                                    <StarIcon style={{ width: '4rem', height: '4rem', color: '#6c757d' }} />
                                  </div>
                                  <h4 class="text-muted mb-3">🌟 No Reviews Yet</h4>
                                  <p class="text-muted mb-4">Be the first to share your experience with this expert.</p>
                                  <button 
                                    class="btn btn-primary btn-lg rounded-pill px-4 shadow-sm"
                                    onClick={() => showAddReviewModal.value = true}
                                    style={{ fontWeight: '600' }}
                                  >
                                    <PlusIcon style={{ width: '1.2rem', height: '1.2rem' }} class="me-2" />
                                    Write First Review
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div class="text-center py-5">
                <UserIcon style={{ width: '4rem', height: '4rem', color: '#dee2e6' }} class="mb-3" />
                <h5 class="text-muted mb-2">Expert not found</h5>
                <p class="text-muted mb-3">The expert you're looking for doesn't exist or has been removed.</p>
                <button class="btn btn-primary rounded-pill px-4" onClick={goBack}>
                  <ArrowLeftIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                  Back to Management
                </button>
              </div>
            )}

            {/* Add Review Modal */}
            {showAddReviewModal.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                <div class="modal-dialog modal-dialog-centered">
                  <div class="modal-content shadow">
                    <div class="modal-header bg-primary text-white">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        <StarIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                        Add Review for {expert.value?.name}
                      </h5>
                      <button 
                        class="btn-close btn-close-white" 
                        onClick={() => {
                          showAddReviewModal.value = false;
                          newReview.value = { userName: '', userImage: null, description: '', rating: 5 };
                          newImageUploaded.value = false;
                          newImageFileName.value = '';
                        }}
                      ></button>
                    </div>
                    <div class="modal-body p-4">
                      <form>
                        <div class="mb-3">
                          <label class="form-label fw-semibold">User Name *</label>
                          <input 
                            type="text" 
                            class="form-control" 
                            v-model={newReview.value.userName}
                            placeholder="Enter user name"
                            required
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold">Rating *</label>
                          <select class="form-select" v-model={newReview.value.rating}>
                            <option value={5}>⭐⭐⭐⭐⭐ 5 Stars - Excellent</option>
                            <option value={4}>⭐⭐⭐⭐ 4 Stars - Very Good</option>
                            <option value={3}>⭐⭐⭐ 3 Stars - Good</option>
                            <option value={2}>⭐⭐ 2 Stars - Fair</option>
                            <option value={1}>⭐ 1 Star - Poor</option>
                          </select>
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold">Review Description *</label>
                          <textarea 
                            class="form-control" 
                            rows="4"
                            v-model={newReview.value.description}
                            placeholder="Share your experience with this expert..."
                            required
                          ></textarea>
                          <small class="form-text text-muted">Describe your consultation experience and satisfaction.</small>
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold">User Profile Image (Optional)</label>
                          <input 
                            type="file" 
                            class="form-control" 
                            accept="image/*"
                            onChange={handleReviewImageUpload}
                          />
                          {newImageUploaded.value && (
                            <div class="mt-2 p-2 bg-success bg-opacity-10 rounded">
                              <small class="text-success d-flex align-items-center gap-1">
                                <span>✓</span>
                                Image uploaded: {newImageFileName.value}
                              </small>
                            </div>
                          )}
                          <small class="form-text text-muted">Max 5MB - JPG, PNG, GIF</small>
                        </div>
                      </form>
                    </div>
                    <div class="modal-footer bg-light">
                      <button 
                        class="btn btn-outline-secondary" 
                        onClick={() => {
                          showAddReviewModal.value = false;
                          newReview.value = { userName: '', userImage: null, description: '', rating: 5 };
                          newImageUploaded.value = false;
                          newImageFileName.value = '';
                        }}
                        disabled={loading.value}
                      >
                        Cancel
                      </button>
                      <button 
                        class="btn btn-primary" 
                        onClick={addReview}
                        disabled={loading.value || !newReview.value.userName || !newReview.value.description}
                      >
                        {loading.value ? (
                          <>
                            <span class="spinner-border spinner-border-sm me-2"></span>
                            Adding...
                          </>
                        ) : (
                          <>
                            <StarIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                            Add Review
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View Review Modal */}
            {showViewReviewModal.value && viewingReview.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                <div class="modal-dialog modal-dialog-centered modal-lg">
                  <div class="modal-content shadow">
                    <div class="modal-header bg-info text-white">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-3-3-3-3z"/>
                        </svg>
                        Review Details
                      </h5>
                      <button 
                        class="btn-close btn-close-white" 
                        onClick={() => {
                          showViewReviewModal.value = false;
                          viewingReview.value = null;
                        }}
                      ></button>
                    </div>
                    <div class="modal-body p-0">
                      <div class="card border-0">
                        <div class="card-body p-4">
                          <div class="d-flex gap-4 mb-4">
                            <div class="position-relative">
                              <img 
                                src={viewingReview.value.userImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(viewingReview.value.userName)}&background=007bff&color=fff&size=80`}
                                alt={viewingReview.value.userName}
                                class="rounded-circle border border-3 border-white shadow-lg"
                                style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                                onError={(e) => {
                                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(viewingReview.value.userName)}&background=007bff&color=fff&size=80`;
                                }}
                              />
                              <div class="position-absolute bottom-0 end-0">
                                <span class={`badge rounded-pill px-2 py-1 ${viewingReview.value.isActive ? 'bg-success' : 'bg-secondary'}`}>
                                  {viewingReview.value.isActive ? '✓ Active' : '✗ Disabled'}
                                </span>
                              </div>
                            </div>
                            
                            <div class="flex-grow-1">
                              <h4 class="fw-bold mb-2 text-dark">{viewingReview.value.userName}</h4>
                              <div class="d-flex align-items-center gap-3 mb-3">
                                <div class="d-flex align-items-center">
                                  {renderStars(viewingReview.value.rating || 0)}
                                </div>
                                <span class="badge bg-warning-subtle text-warning px-3 py-2 rounded-pill fw-bold fs-6">
                                  ⭐ {viewingReview.value.rating}/5
                                </span>
                                <span class="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill">
                                  {viewingReview.value.consultationType || 'Chat'}
                                </span>
                              </div>
                              
                              <div class="row g-3">
                                <div class="col-md-6">
                                  <small class="text-muted d-block">Review Date</small>
                                  <span class="fw-semibold">
                                    {new Date(viewingReview.value.createdAt || viewingReview.value.date).toLocaleDateString('en-US', { 
                                      weekday: 'long',
                                      year: 'numeric', 
                                      month: 'long', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                </div>
                                <div class="col-md-6">
                                  <small class="text-muted d-block">Last Updated</small>
                                  <span class="fw-semibold">
                                    {new Date(viewingReview.value.updatedAt || viewingReview.value.createdAt).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric' 
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <div class="mb-4">
                            <h6 class="fw-bold mb-3 text-dark d-flex align-items-center gap-2">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="text-primary">
                                <path d="M20 2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14l4 4V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
                              </svg>
                              Review Message
                            </h6>
                            <div class="p-4 rounded-3 bg-light border">
                              <blockquote class="mb-0">
                                <p class="mb-0 fst-italic text-dark lh-lg" style={{ fontSize: '1.1rem' }}>
                                  "{viewingReview.value.description || viewingReview.value.comment}"
                                </p>
                              </blockquote>
                            </div>
                          </div>
                          
                          <div class="d-flex align-items-center justify-content-between pt-3 border-top">
                            <div class="d-flex align-items-center gap-3">
                              <span class="badge bg-success-subtle text-success px-3 py-2 rounded-pill fw-semibold">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" class="me-1">
                                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                </svg>
                                Verified Review
                              </span>
                              <small class="text-muted">
                                Review ID: {viewingReview.value.id || viewingReview.value._id}
                              </small>
                            </div>
                            

                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="modal-footer bg-light">
                      <button 
                        class="btn btn-secondary" 
                        onClick={() => {
                          showViewReviewModal.value = false;
                          viewingReview.value = null;
                        }}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Review Modal */}
            {showEditReviewModal.value && editingReview.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                <div class="modal-dialog modal-dialog-centered">
                  <div class="modal-content shadow">
                    <div class="modal-header bg-primary text-white">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        <PencilIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                        Edit Review
                      </h5>
                      <button 
                        class="btn-close btn-close-white" 
                        onClick={() => {
                          showEditReviewModal.value = false;
                          editingReview.value = null;
                          editImageUploaded.value = false;
                          editImageFileName.value = '';
                        }}
                      ></button>
                    </div>
                    <div class="modal-body p-4">
                      <form>
                        <div class="mb-3">
                          <label class="form-label fw-semibold">User Name *</label>
                          <input 
                            type="text" 
                            class="form-control" 
                            v-model={editingReview.value.userName}
                            placeholder="Enter user name"
                            required
                          />
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold">Rating *</label>
                          <select class="form-select" v-model={editingReview.value.rating}>
                            <option value={5}>⭐⭐⭐⭐⭐ 5 Stars - Excellent</option>
                            <option value={4}>⭐⭐⭐⭐ 4 Stars - Very Good</option>
                            <option value={3}>⭐⭐⭐ 3 Stars - Good</option>
                            <option value={2}>⭐⭐ 2 Stars - Fair</option>
                            <option value={1}>⭐ 1 Star - Poor</option>
                          </select>
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold">Review Description *</label>
                          <textarea 
                            class="form-control" 
                            rows="4"
                            v-model={editingReview.value.description}
                            placeholder="Share your experience with this expert..."
                            required
                          ></textarea>
                          <small class="form-text text-muted">Describe your consultation experience and satisfaction.</small>
                        </div>
                        
                        <div class="mb-3">
                          <label class="form-label fw-semibold">User Profile Image (Optional)</label>
                          <input 
                            type="file" 
                            class="form-control" 
                            accept="image/*"
                            onChange={handleEditImageUpload}
                          />
                          {editImageUploaded.value && (
                            <div class="mt-2 p-2 bg-success bg-opacity-10 rounded">
                              <small class="text-success d-flex align-items-center gap-1">
                                <span>✓</span>
                                Image uploaded: {editImageFileName.value}
                              </small>
                            </div>
                          )}
                          <small class="form-text text-muted">Max 5MB - JPG, PNG, GIF</small>
                        </div>
                      </form>
                    </div>
                    <div class="modal-footer bg-light">
                      <button 
                        class="btn btn-outline-secondary" 
                        onClick={() => {
                          showEditReviewModal.value = false;
                          editingReview.value = null;
                          editImageUploaded.value = false;
                          editImageFileName.value = '';
                        }}
                        disabled={loading.value}
                      >
                        Cancel
                      </button>
                      <button 
                        class="btn btn-primary" 
                        onClick={updateReview}
                        disabled={loading.value || !editingReview.value.userName || !editingReview.value.description}
                      >
                        {loading.value ? (
                          <>
                            <span class="spinner-border spinner-border-sm me-2"></span>
                            Updating...
                          </>
                        ) : (
                          <>
                            <PencilIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                            Update Review
                          </>
                        )}
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