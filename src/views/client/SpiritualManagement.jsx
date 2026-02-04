import { ref, onMounted, computed, watch } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { 
  ArrowLeftIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  PlayIcon,
  PhotoIcon,
  MusicalNoteIcon,
  XMarkIcon,
  XCircleIcon,
  CheckCircleIcon,
  ClockIcon,
  SparklesIcon,
  ChartBarIcon,
  FireIcon
} from '@heroicons/vue/24/outline';
import { useToast } from 'vue-toastification';
import spiritualConfigurationService from '../../services/spiritualConfigurationService.js';
import spiritualClipService from '../../services/spiritualClipService.js';
import spiritualStatsService from '../../services/spiritualStatsService.js';

export default {
  name: 'SpiritualManagement',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const toast = useToast();
    
    // Get category from URL params, detect from activities, or default to 'meditation'
    const currentCategory = ref((() => {
      // First check URL params
      if (route.params.category) {
        return route.params.category;
      }
      
      // Default fallback
      return 'meditation';
    })());
    const loading = ref(false);
    const activities = ref([]);
    const configurations = ref([]);
    const clips = ref([]);
    const userStats = ref({
      totalStats: { sessions: 0, minutes: 0, karmaPoints: 0, streak: 0 },
      categoryStats: {},
      recentActivities: []
    });
    const configForm = ref({
      title: '',
      duration: '5 minutes',
      description: '',
      emotion: '',
      chantingType: '',
      customChantingType: '',
      karmaPoints: 10,
      type: currentCategory.value
    });
    const showCustomInput = ref(false);
    const showAddModal = ref(false);
    const showEditModal = ref(false);
    const showViewModal = ref(false);
    const activeDropdown = ref(null);
    const selectedActivity = ref(null);
    const editingActivity = ref(null);

    const showAddClipModal = ref(false);
    const addClipForm = ref({
      title: '',
      description: '',
      video: null,
      audio: null,
      suitableTime: '',
      guided: '',
      transcript: '',
      type: currentCategory.value,
      suitableConfiguration: ''
    });
    const clipVideoUploaded = ref(false);
    const clipVideoFileName = ref('');
    const clipAudioUploaded = ref(false);
    const clipAudioFileName = ref('');
    const clipUploadProgress = ref({ video: 0, audio: 0 });
    const clipUploading = ref({ video: false, audio: false });

    const activeTab = ref('configuration');
    
    // Dynamic category detection from activity titles
    const detectCategoryFromTitle = (title) => {
      const titleLower = title.toLowerCase();
      
      // Check for specific keywords in activity titles
      if (titleLower.includes('meditation') || titleLower.includes('meditate') || titleLower.includes('dhyan')) {
        return 'meditation';
      }
      if (titleLower.includes('prayer') || titleLower.includes('pray') || titleLower.includes('prarthana') || titleLower.includes('dua')) {
        return 'prayer';
      }
      if (titleLower.includes('chant') || titleLower.includes('mantra') || titleLower.includes('kirtan') || titleLower.includes('bhajan')) {
        return 'chanting';
      }
      if (titleLower.includes('breath') || titleLower.includes('pranayam') || titleLower.includes('breathing')) {
        return 'breathing';
      }
      if (titleLower.includes('mindful') || titleLower.includes('awareness') || titleLower.includes('conscious')) {
        return 'mindfulness';
      }
      if (titleLower.includes('yoga') || titleLower.includes('asana')) {
        return 'yoga';
      }
      if (titleLower.includes('gratitude') || titleLower.includes('thankful') || titleLower.includes('grateful')) {
        return 'gratitude';
      }
      if (titleLower.includes('silence') || titleLower.includes('quiet') || titleLower.includes('maun')) {
        return 'silence';
      }
      if (titleLower.includes('reflection') || titleLower.includes('contemplate') || titleLower.includes('introspect')) {
        return 'reflection';
      }
      
      // Default to meditation if no match found
      return 'meditation';
    };
    
    // Enhanced category info mapping with more categories
    const categoryInfo = {
      meditation: { emoji: '🧘', name: 'Meditation', color: '#8b5cf6' },
      prayer: { emoji: '🙏', name: 'Prayer', color: '#10b981' },
      chanting: { emoji: '🎵', name: 'Chanting', color: '#f59e0b' },
      breathing: { emoji: '💨', name: 'Breathing', color: '#06b6d4' },
      mindfulness: { emoji: '🌸', name: 'Mindfulness', color: '#ec4899' },
      yoga: { emoji: '🧘‍♀️', name: 'Yoga', color: '#8b5cf6' },
      gratitude: { emoji: '🙏', name: 'Gratitude', color: '#10b981' },
      silence: { emoji: '🤫', name: 'Silence', color: '#6b7280' },
      reflection: { emoji: '🤔', name: 'Reflection', color: '#f59e0b' }
    };
    
    // Category-specific field configurations
    const categoryFields = {
      meditation: {
        config: ['title', 'duration', 'description', 'emotion'],
        clip: ['title', 'description', 'video', 'audio', 'suitableTime', 'guided', 'transcript']
      },
      prayer: {
        config: ['title', 'duration', 'description'],
        clip: ['title', 'description', 'audio', 'transcript']
      },
      chanting: {
        config: ['title', 'description'], // Remove duration for chanting
        clip: ['title', 'description', 'audio', 'transcript']
      },
      breathing: {
        config: ['title', 'duration', 'description'],
        clip: ['title', 'description', 'video', 'guided']
      },
      mindfulness: {
        config: ['title', 'duration', 'description', 'emotion'],
        clip: ['title', 'description', 'video', 'audio', 'guided']
      },
      yoga: {
        config: ['title', 'duration', 'description'],
        clip: ['title', 'description', 'video']
      },
      gratitude: {
        config: ['title', 'duration', 'description'],
        clip: ['title', 'description', 'audio', 'transcript']
      },
      silence: {
        config: ['title', 'duration', 'description'],
        clip: ['title', 'description']
      },
      reflection: {
        config: ['title', 'duration', 'description'],
        clip: ['title', 'description', 'transcript']
      }
    };
    
    // Category-specific options
    const categoryOptions = {
      chanting: [
        'Gayatri Mantra',
        'Hanuman Chalisa',
        'Mahamrityunjaya Mantra',
        'Shri Ganesh Vandana',
        'Shri Ram Stuti',
        'Shiv Tandav Stotram',
        'Durga Chalisa',
        'Vishnu Sahasranama',
        'Saraswati Vandana',
        'Shanti Path',
        'Om Namah Shivaya',
        'Hare Krishna Mantra',
        'Other'
      ],
      prayer: [
        'Morning Prayer',
        'Evening Prayer',
        'Gratitude Prayer',
        'Peace Prayer',
        'Healing Prayer',
        'Protection Prayer',
        'Other'
      ],
      meditation: [
        'Mindfulness Meditation',
        'Breathing Meditation',
        'Body Scan Meditation',
        'Loving Kindness Meditation',
        'Walking Meditation',
        'Other'
      ]
    };
    
    // Get current category fields
    const currentCategoryFields = computed(() => 
      categoryFields[currentCategory.value] || categoryFields.meditation
    );
    
    // Get current category options
    const currentCategoryOptions = computed(() => 
      categoryOptions[currentCategory.value] || []
    );
    
    const currentCategoryInfo = computed(() => 
      categoryInfo[currentCategory.value] || categoryInfo.meditation
    );
    
    // Watch for category changes and update form types
    watch(currentCategory, (newCategory) => {
      configForm.value.type = newCategory;
      addClipForm.value.type = newCategory;
      editClipForm.value.type = newCategory;
      editConfigForm.value.type = newCategory;
      // Reset custom input when category changes
      showCustomInput.value = false;
      configForm.value.customChantingType = '';
      // Refresh stats when category changes
      fetchUserStats();
      fetchConfigurations();
      fetchClips();
    });
    
    // Handle dropdown change for category options
    const handleCategoryOptionChange = (value) => {
      configForm.value.chantingType = value;
      if (value === 'Other') {
        showCustomInput.value = true;
        configForm.value.customChantingType = '';
      } else {
        showCustomInput.value = false;
        configForm.value.customChantingType = '';
      }
    };
    
    // Filter configurations and clips by category
    const filteredConfigurations = computed(() => 
      configurations.value.filter(config => 
        config.type === currentCategory.value || (!config.type && currentCategory.value === 'meditation')
      )
    );
    
    const filteredRecentActivities = computed(() => {
      const activities = userStats.value.recentActivities || [];
      console.log('All activities before filtering:', activities);
      console.log('Current category:', currentCategory.value);
      
      // Since we're already fetching category-specific data from backend,
      // we should get all activities for the current category
      // But let's still filter to be safe
      const filtered = activities.filter(activity => {
        console.log('Filtering activity:', activity.type, 'Current category:', currentCategory.value);
        return activity.type === currentCategory.value;
      });
      
      console.log('Filtered activities:', filtered);
      return filtered;
    });
    
    const filteredClips = computed(() => 
      clips.value.filter(clip => {
        // If clip has no type, show in meditation category
        if (!clip.type) return currentCategory.value === 'meditation';
        return clip.type === currentCategory.value;
      })
    );

    const openDropdownId = ref(null);
    const showViewClipModal = ref(false);
    const showEditClipModal = ref(false);
    const selectedClip = ref(null);
    const editingClip = ref(null);
    const editClipForm = ref({
      title: '',
      description: '',
      suitableTime: '',
      guided: '',
      transcript: '',
      video: null,
      audio: null,
      type: currentCategory.value,
      suitableConfiguration: ''
    });
    const editClipVideoUploaded = ref(false);
    const editClipVideoFileName = ref('');
    const editClipAudioUploaded = ref(false);
    const editClipAudioFileName = ref('');
    const editClipUploadProgress = ref({ video: 0, audio: 0 });
    const editClipUploading = ref({ video: false, audio: false });

    // Video popup state
    const showVideoModal = ref(false);
    const selectedVideoClip = ref(null);

    // Audio popup state
    const showAudioModal = ref(false);
    const selectedAudioClip = ref(null);

    const editingConfig = ref(null);
    const showEditConfigModal = ref(false);
    const showViewConfigModal = ref(false);
    const selectedConfig = ref(null);
    const activeConfigDropdown = ref(null);

    const editConfigForm = ref({
      title: '',
      duration: '5 minutes',
      description: '',
      emotion: '',
      karmaPoints: 10,
      type: currentCategory.value
    });

    const newActivity = ref({
      title: '',
      duration: '5 minutes',
      description: '',
      emotion: '',
      suitableTime: '',
      guided: '',
      type: '',
      transcript: '',
      audio: null,
      video: null,
      image: null
    });

    const editForm = ref({
      title: '',
      duration: '',
      description: '',
      emotion: '',
      suitableTime: '',
      guided: '',
      type: '',
      transcript: '',
      audio: null,
      video: null,
      image: null
    });

    const audioUploaded = ref(false);
    const audioFileName = ref('');
    const videoUploaded = ref(false);
    const videoFileName = ref('');
    const imageUploaded = ref(false);
    const imageFileName = ref('');
    const uploadProgress = ref({ audio: 0, video: 0, image: 0 });

    const editAudioUploaded = ref(false);
    const editAudioFileName = ref('');
    const editVideoUploaded = ref(false);
    const editVideoFileName = ref('');
    const editImageUploaded = ref(false);
    const editImageFileName = ref('');
    const editUploadProgress = ref({ audio: 0, video: 0, image: 0 });

    const goBack = () => {
      router.push('/client/spiritual-checkin');
    };

    const toggleClipDropdown = (clipId) => {
      openDropdownId.value = openDropdownId.value === clipId ? null : clipId;
    };

    const viewClip = (clip) => {
      selectedClip.value = clip;
      showViewClipModal.value = true;
      openDropdownId.value = null;
    };

    const editClip = (clip) => {
      editingClip.value = clip;
      editClipForm.value = {
        title: clip.title,
        description: clip.description,
        suitableTime: clip.suitableTime || '',
        guided: clip.guided || '',
        transcript: clip.transcript || '',
        suitableConfiguration: clip.suitableConfiguration?._id || '',
        video: null,
        audio: null
      };
      editClipVideoUploaded.value = false;
      editClipVideoFileName.value = '';
      editClipAudioUploaded.value = false;
      editClipAudioFileName.value = '';
      editClipUploadProgress.value = { video: 0, audio: 0 };
      editClipUploading.value = { video: false, audio: false };
      showEditClipModal.value = true;
      openDropdownId.value = null;
    };

    const handleEditClipVideoUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        editClipForm.value.video = file;
        editClipVideoUploaded.value = true;
        editClipVideoFileName.value = file.name;
      }
    };

    const handleEditClipAudioUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        editClipForm.value.audio = file;
        editClipAudioUploaded.value = true;
        editClipAudioFileName.value = file.name;
      }
    };

    const updateClip = async () => {
      if (!editClipForm.value.title || !editClipForm.value.description) {
        toast.error('Please fill in required fields');
        return;
      }

      try {
        loading.value = true;
        
        let videoUrl = null;
        let audioUrl = null;
        
        // Upload video directly to S3 if provided
        if (editClipForm.value.video) {
          try {
            editClipUploading.value.video = true;
            editClipUploadProgress.value.video = 0;
            
            const { uploadUrl, fileUrl } = await spiritualClipService.getUploadUrl(
              editClipForm.value.video.name,
              editClipForm.value.video.type,
              'video'
            );
            
            await spiritualClipService.uploadToS3(
              uploadUrl,
              editClipForm.value.video,
              (progress) => {
                editClipUploadProgress.value.video = Math.round(progress);
              }
            );
            
            videoUrl = fileUrl;
            editClipUploading.value.video = false;
          } catch (error) {
            console.error('Video upload failed:', error);
            toast.error('Video upload failed: ' + (error.message || 'Unknown error'));
            editClipUploading.value.video = false;
            loading.value = false;
            return;
          }
        }
        
        // Upload audio directly to S3 if provided
        if (editClipForm.value.audio) {
          try {
            editClipUploading.value.audio = true;
            editClipUploadProgress.value.audio = 0;
            
            const { uploadUrl, fileUrl } = await spiritualClipService.getUploadUrl(
              editClipForm.value.audio.name,
              editClipForm.value.audio.type,
              'audio'
            );
            
            await spiritualClipService.uploadToS3(
              uploadUrl,
              editClipForm.value.audio,
              (progress) => {
                editClipUploadProgress.value.audio = Math.round(progress);
              }
            );
            
            audioUrl = fileUrl;
            editClipUploading.value.audio = false;
          } catch (error) {
            console.error('Audio upload failed:', error);
            toast.error('Audio upload failed: ' + (error.message || 'Unknown error'));
            editClipUploading.value.audio = false;
            loading.value = false;
            return;
          }
        }
        
        // Update clip data
        const updateData = {
          title: editClipForm.value.title,
          description: editClipForm.value.description,
          suitableTime: editClipForm.value.suitableTime,
          guided: editClipForm.value.guided,
          transcript: editClipForm.value.transcript,
          suitableConfiguration: editClipForm.value.suitableConfiguration
        };
        
        // Add URLs if files were uploaded
        if (videoUrl) updateData.videoUrl = videoUrl;
        if (audioUrl) updateData.audioUrl = audioUrl;
        
        const response = await spiritualClipService.updateClipDirect(editingClip.value._id, updateData);
        
        if (response.success) {
          await fetchClips();
          showEditClipModal.value = false;
          editingClip.value = null;
          toast.success('Clip updated successfully!');
        } else {
          toast.error(response.message || 'Failed to update clip');
        }
      } catch (error) {
        console.error('Error updating clip:', error);
        toast.error('Failed to update clip');
      } finally {
        loading.value = false;
        editClipUploading.value = { video: false, audio: false };
      }
    };

    const deleteClip = async (clipId) => {
      if (confirm('Are you sure you want to PERMANENTLY DELETE this clip?')) {
        try {
          loading.value = true;
          const response = await spiritualClipService.deleteClip(clipId);
          
          if (response.success) {
            await fetchClips();
            toast.success('Clip deleted successfully!');
          } else {
            toast.error(response.message || 'Failed to delete clip');
          }
        } catch (error) {
          console.error('Error deleting clip:', error);
          toast.error('Failed to delete clip');
        } finally {
          loading.value = false;
        }
        openDropdownId.value = null;
      }
    };

    const toggleClipStatus = async (clip) => {
      try {
        const response = await spiritualClipService.toggleClip(clip._id);
        
        if (response.success) {
          const index = clips.value.findIndex(c => c._id === clip._id);
          if (index !== -1) {
            clips.value[index] = {
              ...clips.value[index],
              isActive: response.data.isActive
            };
          }
          toast.success(`Clip ${response.data.isActive ? 'enabled' : 'disabled'} successfully!`);
        } else {
          toast.error(response.message || 'Failed to toggle clip status');
        }
      } catch (error) {
        console.error('Error toggling clip status:', error);
        toast.error('Failed to toggle clip status');
      }
      openDropdownId.value = null;
    };

    // Video popup functions
    const openVideoModal = (clip) => {
      if (!clip.isActive || !clip.videoUrl) return;
      selectedVideoClip.value = clip;
      showVideoModal.value = true;
      openDropdownId.value = null;
    };

    const closeVideoModal = () => {
      showVideoModal.value = false;
      selectedVideoClip.value = null;
    };

    // Audio popup functions
    const openAudioModal = (clip) => {
      if (!clip.isActive || !clip.audioUrl) return;
      selectedAudioClip.value = clip;
      showAudioModal.value = true;
      openDropdownId.value = null;
    };

    const closeAudioModal = () => {
      showAudioModal.value = false;
      selectedAudioClip.value = null;
    };

    const fetchClips = async () => {
      try {
        loading.value = true;
        // Add type filter to API call
        const response = await spiritualClipService.getAllClips({ type: currentCategory.value });
        if (response.success) {
          clips.value = response.data || [];
        }
      } catch (error) {
        console.error('Fetch clips error:', error);
        toast.error('Failed to load clips');
      } finally {
        loading.value = false;
      }
    };

    // Helper function to format user name
    const formatUserName = (userDetails) => {
      if (userDetails?.name && !userDetails.name.startsWith('User-')) {
        return userDetails.name;
      }
      
      if (userDetails?.email) {
        const username = userDetails.email.split('@')[0];
        // Remove numbers and format properly
        const cleanName = username
          .replace(/[0-9]/g, '') // Remove numbers
          .replace(/[._-]/g, ' ') // Replace separators with spaces
          .replace(/([a-z])([A-Z])/g, '$1 $2') // Add space before capital letters
          .split(' ')
          .filter(word => word.length > 0)
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        
        return cleanName || username;
      }
      
      return userDetails?.name || 'Unknown User';
    };

    const fetchUserStats = async () => {
      try {
        console.log('Fetching all users stats for category:', currentCategory.value);
        // Fetch all users stats with category filter
        const response = await spiritualStatsService.getAllUsersStats(currentCategory.value);
        if (response.success) {
          console.log('All users stats received:', response.data);
          console.log('All recent activities:', response.data.recentActivities);
          console.log('Category stats:', response.data.categoryStats);
          userStats.value = response.data;
        }
      } catch (error) {
        console.error('Fetch all users stats error:', error);
        // Keep default values on error
      }
    };

    // Test function to manually save a silence session
    const testSaveSilenceSession = async () => {
      try {
        const testSessionData = {
          type: 'silence',
          title: 'Test Silence Session',
          targetDuration: 5,
          actualDuration: 5,
          karmaPoints: 15,
          emotion: 'calm',
          status: 'completed',
          completionPercentage: 100
        };
        
        console.log('Testing silence session save:', testSessionData);
        const response = await spiritualStatsService.saveSession(testSessionData);
        console.log('Test save response:', response);
        
        if (response.success) {
          toast.success('Test silence session saved!');
          await fetchUserStats(); // Refresh stats
        } else {
          toast.error('Failed to save test session: ' + response.message);
        }
      } catch (error) {
        console.error('Test save error:', error);
        toast.error('Error saving test session: ' + error.message);
      }
    };

    const fetchConfigurations = async () => {
      try {
        loading.value = true;
        // Add type filter to API call
        const response = await spiritualConfigurationService.getAllConfigurations({ type: currentCategory.value });
        if (response.success) {
          configurations.value = response.data || [];
        }
      } catch (error) {
        console.error('Fetch configurations error:', error);
        toast.error('Failed to load configurations');
      } finally {
        loading.value = false;
      }
    };

    const addConfiguration = async () => {
      if (!configForm.value.title || !configForm.value.description) {
        toast.error('Please fill in required fields');
        return;
      }

      if (configForm.value.title.length > 100) {
        toast.error('Name cannot exceed 100 characters');
        return;
      }

      if (configForm.value.description.length > 500) {
        toast.error('Description cannot exceed 500 characters');
        return;
      }

      try {
        loading.value = true;
        const response = await spiritualConfigurationService.createConfiguration(configForm.value);
        if (response.success) {
          configurations.value.unshift(response.data);
          configForm.value = {
            title: '',
            duration: '5 minutes',
            description: '',
            emotion: '',
            karmaPoints: 10,
            type: currentCategory.value
          };
          toast.success('Configuration saved successfully!');
        }
      } catch (error) {
        console.error('Add configuration error:', error);
        toast.error('Failed to save configuration');
      } finally {
        loading.value = false;
      }
    };

    const toggleConfigDropdown = (configId) => {
      activeConfigDropdown.value = activeConfigDropdown.value === configId ? null : configId;
    };

    const viewConfig = (config) => {
      selectedConfig.value = config;
      showViewConfigModal.value = true;
      activeConfigDropdown.value = null;
    };

    const editConfig = (config) => {
      editingConfig.value = config;
      editConfigForm.value = {
        title: config.title || '',
        duration: config.duration || '15 minutes',
        description: config.description || '',
        emotion: config.emotion || '',
        karmaPoints: config.karmaPoints || 10,
        type: config.type || ''
      };
      showEditConfigModal.value = true;
      activeConfigDropdown.value = null;
    };

    const updateConfig = async () => {
      if (!editConfigForm.value.title || !editConfigForm.value.description) {
        toast.error('Please fill in required fields');
        return;
      }

      if (editConfigForm.value.title.length > 100) {
        toast.error('Name cannot exceed 100 characters');
        return;
      }

      if (editConfigForm.value.description.length > 500) {
        toast.error('Description cannot exceed 500 characters');
        return;
      }

      try {
        loading.value = true;
        const response = await spiritualConfigurationService.updateConfiguration(editingConfig.value._id, editConfigForm.value);
        if (response.success) {
          const index = configurations.value.findIndex(c => c._id === editingConfig.value._id);
          if (index !== -1) {
            configurations.value[index] = response.data;
          }
          showEditConfigModal.value = false;
          editingConfig.value = null;
          toast.success('Configuration updated successfully!');
        }
      } catch (error) {
        console.error('Update configuration error:', error);
        toast.error('Failed to update configuration');
      } finally {
        loading.value = false;
      }
    };

    const deleteConfig = async (configId) => {
      if (confirm('Are you sure you want to delete this configuration?')) {
        try {
          loading.value = true;
          const response = await spiritualConfigurationService.deleteConfiguration(configId);
          if (response.success) {
            configurations.value = configurations.value.filter(c => c._id !== configId);
            toast.success('Configuration deleted successfully!');
          }
        } catch (error) {
          console.error('Delete configuration error:', error);
          toast.error('Failed to delete configuration');
        } finally {
          loading.value = false;
        }
        activeConfigDropdown.value = null;
      }
    };

    const toggleConfigStatus = async (config) => {
      try {
        loading.value = true;
        const response = await spiritualConfigurationService.toggleConfiguration(config._id);
        if (response.success) {
          const index = configurations.value.findIndex(c => c._id === config._id);
          if (index !== -1) {
            configurations.value[index].isActive = response.data.isActive;
          }
          toast.success(`Configuration ${response.data.isActive ? 'enabled' : 'disabled'} successfully!`);
        }
      } catch (error) {
        console.error('Toggle configuration error:', error);
        toast.error('Failed to toggle configuration status');
      } finally {
        loading.value = false;
      }
      activeConfigDropdown.value = null;
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
        title: activity.title || '',
        duration: activity.duration || '',
        description: activity.description || '',
        emotion: activity.emotion || '',
        suitableTime: activity.suitableTime || '',
        guided: activity.guided || '',
        type: activity.type || '',
        transcript: activity.transcript || '',
        audio: null,
        video: null,
        image: null
      };
      editAudioUploaded.value = false;
      editAudioFileName.value = '';
      editVideoUploaded.value = false;
      editVideoFileName.value = '';
      editImageUploaded.value = false;
      editImageFileName.value = '';
      showEditModal.value = true;
      activeDropdown.value = null;
    };

    const deleteActivity = async (activityId) => {
      if (confirm('Are you sure you want to delete this activity?')) {
        try {
          const response = await spiritualStatsService.deleteSession(activityId);
          
          if (response.success) {
            // Remove from local state
            userStats.value.recentActivities = userStats.value.recentActivities.filter(a => a.id !== activityId);
            activeDropdown.value = null;
            toast.success(response.message || 'Activity deleted successfully!');
          } else {
            throw new Error(response.message || 'Failed to delete activity');
          }
        } catch (error) {
          console.error('Delete activity error:', error);
          toast.error('Failed to delete activity');
        }
      }
    };

    const toggleActivityStatus = async (activity) => {
      try {
        const response = await spiritualStatsService.toggleSession(activity.id);
        
        if (response.success) {
          // Update the activity in the stats list
          const index = userStats.value.recentActivities.findIndex(a => a.id === activity.id);
          if (index !== -1) {
            userStats.value.recentActivities[index] = {
              ...userStats.value.recentActivities[index],
              isActive: response.data.isActive
            };
          }
          activeDropdown.value = null;
          toast.success(response.message || `Activity ${response.data.isActive ? 'enabled' : 'disabled'} successfully!`);
        } else {
          throw new Error(response.message || 'Failed to toggle status');
        }
      } catch (error) {
        console.error('Error toggling status:', error);
        toast.error('Error updating status');
      }
    };

    const handleAudioUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        newActivity.value.audio = file;
        audioUploaded.value = true;
        audioFileName.value = file.name;
      }
    };

    const handleVideoUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        newActivity.value.video = file;
        videoUploaded.value = true;
        videoFileName.value = file.name;
      }
    };

    const handleImageUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        newActivity.value.image = file;
        imageUploaded.value = true;
        imageFileName.value = file.name;
      }
    };

    const handleEditAudioUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        editForm.value.audio = file;
        editAudioUploaded.value = true;
        editAudioFileName.value = file.name;
      }
    };

    const handleEditVideoUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        editForm.value.video = file;
        editVideoUploaded.value = true;
        editVideoFileName.value = file.name;
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

    const addActivity = async () => {
      if (!newActivity.value.title || !newActivity.value.description) {
        toast.error('Please fill in required fields');
        return;
      }

      try {
        loading.value = true;
        
        // Create new activity locally
        const newId = Date.now().toString();
        const createdActivity = {
          _id: newId,
          title: newActivity.value.title,
          description: newActivity.value.description,
          duration: newActivity.value.duration,
          emotion: newActivity.value.emotion,
          suitableTime: newActivity.value.suitableTime,
          guided: newActivity.value.guided,
          type: newActivity.value.type,
          transcript: newActivity.value.transcript,
          image: newActivity.value.image ? URL.createObjectURL(newActivity.value.image) : null,
          isActive: true,
          createdAt: new Date().toISOString()
        };

        activities.value.unshift(createdActivity);
        closeAddModal();
        toast.success('Spiritual activity added successfully!');
      } catch (error) {
        console.error('Error creating activity:', error);
        toast.error('Failed to create activity');
      } finally {
        loading.value = false;
      }
    };

    const updateActivity = async () => {
      if (!editForm.value.title || !editForm.value.description) {
        toast.error('Please fill in required fields');
        return;
      }

      try {
        loading.value = true;
        
        const index = activities.value.findIndex(a => a._id === editingActivity.value._id);
        if (index !== -1) {
          activities.value[index] = {
            ...activities.value[index],
            title: editForm.value.title,
            description: editForm.value.description,
            duration: editForm.value.duration,
            emotion: editForm.value.emotion,
            suitableTime: editForm.value.suitableTime,
            guided: editForm.value.guided,
            type: editForm.value.type,
            transcript: editForm.value.transcript,
            image: editForm.value.image ? URL.createObjectURL(editForm.value.image) : activities.value[index].image
          };
        }
        
        closeEditModal();
        toast.success('Activity updated successfully!');
      } catch (error) {
        console.error('Error updating activity:', error);
        toast.error('Failed to update activity');
      } finally {
        loading.value = false;
      }
    };

    const handleClipVideoUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        addClipForm.value.video = file;
        clipVideoUploaded.value = true;
        clipVideoFileName.value = file.name;
      }
    };

    const handleClipAudioUpload = (event) => {
      const file = event.target.files[0];
      if (file) {
        addClipForm.value.audio = file;
        clipAudioUploaded.value = true;
        clipAudioFileName.value = file.name;
      }
    };

    const closeAddClipModal = () => {
      showAddClipModal.value = false;
      addClipForm.value = {
        title: '',
        description: '',
        video: null,
        audio: null,
        suitableTime: '',
        guided: '',
        transcript: ''
      };
      clipVideoUploaded.value = false;
      clipVideoFileName.value = '';
      clipAudioUploaded.value = false;
      clipAudioFileName.value = '';
      clipUploadProgress.value = { video: 0, audio: 0 };
      clipUploading.value = { video: false, audio: false };
    };

    const addClip = async () => {
      if (!addClipForm.value.title || !addClipForm.value.description) {
        toast.error('Please fill in required fields');
        return;
      }

      try {
        loading.value = true;
        
        let videoUrl = null;
        let audioUrl = null;
        
        // Upload video directly to S3 if provided
        if (addClipForm.value.video) {
          try {
            clipUploading.value.video = true;
            clipUploadProgress.value.video = 0;
            
            const { uploadUrl, fileUrl } = await spiritualClipService.getUploadUrl(
              addClipForm.value.video.name,
              addClipForm.value.video.type,
              'video'
            );
            
            await spiritualClipService.uploadToS3(
              uploadUrl,
              addClipForm.value.video,
              (progress) => {
                clipUploadProgress.value.video = Math.round(progress);
              }
            );
            
            videoUrl = fileUrl;
            clipUploading.value.video = false;
          } catch (error) {
            console.error('Video upload failed:', error);
            toast.error('Video upload failed: ' + (error.message || 'Unknown error'));
            clipUploading.value.video = false;
            loading.value = false;
            return;
          }
        }
        
        // Upload audio directly to S3 if provided
        if (addClipForm.value.audio) {
          try {
            clipUploading.value.audio = true;
            clipUploadProgress.value.audio = 0;
            
            const { uploadUrl, fileUrl } = await spiritualClipService.getUploadUrl(
              addClipForm.value.audio.name,
              addClipForm.value.audio.type,
              'audio'
            );
            
            await spiritualClipService.uploadToS3(
              uploadUrl,
              addClipForm.value.audio,
              (progress) => {
                clipUploadProgress.value.audio = Math.round(progress);
              }
            );
            
            audioUrl = fileUrl;
            clipUploading.value.audio = false;
          } catch (error) {
            console.error('Audio upload failed:', error);
            toast.error('Audio upload failed: ' + (error.message || 'Unknown error'));
            clipUploading.value.audio = false;
            loading.value = false;
            return;
          }
        }
        
        // Create clip with S3 URLs and category type
        const response = await spiritualClipService.createClipDirect({
          title: addClipForm.value.title,
          description: addClipForm.value.description,
          suitableTime: addClipForm.value.suitableTime,
          guided: addClipForm.value.guided,
          transcript: addClipForm.value.transcript,
          type: currentCategory.value,  // Add category type
          suitableConfiguration: addClipForm.value.suitableConfiguration,
          videoUrl,
          audioUrl
        });
        
        if (response.success) {
          await fetchClips();
          closeAddClipModal();
          toast.success('Clip added successfully!');
        } else {
          toast.error(response.message || 'Failed to create clip');
        }
      } catch (error) {
        console.error('Error creating clip:', error);
        toast.error('Failed to create clip');
      } finally {
        loading.value = false;
      }
    };

    const closeAddModal = () => {
      showAddModal.value = false;
      newActivity.value = {
        title: '',
        duration: '5 minutes',
        description: '',
        emotion: '',
        suitableTime: '',
        guided: '',
        type: '',
        transcript: '',
        audio: null,
        video: null,
        image: null
      };
      audioUploaded.value = false;
      audioFileName.value = '';
      videoUploaded.value = false;
      videoFileName.value = '';
      imageUploaded.value = false;
      imageFileName.value = '';
    };

    const closeEditModal = () => {
      showEditModal.value = false;
      editingActivity.value = null;
      editForm.value = {
        title: '',
        duration: '',
        description: '',
        emotion: '',
        suitableTime: '',
        guided: '',
        type: '',
        transcript: '',
        audio: null,
        video: null,
        image: null
      };
      editAudioUploaded.value = false;
      editAudioFileName.value = '';
      editVideoUploaded.value = false;
      editVideoFileName.value = '';
      editImageUploaded.value = false;
      editImageFileName.value = '';
    };

    onMounted(() => {
      // Update category from route if needed
      if (route.params.category && route.params.category !== currentCategory.value) {
        currentCategory.value = route.params.category;
      }
      
      // Check if client is logged in
      const clientToken = localStorage.getItem('token_client');
      console.log('Client token check:', clientToken ? 'Token exists' : 'No token found');
      
      if (!clientToken) {
        console.error('Client not logged in - redirecting to login');
        router.push('/client/login');
        return;
      }
      
      // Fetch all data for the current category
      fetchConfigurations();
      fetchClips();
      fetchUserStats();
    });

    return () => (
      <div class="container-fluid px-3 px-lg-4">
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
                  <span>Back to Check-in</span>
                </button>
                <div class="flex-grow-1">
                  <h1 class="mb-1 fw-bold fs-2 text-dark">
                    {currentCategoryInfo.value.emoji} {currentCategoryInfo.value.name} Management
                  </h1>
                  <p class="mb-0 text-dark" style={{ opacity: 0.8 }}>
                    Manage {currentCategoryInfo.value.name.toLowerCase()} configurations and clips
                  </p>
                </div>

              </div>
            </div>

            {/* Activities Grid */}
            {loading.value ? (
              <div class="text-center py-5">
                <div class="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
                  <span class="visually-hidden">Loading...</span>
                </div>
                <p class="text-muted">Loading activities...</p>
              </div>
            ) : activities.value.length > 0 ? (
              <div class="row g-4">
                {activities.value.map(activity => (
                  <div key={activity._id} class="col-xl-4 col-lg-6 col-md-6 col-sm-12">
                    <div class="card border-0 shadow-sm h-100 position-relative overflow-hidden" style={{ borderRadius: '16px' }}>
                      {/* Disabled Overlay */}
                      {!activity.isActive && (
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
                            <h6 class="text-muted fw-bold">Activity Disabled</h6>
                          </div>
                        </div>
                      )}
                      
                      <div class="card-body p-4 position-relative" style={{ zIndex: 1 }}>
                        {/* Activity Header */}
                        <div class="d-flex align-items-start justify-content-between mb-3">
                          <div class="d-flex align-items-center gap-3 flex-grow-1">
                            <div class="position-relative">
                              <div 
                                class="rounded-circle bg-white d-flex align-items-center justify-content-center overflow-hidden shadow-sm"
                                style={{ width: '50px', height: '50px', minWidth: '50px', border: '2px solid #fff' }}
                              >
                                {activity.image ? (
                                  <img 
                                    src={activity.image} 
                                    alt={activity.title}
                                    class="w-100 h-100 object-fit-cover"
                                    style={{ objectFit: 'cover' }}
                                  />
                                ) : (
                                  <span style={{ fontSize: '1.5rem' }}>🧘</span>
                                )}
                              </div>
                            </div>
                            <div class="flex-grow-1 min-w-0">
                              <h6 class="fw-bold mb-1 text-truncate">{activity.title}</h6>
                              <span 
                                class="badge rounded-pill px-2 py-1"
                                style={{ 
                                  backgroundColor: activity.isActive ? '#10b981' + '20' : '#6b7280' + '20',
                                  color: activity.isActive ? '#10b981' : '#6b7280',
                                  fontSize: '0.75rem'
                                }}
                              >
                                {activity.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </div>
                          </div>
                          <div class="dropdown">
                            <button 
                              class="btn btn-dark rounded-circle p-2 d-flex align-items-center justify-content-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDropdown(activity._id);
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
                            {activeDropdown.value === activity._id && (
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
                                {activity.isActive ? (
                                  <>
                                    <button class="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => viewActivity(activity)}>
                                      <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                                      <span>View</span>
                                    </button>
                                    <button class="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => editActivity(activity)}>
                                      <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                                      <span>Edit</span>
                                    </button>
                                    <button 
                                      class="dropdown-item d-flex align-items-center gap-2 py-2" 
                                      onClick={() => toggleActivityStatus(activity)}
                                    >
                                      <span>🔴</span>
                                      <span>Disable</span>
                                    </button>
                                    <hr class="dropdown-divider my-1" />
                                    <button class="dropdown-item text-danger d-flex align-items-center gap-2 py-2" onClick={() => deleteActivity(activity._id)}>
                                      <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                                      <span>Delete</span>
                                    </button>
                                  </>
                                ) : (
                                  <button 
                                    class="dropdown-item d-flex align-items-center gap-2 py-2" 
                                    onClick={() => toggleActivityStatus(activity)}
                                  >
                                    <span>🟢</span>
                                    <span>Enable</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Activity Details */}
                        <div class="mb-3">
                          <div class="bg-light rounded p-2">
                            <small class="text-muted" style={{ lineHeight: '1.4' }}>
                              {(activity.description?.length || 0) > 80 
                                ? activity.description.substring(0, 80) + '...' 
                                : activity.description || 'No description available'
                              }
                            </small>
                          </div>
                        </div>

                        {/* Activity Info */}
                        <div class="row g-2 mb-3">
                          <div class="col-6">
                            <small class="text-muted d-block"><strong>Created:</strong></small>
                            <small class="text-dark">
                              {new Date(activity.createdAt).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric'
                              })}
                            </small>
                          </div>
                          <div class="col-6">
                            <small class="text-muted d-block"><strong>Type:</strong></small>
                            <small class="text-dark">
                              {activity.type || 'General'}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {/* Tabs */}
                <div class="mb-4">
                  <ul class="nav nav-tabs">
                    <li class="nav-item">
                      <button 
                        class={`nav-link ${activeTab.value === 'configuration' ? 'active' : ''}`}
                        onClick={() => activeTab.value = 'configuration'}
                      >
                        Configuration
                      </button>
                    </li>
                    <li class="nav-item">
                      <button 
                        class={`nav-link ${activeTab.value === 'clips' ? 'active' : ''}`}
                        onClick={() => activeTab.value = 'clips'}
                      >
                        Clips
                      </button>
                    </li>
                    <li class="nav-item">
                      <button 
                        class={`nav-link ${activeTab.value === 'states' ? 'active' : ''}`}
                        onClick={() => activeTab.value = 'states'}
                      >
                        Stats
                      </button>
                    </li>
                  </ul>
                </div>

                {/* Tab Content */}
                {activeTab.value === 'configuration' ? (
                  <div>
                    <div class="card border-0 shadow-sm">
                      <div class="card-header text-white" style={{ backgroundColor: currentCategoryInfo.value.color }}>
                        <h5 class="mb-0 fw-bold">
                          {currentCategoryInfo.value.emoji} {currentCategoryInfo.value.name} Configuration
                        </h5>
                      </div>
                      <div class="card-body p-4">
                        <div class="row">
                          <div class="col-md-6">
                            <div class="mb-3">
                              <label class="form-label fw-semibold">Name  *</label>
                              <input 
                                type="text" 
                                class="form-control" 
                                placeholder={`Enter ${currentCategoryInfo.value.name.toLowerCase()} configuration name`}
                                maxlength="100"
                                v-model={configForm.value.title}
                              />
                              <small class="form-text text-muted">{configForm.value.title.length}/100 characters</small>
                            </div>
                          </div>
                          <div class="col-md-6">
                            {currentCategoryOptions.value.length > 0 && (
                              <div class="mb-3">
                                <label class="form-label fw-semibold">{currentCategoryInfo.value.name} Type</label>
                                <select 
                                  class="form-select" 
                                  value={configForm.value.chantingType}
                                  onChange={(e) => handleCategoryOptionChange(e.target.value)}
                                >
                                  <option value="">Select {currentCategoryInfo.value.name.toLowerCase()} type</option>
                                  {currentCategoryOptions.value.map(option => (
                                    <option key={option} value={option}>{option}</option>
                                  ))}
                                </select>
                                {showCustomInput.value && (
                                  <div class="mt-2">
                                    <input 
                                      type="text" 
                                      class="form-control" 
                                      placeholder={`Enter custom ${currentCategoryInfo.value.name.toLowerCase()} type`}
                                      v-model={configForm.value.customChantingType}
                                    />
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                        <div class="mb-3">
                          <label class="form-label fw-semibold">Description *</label>
                          <textarea 
                            class="form-control" 
                            rows="3" 
                            placeholder={`Describe the ${currentCategoryInfo.value.name.toLowerCase()} configuration...`}
                            maxlength="500"
                            v-model={configForm.value.description}
                          ></textarea>
                          <small class="form-text text-muted">{configForm.value.description.length}/500 characters</small>
                        </div>
                        <div class="row">
                          <div class="col-md-12">
                            {currentCategory.value !== 'chanting' && (
                              <div class="mb-3">
                                <label class="form-label fw-semibold">Duration</label>
                                <div class="row g-2">
                                  {[
                                    '1 minute', '2 minutes', '3 minutes', '4 minutes', 
                                    '5 minutes', '6 minutes', '7 minutes', '8 minutes', 
                                    '9 minutes', '10 minutes'
                                  ].map(duration => (
                                    <div key={duration} class="col-4">
                                      <div class="form-check">
                                        <input 
                                          class="form-check-input" 
                                          type="radio" 
                                          name="configDuration"
                                          id={`config-duration-${duration}`}
                                          value={duration}
                                          checked={configForm.value.duration === duration}
                                          onChange={(e) => {
                                            configForm.value.duration = e.target.value;
                                          }}
                                        />
                                        <label class="form-check-label" for={`config-duration-${duration}`}>
                                          {duration} {configForm.value.duration === duration ? '(Default)' : ''}
                                        </label>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <div class="row">
                          <div class="col-md-12">
                            <div class="mb-3">
                              <label class="form-label fw-semibold">Emotion</label>
                              <div class="row g-2">
                                {[
                                  { value: 'happy', emoji: '😊', label: 'Happy' },
                                  { value: 'sad', emoji: '😢', label: 'Sad' },
                                  { value: 'angry', emoji: '😠', label: 'Angry' },
                                  { value: 'afraid', emoji: '😨', label: 'Afraid' },
                                  { value: 'loved', emoji: '🥰', label: 'Loved' },
                                  { value: 'surprised', emoji: '😲', label: 'Surprised' },
                                  { value: 'calm', emoji: '😌', label: 'Calm' },
                                  { value: 'disgusted', emoji: '🤢', label: 'Disgusted' },
                                  { value: 'neutral', emoji: '😐', label: 'Neutral' },
                                  { value: 'stress', emoji: '😰', label: 'Stress' }
                                ].map(emotion => (
                                  <div key={emotion.value} class="col-3">
                                    <div class="form-check">
                                      <input 
                                        class="form-check-input" 
                                        type="radio" 
                                        name="configEmotion"
                                        id={`config-emotion-${emotion.value}`}
                                        value={emotion.value}
                                        checked={configForm.value.emotion === emotion.value}
                                        onChange={(e) => {
                                          configForm.value.emotion = e.target.value;
                                        }}
                                      />
                                      <label class="form-check-label" for={`config-emotion-${emotion.value}`}>
                                        {emotion.emoji} {emotion.label} {configForm.value.emotion === emotion.value ? '(Default)' : ''}
                                      </label>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                        <div class="mb-3">
                          <label class="form-label fw-semibold">Karma Points</label>
                          <input 
                            type="number" 
                            class="form-control" 
                            placeholder="Enter karma points (1-100)"
                            min="1"
                            max="100"
                            v-model={configForm.value.karmaPoints}
                          />
                          <small class="form-text text-muted">Points awarded for completing this activity (1-100)</small>
                        </div>
                        <div class="text-center">
                          <button 
                            class="btn btn-primary btn-lg px-5" 
                            onClick={addConfiguration}
                            disabled={loading.value || !configForm.value.title || !configForm.value.description}
                          >
                            {loading.value ? 'Saving...' : 'Save Configuration'}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Saved Configurations */}
                    {filteredConfigurations.value.length > 0 && (
                      <div class="mt-4">
                        <h6 class="fw-bold mb-3">
                          {currentCategoryInfo.value.name} Configurations ({filteredConfigurations.value.length})
                        </h6>
                        <div class="row g-3">
                          {filteredConfigurations.value.map(config => (
                            <div key={config._id} class="col-md-6 col-lg-4">
                              <div class={`card border-0 shadow-sm h-100 position-relative ${!config.isActive ? 'opacity-75' : ''}`}>
                                {!config.isActive && (
                                  <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(255,255,255,0.6)', zIndex: 2, pointerEvents: 'none' }}>
                                    <span class="badge bg-secondary px-3 py-2 rounded-pill shadow">🔒 Disabled</span>
                                  </div>
                                )}
                                <div class="card-body p-3" style={{ zIndex: 3, position: 'relative' }}>
                                  <div class="d-flex justify-content-between align-items-start mb-2">
                                    <h6 class="fw-bold mb-1 text-truncate flex-grow-1">{config.title}</h6>
                                    <div class="dropdown">
                                      <button 
                                        class="btn btn-light btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleConfigDropdown(config._id);
                                        }}
                                        style={{ width: '28px', height: '28px', zIndex: 20, position: 'relative' }}
                                      >
                                        <EllipsisVerticalIcon style={{ width: '14px', height: '14px' }} />
                                      </button>
                                      {activeConfigDropdown.value === config._id && (
                                        <div class="dropdown-menu show position-absolute shadow" style={{ zIndex: 1050, right: '0', left: 'auto', top: '100%', minWidth: '140px' }}>
                                          {config.isActive ? (
                                            <>
                                              <button class="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => viewConfig(config)}>
                                                <EyeIcon style={{ width: '14px', height: '14px' }} />
                                                <span>View</span>
                                              </button>
                                              <button class="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => editConfig(config)}>
                                                <PencilIcon style={{ width: '14px', height: '14px' }} />
                                                <span>Edit</span>
                                              </button>
                                              <button class="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => toggleConfigStatus(config)}>
                                                <span>🔴</span>
                                                <span>Disable</span>
                                              </button>
                                              <hr class="dropdown-divider my-1" />
                                              <button class="dropdown-item text-danger d-flex align-items-center gap-2 py-2" onClick={() => deleteConfig(config._id)}>
                                                <TrashIcon style={{ width: '14px', height: '14px' }} />
                                                <span>Delete</span>
                                              </button>
                                            </>
                                          ) : (
                                            <button class="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => toggleConfigStatus(config)}>
                                              <span>🟢</span>
                                              <span>Enable</span>
                                            </button>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                  <p class="text-muted small mb-2 lh-sm">
                                    {config.description.length > 80 ? config.description.substring(0, 80) + '...' : config.description}
                                  </p>
                                  <div class="row g-2 mb-2">
                                    {config.duration && currentCategory.value !== 'chanting' && (
                                      <div class="col-6">
                                        <small class="text-muted d-block">Duration:</small>
                                        <span class="badge bg-primary-subtle text-primary px-2 py-1">{config.duration}</span>
                                      </div>
                                    )}
                                    <div class={config.duration && currentCategory.value !== 'chanting' ? "col-6" : "col-12"}>
                                      <small class="text-muted d-block">Type:</small>
                                      <span class="badge bg-secondary-subtle text-secondary px-2 py-1">{config.type || 'General'}</span>
                                    </div>
                                  </div>
                                  {config.emotion && (
                                    <div class="mb-2">
                                      <small class="text-muted d-block">Emotion:</small>
                                      <span class="badge bg-warning-subtle text-warning px-2 py-1">
                                        {{
                                          happy: '😊 Happy',
                                          sad: '😢 Sad', 
                                          angry: '😠 Angry',
                                          afraid: '😨 Afraid',
                                          loved: '🥰 Loved',
                                          surprised: '😲 Surprised',
                                          calm: '😌 Calm',
                                          disgusted: '🤢 Disgusted',
                                          neutral: '😐 Neutral',
                                          stress: '😰 Stress'
                                        }[config.emotion] || config.emotion}
                                      </span>
                                    </div>
                                  )}
                                  <div class="d-flex justify-content-between align-items-center pt-2 border-top border-light">
                                    <small class="text-muted">
                                      {new Date(config.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </small>
                                    <span class={`badge ${config.isActive ? 'bg-success' : 'bg-secondary'} px-2 py-1`}>
                                      {config.isActive ? '✅ Active' : '❌ Inactive'}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeTab.value === 'clips' ? (
                  <div>
                    {/* Clips Header */}
                    <div class="d-flex justify-content-between align-items-center mb-4">
                      <div>
                        <h4 class="fw-bold mb-1">
                          {currentCategoryInfo.value.emoji} {currentCategoryInfo.value.name} Clips
                        </h4>
                        <p class="text-muted mb-0">Manage your {currentCategoryInfo.value.name.toLowerCase()} clips</p>
                      </div>
                      <button 
                        class="btn btn-primary btn-lg rounded-pill px-4 shadow-sm"
                        onClick={() => showAddClipModal.value = true}
                        disabled={loading.value}
                        style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}
                      >
                        <PlusIcon style={{ width: '1.2rem', height: '1.2rem' }} />
                        <span>Add Clip</span>
                      </button>
                    </div>
                    
                    {/* Clips Grid */}
                    {filteredClips.value.length > 0 ? (
                      <div class="row g-3">
                        {filteredClips.value.map(clip => (
                          <div key={clip._id} class="col-12 col-md-6 col-lg-4">
                            <div class={`card h-100 border-0 shadow-sm position-relative ${!clip.isActive ? 'opacity-50' : ''}`} style={{ borderRadius: '16px', transition: 'all 0.3s ease' }}>
                              {!clip.isActive && (
                                <div class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" style={{ backgroundColor: 'rgba(0,0,0,0.1)', zIndex: 1, borderRadius: '16px', cursor: 'default' }}>
                                  <span class="badge bg-secondary px-3 py-2 rounded-pill shadow d-flex align-items-center gap-2">
                                    <XCircleIcon style={{ width: '16px', height: '16px' }} />
                                    Disabled
                                  </span>
                                </div>
                              )}
                              
                              {/* Card Media */}
                              <div class="position-relative" style={{ height: '200px', overflow: 'hidden', borderRadius: '16px 16px 0 0', backgroundColor: '#f8f9fa' }}>
                                {clip.videoUrl ? (
                                  <>
                                    <video 
                                      class="w-100 h-100"
                                      style={{ objectFit: 'cover', cursor: clip.isActive ? 'pointer' : 'not-allowed' }}
                                      muted
                                      preload="metadata"
                                      onClick={() => openVideoModal(clip)}
                                      onError={(e) => console.error('Video load error:', e)}
                                    >
                                      <source src={clip.videoUrl} type="video/mp4" />
                                      Your browser does not support the video tag.
                                    </video>
                                    <div class="position-absolute top-50 start-50 translate-middle">
                                      <button 
                                        class={`btn btn-primary rounded-circle ${!clip.isActive ? 'disabled' : ''}`}
                                        style={{ width: '60px', height: '60px', cursor: clip.isActive ? 'pointer' : 'not-allowed' }}
                                        disabled={!clip.isActive}
                                        onClick={() => openVideoModal(clip)}
                                      >
                                        <PlayIcon style={{ width: '24px', height: '24px' }} />
                                      </button>
                                    </div>
                                  </>
                                ) : clip.audioUrl ? (
                                  <div 
                                    class="w-100 h-100 d-flex align-items-center justify-content-center bg-gradient-primary position-relative"
                                    style={{ cursor: clip.isActive ? 'pointer' : 'not-allowed' }}
                                    onClick={() => clip.isActive && openAudioModal(clip)}
                                  >
                                    <div class="text-center text-white">
                                      <MusicalNoteIcon style={{ width: '48px', height: '48px', marginBottom: '8px' }} />
                                      <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>Audio Only</div>
                                      <small class="d-block mt-1">Click to play audio</small>
                                    </div>
                                    <div class="position-absolute top-50 start-50 translate-middle">
                                      <button 
                                        class={`btn btn-primary rounded-circle ${!clip.isActive ? 'disabled' : ''}`}
                                        style={{ width: '60px', height: '60px', cursor: clip.isActive ? 'pointer' : 'not-allowed' }}
                                        disabled={!clip.isActive}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          clip.isActive && openAudioModal(clip);
                                        }}
                                      >
                                        <PlayIcon style={{ width: '24px', height: '24px' }} />
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                                    <div class="text-center text-muted">
                                      <PhotoIcon style={{ width: '48px', height: '48px', marginBottom: '8px' }} />
                                      <div style={{ fontSize: '1.1rem', fontWeight: '600' }}>No Media</div>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div class="card-body p-3">
                                <div class="d-flex justify-content-between align-items-start mb-2">
                                  <h6 class="fw-bold mb-0 text-truncate" style={{ fontSize: '1rem' }}>{clip.title}</h6>
                                  <div class="dropdown position-relative">
                                    <button 
                                      class="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center"
                                      onClick={() => toggleClipDropdown(clip._id)}
                                      style={{ width: '40px', height: '40px', position: 'relative', zIndex: 10 }}
                                    >
                                      <EllipsisVerticalIcon style={{ width: '20px', height: '20px' }} />
                                    </button>
                                    {openDropdownId.value === clip._id && (
                                      <div class="dropdown-menu show position-absolute shadow-lg border-0 rounded-3" style={{ minWidth: '160px', right: '0', top: '100%', zIndex: 1000 }}>
                                        {clip.isActive && (
                                          <>
                                            <button 
                                              class="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
                                              onClick={() => viewClip(clip)}
                                            >
                                              <EyeIcon style={{ width: '18px', height: '18px' }} />
                                              <span>View Details</span>
                                            </button>
                                            <button 
                                              class="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
                                              onClick={() => editClip(clip)}
                                            >
                                              <PencilIcon style={{ width: '18px', height: '18px' }} />
                                              <span>Edit</span>
                                            </button>
                                          </>
                                        )}
                                        <button 
                                          class="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
                                          onClick={() => toggleClipStatus(clip)}
                                        >
                                          {clip.isActive ? (
                                            <XCircleIcon style={{ width: '18px', height: '18px' }} class="text-danger" />
                                          ) : (
                                            <CheckCircleIcon style={{ width: '18px', height: '18px' }} class="text-success" />
                                          )}
                                          <span>{clip.isActive ? 'Disable' : 'Enable'}</span>
                                        </button>
                                        {clip.isActive && (
                                          <>
                                            <div class="dropdown-divider"></div>
                                            <button 
                                              class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-danger"
                                              onClick={() => deleteClip(clip._id)}
                                            >
                                              <TrashIcon style={{ width: '18px', height: '18px' }} />
                                              <span>Delete</span>
                                            </button>
                                          </>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                
                                <p class="text-muted small mb-3 lh-base" style={{ fontSize: '0.85rem' }}>
                                  {clip.description.length > 80 ? clip.description.substring(0, 80) + '...' : clip.description}
                                </p>
                                
                                {/* Content Badges */}
                                <div class="d-flex flex-wrap gap-1 mb-3">
                                  {clip.videoUrl && (
                                    <span 
                                      class={`badge bg-success d-flex align-items-center gap-1 ${clip.isActive ? 'cursor-pointer' : ''}`}
                                      style={{ cursor: clip.isActive ? 'pointer' : 'not-allowed', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                      title={clip.isActive ? "Click to view video" : "Content disabled"}
                                      onClick={() => clip.isActive && openVideoModal(clip)}
                                    >
                                      <PlayIcon style={{ width: '14px', height: '14px' }} />
                                      Video
                                    </span>
                                  )}
                                  {clip.audioUrl && (
                                    <span 
                                      class={`badge bg-primary d-flex align-items-center gap-1 ${clip.isActive ? 'cursor-pointer' : ''}`}
                                      style={{ cursor: clip.isActive ? 'pointer' : 'not-allowed', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                      title={clip.isActive ? "Click to play audio" : "Content disabled"}
                                      onClick={() => clip.isActive && openAudioModal(clip)}
                                    >
                                      <MusicalNoteIcon style={{ width: '14px', height: '14px' }} />
                                      Audio
                                    </span>
                                  )}
                                  {clip.suitableConfiguration && (
                                    <span 
                                      class="badge bg-secondary d-flex align-items-center gap-1"
                                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                      title={clip.suitableConfiguration.description || 'Configuration'}
                                    >
                                      <span>⚙️</span>
                                      {clip.suitableConfiguration.title}
                                    </span>
                                  )}
                                  {clip.suitableTime && (
                                    <span 
                                      class="badge bg-info d-flex align-items-center gap-1"
                                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                    >
                                      <span>🕐</span>
                                      {clip.suitableTime}
                                    </span>
                                  )}
                                  {clip.guided && (
                                    <span 
                                      class="badge bg-warning d-flex align-items-center gap-1"
                                      style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}
                                    >
                                      <span>🎯</span>
                                      {clip.guided}
                                    </span>
                                  )}
                                </div>
                                
                                <div class="d-flex justify-content-between align-items-center">
                                  <small class="text-muted">
                                    {new Date(clip.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  </small>
                                  {!clip.isActive && (
                                    <span class="badge bg-secondary small">Disabled</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div class="text-center py-5">
                        <div class="mb-4">
                          <span style={{ fontSize: '4rem' }}>🎥</span>
                        </div>
                        <h3 class="text-muted mb-3">No {currentCategoryInfo.value.name.toLowerCase()} clips available</h3>
                        <p class="text-muted mb-4">Start by adding your first {currentCategoryInfo.value.name.toLowerCase()} clip</p>
                        <button 
                          class="btn btn-primary btn-lg"
                          onClick={() => showAddClipModal.value = true}
                        >
                          <PlusIcon style={{ width: '1.2rem', height: '1.2rem', marginRight: '0.5rem' }} />
                          Add Your First Clip
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div>
                    {/* User Activity History */}
                    <div class="row g-4">
                      {/* Total Minutes - Hide for chanting */}
                      {currentCategory.value !== 'chanting' && (
                        <div class="col-md-3">
                          <div class="card border-0 shadow-sm h-100">
                            <div class="card-body text-center">
                              <div class="mb-3">
                                <ClockIcon style={{ width: '2.5rem', height: '2.5rem', color: '#06b6d4' }} />
                              </div>
                              <h4 class="fw-bold mb-1">{userStats.value.categoryStats[currentCategory.value]?.minutes || 0}</h4>
                              <p class="text-muted mb-0">Total Minutes</p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Total Karma Points */}
                      <div class={currentCategory.value === 'chanting' ? "col-md-4" : "col-md-3"}>
                        <div class="card border-0 shadow-sm h-100">
                          <div class="card-body text-center">
                            <div class="mb-3">
                              <SparklesIcon style={{ width: '2.5rem', height: '2.5rem', color: '#f59e0b' }} />
                            </div>
                            <h4 class="fw-bold mb-1">{userStats.value.categoryStats[currentCategory.value]?.karmaPoints || 0}</h4>
                            <p class="text-muted mb-0">Karma Points</p>
                          </div>
                        </div>
                      </div>

                      {/* Total Sessions */}
                      <div class={currentCategory.value === 'chanting' ? "col-md-4" : "col-md-3"}>
                        <div class="card border-0 shadow-sm h-100">
                          <div class="card-body text-center">
                            <div class="mb-3">
                              <ChartBarIcon style={{ width: '2.5rem', height: '2.5rem', color: '#8b5cf6' }} />
                            </div>
                            <h4 class="fw-bold mb-1">{userStats.value.categoryStats[currentCategory.value]?.sessions || 0}</h4>
                            <p class="text-muted mb-0">Total Sessions</p>
                            <div class="mt-2">
                              <small class="text-success">✅ {userStats.value.categoryStats[currentCategory.value]?.completed || 0} Completed</small>
                              <br />
                              <small class="text-warning">⚠️ {userStats.value.categoryStats[currentCategory.value]?.incomplete || 0} Incomplete</small>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Average Completion */}
                      <div class={currentCategory.value === 'chanting' ? "col-md-4" : "col-md-3"}>
                        <div class="card border-0 shadow-sm h-100">
                          <div class="card-body text-center">
                            <div class="mb-3">
                              <FireIcon style={{ width: '2.5rem', height: '2.5rem', color: '#ef4444' }} />
                            </div>
                            <h4 class="fw-bold mb-1">{Math.round(userStats.value.categoryStats[currentCategory.value]?.averageCompletion || 0)}%</h4>
                            <p class="text-muted mb-0">Avg Completion</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Category Stats */}
                    <div class="row g-4 mt-2">
                      {Object.entries(userStats.value.categoryStats).filter(([category]) => category === currentCategory.value).map(([category, stats]) => {
                        const categoryEmojis = {
                          meditation: '🧘',
                          prayer: '🙏',
                          chanting: '🎵',
                          silence: '🤫',
                          breathing: '💭',
                          mindfulness: '🌸',
                          yoga: '🧘‍♀️',
                          gratitude: '🙏',
                          reflection: '🤔'
                        };
                        const badgeColors = {
                          meditation: 'bg-primary',
                          prayer: 'bg-success', 
                          chanting: 'bg-warning',
                          silence: 'bg-secondary',
                          breathing: 'bg-info',
                          mindfulness: 'bg-danger',
                          yoga: 'bg-primary',
                          gratitude: 'bg-success',
                          reflection: 'bg-warning'
                        };
                        return (
                          <div key={category} class="col-md-3">
                            <div class="card border-0 shadow-sm h-100">
                              <div class="card-body text-center">
                                <div class="mb-3">
                                  <span style={{ fontSize: '2rem' }}>{categoryEmojis[category] || '🧘'}</span>
                                </div>
                                <h5 class="fw-bold mb-1">{stats.sessions} Sessions</h5>
                                {category !== 'chanting' && (
                                  <p class="text-muted mb-1">{stats.minutes} minutes</p>
                                )}
                                <div class="d-flex justify-content-center gap-2 mb-2">
                                  <small class="text-success">✅ {stats.completed || 0}</small>
                                  <small class="text-warning">⚠️ {stats.incomplete || 0}</small>
                                </div>
                                <span class={`badge ${badgeColors[category] || 'bg-primary'}`}>{stats.karmaPoints} points</span>
                                <div class="mt-1">
                                  <small class="text-muted">{Math.round(stats.averageCompletion || 100)}% avg completion</small>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <div class="card border-0 shadow-sm">
                      <div class="card-header bg-light">
                        <div class="d-flex justify-content-between align-items-center">
                          <div>
                            <h5 class="mb-0 fw-bold d-flex align-items-center gap-2">
                              <span>📋</span> All Users Activity History
                            </h5>
                            <small class="text-muted">Showing {currentCategoryInfo.value.name.toLowerCase()} activities from all users</small>
                          </div>
                          <div class="text-end">
                            <div class="badge bg-primary px-3 py-2">
                              <strong>{filteredRecentActivities.value.length}</strong> Activities
                            </div>
                            <div class="badge bg-success px-3 py-2 ms-2">
                              <strong>{[...new Set(filteredRecentActivities.value.map(a => a.userDetails?.email))].length}</strong> Users
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="card-body p-0">
                        {filteredRecentActivities.value.length > 0 ? (
                          <div class="table-responsive">
                            <table class="table table-hover mb-0">
                              <thead class="table-light">
                                <tr>
                                  <th scope="col" class="fw-semibold">User</th>
                                  <th scope="col" class="fw-semibold">Activity</th>
                                  <th scope="col" class="fw-semibold">Type</th>
                                  {currentCategory.value !== 'chanting' && (
                                    <>
                                      <th scope="col" class="fw-semibold">Target Duration</th>
                                      <th scope="col" class="fw-semibold">Actual Duration</th>
                                    </>
                                  )}
                                  {currentCategory.value === 'chanting' && (
                                    <th scope="col" class="fw-semibold">Chant Count</th>
                                  )}
                                  <th scope="col" class="fw-semibold">Completion</th>
                                  <th scope="col" class="fw-semibold">Emotion</th>
                                  <th scope="col" class="fw-semibold">Karma Points</th>
                                  <th scope="col" class="fw-semibold">Video</th>
                                  <th scope="col" class="fw-semibold">Audio</th>
                                  <th scope="col" class="fw-semibold">Date</th>
                                  <th scope="col" class="fw-semibold">Status</th>
                                  <th scope="col" class="fw-semibold">Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {filteredRecentActivities.value.map((activity, index) => {
                                  const activityEmojis = {
                                    meditation: '🧘',
                                    prayer: '🙏',
                                    chanting: '🎵',
                                    silence: '🤫',
                                    breathing: '💭',
                                    mindfulness: '🌸',
                                    yoga: '🧘♀️',
                                    gratitude: '🙏',
                                    reflection: '🤔'
                                  };
                                  const emotionEmojis = {
                                    happy: '😊',
                                    sad: '😢',
                                    angry: '😠',
                                    afraid: '😨',
                                    loved: '🥰',
                                    surprised: '😲',
                                    calm: '😌',
                                    disgusted: '🤢',
                                    neutral: '😐',
                                    stress: '😰'
                                  };
                                  return (
                                    <tr key={activity.id} style={{ opacity: activity.isActive ? 1 : 0.5 }}>
                                      <td>
                                        <div class="d-flex align-items-center gap-2">
                                          <div class="bg-primary rounded-circle d-flex align-items-center justify-content-center" style={{ width: '32px', height: '32px', minWidth: '32px' }}>
                                            <span class="text-white fw-bold" style={{ fontSize: '0.8rem' }}>
                                              {(activity.userDetails?.name || activity.userDetails?.email || 'U').charAt(0).toUpperCase()}
                                            </span>
                                          </div>
                                          <div class="min-w-0">
                                            <div class="fw-medium text-primary text-truncate" style={{ maxWidth: '150px' }}>
                                              {formatUserName(activity.userDetails) || 'Unknown User'}
                                            </div>
                                            <small class="text-muted text-truncate d-block" style={{ maxWidth: '150px' }}>
                                              {activity.userDetails?.email || 'No email'}
                                            </small>
                                          </div>
                                        </div>
                                      </td>
                                      <td>
                                        <div class="d-flex align-items-center gap-2">
                                          <span style={{ fontSize: '1.2rem' }}>{activityEmojis[activity.type] || '🧘'}</span>
                                          <div>
                                            <span class="fw-medium d-block">{activity.title}</span>
                                            {activity.type === 'chanting' && activity.chantingName && (
                                              <small class="text-muted">{activity.chantingName}</small>
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                      <td>
                                        <span class="badge bg-primary-subtle text-primary px-2 py-1">
                                          {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                                        </span>
                                      </td>
                                      {currentCategory.value !== 'chanting' && (
                                        <>
                                          <td>
                                            <span class="fw-medium">{activity.targetDuration || activity.duration || 0} min</span>
                                          </td>
                                          <td>
                                            <span class="fw-medium">{activity.actualDuration || activity.duration || 0} min</span>
                                          </td>
                                        </>
                                      )}
                                      {currentCategory.value === 'chanting' && (
                                        <td>
                                          <span class="fw-medium">{activity.chantCount || 0} chants</span>
                                        </td>
                                      )}
                                      <td>
                                        <div class="d-flex align-items-center gap-2">
                                          <div class="progress" style={{ width: '60px', height: '8px' }}>
                                            <div 
                                              class="progress-bar" 
                                              style={{ 
                                                width: `${activity.completionPercentage || 0}%`,
                                                backgroundColor: (activity.completionPercentage || 0) >= 100 ? '#10b981' : 
                                                                (activity.completionPercentage || 0) >= 50 ? '#f59e0b' : '#ef4444'
                                              }}
                                            ></div>
                                          </div>
                                          <small class="fw-medium">{activity.completionPercentage || 0}%</small>
                                        </div>
                                      </td>
                                      <td>
                                        {activity.emotion ? (
                                          <span class="d-flex align-items-center gap-1">
                                            <span>{emotionEmojis[activity.emotion] || '😐'}</span>
                                            <small class="text-muted">{activity.emotion}</small>
                                          </span>
                                        ) : (
                                          <span class="text-muted">-</span>
                                        )}
                                      </td>
                                      <td>
                                        {activity.karmaPoints ? (
                                          <span class="badge bg-success-subtle text-success px-2 py-1 fw-medium">
                                            +{activity.karmaPoints}
                                          </span>
                                        ) : (
                                          <span class="text-muted">-</span>
                                        )}
                                      </td>
                                      <td>
                                        {activity.videoUrl ? (
                                          <a 
                                            href={activity.videoUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            class="btn btn-sm btn-outline-primary d-flex align-items-center gap-1"
                                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                                          >
                                            <PlayIcon style={{ width: '12px', height: '12px' }} />
                                            Video
                                          </a>
                                        ) : (
                                          <span class="text-muted">-</span>
                                        )}
                                      </td>
                                      <td>
                                        {activity.audioUrl ? (
                                          <a 
                                            href={activity.audioUrl} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            class="btn btn-sm btn-outline-success d-flex align-items-center gap-1"
                                            style={{ fontSize: '0.7rem', padding: '0.25rem 0.5rem' }}
                                          >
                                            <MusicalNoteIcon style={{ width: '12px', height: '12px' }} />
                                            Audio
                                          </a>
                                        ) : (
                                          <span class="text-muted">-</span>
                                        )}
                                      </td>
                                      <td>
                                        <small class="text-muted">
                                          {new Date(activity.createdAt).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                            year: 'numeric'
                                          })}
                                        </small>
                                      </td>
                                      <td>
                                        <div class="d-flex align-items-center gap-2">
                                          <span class={`badge px-2 py-1 ${
                                            activity.status === 'completed' ? 'bg-success' :
                                            activity.status === 'incomplete' ? 'bg-warning' :
                                            activity.status === 'interrupted' ? 'bg-danger' : 'bg-success'
                                          }`}>
                                            {activity.status === 'completed' ? '✅ Completed' :
                                             activity.status === 'incomplete' ? '⚠️ Incomplete' :
                                             activity.status === 'interrupted' ? '❌ Interrupted' : '✅ Completed'}
                                          </span>
                                          <small class="text-muted">
                                            ({activity.completionPercentage || 0}%)
                                          </small>
                                        </div>
                                      </td>
                                      <td>
                                        <div class="dropdown">
                                          <button 
                                            class="btn btn-light btn-sm rounded-circle p-1 d-flex align-items-center justify-content-center"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              toggleDropdown(activity.id);
                                            }}
                                            style={{ width: '28px', height: '28px', zIndex: 20, position: 'relative' }}
                                          >
                                            <EllipsisVerticalIcon style={{ width: '14px', height: '14px' }} />
                                          </button>
                                          {activeDropdown.value === activity.id && (
                                            <div class="dropdown-menu show position-absolute shadow" style={{ zIndex: 1050, right: '0', left: 'auto', top: '100%', minWidth: '140px' }}>
                                              {activity.isActive ? (
                                                <>
                                                  <button class="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => viewActivity(activity)}>
                                                    <EyeIcon style={{ width: '14px', height: '14px' }} />
                                                    <span>View</span>
                                                  </button>
                                                  <button 
                                                    class="dropdown-item d-flex align-items-center gap-2 py-2" 
                                                    onClick={() => toggleActivityStatus(activity)}
                                                  >
                                                    <XCircleIcon style={{ width: '14px', height: '14px' }} class="text-danger" />
                                                    <span>Disable</span>
                                                  </button>
                                                  <hr class="dropdown-divider my-1" />
                                                  <button class="dropdown-item text-danger d-flex align-items-center gap-2 py-2" onClick={() => deleteActivity(activity.id)}>
                                                    <TrashIcon style={{ width: '14px', height: '14px' }} />
                                                    <span>Delete</span>
                                                  </button>
                                                </>
                                              ) : (
                                                <button 
                                                  class="dropdown-item d-flex align-items-center gap-2 py-2" 
                                                  onClick={() => toggleActivityStatus(activity)}
                                                >
                                                  <CheckCircleIcon style={{ width: '14px', height: '14px' }} class="text-success" />
                                                  <span>Enable</span>
                                                </button>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div class="text-center py-5">
                            <span style={{ fontSize: '3rem' }}>🧘</span>
                            <h6 class="text-muted mt-3">No activities found</h6>
                            <p class="text-muted small">User activities will appear here once they start their spiritual journey.</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>



        {/* View Clip Modal */}
        {showViewClipModal.value && selectedClip.value && (
          <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => showViewClipModal.value = false}>
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
              <div class="modal-content border-0 shadow-lg rounded-4">
                <div class="modal-header border-0 pb-2">
                  <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                    <EyeIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                    {selectedClip.value.title}
                  </h5>
                  <button type="button" class="btn-close" onClick={() => showViewClipModal.value = false}></button>
                </div>
                <div class="modal-body pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div class="mb-3">
                    <h6 class="fw-semibold mb-2 small text-muted">Description</h6>
                    <p class="mb-0">{selectedClip.value.description}</p>
                  </div>
                  
                  {selectedClip.value.suitableConfiguration && (
                    <div class="mb-3">
                      <h6 class="fw-semibold mb-2 small text-muted">Suitable Configuration</h6>
                      <span class="badge bg-primary">{selectedClip.value.suitableConfiguration.title}</span>
                      {selectedClip.value.suitableConfiguration.description && (
                        <p class="mt-2 mb-0 small text-muted">{selectedClip.value.suitableConfiguration.description}</p>
                      )}
                    </div>
                  )}
                  
                  {selectedClip.value.suitableTime && (
                    <div class="mb-3">
                      <h6 class="fw-semibold mb-2 small text-muted">Suitable Time</h6>
                      <span class="badge bg-info">{selectedClip.value.suitableTime}</span>
                    </div>
                  )}
                  
                  {selectedClip.value.guided && (
                    <div class="mb-3">
                      <h6 class="fw-semibold mb-2 small text-muted">Guide Type</h6>
                      <span class="badge bg-warning">{selectedClip.value.guided}</span>
                    </div>
                  )}
                  
                  {selectedClip.value.transcript && (
                    <div class="mb-3">
                      <h6 class="fw-semibold mb-2 small text-muted">Transcript</h6>
                      <p class="mb-0 p-3 bg-light rounded">{selectedClip.value.transcript}</p>
                    </div>
                  )}
                  
                  {selectedClip.value.audioUrl && (
                    <div class="mb-3">
                      <h6 class="fw-semibold mb-2 small text-muted d-flex align-items-center gap-1">
                        <MusicalNoteIcon style={{ width: '16px', height: '16px' }} />
                        Audio
                      </h6>
                      <audio controls class="w-100">
                        <source src={selectedClip.value.audioUrl} type="audio/mpeg" />
                        <source src={selectedClip.value.audioUrl} type="audio/wav" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                  
                  {selectedClip.value.videoUrl && (
                    <div class="mb-3">
                      <h6 class="fw-semibold mb-2 small text-muted d-flex align-items-center gap-1">
                        <PlayIcon style={{ width: '16px', height: '16px' }} />
                        Video
                      </h6>
                      <video controls class="w-100 rounded-3" style={{ maxHeight: '250px' }}>
                        <source src={selectedClip.value.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                </div>
                <div class="modal-footer border-0 pt-2">
                  <button type="button" class="btn btn-secondary rounded-pill px-3 btn-sm" onClick={() => showViewClipModal.value = false}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Clip Modal */}
        {showEditClipModal.value && editingClip.value && (
          <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => showEditClipModal.value = false}>
            <div class="modal-dialog modal-dialog-centered modal-md" onClick={(e) => e.stopPropagation()}>
              <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                  <h5 class="modal-title fw-bold">Edit Clip</h5>
                  <button class="btn-close btn-close-white" onClick={() => showEditClipModal.value = false}></button>
                </div>
                <div class="modal-body p-3">
                  <div class="row">
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Name *</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          placeholder="Enter clip name"
                          v-model={editClipForm.value.title}
                        />
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Suitable Time</label>
                        <select class="form-select" v-model={editClipForm.value.suitableTime}>
                          <option value="">Select time</option>
                          <option value="morning">Morning</option>
                          <option value="afternoon">Afternoon</option>
                          <option value="evening">Evening</option>
                          <option value="night">Night</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Description *</label>
                    <textarea 
                      class="form-control" 
                      rows="2" 
                      placeholder="Describe the clip..."
                      v-model={editClipForm.value.description}
                    ></textarea>
                  </div>
                  <div class="row">
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Video</label>
                        <input 
                          type="file" 
                          class="form-control" 
                          accept="video/*"
                          onChange={handleEditClipVideoUpload}
                        />
                        {editClipVideoUploaded.value && (
                          <div class="mt-2 p-2 bg-success bg-opacity-10 rounded">
                            <small class="text-success d-flex align-items-center gap-1">
                              <PlayIcon style={{ width: '14px', height: '14px' }} />
                              New video: {editClipVideoFileName.value}
                            </small>
                          </div>
                        )}
                        {editClipUploading.value.video && (
                          <div class="mt-2">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                              <small class="text-primary">Uploading video...</small>
                              <small class="text-primary">{editClipUploadProgress.value.video}%</small>
                            </div>
                            <div class="progress" style={{ height: '6px' }}>
                              <div 
                                class="progress-bar bg-primary" 
                                style={{ width: `${editClipUploadProgress.value.video}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Audio</label>
                        <input 
                          type="file" 
                          class="form-control" 
                          accept="audio/*"
                          onChange={handleEditClipAudioUpload}
                        />
                        {editClipAudioUploaded.value && (
                          <div class="mt-2 p-2 bg-success bg-opacity-10 rounded">
                            <small class="text-success d-flex align-items-center gap-1">
                              <MusicalNoteIcon style={{ width: '14px', height: '14px' }} />
                              New audio: {editClipAudioFileName.value}
                            </small>
                          </div>
                        )}
                        {editClipUploading.value.audio && (
                          <div class="mt-2">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                              <small class="text-primary">Uploading audio...</small>
                              <small class="text-primary">{editClipUploadProgress.value.audio}%</small>
                            </div>
                            <div class="progress" style={{ height: '6px' }}>
                              <div 
                                class="progress-bar bg-primary" 
                                style={{ width: `${editClipUploadProgress.value.audio}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Suitable Configuration</label>
                        <select class="form-select" v-model={editClipForm.value.suitableConfiguration}>
                          <option value="">Select configuration</option>
                          {filteredConfigurations.value.map(config => (
                            <option key={config._id} value={config._id}>{config.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Guide</label>
                        <select class="form-select" v-model={editClipForm.value.guided}>
                          <option value="">Select type</option>
                          <option value="guided">Guided</option>
                          <option value="unguided">Unguided</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Transcript</label>
                    <textarea 
                      class="form-control" 
                      rows="2" 
                      placeholder="Enter transcript or instructions..."
                      v-model={editClipForm.value.transcript}
                    ></textarea>
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" onClick={() => showEditClipModal.value = false}>Cancel</button>
                  <button 
                    class="btn btn-primary" 
                    onClick={updateClip}
                    disabled={loading.value || editClipUploading.value.video || editClipUploading.value.audio || !editClipForm.value.title || !editClipForm.value.description}
                  >
                    {editClipUploading.value.video ? 'Uploading Video...' : 
                     editClipUploading.value.audio ? 'Uploading Audio...' : 
                     loading.value ? 'Updating...' : 'Update Clip'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showAddClipModal.value && (
          <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div class="modal-dialog modal-dialog-centered modal-md">
              <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                  <h5 class="modal-title fw-bold">Add Clip</h5>
                  <button class="btn-close btn-close-white" onClick={closeAddClipModal}></button>
                </div>
                <div class="modal-body p-3">
                  <div class="row">
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Name *</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          placeholder="Enter clip name"
                          v-model={addClipForm.value.title}
                        />
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Suitable Time</label>
                        <select class="form-select" v-model={addClipForm.value.suitableTime}>
                          <option value="">Select time</option>
                          <option value="morning">Morning</option>
                          <option value="afternoon">Afternoon</option>
                          <option value="evening">Evening</option>
                          <option value="night">Night</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Description *</label>
                    <textarea 
                      class="form-control" 
                      rows="2" 
                      placeholder="Describe the clip..."
                      v-model={addClipForm.value.description}
                    ></textarea>
                  </div>
                  <div class="row">
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Video</label>
                        <input 
                          type="file" 
                          class="form-control" 
                          accept="video/*"
                          onChange={handleClipVideoUpload}
                        />
                        {clipVideoUploaded.value && (
                          <div class="mt-2 p-2 bg-success bg-opacity-10 rounded">
                            <small class="text-success d-flex align-items-center gap-1">
                              <PlayIcon style={{ width: '14px', height: '14px' }} />
                              Video: {clipVideoFileName.value}
                            </small>
                          </div>
                        )}
                        {clipUploading.value.video && (
                          <div class="mt-2">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                              <small class="text-primary">Uploading video...</small>
                              <small class="text-primary">{clipUploadProgress.value.video}%</small>
                            </div>
                            <div class="progress" style={{ height: '6px' }}>
                              <div 
                                class="progress-bar bg-primary" 
                                style={{ width: `${clipUploadProgress.value.video}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Audio</label>
                        <input 
                          type="file" 
                          class="form-control" 
                          accept="audio/*"
                          onChange={handleClipAudioUpload}
                        />
                        {clipAudioUploaded.value && (
                          <div class="mt-2 p-2 bg-success bg-opacity-10 rounded">
                            <small class="text-success d-flex align-items-center gap-1">
                              <MusicalNoteIcon style={{ width: '14px', height: '14px' }} />
                              Audio: {clipAudioFileName.value}
                            </small>
                          </div>
                        )}
                        {clipUploading.value.audio && (
                          <div class="mt-2">
                            <div class="d-flex justify-content-between align-items-center mb-1">
                              <small class="text-primary">Uploading audio...</small>
                              <small class="text-primary">{clipUploadProgress.value.audio}%</small>
                            </div>
                            <div class="progress" style={{ height: '6px' }}>
                              <div 
                                class="progress-bar bg-primary" 
                                style={{ width: `${clipUploadProgress.value.audio}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Suitable Configuration</label>
                        <select class="form-select" v-model={addClipForm.value.suitableConfiguration}>
                          <option value="">Select configuration</option>
                          {filteredConfigurations.value.map(config => (
                            <option key={config._id} value={config._id}>{config.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Guide</label>
                        <select class="form-select" v-model={addClipForm.value.guided}>
                          <option value="">Select type</option>
                          <option value="guided">Guided</option>
                          <option value="unguided">Unguided</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Transcript</label>
                    <textarea 
                      class="form-control" 
                      rows="2" 
                      placeholder="Enter transcript or instructions..."
                      v-model={addClipForm.value.transcript}
                    ></textarea>
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" onClick={closeAddClipModal}>Cancel</button>
                  <button 
                    class="btn btn-primary" 
                    onClick={addClip}
                    disabled={loading.value || clipUploading.value.video || clipUploading.value.audio || !addClipForm.value.title || !addClipForm.value.description}
                  >
                    {clipUploading.value.video ? 'Uploading Video...' : 
                     clipUploading.value.audio ? 'Uploading Audio...' : 
                     loading.value ? 'Adding...' : 'Add Clip'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Activity Modal */}
        {showEditModal.value && (
          <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div class="modal-dialog modal-dialog-centered modal-lg">
              <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                  <h5 class="modal-title fw-bold">Edit Activity</h5>
                  <button class="btn-close btn-close-white" onClick={closeEditModal}></button>
                </div>
                <div class="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div class="row">
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Name *</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          placeholder="Enter activity name"
                          v-model={editForm.value.title}
                        />
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Duration</label>
                        <div class="row g-2">
                          {[
                            '1 minute', '2 minutes', '3 minutes', '4 minutes', 
                            '5 minutes', '6 minutes', '7 minutes', '8 minutes', 
                            '9 minutes', '10 minutes'
                          ].map(duration => (
                            <div key={duration} class="col-4">
                              <div class="form-check">
                                <input 
                                  class="form-check-input" 
                                  type="radio" 
                                  name="editDuration"
                                  id={`edit-duration-${duration}`}
                                  value={duration}
                                  checked={editForm.value.duration === duration}
                                  onChange={(e) => {
                                    editForm.value.duration = e.target.value;
                                  }}
                                />
                                <label class="form-check-label" for={`edit-duration-${duration}`}>
                                  {duration}
                                </label>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Description *</label>
                    <textarea 
                      class="form-control" 
                      rows="3" 
                      placeholder="Describe the spiritual activity..."
                      v-model={editForm.value.description}
                    ></textarea>
                  </div>
                  <div class="row">
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Emotion</label>
                        <select class="form-select" v-model={editForm.value.emotion}>
                          <option value="">Select emotion</option>
                          <option value="happy">😊 Happy</option>
                          <option value="sad">😢 Sad</option>
                          <option value="angry">😠 Angry</option>
                          <option value="afraid">😨 Afraid</option>
                          <option value="loved">🥰 Loved</option>
                          <option value="surprised">😲 Surprised</option>
                          <option value="calm">😌 Calm</option>
                          <option value="disgusted">🤢 Disgusted</option>
                          <option value="neutral">😐 Neutral</option>
                          <option value="stress">😰 Stress</option>
                        </select>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Suitable Time</label>
                        <select class="form-select" v-model={editForm.value.suitableTime}>
                          <option value="">Select time</option>
                          <option value="morning">Morning</option>
                          <option value="afternoon">Afternoon</option>
                          <option value="evening">Evening</option>
                          <option value="night">Night</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Guided</label>
                        <select class="form-select" v-model={editForm.value.guided}>
                          <option value="">Select type</option>
                          <option value="guided">Guided</option>
                          <option value="unguided">Unguided</option>
                        </select>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Type</label>
                        <select class="form-select" v-model={editForm.value.type}>
                          <option value="">Select type</option>
                          <option value="meditation">Meditation</option>
                          <option value="prayer">Prayer</option>
                          <option value="chanting">Chanting</option>
                          <option value="breathing">Breathing</option>
                          <option value="mindfulness">Mindfulness</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  <div class="row">
                    <div class="col-md-4">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Audio</label>
                        <input 
                          type="file" 
                          class="form-control" 
                          accept="audio/*"
                          onChange={handleEditAudioUpload}
                        />
                        {editAudioUploaded.value && (
                          <div class="mt-2 p-2 bg-success bg-opacity-10 rounded">
                            <small class="text-success d-flex align-items-center gap-1">
                              <MusicalNoteIcon style={{ width: '14px', height: '14px' }} />
                              New audio: {editAudioFileName.value}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                    <div class="col-md-4">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Video</label>
                        <input 
                          type="file" 
                          class="form-control" 
                          accept="video/*"
                          onChange={handleEditVideoUpload}
                        />
                        {editVideoUploaded.value && (
                          <div class="mt-2 p-2 bg-success bg-opacity-10 rounded">
                            <small class="text-success d-flex align-items-center gap-1">
                              <PlayIcon style={{ width: '14px', height: '14px' }} />
                              New video: {editVideoFileName.value}
                            </small>
                          </div>
                        )}
                      </div>
                    </div>
                    <div class="col-md-4">
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
                              <PhotoIcon style={{ width: '14px', height: '14px' }} />
                              New image: {editImageFileName.value}
                            </small>
                          </div>
                        )}
                        {editingActivity.value?.image && !editImageUploaded.value && (
                          <small class="text-info d-block mt-1">Current image will be kept if no new image is uploaded</small>
                        )}
                      </div>
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Transcript</label>
                    <textarea 
                      class="form-control" 
                      rows="4" 
                      placeholder="Enter transcript or instructions..."
                      v-model={editForm.value.transcript}
                    ></textarea>
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" onClick={closeEditModal}>Cancel</button>
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

        {/* View Configuration Modal */}
        {showViewConfigModal.value && selectedConfig.value && (
          <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content">
                <div class="modal-header bg-info text-white">
                  <h5 class="modal-title fw-bold">Configuration Details</h5>
                  <button class="btn-close btn-close-white" onClick={() => showViewConfigModal.value = false}></button>
                </div>
                <div class="modal-body p-4">
                  <h4 class="mb-3 fw-bold text-center">{selectedConfig.value.title}</h4>
                  <div class="row g-3">
                    {selectedConfig.value.duration && currentCategory.value !== 'chanting' && (
                      <div class="col-md-6">
                        <strong>Duration:</strong>
                        <span class="badge bg-primary ms-2">{selectedConfig.value.duration}</span>
                      </div>
                    )}
                    <div class={selectedConfig.value.duration && currentCategory.value !== 'chanting' ? "col-md-6" : "col-md-12"}>
                      <strong>Type:</strong>
                      <span class="badge bg-secondary ms-2">{selectedConfig.value.type || 'General'}</span>
                    </div>
                    {selectedConfig.value.emotion && (
                      <div class="col-12">
                        <strong>Emotion:</strong>
                        <span class="badge bg-warning ms-2">
                          {{
                            happy: '😊 Happy',
                            sad: '😢 Sad', 
                            angry: '😠 Angry',
                            afraid: '😨 Afraid',
                            loved: '🥰 Loved',
                            surprised: '😲 Surprised',
                            calm: '😌 Calm',
                            disgusted: '🤢 Disgusted',
                            neutral: '😐 Neutral',
                            stress: '😰 Stress'
                          }[selectedConfig.value.emotion] || selectedConfig.value.emotion}
                        </span>
                      </div>
                    )}
                    <div class="mb-3">
                      <strong>Description:</strong>
                      <p class="mt-2 p-3 bg-light rounded">{selectedConfig.value.description}</p>
                    </div>
                    {selectedConfig.value.karmaPoints && (
                      <div class="col-12">
                        <strong>Karma Points:</strong>
                        <span class="badge bg-success ms-2">{selectedConfig.value.karmaPoints} points</span>
                      </div>
                    )}
                    <div class="col-md-6">
                      <strong>Status:</strong>
                      <span class={`badge ms-2 ${selectedConfig.value.isActive ? 'bg-success' : 'bg-secondary'}`}>
                        {selectedConfig.value.isActive ? '✅ Active' : '❌ Inactive'}
                      </span>
                    </div>
                    <div class="col-md-6">
                      <strong>Created:</strong>
                      <span class="ms-2">{new Date(selectedConfig.value.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Configuration Modal */}
        {showEditConfigModal.value && editingConfig.value && (
          <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div class="modal-dialog modal-dialog-centered modal-lg">
              <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                  <h5 class="modal-title fw-bold">Edit Configuration</h5>
                  <button class="btn-close btn-close-white" onClick={() => showEditConfigModal.value = false}></button>
                </div>
                <div class="modal-body p-4">
                  <div class="row">
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Name *</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          placeholder="Enter configuration name"
                          maxlength="100"
                          v-model={editConfigForm.value.title}
                        />
                        <small class="form-text text-muted">{editConfigForm.value.title.length}/100 characters</small>
                      </div>
                    </div>
                    <div class="col-md-6">
                      {currentCategory.value !== 'chanting' && (
                        <div class="mb-3">
                          <label class="form-label fw-semibold">Duration</label>
                          <select class="form-select" v-model={editConfigForm.value.duration}>
                            <option value="1 minute">1 minute</option>
                            <option value="2 minutes">2 minutes</option>
                            <option value="3 minutes">3 minutes</option>
                            <option value="4 minutes">4 minutes</option>
                            <option value="5 minutes">5 minutes</option>
                            <option value="6 minutes">6 minutes</option>
                            <option value="7 minutes">7 minutes</option>
                            <option value="8 minutes">8 minutes</option>
                            <option value="9 minutes">9 minutes</option>
                            <option value="10 minutes">10 minutes</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                  <div class="mb-3">
                    <label class="form-label fw-semibold">Description *</label>
                    <textarea 
                      class="form-control" 
                      rows="3" 
                      placeholder="Describe the spiritual configuration..."
                      maxlength="500"
                      v-model={editConfigForm.value.description}
                    ></textarea>
                    <small class="form-text text-muted">{editConfigForm.value.description.length}/500 characters</small>
                  </div>
                  <div class="row">
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Emotion</label>
                        <select class="form-select" v-model={editConfigForm.value.emotion}>
                          <option value="">Select emotion</option>
                          <option value="happy">😊 Happy</option>
                          <option value="sad">😢 Sad</option>
                          <option value="angry">😠 Angry</option>
                          <option value="afraid">😨 Afraid</option>
                          <option value="loved">🥰 Loved</option>
                          <option value="surprised">😲 Surprised</option>
                          <option value="calm">😌 Calm</option>
                          <option value="disgusted">🤢 Disgusted</option>
                          <option value="neutral">😐 Neutral</option>
                          <option value="stress">😰 Stress</option>
                        </select>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-3">
                        <label class="form-label fw-semibold">Karma Points</label>
                        <input 
                          type="number" 
                          class="form-control" 
                          placeholder="Enter karma points (1-100)"
                          min="1"
                          max="100"
                          v-model={editConfigForm.value.karmaPoints}
                        />
                        <small class="form-text text-muted">Points awarded for completing this activity</small>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" onClick={() => showEditConfigModal.value = false}>Cancel</button>
                  <button 
                    class="btn btn-primary" 
                    onClick={updateConfig}
                    disabled={loading.value || !editConfigForm.value.title || !editConfigForm.value.description}
                  >
                    {loading.value ? 'Updating...' : 'Update Configuration'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        {showViewModal.value && selectedActivity.value && (
          <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div class="modal-dialog modal-dialog-centered modal-lg">
              <div class="modal-content">
                <div class="modal-header bg-primary text-white">
                  <h5 class="modal-title fw-bold">Spiritual Session Details</h5>
                  <button class="btn-close btn-close-white" onClick={() => showViewModal.value = false}></button>
                </div>
                <div class="modal-body p-4" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  {/* User Information */}
                  {selectedActivity.value.userDetails && (
                    <div class="card bg-light mb-4">
                      <div class="card-body p-3">
                        <h6 class="fw-bold mb-2 text-primary">👤 User Information</h6>
                        <div class="row">
                          <div class="col-md-6">
                            <strong>Name:</strong> {formatUserName(selectedActivity.value.userDetails) || 'Not provided'}
                          </div>
                          <div class="col-md-6">
                            <strong>Email:</strong> {selectedActivity.value.userDetails.email || 'Not provided'}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Activity Header */}
                  <div class="text-center mb-4">
                    {selectedActivity.value.image && (
                      <img 
                        src={selectedActivity.value.image}
                        alt={selectedActivity.value.title}
                        class="rounded mb-3"
                        style={{ width: '100px', height: '100px', objectFit: 'cover' }}
                      />
                    )}
                    <h4 class="fw-bold mb-2">{selectedActivity.value.title}</h4>
                    {selectedActivity.value.type === 'chanting' && selectedActivity.value.chantingName && (
                      <h5 class="text-warning mb-2">🕉️ {selectedActivity.value.chantingName}</h5>
                    )}
                    <p class="text-muted mb-3">{selectedActivity.value.description || 'No description available'}</p>
                  </div>

                  {/* Session Details */}
                  <div class="row g-3 mb-4">
                    <div class="col-md-6">
                      <div class="card border-0 bg-light">
                        <div class="card-body p-3 text-center">
                          <h6 class="fw-bold text-primary mb-1">📅 Session Date</h6>
                          <p class="mb-0">{new Date(selectedActivity.value.createdAt).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}</p>
                          <small class="text-muted">{new Date(selectedActivity.value.createdAt).toLocaleTimeString('en-US', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}</small>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="card border-0 bg-light">
                        <div class="card-body p-3 text-center">
                          <h6 class="fw-bold text-success mb-1">✨ Karma Points</h6>
                          <h4 class="text-success mb-0">+{selectedActivity.value.karmaPoints || 0}</h4>
                          <small class="text-muted">Points Earned</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Activity Type & Category */}
                  <div class="row g-3 mb-4">
                    <div class="col-md-6">
                      <div class="mb-3">
                        <h6 class="fw-bold text-secondary mb-2">🏷️ Category & Type</h6>
                        <div class="d-flex gap-2 flex-wrap">
                          <span class="badge bg-primary px-3 py-2">
                            {selectedActivity.value.type?.charAt(0).toUpperCase() + selectedActivity.value.type?.slice(1) || 'General'}
                          </span>
                          {selectedActivity.value.chantingType && (
                            <span class="badge bg-warning px-3 py-2">
                              {selectedActivity.value.chantingType}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="mb-3">
                        <h6 class="fw-bold text-secondary mb-2">📊 Completion Status</h6>
                        <div class="d-flex align-items-center gap-3">
                          <div class="progress flex-grow-1" style={{ height: '12px' }}>
                            <div 
                              class="progress-bar" 
                              style={{ 
                                width: `${selectedActivity.value.completionPercentage || 100}%`,
                                backgroundColor: (selectedActivity.value.completionPercentage || 100) >= 100 ? '#10b981' : 
                                                (selectedActivity.value.completionPercentage || 100) >= 50 ? '#f59e0b' : '#ef4444'
                              }}
                            ></div>
                          </div>
                          <span class="fw-bold">{selectedActivity.value.completionPercentage || 100}%</span>
                        </div>
                        <small class="text-muted">
                          Status: {selectedActivity.value.status === 'completed' ? '✅ Completed' :
                                   selectedActivity.value.status === 'incomplete' ? '⚠️ Incomplete' :
                                   selectedActivity.value.status === 'interrupted' ? '❌ Interrupted' : '✅ Completed'}
                        </small>
                      </div>
                    </div>
                  </div>

                  {/* Duration Information - Hide for chanting */}
                  {selectedActivity.value.type !== 'chanting' && (
                    <div class="row g-3 mb-4">
                      <div class="col-md-6">
                        <div class="card border-0 bg-info bg-opacity-10">
                          <div class="card-body p-3 text-center">
                            <h6 class="fw-bold text-info mb-1">🎯 Target Duration</h6>
                            <h5 class="text-info mb-0">{selectedActivity.value.targetDuration || selectedActivity.value.duration || 0} min</h5>
                            <small class="text-muted">Planned Time</small>
                          </div>
                        </div>
                      </div>
                      <div class="col-md-6">
                        <div class="card border-0 bg-warning bg-opacity-10">
                          <div class="card-body p-3 text-center">
                            <h6 class="fw-bold text-warning mb-1">⏱️ Actual Duration</h6>
                            <h5 class="text-warning mb-0">{selectedActivity.value.actualDuration || selectedActivity.value.duration || 0} min</h5>
                            <small class="text-muted">Time Spent</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Chant Count - Show only for chanting */}
                  {selectedActivity.value.type === 'chanting' && (
                    <div class="row g-3 mb-4">
                      <div class="col-md-12">
                        <div class="card border-0 bg-warning bg-opacity-10">
                          <div class="card-body p-3 text-center">
                            <h6 class="fw-bold text-warning mb-1">🔢 Chant Count</h6>
                            <h4 class="text-warning mb-0">{selectedActivity.value.chantCount || 0}</h4>
                            <small class="text-muted">Total Chants Completed</small>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Emotion & Experience */}
                  {selectedActivity.value.emotion && (
                    <div class="mb-4">
                      <h6 class="fw-bold text-secondary mb-2">😊 Emotional State</h6>
                      <div class="card border-0 bg-light">
                        <div class="card-body p-3 text-center">
                          <span class="badge bg-secondary px-4 py-2" style={{ fontSize: '1rem' }}>
                            {{
                              happy: '😊 Happy',
                              sad: '😢 Sad',
                              angry: '😠 Angry',
                              afraid: '😨 Afraid',
                              loved: '🥰 Loved',
                              surprised: '😲 Surprised',
                              calm: '😌 Calm',
                              disgusted: '🤢 Disgusted',
                              devoted: '🙏 Devoted',
                              elevated: '✨ Elevated',
                              reverent: '🕉️ Reverent',
                              neutral: '😐 Neutral',
                              stress: '😰 Stress'
                            }[selectedActivity.value.emotion] || selectedActivity.value.emotion}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Additional Details */}
                  <div class="row g-3 mb-4">
                    {selectedActivity.value.suitableTime && (
                      <div class="col-md-6">
                        <h6 class="fw-bold text-secondary mb-2">🕐 Suitable Time</h6>
                        <span class="badge bg-info px-3 py-2">{selectedActivity.value.suitableTime}</span>
                      </div>
                    )}
                    {selectedActivity.value.guided && (
                      <div class="col-md-6">
                        <h6 class="fw-bold text-secondary mb-2">🎯 Guidance Type</h6>
                        <span class="badge bg-warning px-3 py-2">{selectedActivity.value.guided}</span>
                      </div>
                    )}
                  </div>

                  {/* Transcript */}
                  {selectedActivity.value.transcript && (
                    <div class="mb-4">
                      <h6 class="fw-bold text-secondary mb-2">📝 Transcript/Notes</h6>
                      <div class="card border-0 bg-light">
                        <div class="card-body p-3">
                          <p class="mb-0" style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6' }}>
                            {selectedActivity.value.transcript}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Session ID & Technical Details */}
                  <div class="card border-0 bg-light">
                    <div class="card-body p-3">
                      <h6 class="fw-bold text-secondary mb-2">🔧 Technical Details</h6>
                      <div class="row g-2">
                        <div class="col-md-6">
                          <small class="text-muted d-block">Session ID:</small>
                          <code class="small">{selectedActivity.value.id || selectedActivity.value._id}</code>
                        </div>
                        <div class="col-md-6">
                          <small class="text-muted d-block">Status:</small>
                          <span class={`badge ${selectedActivity.value.isActive ? 'bg-success' : 'bg-secondary'}`}>
                            {selectedActivity.value.isActive ? '✅ Active' : '❌ Inactive'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="modal-footer">
                  <button class="btn btn-secondary" onClick={() => showViewModal.value = false}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Audio Modal */}
        {showAudioModal.value && selectedAudioClip.value && (
          <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={closeAudioModal}>
            <div class="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
              <div class="modal-content border-0 shadow-lg rounded-4">
                <div class="modal-header border-0 pb-2">
                  <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                    <MusicalNoteIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                    {selectedAudioClip.value.title}
                  </h5>
                  <button type="button" class="btn-close" onClick={closeAudioModal}></button>
                </div>
                <div class="modal-body p-4">
                  <div class="text-center mb-4">
                    <div class="bg-gradient-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-3" style={{ width: '120px', height: '120px' }}>
                      <MusicalNoteIcon style={{ width: '60px', height: '60px', color: 'white' }} />
                    </div>
                    <h6 class="fw-bold mb-2">{selectedAudioClip.value.title}</h6>
                    <p class="text-muted small">{selectedAudioClip.value.description}</p>
                  </div>
                  <audio controls class="w-100" style={{ height: '60px' }}>
                    <source src={selectedAudioClip.value.audioUrl} type="audio/mpeg" />
                    <source src={selectedAudioClip.value.audioUrl} type="audio/wav" />
                    <source src={selectedAudioClip.value.audioUrl} type="audio/mp3" />
                    Your browser does not support the audio element.
                  </audio>
                </div>
                <div class="modal-footer border-0 pt-2">
                  <button type="button" class="btn btn-secondary rounded-pill px-3 btn-sm" onClick={closeAudioModal}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Video Modal */}
        {showVideoModal.value && selectedVideoClip.value && (
          <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }} onClick={closeVideoModal}>
            <div class="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
              <div class="modal-content border-0 shadow-lg rounded-4">
                <div class="modal-header border-0 pb-2">
                  <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                    <PlayIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                    {selectedVideoClip.value.title}
                  </h5>
                  <button type="button" class="btn-close" onClick={closeVideoModal}></button>
                </div>
                <div class="modal-body p-0">
                  <video controls class="w-100 border-0" style={{ maxHeight: '70vh', borderRadius: '0' }}>
                    <source src={selectedVideoClip.value.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
                <div class="modal-footer border-0 pt-2">
                  <button type="button" class="btn btn-secondary rounded-pill px-3 btn-sm" onClick={closeVideoModal}>
                    Close
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


 