import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import { useRouter } from 'vue-router';
import { 
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlusIcon,
  CalendarIcon,
  ArrowRightIcon,
  ClipboardDocumentListIcon,
  GiftIcon,
  ShoppingCartIcon,
  ChartBarIcon
} from '@heroicons/vue/24/outline';
import spiritualActivityService from '../../services/spiritualActivityService.js';
import spiritualStatsService from '../../services/spiritualStatsService.js';

export default {
  name: 'SpiritualCheckin',
  setup() {
    const toast = useToast();
    const router = useRouter();
    const activeTab = ref('activity');
    const loading = ref(false);
    const activities = ref([]);
    const showAddModal = ref(false);
    const showEditModal = ref(false);
    const showViewModal = ref(false);
    const activeDropdown = ref(null);
    const selectedActivity = ref(null);
    const editingActivity = ref(null);
    const expandedDescriptions = ref(new Set());
    const statsData = ref([]);
    const statsLoading = ref(false);
    const categoryStats = ref({});
    const totalStats = ref({});
    const statsPage = ref(1);
    const statsLimit = ref(25);
    const statsTotal = ref(0);

    const newActivity = ref({
      title: '',
      description: '',
      image: null
    });

    const editForm = ref({
      title: '',
      description: '',
      image: null
    });

    const imageUploaded = ref(false);
    const imageFileName = ref('');
    const editImageUploaded = ref(false);
    const editImageFileName = ref('');

    const toggleDescription = (activityId) => {
      const expanded = expandedDescriptions.value;
      if (expanded.has(activityId)) {
        expanded.delete(activityId);
      } else {
        expanded.add(activityId);
      }
      expandedDescriptions.value = new Set(expanded);
    };

    const truncateText = (text, maxLength = 100) => {
      if (!text || text.length <= maxLength) return text;
      return text.substring(0, maxLength) + '...';
    };

    const fetchActivities = async () => {
      try {
        loading.value = true;
        const response = await spiritualActivityService.getSpiritualActivities(true);
        if (response.success) {
          activities.value = response.data || [];
        }
      } catch (error) {
        console.error('Fetch activities error:', error);
        toast.error('Failed to load activities');
      } finally {
        loading.value = false;
      }
    };

    const fetchStats = async () => {
      try {
        statsLoading.value = true;
        const response = await spiritualStatsService.getAllUsersStats('all');
        if (response.success && response.data) {
          const allActivities = response.data.recentActivities || [];
          statsTotal.value = allActivities.length;
          const start = (statsPage.value - 1) * statsLimit.value;
          const end = start + statsLimit.value;
          statsData.value = allActivities.slice(start, end);
          categoryStats.value = response.data.categoryStats || {};
          totalStats.value = response.data.totalStats || {};
        }
      } catch (error) {
        console.error('Fetch stats error:', error);
        toast.error('Failed to load statistics');
      } finally {
        statsLoading.value = false;
      }
    };

    const statsTotalPages = () => Math.max(Math.ceil(statsTotal.value / statsLimit.value), 1);

    const goToStatsPage = async (newPage) => {
      const max = statsTotalPages();
      const target = Math.min(Math.max(newPage, 1), max);
      if (target === statsPage.value) return;
      statsPage.value = target;
      await fetchStats();
    };


    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        newActivity.value.image = file;
        imageUploaded.value = true;
        imageFileName.value = file.name;
      }
    };

    const handleEditImageUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        editForm.value.image = file;
        editImageUploaded.value = true;
        editImageFileName.value = file.name;
      }
    };

    const toggleDropdown = (activityId) => {
      activeDropdown.value = activeDropdown.value === activityId ? null : activityId;
    };

    const viewActivity = (activity) => {
      selectedActivity.value = activity;
      showViewModal.value = true;
      activeDropdown.value = null;
    };

    const editActivity = (activity) => {
      editingActivity.value = activity;
      editForm.value = {
        title: activity.title,
        description: activity.description,
        image: null
      };
      editImageUploaded.value = false;
      editImageFileName.value = '';
      showEditModal.value = true;
      activeDropdown.value = null;
    };

    const updateActivity = async () => {
      if (editForm.value.title && editForm.value.description) {
        try {
          loading.value = true;
          
          // Find original activity to preserve images
          const originalActivity = activities.value.find(a => a._id === editingActivity.value._id);
          
          const response = await spiritualActivityService.updateSpiritualActivity(editingActivity.value._id, {
            title: editForm.value.title,
            description: editForm.value.description
          });
          
          if (response.success) {
            let updatedActivity = response.data;
            
            // Handle image upload (endpoint may not exist)
            if (editForm.value.image) {
              const imageResponse = await spiritualActivityService.uploadActivityImage(editingActivity.value._id, editForm.value.image);
              
              if (imageResponse.success && imageResponse.data) {
                updatedActivity.image = imageResponse.data.imageUrl;
                updatedActivity.imageKey = imageResponse.data.imageKey;
              } else {
                // Keep existing image if upload fails
                if (originalActivity && originalActivity.image) {
                  updatedActivity.image = originalActivity.image;
                  updatedActivity.imageKey = originalActivity.imageKey;
                }
              }
            } else if (originalActivity && originalActivity.image) {
              // Preserve existing image if no new image uploaded
              updatedActivity.image = originalActivity.image;
              updatedActivity.imageKey = originalActivity.imageKey;
            }
            
            // Update local state with proper reactivity
            const index = activities.value.findIndex(a => a._id === editingActivity.value._id);
            if (index !== -1) {
              // Force reactivity by creating new array
              const newActivities = [...activities.value];
              newActivities[index] = updatedActivity;
              activities.value = newActivities;
            }
            
            toast.success('Activity updated successfully!');
            closeEditModal();
          } else {
            toast.error(response.message || 'Failed to update activity');
          }
        } catch (error) {
          console.error('Update activity error:', error);
          toast.error('Failed to update activity');
        } finally {
          loading.value = false;
        }
      } else {
        toast.error('Please fill in all required fields');
      }
    };

    const deleteActivity = async (activityId) => {
      if (confirm('Are you sure you want to delete this activity?')) {
        try {
          const response = await spiritualActivityService.deleteSpiritualActivity(activityId);
          if (response.success) {
            // Remove from local state instead of fetching
            activities.value = activities.value.filter(a => a._id !== activityId);
            toast.success('Activity deleted successfully!');
          }
        } catch (error) {
          console.error('Delete activity error:', error);
          toast.error('Failed to delete activity');
        }
        activeDropdown.value = null;
      }
    };

    const toggleActivityStatus = async (activity) => {
      try {
        const response = await spiritualActivityService.toggleSpiritualActivity(activity._id);
        if (response.success) {
          // Update local state instead of fetching
          const index = activities.value.findIndex(a => a._id === activity._id);
          if (index !== -1) {
            activities.value[index].isActive = response.data.isActive;
          }
          toast.success(`Activity ${response.data.isActive ? 'enabled' : 'disabled'} successfully!`);
        }
      } catch (error) {
        console.error('Toggle activity error:', error);
        toast.error('Failed to toggle activity status');
      }
      activeDropdown.value = null;
    };

    const markAsCompleted = async (activityId) => {
      try {
        const response = await spiritualActivityService.markAsCompleted(activityId);
        if (response.success) {
          // Update local state instead of fetching
          const index = activities.value.findIndex(a => a._id === activityId);
          if (index !== -1) {
            activities.value[index].completed = true;
          }
          toast.success('Activity marked as completed!');
        }
      } catch (error) {
        console.error('Mark completed error:', error);
        toast.error('Failed to mark activity as completed');
      }
    };

    const openAddModal = () => {
      showAddModal.value = true;
    };

    const closeAddModal = () => {
      showAddModal.value = false;
      newActivity.value = { title: '', description: '', image: null };
      imageUploaded.value = false;
      imageFileName.value = '';
    };

    const closeEditModal = () => {
      showEditModal.value = false;
      editingActivity.value = null;
      editForm.value = { title: '', description: '', image: null };
      editImageUploaded.value = false;
      editImageFileName.value = '';
    };

    const addActivity = async () => {
      if (newActivity.value.title && newActivity.value.description) {
        try {
          loading.value = true;
          const response = await spiritualActivityService.createSpiritualActivity({
            title: newActivity.value.title,
            description: newActivity.value.description
          });
          
          if (response.success) {
            let createdActivity = response.data;
            
            // First add activity to state without image
            activities.value.unshift(createdActivity);
            
            // Upload image if provided
            if (newActivity.value.image && createdActivity._id) {
              const imageResponse = await spiritualActivityService.uploadActivityImage(createdActivity._id, newActivity.value.image);
              
              if (imageResponse.success && imageResponse.data) {
                // Update local state with uploaded image URL
                const activityIndex = activities.value.findIndex(a => a._id === createdActivity._id);
                if (activityIndex !== -1) {
                  const updatedActivities = [...activities.value];
                  updatedActivities[activityIndex] = {
                    ...updatedActivities[activityIndex],
                    image: imageResponse.data.imageUrl,
                    imageKey: imageResponse.data.imageKey
                  };
                  activities.value = updatedActivities;
                }
              }
            }
            
            toast.success('New spiritual activity added!');
            closeAddModal();
          }
        } catch (error) {
          console.error('Add activity error:', error);
          toast.error('Failed to add activity');
        } finally {
          loading.value = false;
        }
      }
    };

    onMounted(() => {
      fetchActivities();
      if (activeTab.value === 'stats') {
        fetchStats();
      }
    });

    return () => (
      <div class="container-fluid px-3 px-lg-4">
        <style>{`
          .spiritual-activity-card {
            transition: all 0.3s ease;
            border-radius: 16px;
          }
          .spiritual-activity-card:not(.disabled) {
            cursor: pointer;
          }
          .spiritual-activity-card:not(.disabled):hover {
            transform: translateY(-8px) scale(1.02);
            box-shadow: 0 20px 40px rgba(0,0,0,0.15) !important;
          }
          .spiritual-activity-card.disabled {
            cursor: not-allowed;
          }
          .activity-icon {
            transition: all 0.3s ease;
          }
          .spiritual-activity-card:not(.disabled):hover .activity-icon {
            transform: rotate(10deg) scale(1.1);
          }
          .arrow-btn {
            transition: all 0.3s ease;
          }
          .spiritual-activity-card:not(.disabled):hover .arrow-btn {
            transform: scale(1.2);
            background-color: #8b5cf6 !important;
            color: white !important;
          }
          .hover-overlay {
            opacity: 0;
            transition: opacity 0.3s ease;
          }
          .spiritual-activity-card:not(.disabled):hover .hover-overlay {
            opacity: 1;
          }
        `}</style>
        <div class="row">
          <div class="col-12">
            {/* Header */}
            <div class="bg-gradient-primary rounded-4 p-4 mb-4 text-white shadow-lg">
              <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
                <div class="flex-grow-1">
                  <h1 class="mb-1 fw-bold fs-2 text-dark">🌟 Spiritual Check-in</h1>
                  <p class="mb-0 text-dark" style={{ opacity: 0.8 }}>
                    Daily spiritual activities for inner growth
                  </p>
                </div>
                <button 
                  class="btn btn-light btn-lg rounded-pill px-4 shadow-sm"
                  onClick={openAddModal}
                  disabled={loading.value}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
                >
                  <PlusIcon style={{ width: '1.2rem', height: '1.2rem' }} />
                  <span class="d-none d-sm-inline">Add Activity</span>
                  <span class="d-sm-none">Add Activity</span>
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div class="card border-0 shadow-sm mb-4" style={{ borderRadius: '16px', overflow: 'hidden' }}>
              <div class="card-body p-0">
                <nav class="nav nav-pills nav-fill">
                  <button 
                    class={`nav-link ${activeTab.value === 'activity' ? 'active' : ''}`}
                    onClick={() => activeTab.value = 'activity'}
                    style={{ 
                      borderRadius: '16px',
                      fontWeight: '600',
                      padding: '1rem 2rem',
                      backgroundColor: activeTab.value === 'activity' ? '#8b5cf6' : 'transparent',
                      color: activeTab.value === 'activity' ? 'white' : '#6c757d',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <ClipboardDocumentListIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    Activity
                  </button>
                  <button 
                    class={`nav-link ${activeTab.value === 'rewards' ? 'active' : ''}`}
                    onClick={() => router.push('/client/spiritual-rewards')}
                    style={{ 
                      borderRadius: '16px',
                      fontWeight: '600',
                      padding: '1rem 2rem',
                      backgroundColor: activeTab.value === 'rewards' ? '#8b5cf6' : 'transparent',
                      color: activeTab.value === 'rewards' ? 'white' : '#6c757d',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <GiftIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    Rewards
                  </button>
                  <button 
                    class={`nav-link ${activeTab.value === 'orders' ? 'active' : ''}`}
                    onClick={() => activeTab.value = 'orders'}
                    style={{ 
                      borderRadius: '16px',
                      fontWeight: '600',
                      padding: '1rem 2rem',
                      backgroundColor: activeTab.value === 'orders' ? '#8b5cf6' : 'transparent',
                      color: activeTab.value === 'orders' ? 'white' : '#6c757d',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <ShoppingCartIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    Orders
                  </button>
                  <button 
                    class={`nav-link ${activeTab.value === 'stats' ? 'active' : ''}`}
                    onClick={() => { activeTab.value = 'stats'; fetchStats(); }}
                    style={{ 
                      borderRadius: '16px',
                      fontWeight: '600',
                      padding: '1rem 2rem',
                      backgroundColor: activeTab.value === 'stats' ? '#8b5cf6' : 'transparent',
                      color: activeTab.value === 'stats' ? 'white' : '#6c757d',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <ChartBarIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                    Stats
                  </button>
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab.value === 'activity' && (
              <>
                {/* Spiritual Activities Grid */}
                {loading.value ? (
                  <div class="text-center py-5">
                    <div class="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                      <span class="visually-hidden">Loading...</span>
                    </div>
                    <p class="text-muted">Loading spiritual activities...</p>
                  </div>
                ) : activities.value.length > 0 ? (
                  <div class="row g-4">
                    {activities.value.map(activity => (
                      <div key={activity._id} class="col-xl-4 col-lg-6 col-md-6 col-sm-12">
                        <div 
                          class={`spiritual-activity-card card h-100 border-0 shadow-sm position-relative overflow-hidden ${!activity.isActive ? 'disabled opacity-50' : ''}`}
                          style={{
                            background: `linear-gradient(135deg, #8b5cf608 0%, #8b5cf615 30%, #f8fafc 100%)`,
                            borderRadius: '16px',
                            pointerEvents: activity.isActive ? 'auto' : 'none'
                          }}
                          onClick={activity.isActive ? () => {} : undefined}
                        >
                          {!activity.isActive && (
                            <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.1)', zIndex: 1, pointerEvents: 'none' }}>
                              <span class="badge bg-secondary px-3 py-2 rounded-pill shadow">🔒 Disabled</span>
                            </div>
                          )}
                          {/* Status Badge */}
                          <div class="position-absolute top-0 end-0 m-3" style={{ zIndex: 2, pointerEvents: 'auto' }}>
                            <div class="dropdown position-relative">
                              <button 
                                class="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center shadow-sm"
                                onClick={(e) => { e.stopPropagation(); toggleDropdown(activity._id); }}
                                style={{ width: '32px', height: '32px', transition: 'all 0.2s ease' }}
                              >
                                <EllipsisVerticalIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                              </button>
                              {activeDropdown.value === activity._id && (
                                <div class="dropdown-menu show position-absolute shadow-lg border-0 rounded-3" style={{ minWidth: '160px', right: '0', top: '100%', zIndex: 1000 }}>
                                  {activity.isActive ? (
                                    <>
                                      <button 
                                        class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded-2"
                                        onClick={(e) => { e.stopPropagation(); viewActivity(activity); }}
                                      >
                                        <EyeIcon style={{ width: '1rem', height: '1rem', color: '#0d6efd' }} />
                                        <span class="fw-medium">View Details</span>
                                      </button>
                                      <button 
                                        class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded-2"
                                        onClick={(e) => { e.stopPropagation(); editActivity(activity); }}
                                      >
                                        <PencilIcon style={{ width: '1rem', height: '1rem', color: '#8b5cf6' }} />
                                        <span class="fw-medium">Edit Activity</span>
                                      </button>
                                      <button 
                                        class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded-2"
                                        onClick={(e) => { e.stopPropagation(); toggleActivityStatus(activity); }}
                                      >
                                        <span class="rounded-circle bg-warning" style={{ width: '1rem', height: '1rem' }}></span>
                                        <span class="fw-medium">Disable</span>
                                      </button>
                                      <hr class="dropdown-divider my-1" />
                                      <button 
                                        class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-danger rounded-2"
                                        onClick={(e) => { e.stopPropagation(); deleteActivity(activity._id); }}
                                      >
                                        <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                                        <span class="fw-medium">Delete</span>
                                      </button>
                                    </>
                                  ) : (
                                    <button 
                                      class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 rounded-2"
                                      onClick={(e) => { e.stopPropagation(); toggleActivityStatus(activity); }}
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
                                class="activity-icon d-inline-flex align-items-center justify-content-center rounded-3"
                                style={{ 
                                  width: '72px', 
                                  height: '72px',
                                  backgroundColor: '#8b5cf615',
                                  border: '2px solid #8b5cf625'
                                }}
                              >
                                {activity.image ? (
                                  <img 
                                    src={activity.image} 
                                    alt={activity.title}
                                    class="rounded-3"
                                    style={{ width: '60px', height: '60px', objectFit: 'cover' }}
                                    onLoad={(e) => {
                                      // Image loaded successfully
                                    }}
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
                                    display: activity.image ? 'none' : 'block'
                                  }}
                                >
                                  {activity.icon || '🌟'}
                                </span>
                              </div>
                            </div>

                            {/* Content */}
                            <div class="mb-4">
                              <h5 class="card-title fw-bold mb-2 text-dark">{activity.title}</h5>
                              <div class="card-text text-muted mb-0 lh-base" style={{ fontSize: '0.95rem' }}>
                                {expandedDescriptions.value.has(activity._id) ? (
                                  <>
                                    <p class="mb-1">{activity.description}</p>
                                    <button 
                                      class="btn btn-link p-0 text-primary" 
                                      style={{ fontSize: '0.85rem', textDecoration: 'none' }}
                                      onClick={(e) => { e.stopPropagation(); toggleDescription(activity._id); }}
                                    >
                                      See less
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <p class="mb-1">{truncateText(activity.description, 100)}</p>
                                    {activity.description && activity.description.length > 100 && (
                                      <button 
                                        class="btn btn-link p-0 text-primary" 
                                        style={{ fontSize: '0.85rem', textDecoration: 'none' }}
                                        onClick={(e) => { e.stopPropagation(); toggleDescription(activity._id); }}
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
                                <span>{activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('en-US', { 
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
                                  cursor: activity.isActive ? 'pointer' : 'not-allowed'
                                }}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (activity.isActive) {
                                    // Dynamic category detection based on activity title
                                    const detectCategory = (title) => {
                                      const titleLower = title.toLowerCase();
                                      if (titleLower.includes('meditation') || titleLower.includes('meditate') || titleLower.includes('dhyan')) return 'meditation';
                                      if (titleLower.includes('prayer') || titleLower.includes('pray') || titleLower.includes('prarthana') || titleLower.includes('dua')) return 'prayer';
                                      if (titleLower.includes('chant') || titleLower.includes('mantra') || titleLower.includes('kirtan') || titleLower.includes('bhajan')) return 'chanting';
                                      if (titleLower.includes('breath') || titleLower.includes('pranayam') || titleLower.includes('breathing')) return 'breathing';
                                      if (titleLower.includes('mindful') || titleLower.includes('awareness') || titleLower.includes('conscious')) return 'mindfulness';
                                      if (titleLower.includes('yoga') || titleLower.includes('asana')) return 'yoga';
                                      if (titleLower.includes('gratitude') || titleLower.includes('thankful') || titleLower.includes('grateful')) return 'gratitude';
                                      if (titleLower.includes('silence') || titleLower.includes('quiet') || titleLower.includes('maun')) return 'silence';
                                      if (titleLower.includes('reflection') || titleLower.includes('contemplate') || titleLower.includes('introspect')) return 'reflection';
                                      return 'meditation'; // default
                                    };
                                    
                                    const categoryType = detectCategory(activity.title);
                                    router.push(`/client/spiritual-management/${categoryType}`);
                                  }
                                }}
                              >
                                <ArrowRightIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                              </div>
                            </div>
                          </div>

                          {/* Hover Effect Overlay */}
                          {activity.isActive && (
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
                    <h4 class="fw-bold mb-2">No Spiritual Activities Yet</h4>
                    <p class="text-muted mb-4">Create your first spiritual check-in to get started</p>
                    <button 
                      class="btn btn-primary rounded-pill px-4"
                      onClick={openAddModal}
                    >
                      Add Spiritual Check-in
                    </button>
                  </div>
                )}
              </>
            )}

{/* Orders Tab */}
            {activeTab.value === 'orders' && (
              <div class="text-center py-5">
                <div class="mb-4">
                  <div class="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                    <span style={{ fontSize: '2rem' }}>🛒</span>
                  </div>
                </div>
                <h4 class="fw-bold mb-2">Orders Coming Soon</h4>
                <p class="text-muted mb-4">Track your spiritual product orders</p>
              </div>
            )}

            {/* Stats Tab */}
            {activeTab.value === 'stats' && (
              <>
                {/* Summary Cards */}
                <div class="row g-2 mb-3">
                  <div class="col-md-3 col-sm-6">
                    <div class="card border-0 shadow-sm h-100" style={{ borderRadius: '10px', background: 'white' }}>
                      <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center">
                          <div class="flex-grow-1">
                            <p class="mb-0 text-muted fw-semibold" style={{ fontSize: '0.7rem' }}>Meditation</p>
                            <h4 class="mb-0 fw-bold" style={{ color: '#667eea' }}>{categoryStats.value.meditation?.sessions || 0}</h4>
                            <small class="text-muted" style={{ fontSize: '0.65rem' }}>{categoryStats.value.meditation?.minutes || 0} min</small>
                          </div>
                          <div class="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                            <span style={{ fontSize: '1rem' }}>🧘</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3 col-sm-6">
                    <div class="card border-0 shadow-sm h-100" style={{ borderRadius: '10px', background: 'white' }}>
                      <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center">
                          <div class="flex-grow-1">
                            <p class="mb-0 text-muted fw-semibold" style={{ fontSize: '0.7rem' }}>Chanting</p>
                            <h4 class="mb-0 fw-bold" style={{ color: '#f093fb' }}>{categoryStats.value.chanting?.sessions || 0}</h4>
                            <small class="text-muted" style={{ fontSize: '0.65rem' }}>{categoryStats.value.chanting?.karmaPoints || 0} karma</small>
                          </div>
                          <div class="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                            <span style={{ fontSize: '1rem' }}>🕉️</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3 col-sm-6">
                    <div class="card border-0 shadow-sm h-100" style={{ borderRadius: '10px', background: 'white' }}>
                      <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center">
                          <div class="flex-grow-1">
                            <p class="mb-0 text-muted fw-semibold" style={{ fontSize: '0.7rem' }}>Prayer</p>
                            <h4 class="mb-0 fw-bold" style={{ color: '#4facfe' }}>{categoryStats.value.prayer?.sessions || 0}</h4>
                            <small class="text-muted" style={{ fontSize: '0.65rem' }}>{categoryStats.value.prayer?.minutes || 0} min</small>
                          </div>
                          <div class="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
                            <span style={{ fontSize: '1rem' }}>🙏</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="col-md-3 col-sm-6">
                    <div class="card border-0 shadow-sm h-100" style={{ borderRadius: '10px', background: 'white' }}>
                      <div class="card-body p-2">
                        <div class="d-flex justify-content-between align-items-center">
                          <div class="flex-grow-1">
                            <p class="mb-0 text-muted fw-semibold" style={{ fontSize: '0.7rem' }}>Silence</p>
                            <h4 class="mb-0 fw-bold" style={{ color: '#43e97b' }}>{categoryStats.value.silence?.sessions || 0}</h4>
                            <small class="text-muted" style={{ fontSize: '0.65rem' }}>{categoryStats.value.silence?.minutes || 0} min</small>
                          </div>
                          <div class="rounded-circle d-flex align-items-center justify-content-center" style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
                            <span style={{ fontSize: '1rem' }}>🤫</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Total Stats Card */}
                <div class="card border-0 shadow-sm mb-3" style={{ borderRadius: '10px' }}>
                  <div class="card-body p-2">
                    <div class="row g-2">
                      <div class="col-md-2 col-6">
                        <div class="text-center p-2 rounded-2" style={{ background: '#f8f9fa' }}>
                          <h5 class="mb-0 fw-bold" style={{ color: '#8b5cf6' }}>{totalStats.value.karmaPoints || 0}</h5>
                          <p class="mb-0 text-muted fw-semibold" style={{ fontSize: '0.65rem' }}>Karma</p>
                        </div>
                      </div>
                      <div class="col-md-2 col-6">
                        <div class="text-center p-2 rounded-2" style={{ background: '#f8f9fa' }}>
                          <h5 class="mb-0 fw-bold" style={{ color: '#10b981' }}>{totalStats.value.sessions || 0}</h5>
                          <p class="mb-0 text-muted fw-semibold" style={{ fontSize: '0.65rem' }}>Sessions</p>
                        </div>
                      </div>
                      <div class="col-md-2 col-6">
                        <div class="text-center p-2 rounded-2" style={{ background: '#f8f9fa' }}>
                          <h5 class="mb-0 fw-bold" style={{ color: '#3b82f6' }}>{totalStats.value.minutes || 0}</h5>
                          <p class="mb-0 text-muted fw-semibold" style={{ fontSize: '0.65rem' }}>Minutes</p>
                        </div>
                      </div>
                      <div class="col-md-2 col-6">
                        <div class="text-center p-2 rounded-2" style={{ background: '#f8f9fa' }}>
                          <h5 class="mb-0 fw-bold" style={{ color: '#10b981' }}>{totalStats.value.completed || 0}</h5>
                          <p class="mb-0 text-muted fw-semibold" style={{ fontSize: '0.65rem' }}>Completed</p>
                        </div>
                      </div>
                      <div class="col-md-2 col-6">
                        <div class="text-center p-2 rounded-2" style={{ background: '#f8f9fa' }}>
                          <h5 class="mb-0 fw-bold" style={{ color: '#f59e0b' }}>{totalStats.value.incomplete || 0}</h5>
                          <p class="mb-0 text-muted fw-semibold" style={{ fontSize: '0.65rem' }}>Incomplete</p>
                        </div>
                      </div>
                      <div class="col-md-2 col-6">
                        <div class="text-center p-2 rounded-2" style={{ background: '#f8f9fa' }}>
                          <h5 class="mb-0 fw-bold" style={{ color: '#6366f1' }}>{totalStats.value.averageCompletion || 0}%</h5>
                          <p class="mb-0 text-muted fw-semibold" style={{ fontSize: '0.65rem' }}>Avg Complete</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="card border-0 shadow-sm">
                  <div class="card-body p-4">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                      <h4 class="fw-bold mb-0">User Spiritual Activity History</h4>
                      <button 
                        class="btn btn-primary btn-sm rounded-pill"
                        onClick={fetchStats}
                        disabled={statsLoading.value}
                      >
                        {statsLoading.value ? 'Loading...' : 'Refresh'}
                      </button>
                    </div>

                  {statsLoading.value ? (
                    <div class="text-center py-5">
                      <div class="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                        <span class="visually-hidden">Loading...</span>
                      </div>
                      <p class="text-muted">Loading statistics...</p>
                    </div>
                  ) : statsData.value.length > 0 ? (
                    <>
                      <div class="table-responsive">
                        <table class="table table-hover align-middle">
                          <thead class="table-light">
                            <tr>
                              <th>User</th>
                              <th>Category</th>
                              <th>Duration</th>
                              <th>Title</th>
                              <th>Video</th>
                              <th>Audio</th>
                              <th>Date</th>
                            </tr>
                          </thead>
                          <tbody>
                            {statsData.value.map((activity) => (
                              <tr key={activity.id}>
                                <td>
                                  <div class="fw-semibold">{activity.userDetails?.name || 'N/A'}</div>
                                  <small class="text-muted">{activity.userDetails?.email || ''}</small>
                                </td>
                                <td>
                                  <span class="badge bg-primary rounded-pill">{activity.type}</span>
                                </td>
                                <td>{activity.actualDuration || 0} min</td>
                                <td>
                                  <div style={{ maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {activity.title || '-'}
                                  </div>
                                </td>
                                <td>
                                  {activity.videoUrl ? (
                                    <a href={activity.videoUrl} target="_blank" rel="noopener noreferrer" class="badge bg-success text-decoration-none">
                                      🎥 Video
                                    </a>
                                  ) : (
                                    <span class="text-muted">-</span>
                                  )}
                                </td>
                                <td>
                                  {activity.audioUrl ? (
                                    <a href={activity.audioUrl} target="_blank" rel="noopener noreferrer" class="badge bg-info text-decoration-none">
                                      🎵 Audio
                                    </a>
                                  ) : (
                                    <span class="text-muted">-</span>
                                  )}
                                </td>
                                <td>
                                  <small>{activity.createdAt ? new Date(activity.createdAt).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric'
                                  }) : 'N/A'}</small>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      <div class="d-flex justify-content-between align-items-center mt-3">
                        <div>
                          Page {statsPage.value} of {statsTotalPages()} ({statsTotal.value} records)
                        </div>
                        <div class="btn-group">
                          <button
                            class="btn btn-outline-secondary btn-sm"
                            disabled={statsPage.value <= 1}
                            onClick={() => goToStatsPage(statsPage.value - 1)}
                          >
                            Previous
                          </button>
                          <button
                            class="btn btn-outline-secondary btn-sm"
                            disabled={statsPage.value >= statsTotalPages()}
                            onClick={() => goToStatsPage(statsPage.value + 1)}
                          >
                            Next
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div class="text-center py-5">
                      <div class="mb-4">
                        <div class="bg-light rounded-circle d-inline-flex align-items-center justify-content-center" style={{ width: '80px', height: '80px' }}>
                          <ChartBarIcon style={{ width: '2rem', height: '2rem', color: '#6c757d' }} />
                        </div>
                      </div>
                      <h4 class="fw-bold mb-2">No Statistics Yet</h4>
                      <p class="text-muted mb-4">User activity data will appear here</p>
                    </div>
                  )}
                </div>
              </div>
              </>
            )}

            {/* Add Activity Modal */}
            {showAddModal.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                <div class="modal-dialog modal-dialog-centered">
                  <div class="modal-content shadow">
                    <div class="modal-header bg-primary text-white">
                      <h5 class="modal-title fw-bold">Add Activity</h5>
                      <button class="btn-close btn-close-white" onClick={closeAddModal}></button>
                    </div>
                    <div class="modal-body p-4">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Name *</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          value={newActivity.value.title}
                          onInput={(e) => { newActivity.value.title = e.target.value; }}
                          placeholder="Enter activity name"
                        />
                      </div>
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Description *</label>
                        <textarea 
                          class="form-control" 
                          rows="4"
                          value={newActivity.value.description}
                          onInput={(e) => { newActivity.value.description = e.target.value; }}
                          placeholder="Describe the spiritual activity..."
                        ></textarea>
                      </div>
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Image</label>
                        <input 
                          type="file" 
                          class="form-control" 
                          accept="image/*"
                          onChange={handleImageUpload}
                        />
                        {imageUploaded.value && (
                          <div class="mt-2 p-2 bg-success bg-opacity-10 rounded">
                            <small class="text-success d-flex align-items-center gap-1">
                              <span>✓</span>
                              Image uploaded: {imageFileName.value}
                            </small>
                          </div>
                        )}
                        <small class="form-text text-muted">Max 5MB - JPG, PNG, GIF</small>
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button class="btn btn-secondary" onClick={closeAddModal}>Cancel</button>
                      <button 
                        class="btn btn-primary" 
                        onClick={addActivity}
                        disabled={!newActivity.value.title || !newActivity.value.description || loading.value}
                      >
                        {loading.value ? (
                          <>
                            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Adding...
                          </>
                        ) : (
                          'Add Activity'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Activity Modal */}
            {showEditModal.value && editingActivity.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                <div class="modal-dialog modal-dialog-centered">
                  <div class="modal-content shadow">
                    <div class="modal-header bg-primary text-white">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        <PencilIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                        Edit Activity
                      </h5>
                      <button class="btn-close btn-close-white" onClick={closeEditModal}></button>
                    </div>
                    <div class="modal-body p-4">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Name *</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          value={editForm.value.title}
                          onInput={(e) => { editForm.value.title = e.target.value; }}
                          placeholder="Enter activity name"
                        />
                      </div>
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Description *</label>
                        <textarea 
                          class="form-control" 
                          rows="4"
                          value={editForm.value.description}
                          onInput={(e) => { editForm.value.description = e.target.value; }}
                          placeholder="Describe the spiritual activity..."
                        ></textarea>
                      </div>
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Image</label>
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
                              New image selected: {editImageFileName.value}
                            </small>
                          </div>
                        )}
                        {editingActivity.value?.image && !editImageUploaded.value && (
                          <div class="mt-2 p-2 bg-info bg-opacity-10 rounded">
                            <small class="text-info">
                              📷 Current image will be kept if no new image is selected
                            </small>
                          </div>
                        )}
                        <small class="form-text text-muted">Max 5MB - JPG, PNG, GIF</small>
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button class="btn btn-secondary" onClick={closeEditModal} disabled={loading.value}>Cancel</button>
                      <button 
                        class="btn btn-primary" 
                        onClick={updateActivity}
                        disabled={loading.value || !editForm.value.title || !editForm.value.description}
                      >
                        {loading.value ? 'Updating...' : 'Update Activity'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View Activity Modal */}
            {showViewModal.value && selectedActivity.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                <div class="modal-dialog modal-dialog-centered" style={{ maxWidth: '500px' }}>
                  <div class="modal-content shadow" style={{ borderRadius: '16px' }}>
                    <div class="modal-header bg-primary text-white border-0" style={{ borderRadius: '16px 16px 0 0' }}>
                      <h5 class="mb-0 fw-bold d-flex align-items-center">
                        <EyeIcon style={{ width: '1.5rem', height: '1.5rem' }} class="me-2" />
                        Activity Details
                      </h5>
                      <button 
                        class="btn-close btn-close-white" 
                        onClick={() => showViewModal.value = false}
                      ></button>
                    </div>
                    <div class="modal-body p-4">
                      {selectedActivity.value.image && (
                        <div class="text-center mb-4">
                          <img 
                            src={selectedActivity.value.image}
                            alt={selectedActivity.value.title}
                            class="rounded-circle border border-3 border-white shadow-lg"
                            style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                      <h4 class="mb-2 text-center fw-bold text-dark">{selectedActivity.value.title}</h4>
                      <p class="text-muted text-center mb-3">{selectedActivity.value.description}</p>

                      <div class="p-3 rounded-3 mb-4" style={{ backgroundColor: '#f8f9fa', border: '1px solid #e9ecef' }}>
                        <div class="mb-0">
                          <label class="form-label fw-bold text-muted">Status</label>
                          <p class="mb-0">
                            <span class={`badge ${selectedActivity.value.isActive ? 'bg-success' : 'bg-secondary'} px-3 py-2 rounded-pill`}>
                              {selectedActivity.value.isActive ? '✅ Active' : '❌ Inactive'}
                            </span>
                          </p>
                        </div>
                      </div>
                      <hr class="my-3" />
                      <small class="text-muted d-flex align-items-center gap-1">
                        <CalendarIcon style={{ width: '14px', height: '14px' }} />
                        Created on {selectedActivity.value.createdAt ? new Date(selectedActivity.value.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'No date'}
                      </small>
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