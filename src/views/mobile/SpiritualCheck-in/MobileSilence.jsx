import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import spiritualClipService from '../../../services/spiritualClipService.js';
import spiritualStatsService from '../../../services/spiritualStatsService.js';
import spiritualActivityService from '../../../services/spiritualActivityService.js';

export default {
  name: 'MobileSilence',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const clips = ref([]);
    const configurations = ref([]);
    const loading = ref(true);
    const isSessionActive = ref(false);
    const sessionTimer = ref(0);
    const selectedEmotion = ref('happy');
    const selectedDuration = ref(5);
    const selectedVideoUrl = ref('');
    const selectedAudioUrl = ref('');
    const enableVideo = ref(false);
    const enableAudio = ref(false);
    const tempVideoUrl = ref('');
    const tempAudioUrl = ref('');
    const timerInterval = ref(null);
    const showRewardModal = ref(false);
    const earnedPoints = ref(0);
    const backgroundVideo = ref(null);
    const backgroundAudio = ref(null);
    const isVideoPlaying = ref(false);
    const isAudioPlaying = ref(false);
    const selectedClip = ref(null);
    const selectedConfig = ref(null);
    const availableClips = ref([]);
    const showClipPreview = ref(false);
    const previewClip = ref(null);
    const isUserLoggedIn = ref(false);
    const selectedVideoKey = ref('');
    const selectedAudioKey = ref('');
    
    const emotions = [
      { emoji: '😊', label: 'Happy', value: 'happy' },
      { emoji: '😢', label: 'Sad', value: 'sad' },
      { emoji: '😠', label: 'Angry', value: 'angry' },
      { emoji: '😨', label: 'Afraid', value: 'afraid' },
      { emoji: '🥰', label: 'Loved', value: 'loved' },
      { emoji: '😲', label: 'Surprised', value: 'surprised' },
      { emoji: '😌', label: 'Calm', value: 'calm' },
      { emoji: '🤢', label: 'Disgusted', value: 'disgusted' },
      { emoji: '😐', label: 'Neutral', value: 'neutral' },
      { emoji: '😰', label: 'Stressed', value: 'stressed' }
    ];
    
    const checkUserAuth = () => {
      const token = localStorage.getItem('token_user');
      isUserLoggedIn.value = !!token;
      return !!token;
    };
    
    const goBack = () => {
      router.push('/mobile/user/activities');
    };

    const fetchSilenceConfigurations = async () => {
      try {
        const activityType = route.query.type || 'silence';
        const categoryId = route.query.categoryId;
        
        console.log('Fetching configurations for:', { activityType, categoryId });
        
        let response;
        if (categoryId) {
          response = await spiritualActivityService.getSingleCheckinAllConfigration(categoryId);
          
          if (!response.success || !response.data || response.data.length === 0) {
            console.log('No configurations found for categoryId, falling back to type filter');
            response = await spiritualActivityService.getAllSpiritualCheckinConfigurations(activityType);
          }
        } else {
          response = await spiritualActivityService.getAllSpiritualCheckinConfigurations(activityType);
        }
        
        if (response.success && response.data) {
          configurations.value = response.data;
          console.log('Loaded configurations:', response.data.length);
        } else {
          console.log('No configurations found');
          configurations.value = [];
        }
      } catch (error) {
        console.error('Error fetching configurations:', error);
        configurations.value = [];
      }
    };

    const fetchSilenceClips = async () => {
      try {
        loading.value = true;
        console.log('Fetching silence clips...');
        const response = await spiritualClipService.getAllClips({ type: 'silence' });
        console.log('API Response:', response);
        
        if (response.success && response.data && response.data.length > 0) {
          clips.value = response.data;
          console.log('Loaded clips from API:', response.data.length);
        } else {
          console.log('No clips found, using fallback data');
          clips.value = [
            {
              _id: 'fallback-1',
              title: 'Silent Contemplation',
              description: 'In silence, we find our truest self and discover profound peace.',
              type: 'silence'
            },
            {
              _id: 'fallback-2', 
              title: 'Mindful Quietude',
              description: 'Embrace the power of silence and let your mind find its natural state.',
              type: 'silence'
            }
          ];
        }
      } catch (error) {
        console.error('Error fetching silence clips:', error);
        clips.value = [
          {
            _id: 'error-1',
            title: 'Connection Error - Silent Contemplation',
            description: 'Find peace in silence (offline mode).',
            type: 'silence'
          }
        ];
      } finally {
        loading.value = false;
      }
    };

    const filteredConfigurations = computed(() => {
      if (!selectedEmotion.value) return configurations.value;
      const filtered = configurations.value.filter(config => 
        config.emotion?.toLowerCase() === selectedEmotion.value.toLowerCase()
      );
      return filtered;
    });

    const autoSelectClipForEmotion = async () => {
      const configs = filteredConfigurations.value;
      
      if (configs.length > 0) {
        try {
          const allClipsPromises = configs.map(config => 
            spiritualClipService.getSingleConfigurationAllClips(config._id)
              .then(response => ({ config, response }))
          );
          
          const results = await Promise.all(allClipsPromises);
          const allClips = [];
          results.forEach(({ config, response }) => {
            if (response.success && response.data && response.data.length > 0) {
              response.data.forEach(clip => {
                allClips.push({ ...clip, configId: config._id, karmaPoints: config.karmaPoints });
              });
            }
          });
          
          if (allClips.length > 0) {
            availableClips.value = allClips;
            const clip = allClips[0];
            const config = configs.find(c => c._id === clip.configId);
            selectedClip.value = clip;
            selectedConfig.value = config;
            selectedVideoUrl.value = clip.videoPresignedUrl || clip.videoUrl || '';
            selectedAudioUrl.value = clip.audioPresignedUrl || clip.audioUrl || '';
            selectedVideoKey.value = clip.videoKey || '';
            selectedAudioKey.value = clip.audioKey || '';
          } else {
            selectedClip.value = null;
            selectedConfig.value = null;
            availableClips.value = [];
          }
        } catch (error) {
          console.error('Error auto-selecting clip:', error);
          selectedClip.value = null;
          selectedConfig.value = null;
          availableClips.value = [];
        }
      } else {
        selectedClip.value = null;
        selectedConfig.value = null;
        availableClips.value = [];
      }
    };

    const selectClip = (clip) => {
      const configs = filteredConfigurations.value;
      const config = configs.find(c => c._id === clip.configId);
      selectedClip.value = clip;
      selectedConfig.value = config;
      selectedVideoUrl.value = clip.videoPresignedUrl || clip.videoUrl || '';
      selectedAudioUrl.value = clip.audioPresignedUrl || clip.audioUrl || '';
      selectedVideoKey.value = clip.videoKey || '';
      selectedAudioKey.value = clip.audioKey || '';
    };

    const startSession = () => {
      if (!selectedClip.value) {
        alert('⚠️ Please select a clip before starting the silence session.');
        return;
      }
      beginSilence();
    };

    const saveSession = async (targetDuration, actualDuration, emotion, karmaPoints) => {
      try {
        const token = localStorage.getItem('token_user');
        if (!token) {
          console.warn('User not logged in, session not saved');
          alert('⚠️ Please log in to save your silence sessions and earn karma points!');
          return;
        }
        
        const sessionData = {
          type: 'silence',
          title: 'Silence Session',
          targetDuration: targetDuration,
          actualDuration: actualDuration,
          karmaPoints: karmaPoints,
          emotion: emotion,
          videoKey: selectedVideoKey.value || '',
          audioKey: selectedAudioKey.value || ''
        };
        
        const response = await spiritualStatsService.saveSession(sessionData);
        if (response.success) {
          console.log('Session saved successfully:', response.data?.statusMessage || response.message);
          if (response.data?.statusMessage) {
            setTimeout(() => {
              alert(response.data.statusMessage);
            }, 1000);
          }
        }
      } catch (error) {
        console.error('Error saving session:', error);
        alert('❌ Failed to save session. Please check your internet connection and try again.');
      }
    };

    const beginSilence = () => {
      if (!selectedClip.value) {
        alert('⚠️ Please select a clip before starting!');
        return;
      }
      
      isSessionActive.value = true;
      sessionTimer.value = selectedDuration.value * 60;
      
      setTimeout(() => {
        if (selectedVideoUrl.value && backgroundVideo.value) {
          console.log('Starting video:', selectedVideoUrl.value);
          isVideoPlaying.value = true;
          backgroundVideo.value.play().catch(e => {
            console.log('Video autoplay prevented:', e);
            isVideoPlaying.value = false;
          });
        }
        if (selectedAudioUrl.value && backgroundAudio.value) {
          console.log('Starting audio:', selectedAudioUrl.value);
          isAudioPlaying.value = true;
          backgroundAudio.value.play().catch(e => {
            console.log('Audio autoplay prevented:', e);
            isAudioPlaying.value = false;
          });
        }
      }, 500);
      
      timerInterval.value = setInterval(() => {
        sessionTimer.value--;
        if (sessionTimer.value <= 0) {
          isSessionActive.value = false;
          clearInterval(timerInterval.value);
          
          if (backgroundVideo.value) {
            backgroundVideo.value.pause();
            backgroundVideo.value.currentTime = 0;
            isVideoPlaying.value = false;
          }
          if (backgroundAudio.value) {
            backgroundAudio.value.pause();
            backgroundAudio.value.currentTime = 0;
            isAudioPlaying.value = false;
          }
          
          sessionTimer.value = 0;
          earnedPoints.value = selectedConfig.value?.karmaPoints || (selectedDuration.value * 3);
          saveSession(selectedDuration.value, selectedDuration.value, selectedEmotion.value, earnedPoints.value);
          showRewardModal.value = true;
        }
      }, 1000);
    };

    const endSession = () => {
      isSessionActive.value = false;
      clearInterval(timerInterval.value);
      
      if (backgroundVideo.value) {
        backgroundVideo.value.pause();
        backgroundVideo.value.currentTime = 0;
        isVideoPlaying.value = false;
      }
      if (backgroundAudio.value) {
        backgroundAudio.value.pause();
        backgroundAudio.value.currentTime = 0;
        isAudioPlaying.value = false;
      }
      
      const completedMinutes = selectedDuration.value - Math.ceil(sessionTimer.value / 60);
      sessionTimer.value = 0;
      const configKarmaPoints = selectedConfig.value?.karmaPoints || (selectedDuration.value * 3);
      earnedPoints.value = Math.max(0, Math.floor((completedMinutes / selectedDuration.value) * configKarmaPoints));
      
      if (completedMinutes > 0) {
        saveSession(selectedDuration.value, completedMinutes, selectedEmotion.value, earnedPoints.value);
      } else {
        saveSession(selectedDuration.value, 0, selectedEmotion.value, 0);
      }
      showRewardModal.value = true;
    };

    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const closeReward = () => {
      showRewardModal.value = false;
      earnedPoints.value = 0;
      selectedClip.value = null;
      selectedConfig.value = null;
      selectedVideoUrl.value = '';
      selectedAudioUrl.value = '';
      isVideoPlaying.value = false;
      isAudioPlaying.value = false;
    };

    onMounted(async () => {
      checkUserAuth();
      await fetchSilenceConfigurations();
      await fetchSilenceClips();
      await autoSelectClipForEmotion();
    });

    onUnmounted(() => {
      if (timerInterval.value) {
        clearInterval(timerInterval.value);
      }
    });

    return () => (
      <div class="silence-page">
        <style>{`
          .silence-page {
            padding: 0.75rem;
            min-height: 100vh;
            background: #f8fafc;
          }
          
          .page-header {
            background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
            color: white;
            padding: 0.75rem;
            margin-bottom: 1rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 8px rgba(156, 163, 175, 0.3);
          }
          
          .back-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 0.4rem 0.75rem;
            border-radius: 6px;
            font-size: 0.8rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .back-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.4);
          }
          
          .share-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 0.4rem;
            border-radius: 6px;
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s ease;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .share-btn:hover {
            background: rgba(255, 255, 255, 0.3);
            border-color: rgba(255, 255, 255, 0.4);
          }
          
          .header-content {
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          
          .activity-icon {
            font-size: 1.25rem;
          }
          
          .activity-title {
            font-size: 1rem;
            font-weight: 600;
            margin: 0;
            color: white;
          }
          
          .silence-content {
            background: white;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .start-btn {
            background: linear-gradient(135deg, #9ca3af, #6b7280);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 8px;
            font-size: 0.9rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            width: 100%;
          }
          
          .start-btn:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(156, 163, 175, 0.3);
          }
          
          .session-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80') center/cover,
                        linear-gradient(135deg, rgba(156, 163, 175, 0.8) 0%, rgba(107, 114, 128, 0.8) 50%, rgba(75, 85, 99, 0.8) 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            color: #f8fafc;
            text-align: center;
            overflow-x: hidden;
            overflow-y: auto;
          }
          
          .session-card {
            background: transparent;
            backdrop-filter: none;
            border-radius: 25px;
            padding: 0.75rem;
            margin: 0.5rem auto;
            border: 1px solid rgba(255, 255, 255, 0.3);
            box-shadow: none;
            max-width: 320px;
            width: calc(100% - 2rem);
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            box-sizing: border-box;
          }
          
          .session-timer {
            font-size: 3rem;
            font-weight: 300;
            margin: 1rem 0;
            text-shadow: 0 0 20px rgba(30, 41, 59, 0.8);
            color: #1e293b;
          }
          
          .silence-circle {
            width: 150px;
            height: 150px;
            margin: 1rem auto;
            border-radius: 50%;
            background: linear-gradient(135deg, #9ca3af, #6b7280);
            box-shadow: 0 0 40px rgba(156, 163, 175, 0.6), 0 0 80px rgba(107, 114, 128, 0.4);
            animation: breathingGlow 4s ease-in-out infinite;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .silence-icon {
            font-size: 4rem;
          }
          
          @keyframes breathingGlow {
            0%, 100% { 
              transform: scale(1);
              box-shadow: 0 0 40px rgba(156, 163, 175, 0.6), 0 0 80px rgba(107, 114, 128, 0.4);
            }
            50% { 
              transform: scale(1.1);
              box-shadow: 0 0 60px rgba(156, 163, 175, 0.8), 0 0 120px rgba(107, 114, 128, 0.6);
            }
          }
          
          .reward-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2000;
            animation: fadeIn 0.5s ease;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          .reward-content {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 25px;
            padding: 3rem 2rem;
            text-align: center;
            color: #1e293b;
            max-width: 90%;
            width: 350px;
            animation: bounceIn 0.6s ease;
            position: relative;
            overflow: hidden;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
          }
          
          @keyframes bounceIn {
            0% { transform: scale(0.3) rotate(-10deg); opacity: 0; }
            50% { transform: scale(1.1) rotate(5deg); }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          
          .reward-sparkles {
            position: absolute;
            width: 100%;
            height: 100%;
            pointer-events: none;
          }
          
          .sparkle {
            position: absolute;
            width: 6px;
            height: 6px;
            background: white;
            border-radius: 50%;
            animation: sparkle 2s ease-in-out infinite;
          }
          
          @keyframes sparkle {
            0%, 100% { transform: scale(0) rotate(0deg); opacity: 0; }
            50% { transform: scale(1) rotate(180deg); opacity: 1; }
          }
          
          .karma-points {
            font-size: 3rem;
            font-weight: bold;
            margin: 1rem 0;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.5);
            animation: glow 2s ease-in-out infinite;
          }
          
          @keyframes glow {
            0%, 100% { text-shadow: 0 0 20px rgba(255, 255, 255, 0.5); }
            50% { text-shadow: 0 0 30px rgba(255, 255, 255, 0.8), 0 0 40px rgba(255, 255, 255, 0.6); }
          }
        `}</style>
        
        <div class="page-header">
          <button class="back-btn" onClick={goBack}>
            ← Back
          </button>
          <div class="header-content">
            <div class="activity-icon">🤫</div>
            <h1 class="activity-title">Silence</h1>
          </div>
          <button class="share-btn" onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Silence Session - Brahmakosh',
                text: 'Join me in finding peace through silent contemplation',
                url: window.location.href
              });
            } else {
              navigator.clipboard.writeText(window.location.href);
              alert('🔗 Link copied to clipboard!');
            }
          }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/>
              <polyline points="16,6 12,2 8,6"/>
              <line x1="12" y1="2" x2="12" y2="15"/>
            </svg>
          </button>
        </div>
        
        <div class="silence-content">
          <h3 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Silent Contemplation Session</h3>
          <p style={{ marginBottom: '2rem', color: '#64748b', lineHeight: '1.6' }}>
            In silence, we find our truest self and discover profound peace.
          </p>
          
          {!isUserLoggedIn.value ? (
            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
              <div style={{ 
                background: 'linear-gradient(135deg, #fbbf24, #f59e0b)', 
                color: 'white', 
                padding: '1rem', 
                borderRadius: '12px', 
                marginBottom: '1rem',
                fontSize: '0.9rem'
              }}>
                ⚠️ Please log in to save your sessions and earn karma points!
              </div>
              <button 
                class="btn btn-outline-primary"
                style={{ marginRight: '0.5rem' }}
                onClick={() => router.push('/user/login')}
              >
                Login
              </button>
              <button 
                class="btn btn-outline-secondary"
                onClick={() => router.push('/mobile/user/register')}
              >
                Register
              </button>
            </div>
          ) : null}
        </div>
        
        {/* Session Setup - Now directly on page */}
        <div class="session-setup" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: '#1e293b', fontSize: '1.2rem', textAlign: 'center', fontWeight: '600' }}>Customize Your Silence</h3>
          
          <div class="emotion-selector" style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.8rem', color: '#374151', fontSize: '1rem', fontWeight: '500' }}>How are you feeling?</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {emotions.map(item => (
                <label key={item.value} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: selectedEmotion.value === item.value ? '2px solid #9ca3af' : '1px solid #e2e8f0',
                  background: selectedEmotion.value === item.value ? '#f3f4f6' : 'white'
                }}>
                  <input
                    type="radio"
                    name="emotion"
                    value={item.value}
                    checked={selectedEmotion.value === item.value}
                    onChange={() => {
                      selectedEmotion.value = item.value;
                      autoSelectClipForEmotion();
                    }}
                    style={{ marginRight: '0.5rem', accentColor: '#9ca3af' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#1e293b' }}>{item.emoji} {item.label} {selectedEmotion.value === item.value ? '(Default)' : ''}</span>
                </label>
              ))}
            </div>
            {selectedEmotion.value && (
              <div style={{ 
                marginTop: '0.75rem', 
                padding: '0.75rem', 
                background: 'white', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <h5 style={{ color: '#1e293b', margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>Selected Emotion</h5>
                  <span style={{ 
                    background: '#10b981', 
                    color: 'white', 
                    padding: '0.2rem 0.4rem', 
                    borderRadius: '4px', 
                    fontSize: '0.7rem',
                    fontWeight: '500'
                  }}>
                    Default
                  </span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.4rem 0', lineHeight: '1.3' }}>Perfect choice for mindful silence practice</p>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: '#6b7280' }}>
                  <span>🤫 {selectedEmotion.value}</span>
                  <span>✨ Recommended</span>
                </div>
                
                {availableClips.value.length > 0 && (
                  <div style={{ 
                    marginTop: '0.75rem', 
                    padding: '0.75rem', 
                    background: '#f3f4f6', 
                    borderRadius: '6px',
                    border: '1px solid #9ca3af'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '1rem' }}>🎬</span>
                      <h6 style={{ color: '#4b5563', margin: 0, fontSize: '0.85rem', fontWeight: '600' }}>Available Clips ({availableClips.value.length})</h6>
                    </div>
                    
                    {availableClips.value.map((clip, index) => (
                      <div 
                        key={clip._id}
                        onClick={() => selectClip(clip)}
                        style={{ 
                          padding: '0.75rem',
                          background: selectedClip.value?._id === clip._id ? '#9ca3af' : 'white',
                          borderRadius: '6px',
                          marginBottom: index < availableClips.value.length - 1 ? '0.5rem' : '0',
                          cursor: 'pointer',
                          border: selectedClip.value?._id === clip._id ? '2px solid #6b7280' : '1px solid #e2e8f0',
                          transition: 'all 0.2s ease'
                        }}
                      >
                        <div style={{ 
                          color: selectedClip.value?._id === clip._id ? 'white' : '#6b7280', 
                          fontSize: '0.8rem', 
                          fontWeight: '600', 
                          marginBottom: '0.3rem',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between'
                        }}>
                          <span>{clip.title}</span>
                          {selectedClip.value?._id === clip._id && (
                            <span style={{ fontSize: '0.7rem', background: 'rgba(255,255,255,0.3)', padding: '0.2rem 0.4rem', borderRadius: '3px' }}>✓ Selected</span>
                          )}
                        </div>
                        {clip.description && (
                          <div style={{ 
                            color: selectedClip.value?._id === clip._id ? 'rgba(255,255,255,0.9)' : '#4b5563', 
                            fontSize: '0.7rem', 
                            lineHeight: '1.3',
                            marginBottom: '0.4rem'
                          }}>
                            {clip.description}
                          </div>
                        )}
                        <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.7rem' }}>
                          {(clip.videoUrl || clip.videoPresignedUrl) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                previewClip.value = clip;
                                showClipPreview.value = true;
                              }}
                              style={{ 
                                background: selectedClip.value?._id === clip._id ? 'rgba(255,255,255,0.3)' : '#9ca3af', 
                                color: selectedClip.value?._id === clip._id ? 'white' : 'white', 
                                padding: '0.3rem 0.5rem', 
                                borderRadius: '3px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                fontWeight: '500'
                              }}
                            >
                              📹 Preview Video
                            </button>
                          )}
                          {(clip.audioUrl || clip.audioPresignedUrl) && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                previewClip.value = clip;
                                showClipPreview.value = true;
                              }}
                              style={{ 
                                background: selectedClip.value?._id === clip._id ? 'rgba(255,255,255,0.3)' : '#6b7280', 
                                color: 'white', 
                                padding: '0.3rem 0.5rem', 
                                borderRadius: '3px',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: '0.7rem',
                                fontWeight: '500'
                              }}
                            >
                              🎵 Preview Audio
                            </button>
                          )}
                          <span style={{ 
                            background: '#10b981', 
                            color: 'white', 
                            padding: '0.3rem 0.5rem', 
                            borderRadius: '3px',
                            fontSize: '0.7rem',
                            fontWeight: '500'
                          }}>
                            💎 {clip.karmaPoints} pts
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div class="duration-selector" style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.8rem', color: '#374151', fontSize: '1rem', fontWeight: '500' }}>Duration</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(duration => (
                <label key={duration} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: '0.6rem 0.3rem',
                  borderRadius: '6px',
                  border: selectedDuration.value === duration ? '2px solid #9ca3af' : '1px solid #e2e8f0',
                  background: selectedDuration.value === duration ? '#f3f4f6' : 'white',
                  textAlign: 'center',
                  fontSize: '0.8rem'
                }}>
                  <input
                    type="radio"
                    name="duration"
                    value={duration}
                    checked={selectedDuration.value === duration}
                    onChange={() => selectedDuration.value = duration}
                    style={{ marginRight: '0.3rem', accentColor: '#9ca3af' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: '500' }}>{duration}m {selectedDuration.value === duration ? '(Default)' : ''}</span>
                </label>
              ))}
            </div>
            {selectedDuration.value && (
              <div style={{ 
                marginTop: '0.75rem', 
                padding: '0.75rem', 
                background: 'white', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <h5 style={{ color: '#1e293b', margin: 0, fontSize: '0.9rem', fontWeight: '600' }}>Selected Duration</h5>
                  <span style={{ 
                    background: '#9ca3af', 
                    color: 'white', 
                    padding: '0.2rem 0.4rem', 
                    borderRadius: '4px', 
                    fontSize: '0.7rem',
                    fontWeight: '500'
                  }}>
                    {selectedConfig.value?.karmaPoints || (selectedDuration.value * 3)} pts
                  </span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.4rem 0', lineHeight: '1.3' }}>Ideal duration for daily silence practice</p>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: '#6b7280' }}>
                  <span>⏱️ {selectedDuration.value} minutes</span>
                  <span>🎯 Optimal</span>
                </div>
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.5rem', 
                  background: '#f3f4f6', 
                  borderRadius: '6px',
                  border: '1px solid #9ca3af'
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#4b5563', fontWeight: '500' }}>💎 Karma Points Preview</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.2rem' }}>You will earn {selectedConfig.value?.karmaPoints || (selectedDuration.value * 3)} karma points for completing this silence session</div>
                </div>
              </div>
            )}
          </div>
          
          <button class="start-btn" onClick={startSession}>
            🤫 Begin Silence
          </button>
        </div>
        
        {/* Active Session Screen */}
        {isSessionActive.value && (
          <div class="session-screen" style={{ overflow: 'hidden' }}>
            {/* Background media elements */}
            {selectedVideoUrl.value && (
              <div style={{
                position: 'absolute',
                top: '1%',
                left: '0.5%',
                width: '99%',
                height: '98%',
                zIndex: -1,
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <video 
                  ref={backgroundVideo}
                  style={{ 
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover'
                  }}
                  loop
                  preload="auto"
                  playsInline
                >
                  <source src={selectedVideoUrl.value} type="video/mp4" />
                </video>
              </div>
            )}
            
            {selectedAudioUrl.value && (
              <audio 
                ref={backgroundAudio}
                loop
                preload="auto"
              >
                <source src={selectedAudioUrl.value} type="audio/mpeg" />
              </audio>
            )}
            
            <div class="session-card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1e293b' }}>Silence in Progress</h2>
            <p style={{ opacity: 0.9, marginBottom: '2rem', color: '#1e293b' }}>Feeling: {selectedEmotion.value}</p>
            
            <div class="silence-circle">
              <div class="silence-icon">🤫</div>
            </div>
            
            <div class="session-timer">{formatTime(sessionTimer.value)}</div>
            
            <p style={{ opacity: 0.9, lineHeight: '1.6', color: '#1e293b' }}>
              Embrace the stillness. Let silence guide you to inner peace.
            </p>
            
            {/* Media Controls */}
            {(selectedVideoUrl.value || selectedAudioUrl.value) && (
              <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                marginTop: '1.5rem',
                justifyContent: 'center'
              }}>
                {selectedVideoUrl.value && (
                  <button 
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: '#1e293b',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                    onClick={() => {
                      if (backgroundVideo.value) {
                        if (backgroundVideo.value.paused) {
                          backgroundVideo.value.play();
                          isVideoPlaying.value = true;
                        } else {
                          backgroundVideo.value.pause();
                          isVideoPlaying.value = false;
                        }
                      }
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isVideoPlaying.value ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z"/>
                        </svg>
                      )}
                      Video
                    </span>
                  </button>
                )}
                
                {selectedAudioUrl.value && (
                  <button 
                    style={{
                      background: 'rgba(255, 255, 255, 0.2)',
                      border: '1px solid rgba(255, 255, 255, 0.3)',
                      color: '#1e293b',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.9rem'
                    }}
                    onClick={() => {
                      if (backgroundAudio.value) {
                        if (backgroundAudio.value.paused) {
                          backgroundAudio.value.play();
                          isAudioPlaying.value = true;
                        } else {
                          backgroundAudio.value.pause();
                          isAudioPlaying.value = false;
                        }
                      }
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      {isAudioPlaying.value ? (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
                        </svg>
                      ) : (
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
                        </svg>
                      )}
                      Audio
                    </span>
                  </button>
                )}
              </div>
            )}
            
            <button 
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                border: '1px solid rgba(255, 255, 255, 0.3)',
                color: '#1e293b',
                padding: '0.8rem 1.5rem',
                borderRadius: '25px',
                cursor: 'pointer',
                marginTop: '2rem'
              }}
              onClick={() => {
                isSessionActive.value = false;
                clearInterval(timerInterval.value);
                
                if (backgroundVideo.value) {
                  backgroundVideo.value.pause();
                  backgroundVideo.value.currentTime = 0;
                }
                if (backgroundAudio.value) {
                  backgroundAudio.value.pause();
                  backgroundAudio.value.currentTime = 0;
                }
                
                const completedMinutes = selectedDuration.value - Math.ceil(sessionTimer.value / 60);
                sessionTimer.value = 0;
                const configKarma = selectedConfig.value?.karmaPoints || (selectedDuration.value * 3);
                earnedPoints.value = Math.max(0, Math.floor((completedMinutes / selectedDuration.value) * configKarma));
                if (completedMinutes > 0) {
                  saveSession(selectedDuration.value, completedMinutes, selectedEmotion.value, earnedPoints.value);
                } else {
                  saveSession(selectedDuration.value, 0, selectedEmotion.value, 0);
                }
                showRewardModal.value = true;
              }}
            >
              End Session
            </button>
            </div>
          </div>
        )}
        
        {/* Clip Preview Modal */}
        {showClipPreview.value && previewClip.value && (
          <div 
            class="reward-modal"
            onClick={() => {
              showClipPreview.value = false;
              previewClip.value = null;
            }}
          >
            <div 
              style={{
                background: 'white',
                borderRadius: '12px',
                padding: '1.5rem',
                maxWidth: '90%',
                width: '400px',
                maxHeight: '80vh',
                overflow: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0, color: '#1e293b', fontSize: '1.1rem' }}>{previewClip.value.title}</h3>
                <button
                  onClick={() => {
                    showClipPreview.value = false;
                    previewClip.value = null;
                  }}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#64748b'
                  }}
                >
                  ×
                </button>
              </div>
              
              {previewClip.value.description && (
                <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                  {previewClip.value.description}
                </p>
              )}
              
              {(previewClip.value.videoUrl || previewClip.value.videoPresignedUrl) && (
                <div style={{ marginBottom: '1rem' }}>
                  <video 
                    style={{
                      width: '100%',
                      borderRadius: '8px',
                      maxHeight: '300px'
                    }}
                    controls
                    preload="metadata"
                  >
                    <source src={previewClip.value.videoPresignedUrl || previewClip.value.videoUrl} type="video/mp4" />
                  </video>
                </div>
              )}
              
              {(previewClip.value.audioUrl || previewClip.value.audioPresignedUrl) && (
                <div style={{ marginBottom: '1rem' }}>
                  <audio 
                    style={{
                      width: '100%'
                    }}
                    controls
                    preload="metadata"
                  >
                    <source src={previewClip.value.audioPresignedUrl || previewClip.value.audioUrl} type="audio/mpeg" />
                  </audio>
                </div>
              )}
              
              <button
                onClick={() => {
                  selectClip(previewClip.value);
                  showClipPreview.value = false;
                  previewClip.value = null;
                }}
                style={{
                  background: 'linear-gradient(135deg, #9ca3af, #6b7280)',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '8px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  width: '100%'
                }}
              >
                Select This Clip
              </button>
            </div>
          </div>
        )}
        
        {/* Reward Modal */}
        {showRewardModal.value && (
          <div class="reward-modal">
            <div class="reward-content">
              {/* Sparkles Animation */}
              <div class="reward-sparkles">
                {Array.from({length: 15}).map((_, i) => (
                  <div 
                    key={i}
                    class="sparkle"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: `${Math.random() * 100}%`,
                      animationDelay: `${Math.random() * 2}s`
                    }}
                  />
                ))}
              </div>
              
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                Silence Complete!
              </h2>
              
              <div style={{ fontSize: '1.2rem', marginBottom: '1rem', opacity: 0.9 }}>
                You practiced silence for {selectedDuration.value - Math.ceil(sessionTimer.value / 60)} minutes
                {selectedDuration.value - Math.ceil(sessionTimer.value / 60) < selectedDuration.value && (
                  <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
                    Target: {selectedDuration.value} minutes
                  </div>
                )}
              </div>
              
              {isUserLoggedIn.value ? (
                <>
                  <div class="karma-points">
                    +{earnedPoints.value} ✨
                  </div>
                  
                  <div style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
                    Karma Points Earned!
                  </div>
                </>
              ) : (
                <div style={{ fontSize: '1rem', marginBottom: '2rem', opacity: 0.9, background: 'rgba(255,255,255,0.2)', padding: '1rem', borderRadius: '12px' }}>
                  ⚠️ Login to save sessions and earn karma points!
                </div>
              )}
              
              <button 
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  color: 'white',
                  padding: '1rem 2rem',
                  borderRadius: '25px',
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onClick={() => {
                  showRewardModal.value = false;
                  closeReward();
                }}
              >
                Continue Journey 🚀
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
};