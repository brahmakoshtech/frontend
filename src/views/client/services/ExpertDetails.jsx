import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
  ArrowLeftIcon,
  UserIcon,
  StarIcon,
  CurrencyRupeeIcon,
  ChatBubbleLeftRightIcon,
  PhoneIcon,
  VideoCameraIcon,
  PhotoIcon,
  CreditCardIcon,
  MapPinIcon,
  CalendarIcon,
  ClockIcon
} from '@heroicons/vue/24/outline';
import { useToast } from 'vue-toastification';
import expertService from '../../../services/expertService.js';

export default {
  name: 'ExpertDetails',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const toast = useToast();
    const loading = ref(false);
    const expert = ref(null);
    const expertId = route.params.id;

    const loadExpertDetails = async () => {
      try {
        loading.value = true;
        const response = await expertService.getExpert(expertId);
        if (response.success) {
          expert.value = response.data;
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

    onMounted(() => {
      loadExpertDetails();
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
                <div class="bg-gradient-primary rounded-3 rounded-lg-4 p-3 p-md-4 mb-3 mb-md-4 text-white shadow-lg">
                  <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2 gap-md-3">
                    <button 
                      class="btn btn-light btn-sm rounded-pill px-3" 
                      onClick={goBack}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
                    >
                      <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
                      <span class="d-none d-sm-inline">Back to Management</span>
                      <span class="d-sm-none">Back</span>
                    </button>
                    <div class="flex-grow-1">
                      <h1 class="mb-1 fw-bold fs-3 fs-md-2 text-dark">Expert Details</h1>
                      <p class="mb-0 text-dark d-none d-sm-block" style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                        Complete profile information
                      </p>
                    </div>
                  </div>
                </div>

                {/* Expert Profile Card */}
                <div class="row g-4">
                  <div class="col-12 col-lg-4">
                    <div class="card border-0 shadow-sm h-100">
                      <div class="card-body text-center p-4">
                        {/* Profile Photo */}
                        <div class="mb-4">
                          <div 
                            class="rounded-circle bg-light d-inline-flex align-items-center justify-content-center mb-3 overflow-hidden shadow"
                            style={{ width: '120px', height: '120px' }}
                          >
                            {expert.value.profilePhoto ? (
                              <img 
                                src={expert.value.profilePhoto} 
                                alt={expert.value.name}
                                class="w-100 h-100 object-fit-cover"
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
                            class="badge rounded-pill px-3 py-2 fs-6"
                            style={{ 
                              backgroundColor: getStatusBadge(expert.value.status).color + '20',
                              color: getStatusBadge(expert.value.status).color
                            }}
                          >
                            {getStatusBadge(expert.value.status).text}
                          </span>
                        </div>

                        {/* Quick Stats */}
                        <div class="row g-2 text-center">
                          <div class="col-4">
                            <div class="bg-light rounded p-2">
                              <div class="fw-bold text-primary">{expert.value.experience}</div>
                              <small class="text-muted">Experience</small>
                            </div>
                          </div>
                          <div class="col-4">
                            <div class="bg-light rounded p-2">
                              <div class="fw-bold text-success">₹{expert.value.chatCharge}</div>
                              <small class="text-muted">Chat/min</small>
                            </div>
                          </div>
                          <div class="col-4">
                            <div class="bg-light rounded p-2">
                              <div class="fw-bold text-info">₹{expert.value.videoCharge}</div>
                              <small class="text-muted">Video/min</small>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="col-12 col-lg-8">
                    <div class="row g-4">
                      {/* Basic Information */}
                      <div class="col-12">
                        <div class="card border-0 shadow-sm">
                          <div class="card-header bg-transparent border-0 pb-0">
                            <h5 class="fw-bold mb-0">Basic Information</h5>
                          </div>
                          <div class="card-body pt-3">
                            <div class="row g-3">
                              <div class="col-12 col-md-6">
                                <label class="form-label fw-semibold text-muted small">Full Name</label>
                                <p class="mb-0">{expert.value.name}</p>
                              </div>
                              <div class="col-12 col-md-6">
                                <label class="form-label fw-semibold text-muted small">Experience</label>
                                <p class="mb-0">{expert.value.experience}</p>
                              </div>
                              <div class="col-12">
                                <label class="form-label fw-semibold text-muted small">Expertise</label>
                                <p class="mb-0">{expert.value.expertise}</p>
                              </div>
                              <div class="col-12">
                                <label class="form-label fw-semibold text-muted small">Languages</label>
                                <div>
                                  {expert.value.languages ? (
                                    expert.value.languages.map((lang, index) => (
                                      <span key={index} class="badge bg-primary me-2 mb-1">{lang}</span>
                                    ))
                                  ) : (
                                    <span class="badge bg-primary me-2 mb-1">Hindi</span>
                                  )}
                                  {expert.value.customLanguage && (
                                    <span class="badge bg-secondary me-2 mb-1">{expert.value.customLanguage}</span>
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
                          <div class="card-header bg-transparent border-0 pb-0">
                            <h5 class="fw-bold mb-0">Profile Summary</h5>
                          </div>
                          <div class="card-body pt-3">
                            <p class="mb-0 lh-lg">{expert.value.profileSummary || 'No summary available'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Pricing Plans */}
                      <div class="col-12">
                        <div class="card border-0 shadow-sm">
                          <div class="card-header bg-transparent border-0 pb-0">
                            <h5 class="fw-bold mb-0 d-flex align-items-center gap-2">
                              <CreditCardIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                              Pricing Plans
                            </h5>
                          </div>
                          <div class="card-body pt-3">
                            <div class="row g-3">
                              <div class="col-12 col-md-4">
                                <div class="card border-0 bg-primary text-white text-center p-3">
                                  <ChatBubbleLeftRightIcon style={{ width: '2rem', height: '2rem' }} class="mb-2 mx-auto" />
                                  <h4 class="fw-bold mb-1">₹{expert.value.chatCharge || 0}</h4>
                                  <small class="opacity-75">per minute</small>
                                  <div class="mt-2">
                                    <small class="fw-semibold">Chat Consultation</small>
                                  </div>
                                </div>
                              </div>
                              <div class="col-12 col-md-4">
                                <div class="card border-0 bg-success text-white text-center p-3">
                                  <PhoneIcon style={{ width: '2rem', height: '2rem' }} class="mb-2 mx-auto" />
                                  <h4 class="fw-bold mb-1">₹{expert.value.voiceCharge || 0}</h4>
                                  <small class="opacity-75">per minute</small>
                                  <div class="mt-2">
                                    <small class="fw-semibold">Voice Call</small>
                                  </div>
                                </div>
                              </div>
                              <div class="col-12 col-md-4">
                                <div class="card border-0 bg-info text-white text-center p-3">
                                  <VideoCameraIcon style={{ width: '2rem', height: '2rem' }} class="mb-2 mx-auto" />
                                  <h4 class="fw-bold mb-1">₹{expert.value.videoCharge || 0}</h4>
                                  <small class="opacity-75">per minute</small>
                                  <div class="mt-2">
                                    <small class="fw-semibold">Video Call</small>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Background Banner */}
                      {expert.value.backgroundBanner && (
                        <div class="col-12">
                          <div class="card border-0 shadow-sm">
                            <div class="card-header bg-transparent border-0 pb-0">
                              <h5 class="fw-bold mb-0 d-flex align-items-center gap-2">
                                <PhotoIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                                Background Banner
                              </h5>
                            </div>
                            <div class="card-body pt-3">
                              <img 
                                src={expert.value.backgroundBanner} 
                                alt="Background Banner" 
                                class="img-fluid rounded-3 w-100" 
                                style={{ maxHeight: '300px', objectFit: 'cover' }}
                              />
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
          </div>
        </div>
      </div>
    );
  }
};