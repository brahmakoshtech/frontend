import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import spiritualClipService from '../../../services/spiritualClipService.js';
import spiritualStatsService from '../../../services/spiritualStatsService.js';
import spiritualActivityService from '../../../services/spiritualActivityService.js';

export default {
  name: 'MobilePray',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const clips = ref([]);
    const configurations = ref([]);
    const loading = ref(true);
    const isSessionActive = ref(false);
    const sessionTimer = ref(0);
    const selectedEmotion = ref('grateful');
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
    const videoWatchdog = ref(null);
    
    const emotions = [
      { emoji: '🙏', label: 'Grateful', value: 'grateful' },
      { emoji: '☮️', label: 'Peaceful', value: 'peaceful' },
      { emoji: '💝', label: 'Loving', value: 'loving' },
      { emoji: '✨', label: 'Hopeful', value: 'hopeful' },
      { emoji: '🕊️', label: 'Serene', value: 'serene' },
      { emoji: '😐', label: 'Neutral', value: 'neutral' },
      { emoji: '😰', label: 'Stressed', value: 'stressed' }
    ];
    
    const goBack = () => {
      router.push('/mobile/user/activities');
    };

    const fetchPrayerConfigurations = async () => {
      try {
        const activityType = route.query.type || 'prayer';
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

    const fetchPrayerClips = async () => {
      try {
        loading.value = true;
        console.log('Fetching prayer clips...');
        const response = await spiritualClipService.getAllClips({ type: 'prayer' });
        console.log('API Response:', response);
        
        if (response.success && response.data && response.data.length > 0) {
          clips.value = response.data;
          console.log('Loaded clips from API:', response.data.length);
        } else {
          console.log('No clips found, using fallback data');
          clips.value = [
            {
              _id: 'fallback-1',
              title: 'Daily Gratitude Prayer',
              description: 'Express thankfulness and connect with divine grace through heartfelt prayer.',
              type: 'prayer'
            },
            {
              _id: 'fallback-2',
              title: 'Evening Reflection',
              description: 'End your day with peaceful prayer and spiritual contemplation.',
              type: 'prayer'
            }
          ];
        }
      } catch (error) {
        console.error('Error fetching prayer clips:', error);
        clips.value = [
          {
            _id: 'error-1',
            title: 'Connection Error - Daily Prayer',
            description: 'Connect with divine grace (offline mode).',
            type: 'prayer'
          }
        ];
      } finally {
        loading.value = false;
      }
    };

    const startSession = () => {
      beginPrayer();
    };

    const saveSession = async (targetDuration, actualDuration, emotion, karmaPoints, videoUrl = '', audioUrl = '') => {
      try {
        const token = localStorage.getItem('token_user');
        if (!token) {
          console.warn('User not logged in, session not saved');
          alert('⚠️ Please log in to save your prayer sessions and earn karma points!');
          return;
        }
        
        const sessionData = {
          type: 'prayer',
          title: 'Prayer Session',
          targetDuration: targetDuration,
          actualDuration: actualDuration,
          karmaPoints: karmaPoints,
          emotion: emotion,
          videoUrl: videoUrl,
          audioUrl: audioUrl
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

    const beginPrayer = () => {
      isSessionActive.value = true;
      sessionTimer.value = selectedDuration.value * 60;
      
      setTimeout(() => {
        if (selectedVideoUrl.value && backgroundVideo.value) {
          console.log('Starting video:', selectedVideoUrl.value);
          
          // Set all video properties
          backgroundVideo.value.loop = true;
          backgroundVideo.value.muted = true;
          backgroundVideo.value.playsInline = true;
          backgroundVideo.value.preload = 'auto';
          backgroundVideo.value.autoplay = true;
          backgroundVideo.value.controls = false;
          backgroundVideo.value.disablePictureInPicture = true;
          
          // Force video source reload
          backgroundVideo.value.src = selectedVideoUrl.value;
          backgroundVideo.value.load();
          
          // Enhanced event listeners
          backgroundVideo.value.addEventListener('loadstart', () => {
            console.log('Video loading started');
          });
          
          backgroundVideo.value.addEventListener('loadedmetadata', () => {
            console.log('Video metadata loaded');
            backgroundVideo.value.play().catch(e => console.log('Video play error:', e));
          });
          
          backgroundVideo.value.addEventListener('canplay', () => {
            console.log('Video can start playing');
            if (backgroundVideo.value.paused) {
              backgroundVideo.value.play().catch(e => console.log('Video play error:', e));
            }
          });
          
          backgroundVideo.value.addEventListener('waiting', () => {
            console.log('Video waiting for data');
          });
          
          backgroundVideo.value.addEventListener('playing', () => {
            console.log('Video is playing');
            isVideoPlaying.value = true;
          });
          
          backgroundVideo.value.addEventListener('pause', () => {
            console.log('Video paused - attempting restart');
            if (isSessionActive.value) {
              setTimeout(() => {
                backgroundVideo.value.play().catch(e => console.log('Video restart error:', e));
              }, 100);
            }
          });
          
          backgroundVideo.value.addEventListener('ended', () => {
            console.log('Video ended, restarting');
            backgroundVideo.value.currentTime = 0;
            backgroundVideo.value.play().catch(e => console.log('Video restart error:', e));
          });
          
          backgroundVideo.value.addEventListener('error', (e) => {
            console.log('Video error:', e);
            // Try to reload video on error
            setTimeout(() => {
              backgroundVideo.value.load();
              backgroundVideo.value.play().catch(err => console.log('Video reload error:', err));
            }, 1000);
          });
          
          backgroundVideo.value.addEventListener('stalled', () => {
            console.log('Video stalled - attempting restart');
            backgroundVideo.value.load();
          });
          
          // Initial play attempt
          backgroundVideo.value.play().catch(e => {
            console.log('Initial video play prevented:', e);
            // Try again after a short delay
            setTimeout(() => {
              backgroundVideo.value.play().catch(err => console.log('Delayed video play error:', err));
            }, 500);
          });
          
          // Start video watchdog to ensure continuous playback
          if (videoWatchdog.value) {
            clearInterval(videoWatchdog.value);
          }
          
          videoWatchdog.value = setInterval(() => {
            if (backgroundVideo.value && isSessionActive.value) {
              if (backgroundVideo.value.paused || backgroundVideo.value.ended) {
                console.log('Video watchdog: Video paused/ended, restarting');
                backgroundVideo.value.currentTime = 0;
                backgroundVideo.value.play().catch(e => console.log('Watchdog restart error:', e));
              }
            }
          }, 3000);
          
          isVideoPlaying.value = true;
        }
        
        if (selectedAudioUrl.value && backgroundAudio.value) {
          console.log('Starting audio:', selectedAudioUrl.value);
          backgroundAudio.value.loop = true;
          backgroundAudio.value.preload = 'auto';
          backgroundAudio.value.src = selectedAudioUrl.value;
          backgroundAudio.value.load();
          
          backgroundAudio.value.addEventListener('ended', () => {
            backgroundAudio.value.currentTime = 0;
            backgroundAudio.value.play();
          });
          
          backgroundAudio.value.play().catch(e => console.log('Audio autoplay prevented:', e));
          isAudioPlaying.value = true;
        }
      }, 100);
      
      timerInterval.value = setInterval(() => {
        sessionTimer.value--;
        if (sessionTimer.value <= 0) {
          isSessionActive.value = false;
          clearInterval(timerInterval.value);
          if (videoWatchdog.value) {
            clearInterval(videoWatchdog.value);
          }
          
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
          earnedPoints.value = selectedDuration.value * 3;
          saveSession(selectedDuration.value, selectedDuration.value, selectedEmotion.value, earnedPoints.value, selectedVideoUrl.value, selectedAudioUrl.value);
          showRewardModal.value = true;
        }
      }, 1000);
    };

    const endSession = () => {
      isSessionActive.value = false;
      clearInterval(timerInterval.value);
      if (videoWatchdog.value) {
        clearInterval(videoWatchdog.value);
      }
      
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
      earnedPoints.value = Math.max(0, completedMinutes * 3);
      
      if (completedMinutes > 0) {
        saveSession(selectedDuration.value, completedMinutes, selectedEmotion.value, earnedPoints.value, selectedVideoUrl.value, selectedAudioUrl.value);
      } else {
        saveSession(selectedDuration.value, 0, selectedEmotion.value, 0, selectedVideoUrl.value, selectedAudioUrl.value);
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
    };

    onMounted(() => {
      fetchPrayerClips();
      fetchPrayerConfigurations();
    });

    onUnmounted(() => {
      if (timerInterval.value) {
        clearInterval(timerInterval.value);
      }
      if (videoWatchdog.value) {
        clearInterval(videoWatchdog.value);
      }
    });

    return () => (
      <div class="prayer-page">
        <style>{`
          .prayer-page {
            padding: 0.75rem;
            min-height: 100vh;
            background: #f8fafc;
          }
          
          .page-header {
            background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
            color: white;
            padding: 0.75rem;
            margin-bottom: 1rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
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
          
          .prayer-content {
            background: white;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .start-btn {
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
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
            box-shadow: 0 2px 8px rgba(251, 191, 36, 0.3);
          }
          
          .session-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80') center/cover,
                        linear-gradient(135deg, rgba(251, 191, 36, 0.8) 0%, rgba(245, 158, 11, 0.8) 50%, rgba(217, 119, 6, 0.8) 100%);
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
            font-weight: bold;
            margin: 1rem 0;
            text-shadow: 0 0 20px rgba(251, 191, 36, 0.8);
            color: #fbbf24;
          }
          
          .prayer-circle {
            width: 150px;
            height: 150px;
            margin: 1rem auto;
            border-radius: 50%;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            box-shadow: 0 0 40px rgba(251, 191, 36, 0.6), 0 0 80px rgba(245, 158, 11, 0.4);
            animation: breathingGlow 4s ease-in-out infinite;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .prayer-icon {
            font-size: 4rem;
          }
          
          @keyframes breathingGlow {
            0%, 100% { 
              transform: scale(1);
              box-shadow: 0 0 40px rgba(251, 191, 36, 0.6), 0 0 80px rgba(245, 158, 11, 0.4);
            }
            50% { 
              transform: scale(1.1);
              box-shadow: 0 0 60px rgba(251, 191, 36, 0.8), 0 0 120px rgba(245, 158, 11, 0.6);
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
            <div class="activity-icon">🙏</div>
            <h1 class="activity-title">Prayer</h1>
          </div>
          <button class="share-btn" onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Prayer Session - Brahmakosh',
                text: 'Join me in heartfelt prayer and spiritual connection',
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
        
        <div class="prayer-content">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem', color: '#1e293b', fontSize: '1.1rem', fontWeight: '700' }}>🙏 Prayer Session</h3>
            <p style={{ color: '#64748b', lineHeight: '1.5', fontSize: '0.9rem', margin: 0 }}>
              Connect with the divine through heartfelt prayer and spiritual contemplation.
            </p>
          </div>
        </div>
        
        {/* Session Setup - Now directly on page */}
        <div class="session-setup" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginBottom: '1.2rem', color: '#1e293b', fontSize: '1.1rem', textAlign: 'center', fontWeight: '700' }}>🙏 Prayer Session</h3>
          
          <div class="emotion-selector" style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.6rem', color: '#374151', fontSize: '0.95rem', fontWeight: '600' }}>How are you feeling?</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {emotions.map(item => (
                <label key={item.value} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  background: selectedEmotion.value === item.value ? '#fef3c7' : 'white',
                  boxShadow: selectedEmotion.value === item.value ? '0 2px 8px rgba(251, 191, 36, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <input
                    type="radio"
                    name="emotion"
                    value={item.value}
                    checked={selectedEmotion.value === item.value}
                    onChange={() => selectedEmotion.value = item.value}
                    style={{ marginRight: '0.5rem', accentColor: '#fbbf24' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: '600' }}>{item.emoji} {item.label} {selectedEmotion.value === item.value ? '(Default)' : ''}</span>
                </label>
              ))}
            </div>
            {selectedEmotion.value && (
              <div style={{ 
                marginTop: '0.75rem', 
                padding: '0.75rem', 
                background: 'white', 
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h5 style={{ color: '#1e293b', margin: 0, fontSize: '0.9rem', fontWeight: '700' }}>Selected Emotion</h5>
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
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.4rem 0', lineHeight: '1.3' }}>Perfect choice for heartfelt prayer practice</p>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: '#6b7280' }}>
                  <span>🙏 {selectedEmotion.value}</span>
                  <span>✨ Recommended</span>
                </div>
              </div>
            )}
          </div>
          
          <div class="duration-selector" style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.6rem', color: '#374151', fontSize: '0.95rem', fontWeight: '600' }}>Duration</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(duration => (
                <label key={duration} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: '0.6rem 0.3rem',
                  borderRadius: '6px',
                  background: selectedDuration.value === duration ? '#fef3c7' : 'white',
                  boxShadow: selectedDuration.value === duration ? '0 2px 8px rgba(251, 191, 36, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
                  textAlign: 'center',
                  fontSize: '0.8rem'
                }}>
                  <input
                    type="radio"
                    name="duration"
                    value={duration}
                    checked={selectedDuration.value === duration}
                    onChange={() => selectedDuration.value = duration}
                    style={{ marginRight: '0.3rem', accentColor: '#fbbf24' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: '600' }}>{duration}m {selectedDuration.value === duration ? '(Default)' : ''}</span>
                </label>
              ))}
            </div>
            {selectedDuration.value && (
              <div style={{ 
                marginTop: '0.75rem', 
                padding: '0.75rem', 
                background: 'white', 
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h5 style={{ color: '#1e293b', margin: 0, fontSize: '0.9rem', fontWeight: '700' }}>Selected Duration</h5>
                  <span style={{ 
                    background: '#fbbf24', 
                    color: 'white', 
                    padding: '0.2rem 0.4rem', 
                    borderRadius: '4px', 
                    fontSize: '0.7rem',
                    fontWeight: '500'
                  }}>
                    {selectedDuration.value * 3} pts
                  </span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.4rem 0', lineHeight: '1.3' }}>Ideal duration for daily prayer practice</p>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: '#6b7280' }}>
                  <span>⏱️ {selectedDuration.value} minutes</span>
                  <span>🎯 Optimal</span>
                </div>
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.5rem', 
                  background: '#fef3c7', 
                  borderRadius: '6px'
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#4b5563', fontWeight: '500' }}>💎 Karma Points Preview</div>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.2rem' }}>You will earn {selectedDuration.value * 3} karma points for completing this {selectedDuration.value}-minute prayer session</div>
                </div>
              </div>
            )}
          </div>
          
          {/* Media Selection */}
          <div class="media-selector" style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ marginBottom: '0.6rem', color: '#374151', fontSize: '0.95rem', fontWeight: '600' }}>Select Media (Optional)</h4>
            
            {/* Available Clips Dropdown */}
            {clips.value.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <select 
                  style={{ 
                    width: '100%', 
                    padding: '0.5rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem'
                  }}
                  onChange={(e) => {
                    const selectedClip = clips.value.find(clip => clip._id === e.target.value);
                    if (selectedClip) {
                      const videoUrl = selectedClip.videoUrl || selectedClip.videoPresignedUrl || '';
                      const audioUrl = selectedClip.audioUrl || selectedClip.audioPresignedUrl || '';
                      
                      if (videoUrl) {
                        enableVideo.value = true;
                        selectedVideoUrl.value = videoUrl;
                        tempVideoUrl.value = videoUrl;
                      }
                      if (audioUrl) {
                        enableAudio.value = true;
                        selectedAudioUrl.value = audioUrl;
                        tempAudioUrl.value = audioUrl;
                      }
                    } else {
                      enableVideo.value = false;
                      enableAudio.value = false;
                      selectedVideoUrl.value = '';
                      selectedAudioUrl.value = '';
                    }
                  }}
                >
                  <option value="">Select a clip...</option>
                  {clips.value.map(clip => (
                    <option key={clip._id} value={clip._id}>
                      {clip.title} {clip.videoUrl || clip.videoPresignedUrl ? '📹' : ''} {clip.audioUrl || clip.audioPresignedUrl ? '🎵' : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}
            
            {/* Selected Clip Preview */}
            {(selectedVideoUrl.value && selectedVideoUrl.value !== '' && selectedVideoUrl.value !== 'https://') || (selectedAudioUrl.value && selectedAudioUrl.value !== '' && selectedAudioUrl.value !== 'https://') ? (
              <div style={{ 
                marginBottom: '1rem',
                padding: '0.75rem', 
                background: 'white', 
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <h5 style={{ color: '#1e293b', margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '700' }}>Selected Media Preview</h5>
                
                {selectedVideoUrl.value && selectedVideoUrl.value !== '' && selectedVideoUrl.value !== 'https://' && (
                  <div style={{ marginBottom: '0.5rem' }}>
                    <video 
                      style={{
                        width: '100%',
                        maxHeight: '120px',
                        borderRadius: '6px',
                        objectFit: 'cover'
                      }}
                      controls
                      preload="metadata"
                    >
                      <source src={selectedVideoUrl.value} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  </div>
                )}
                
                {selectedAudioUrl.value && selectedAudioUrl.value !== '' && selectedAudioUrl.value !== 'https://' && (
                  <div>
                    <audio 
                      style={{
                        width: '100%',
                        height: '32px'
                      }}
                      controls
                      preload="metadata"
                    >
                      <source src={selectedAudioUrl.value} type="audio/mpeg" />
                      Your browser does not support the audio tag.
                    </audio>
                  </div>
                )}
              </div>
            ) : null}
            
            {/* Manual URL Inputs */}
            <div style={{ fontSize: '0.9rem', color: '#6b7280', marginBottom: '0.5rem' }}>Or enter custom URLs:</div>
            
            {/* Video Selection */}
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.3rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={enableVideo.value}
                  onChange={(e) => {
                    enableVideo.value = e.target.checked;
                    if (!e.target.checked) {
                      tempVideoUrl.value = selectedVideoUrl.value;
                      selectedVideoUrl.value = '';
                    } else {
                      selectedVideoUrl.value = tempVideoUrl.value || '';
                    }
                  }}
                  style={{ marginRight: '0.5rem', accentColor: '#fbbf24' }}
                />
                <span style={{ fontSize: '0.85rem', color: '#374151', fontWeight: '600' }}>📹 Include Video</span>
              </label>
              {enableVideo.value && (
                <input 
                  type="url" 
                  placeholder="Video URL"
                  style={{ 
                    width: '100%', 
                    padding: '0.5rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                  value={selectedVideoUrl.value}
                  onInput={(e) => selectedVideoUrl.value = e.target.value}
                />
              )}
            </div>
            
            {/* Audio Selection */}
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ display: 'flex', alignItems: 'center', marginBottom: '0.3rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={enableAudio.value}
                  onChange={(e) => {
                    enableAudio.value = e.target.checked;
                    if (!e.target.checked) {
                      tempAudioUrl.value = selectedAudioUrl.value;
                      selectedAudioUrl.value = '';
                    } else {
                      selectedAudioUrl.value = tempAudioUrl.value || '';
                    }
                  }}
                  style={{ marginRight: '0.5rem', accentColor: '#fbbf24' }}
                />
                <span style={{ fontSize: '0.85rem', color: '#374151', fontWeight: '600' }}>🎵 Include Audio</span>
              </label>
              {enableAudio.value && (
                <input 
                  type="url" 
                  placeholder="Audio URL"
                  style={{ 
                    width: '100%', 
                    padding: '0.5rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '6px',
                    fontSize: '0.9rem',
                    boxSizing: 'border-box'
                  }}
                  value={selectedAudioUrl.value}
                  onInput={(e) => selectedAudioUrl.value = e.target.value}
                />
              )}
            </div>
          </div>
          
          <button class="start-btn" onClick={startSession}>
            🙏 Begin Prayer
          </button>
        </div>
        
        {loading.value ? (
          <div class="loading">Loading prayer clips...</div>
        ) : (
          <>
            {configurations.value.length > 0 && (
              <div class="configurations-section">
                <h4 style={{ marginBottom: '0.6rem', color: '#1e293b', fontSize: '0.95rem', fontWeight: '700' }}>Available Configurations</h4>
                <div class="configurations-list">
                  {configurations.value.map(config => (
                    <div 
                      key={config._id}
                      class="config-item"
                      style={{
                        background: 'white',
                        borderRadius: '8px',
                        padding: '0.75rem',
                        marginBottom: '0.75rem',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      <div class="config-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <h5 style={{ color: '#1e293b', margin: 0, fontSize: '0.9rem', fontWeight: '700' }}>{config.title}</h5>
                        <span style={{ 
                          background: '#fbbf24', 
                          color: 'white', 
                          padding: '0.2rem 0.4rem', 
                          borderRadius: '4px', 
                          fontSize: '0.7rem',
                          fontWeight: '500'
                        }}>
                          {config.karmaPoints} pts
                        </span>
                      </div>
                      <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.4rem 0', lineHeight: '1.3' }}>{config.description}</p>
                      <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: '#6b7280' }}>
                        <span>⏱️ {config.duration}</span>
                        <span>🙏 {config.emotion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Clips Section */}
            <div class="clips-list">
              {clips.value.map(clip => (
                <div 
                  key={clip._id}
                  style={{
                    background: 'white',
                    borderRadius: '8px',
                    padding: '0.75rem',
                    marginBottom: '0.75rem',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
                  }}
                >
                  <h5 style={{ fontWeight: '700', color: '#1e293b', marginBottom: '0.4rem', fontSize: '0.95rem' }}>{clip.title}</h5>
                  <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: '1.4', marginBottom: '0.75rem' }}>{clip.description}</p>
                  
                  <div class="clip-media">
                    {(clip.videoUrl || clip.videoPresignedUrl) && (
                      <video 
                        style={{
                          width: '100%',
                          maxHeight: '150px',
                          borderRadius: '6px',
                          marginBottom: '0.5rem',
                          objectFit: 'cover'
                        }}
                        controls
                        preload="metadata"
                      >
                        <source src={clip.videoPresignedUrl || clip.videoUrl} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                    
                    {(clip.audioUrl || clip.audioPresignedUrl) && (
                      <audio 
                        style={{
                          width: '100%',
                          height: '32px'
                        }}
                        controls
                        preload="metadata"
                      >
                        <source src={clip.audioPresignedUrl || clip.audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio tag.
                      </audio>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
        
        {/* Active Session Screen */}
        {isSessionActive.value && (
          <div class="session-screen" style={{ overflow: 'hidden' }}>
            {/* Background media elements */}
            {selectedVideoUrl.value && (
              <div style={{
                position: 'absolute',
                top: '0',
                left: '0',
                width: '100%',
                height: '100%',
                zIndex: -1,
                background: selectedVideoUrl.value ? 
                  'linear-gradient(135deg, rgba(251, 191, 36, 0.3) 0%, rgba(245, 158, 11, 0.3) 50%, rgba(217, 119, 6, 0.3) 100%), url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80") center/cover' :
                  'linear-gradient(135deg, rgba(251, 191, 36, 0.8) 0%, rgba(245, 158, 11, 0.8) 50%, rgba(217, 119, 6, 0.8) 100%), url("https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80") center/cover',
                overflow: 'hidden'
              }}>
                <video 
                  ref={backgroundVideo}
                  style={{ 
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    backgroundColor: 'transparent',
                    position: 'absolute',
                    top: 0,
                    left: 0
                  }}
                  loop
                  muted
                  playsInline
                  autoplay
                  preload="auto"
                  controls={false}
                  disablePictureInPicture
                  webkit-playsinline="true"
                  x5-playsinline="true"
                  x5-video-player-type="h5"
                  x5-video-player-fullscreen="true"
                  onLoadStart={() => console.log('Video load started')}
                  onCanPlay={() => console.log('Video can play')}
                  onLoadedData={() => console.log('Video data loaded')}
                  onLoadedMetadata={() => console.log('Video metadata loaded')}
                  onPlaying={() => console.log('Video playing')}
                  onWaiting={() => console.log('Video waiting')}
                  onStalled={() => console.log('Video stalled')}
                  onError={(e) => {
                    console.log('Video error:', e);
                    // Auto-retry on error
                    setTimeout(() => {
                      if (backgroundVideo.value) {
                        backgroundVideo.value.load();
                        backgroundVideo.value.play().catch(err => console.log('Video retry error:', err));
                      }
                    }, 1000);
                  }}
                >
                  <source src={selectedVideoUrl.value} type="video/mp4" />
                  <source src={selectedVideoUrl.value} type="video/webm" />
                  <source src={selectedVideoUrl.value} type="video/ogg" />
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
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#fbbf24', fontWeight: 'bold' }}>Prayer in Progress</h2>
            <p style={{ opacity: 0.9, marginBottom: '2rem', color: '#fbbf24', fontWeight: 'bold' }}>Feeling: {selectedEmotion.value}</p>
            
            <div class="prayer-circle">
              <div class="prayer-icon">🙏</div>
            </div>
            
            <div class="session-timer">{formatTime(sessionTimer.value)}</div>
            
            <p style={{ opacity: 0.9, lineHeight: '1.6', color: '#fbbf24', fontWeight: 'bold' }}>
              Connect with divine grace through heartfelt prayer.
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
                      color: '#fbbf24',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
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
                      color: '#fbbf24',
                      padding: '0.5rem 1rem',
                      borderRadius: '20px',
                      cursor: 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: 'bold'
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
                color: '#fbbf24',
                padding: '0.8rem 1.5rem',
                borderRadius: '25px',
                cursor: 'pointer',
                marginTop: '2rem',
                fontWeight: 'bold'
              }}
              onClick={endSession}
            >
              End Session
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
                Prayer Complete!
              </h2>
              
              <div style={{ fontSize: '1.2rem', marginBottom: '1rem', opacity: 0.9 }}>
                You prayed for {selectedDuration.value - Math.ceil(sessionTimer.value / 60)} minutes
                {selectedDuration.value - Math.ceil(sessionTimer.value / 60) < selectedDuration.value && (
                  <div style={{ fontSize: '0.9rem', marginTop: '0.5rem', opacity: 0.7 }}>
                    Target: {selectedDuration.value} minutes
                  </div>
                )}
              </div>
              
              <div class="karma-points">
                +{earnedPoints.value} ✨
              </div>
              
              <div style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
                Karma Points Earned!
              </div>
              
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
                onClick={() => showRewardModal.value = false}
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