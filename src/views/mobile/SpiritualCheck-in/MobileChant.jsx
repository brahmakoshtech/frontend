import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import spiritualClipService from '../../../services/spiritualClipService.js';
import spiritualStatsService from '../../../services/spiritualStatsService.js';
import spiritualActivityService from '../../../services/spiritualActivityService.js';

export default {
  name: 'MobileChant',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const clips = ref([]);
    const configurations = ref([]);
    const loading = ref(true);
    const isSessionActive = ref(false);
    const sessionTime = ref(0);
    const targetChants = ref(108);
    const selectedEmotion = ref('devoted');
    const selectedChantingName = ref('Gayatri Mantra');
    const selectedVideoUrl = ref('');
    const selectedAudioUrl = ref('');
    const enableVideo = ref(false);
    const enableAudio = ref(false);
    const tempVideoUrl = ref('');
    const tempAudioUrl = ref('');
    const chantCount = ref(0);
    const timer = ref(null);
    const showRewardModal = ref(false);
    const earnedKarma = ref(0);
    const backgroundVideo = ref(null);
    const backgroundAudio = ref(null);
    const isVideoPlaying = ref(false);
    const isAudioPlaying = ref(false);
    
    const emotions = [
      { emoji: '🕉️', label: 'Devoted', value: 'devoted' },
      { emoji: '🔥', label: 'Energized', value: 'energized' },
      { emoji: '🌟', label: 'Focused', value: 'focused' },
      { emoji: '💫', label: 'Elevated', value: 'elevated' },
      { emoji: '🙏', label: 'Reverent', value: 'reverent' },
      { emoji: '😐', label: 'Neutral', value: 'neutral' },
      { emoji: '😰', label: 'Stress', value: 'stress' }
    ];
    
    const chantingNames = [
      'Gayatri Mantra',
      'Hanuman Chalisa', 
      'Mahamrityunjaya Mantra',
      'Shri Ganesh Vandana',
      'Shri Ram Stuti',
      'Shiv Tandava Stotram',
      'Durga Chalisa',
      'Vishnu Sahasranama',
      'Saraswati Vandana',
      'Shanti Path'
    ];
    
    const startTimer = () => {
      timer.value = setInterval(() => {
        sessionTime.value++;
      }, 1000);
    };
    
    const stopTimer = () => {
      if (timer.value) {
        clearInterval(timer.value);
        timer.value = null;
      }
    };
    
    const formatTime = (seconds) => {
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    const incrementChant = () => {
      chantCount.value++;
      if (chantCount.value >= targetChants.value) {
        endSession();
      }
    };
    
    const startSession = () => {
      isSessionActive.value = true;
      sessionTime.value = 0;
      chantCount.value = 0;
      startTimer();
      
      // Start background media playback after a short delay
      setTimeout(() => {
        if (selectedVideoUrl.value && backgroundVideo.value) {
          console.log('Starting video:', selectedVideoUrl.value);
          backgroundVideo.value.play().catch(e => console.log('Video autoplay prevented:', e));
          isVideoPlaying.value = true;
        }
        if (selectedAudioUrl.value && backgroundAudio.value) {
          console.log('Starting audio:', selectedAudioUrl.value);
          backgroundAudio.value.play().catch(e => console.log('Audio autoplay prevented:', e));
          isAudioPlaying.value = true;
        }
      }, 100);
    };
    
    const endSession = async () => {
      stopTimer();
      isSessionActive.value = false;
      
      // Stop background media
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
      
      const completionPercentage = Math.min((chantCount.value / targetChants.value) * 100, 100);
      const karmaPoints = Math.floor(chantCount.value / 10);
      
      earnedKarma.value = karmaPoints;
      
      await saveSession(karmaPoints, completionPercentage);
      
      showRewardModal.value = true;
      
      setTimeout(() => {
        showRewardModal.value = false;
        sessionTime.value = 0;
        chantCount.value = 0;
      }, 3000);
    };

    const saveSession = async (karmaPoints, completionPercentage = 100) => {
      try {
        const token = localStorage.getItem('token_user');
        if (!token) {
          console.warn('User not logged in, session not saved');
          return;
        }
        
        const sessionData = {
          type: 'chanting',
          title: selectedChantingName.value || 'Chanting Session',
          chantingName: selectedChantingName.value,
          karmaPoints: karmaPoints,
          emotion: selectedEmotion.value,
          status: completionPercentage >= 100 ? 'completed' : 'incomplete',
          completionPercentage: Math.round(completionPercentage),
          chantCount: chantCount.value,
          videoUrl: selectedVideoUrl.value,
          audioUrl: selectedAudioUrl.value
        };
        
        const response = await spiritualStatsService.saveSession(sessionData);
        if (response.success) {
          console.log('Chanting session saved successfully:', response.data?.statusMessage || response.message);
        }
      } catch (error) {
        console.error('Error saving chanting session:', error);
      }
    };
    
    const goBack = () => {
      router.push('/mobile/user/activities');
    };

    const fetchChantingConfigurations = async () => {
      try {
        const activityType = route.query.type || 'chanting';
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

    const fetchChantingClips = async () => {
      try {
        loading.value = true;
        const response = await spiritualClipService.getAllClips({ type: 'chanting' });
        
        if (response.success && response.data) {
          clips.value = response.data;
        } else {
          clips.value = [
            {
              _id: '1',
              title: 'Gayatri Mantra Chanting',
              description: 'Sacred Gayatri Mantra for wisdom, enlightenment and spiritual awakening.',
              type: 'chanting'
            },
            {
              _id: '2',
              title: 'Om Namah Shivaya',
              description: 'Powerful Shiva mantra for inner transformation and divine connection.',
              type: 'chanting'
            },
            {
              _id: '3',
              title: 'Hanuman Chalisa',
              description: 'Devotional chanting for strength, courage and protection.',
              type: 'chanting'
            }
          ];
        }
      } catch (error) {
        console.error('Error fetching chanting clips:', error);
        clips.value = [];
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchChantingClips();
      fetchChantingConfigurations();
    });
    
    onUnmounted(() => {
      stopTimer();
    });

    return () => (
      <div class="chant-page">
        <style>{`
          .chant-page {
            padding: 0.75rem;
            min-height: 100vh;
            background: #f8fafc;
          }
          
          .page-header {
            background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
            color: white;
            padding: 0.75rem;
            margin-bottom: 1rem;
            border-radius: 8px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
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
          
          .chant-content {
            background: white;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }
          
          .start-btn {
            background: linear-gradient(135deg, #f59e0b, #d97706);
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
            box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);
          }
          
          .session-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('https://usagif.com/wp-content/uploads/gif/outerspace-70.gif') center/cover,
                        linear-gradient(135deg, rgba(251, 146, 60, 0.8) 0%, rgba(245, 158, 11, 0.8) 50%, rgba(217, 119, 6, 0.8) 100%);
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
          
          .chant-circle {
            width: 120px;
            height: 120px;
            margin: 0.5rem auto;
            border-radius: 50%;
            background: linear-gradient(135deg, #f59e0b, #d97706);
            box-shadow: 0 0 40px rgba(245, 158, 11, 0.6), 0 0 80px rgba(217, 119, 6, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: breathingGlow 4s ease-in-out infinite;
          }
          
          @keyframes breathingGlow {
            0%, 100% { 
              transform: scale(1);
              box-shadow: 0 0 40px rgba(245, 158, 11, 0.6), 0 0 80px rgba(217, 119, 6, 0.4);
            }
            50% { 
              transform: scale(1.1);
              box-shadow: 0 0 60px rgba(245, 158, 11, 0.8), 0 0 120px rgba(217, 119, 6, 0.6);
            }
          }
          
          .chant-counter {
            font-size: 2.5rem;
            font-weight: 300;
            color: white;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
          }
          
          .chant-progress {
            color: #6b7280;
            margin-bottom: 2rem;
          }
          
          .chant-btn {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 1rem;
            border-radius: 50%;
            font-size: 1.5rem;
            cursor: pointer;
            margin: 1rem;
            width: 80px;
            height: 80px;
            backdrop-filter: blur(10px);
            transition: all 0.3s ease;
          }
          
          .chant-btn:hover {
            transform: scale(1.05);
            background: rgba(255, 255, 255, 0.3);
          }
          
          .chant-btn:active {
            transform: scale(0.95);
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
          
          .clips-list {
            margin-top: 2rem;
          }
          
          .clip-item {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .clip-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          }
          
          .clip-title {
            color: #1e293b;
            font-weight: 700;
            margin-bottom: 0.5rem;
            font-size: 0.95rem;
          }
          
          .clip-desc {
            color: #64748b;
            font-size: 0.85rem;
            margin-bottom: 1rem;
            line-height: 1.4;
          }
          
          .loading {
            text-align: center;
            color: #64748b;
            padding: 2rem;
            font-size: 1.1rem;
          }
        `}</style>
        
        <div class="page-header">
          <button class="back-btn" onClick={goBack}>
            ← Back
          </button>
          <div class="header-content">
            <div class="activity-icon">🕉️</div>
            <h1 class="activity-title">Chant</h1>
          </div>
          <button class="share-btn" onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Chanting Session - Brahmakosh',
                text: 'Join me in spiritual chanting and find inner peace',
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
        
        <div class="chant-content">
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.5rem', color: '#1e293b', fontSize: '1.1rem', fontWeight: '700' }}>🕉️ Sacred Mantra Chanting</h3>
            <p style={{ color: '#64748b', lineHeight: '1.5', fontSize: '0.9rem', margin: 0 }}>
              Let the power of sacred mantras elevate your consciousness.
            </p>
          </div>
        </div>
        
        {/* Session Setup - Now directly on page */}
        <div class="session-setup" style={{ background: 'white', borderRadius: '12px', padding: '1.5rem', marginBottom: '2rem', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
          <h3 style={{ marginBottom: '1.2rem', color: '#1e293b', fontSize: '1.1rem', textAlign: 'center', fontWeight: '700' }}>🕉️ Chanting Session</h3>
          
          <div class="chanting-name-section" style={{ marginBottom: '1.5rem' }}>
            <p style={{ marginBottom: '0.6rem', color: '#374151', fontSize: '0.95rem', fontWeight: '600' }}>Select Chanting</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.75rem', maxHeight: '200px', overflowY: 'auto' }}>
              {chantingNames.map(name => (
                <label key={name} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  background: selectedChantingName.value === name ? '#fef3c7' : 'white',
                  boxShadow: selectedChantingName.value === name ? '0 2px 8px rgba(245, 158, 11, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <input
                    type="radio"
                    name="chantingName"
                    value={name}
                    checked={selectedChantingName.value === name}
                    onChange={() => selectedChantingName.value = name}
                    style={{ marginRight: '0.5rem', accentColor: '#f59e0b' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: '600', lineHeight: '1.2' }}>
                    {name} {selectedChantingName.value === name ? '(Default)' : ''}
                  </span>
                </label>
              ))}
            </div>
            {selectedChantingName.value && (
              <div style={{ 
                marginTop: '0.75rem', 
                padding: '0.75rem', 
                background: 'white', 
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h5 style={{ color: '#1e293b', margin: 0, fontSize: '0.9rem', fontWeight: '700' }}>Selected Chanting</h5>
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
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.4rem 0', lineHeight: '1.3' }}>Sacred mantra for spiritual awakening</p>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: '#6b7280' }}>
                  <span>🕉️ {selectedChantingName.value}</span>
                  <span>✨ Recommended</span>
                </div>
              </div>
            )}
          </div>
          
          <div class="emotion-section" style={{ marginBottom: '1.5rem' }}>
            <p style={{ marginBottom: '0.6rem', color: '#374151', fontSize: '0.95rem', fontWeight: '600' }}>How are you feeling?</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {emotions.map(emotion => (
                <label key={emotion.value} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  cursor: 'pointer',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  background: selectedEmotion.value === emotion.value ? '#fef3c7' : 'white',
                  boxShadow: selectedEmotion.value === emotion.value ? '0 2px 8px rgba(245, 158, 11, 0.3)' : '0 1px 3px rgba(0, 0, 0, 0.1)'
                }}>
                  <input
                    type="radio"
                    name="emotion"
                    value={emotion.value}
                    checked={selectedEmotion.value === emotion.value}
                    onChange={() => selectedEmotion.value = emotion.value}
                    style={{ marginRight: '0.5rem', accentColor: '#f59e0b' }}
                  />
                  <span style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: '600' }}>{emotion.emoji} {emotion.label} {selectedEmotion.value === emotion.value ? '(Default)' : ''}</span>
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
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.4rem 0', lineHeight: '1.3' }}>Perfect choice for mindful chanting practice</p>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: '#6b7280' }}>
                  <span>🕉️ {selectedEmotion.value}</span>
                  <span>✨ Recommended</span>
                </div>
              </div>
            )}
          </div>
          
          <div class="chants-section" style={{ marginBottom: '1.5rem' }}>
            <p style={{ marginBottom: '0.6rem', color: '#374151', fontSize: '0.95rem', fontWeight: '600' }}>Target Chants</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.5rem', marginBottom: '0.75rem' }}>
              {[27, 54, 108, 216, 324, 432, 540, 600].map(chants => (
                <label key={chants} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: '0.6rem 0.3rem',
                  borderRadius: '6px',
                  border: targetChants.value === chants ? '2px solid #f59e0b' : '1px solid #e2e8f0',
                  background: targetChants.value === chants ? '#fef3c7' : 'white',
                  textAlign: 'center',
                  fontSize: '0.8rem'
                }}>
                  <input
                    type="radio"
                    name="chants"
                    value={chants}
                    checked={targetChants.value === chants}
                    onChange={() => targetChants.value = chants}
                    style={{ marginRight: '0.3rem', accentColor: '#f59e0b' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: '#1e293b', fontWeight: '600' }}>{chants} {targetChants.value === chants ? '(Default)' : ''}</span>
                </label>
              ))}
            </div>
            {targetChants.value && (
              <div style={{ 
                marginTop: '0.75rem', 
                padding: '0.75rem', 
                background: 'white', 
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <h5 style={{ color: '#1e293b', margin: 0, fontSize: '0.9rem', fontWeight: '700' }}>Selected Target</h5>
                  <span style={{ 
                    background: '#f59e0b', 
                    color: 'white', 
                    padding: '0.2rem 0.4rem', 
                    borderRadius: '4px', 
                    fontSize: '0.7rem',
                    fontWeight: '500'
                  }}>
                    {Math.min(Math.floor(targetChants.value / 10), 60)} pts
                  </span>
                </div>
                <p style={{ color: '#64748b', fontSize: '0.8rem', margin: '0.4rem 0', lineHeight: '1.3' }}>Ideal count for daily chanting practice</p>
                <div style={{ display: 'flex', gap: '0.75rem', fontSize: '0.7rem', color: '#6b7280' }}>
                  <span>🕉️ {targetChants.value} chants</span>
                  <span>🎯 Optimal</span>
                </div>
                <div style={{ 
                  marginTop: '0.5rem', 
                  padding: '0.5rem', 
                  background: '#fef3c7', 
                  borderRadius: '6px',
                  border: '1px solid #f59e0b'
                }}>
                  <div style={{ fontSize: '0.8rem', color: '#92400e', fontWeight: '500' }}>💎 Karma Points Preview</div>
                  <div style={{ fontSize: '0.75rem', color: '#b45309', marginTop: '0.2rem' }}>You will earn {Math.min(Math.floor(targetChants.value / 10), 60)} karma points for completing {targetChants.value} chants</div>
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
                  style={{ marginRight: '0.5rem', accentColor: '#f59e0b' }}
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
                  style={{ marginRight: '0.5rem', accentColor: '#f59e0b' }}
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
          
          <button class="start-btn" onClick={startSession}>Start Chanting</button>
        </div>
        
        {loading.value ? (
          <div class="loading">Loading chanting clips...</div>
        ) : (
          <>
            {configurations.value.length > 0 && (
              <div class="configurations-section" style={{ marginBottom: '2rem' }}>
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
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
                        border: '1px solid #e2e8f0'
                      }}
                    >
                      <div class="config-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                        <h5 style={{ color: '#1e293b', margin: 0, fontSize: '0.9rem', fontWeight: '700' }}>{config.title}</h5>
                        <span style={{ 
                          background: '#f59e0b', 
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
                        <span>🕉️ {config.emotion}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <div class="clips-list">
              {clips.value.map(clip => (
                <div 
                  key={clip._id}
                  class="clip-item"
                >
                  <div class="clip-title">{clip.title}</div>
                  <div class="clip-desc">{clip.description}</div>
                  
                  <div class="clip-media" style={{ marginTop: '1rem' }}>
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
                  muted
                  preload="auto"
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
              <h2 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#fbbf24' }}>Chanting in Progress</h2>
              <p style={{ opacity: 0.9, marginBottom: '1rem', color: '#fbbf24' }}>Feeling: {selectedEmotion.value}</p>
              
              <div class="chant-circle">
                <div class="chant-counter">{chantCount.value}</div>
              </div>
              
              <div class="chant-progress" style={{ color: '#fbbf24', marginBottom: '1rem' }}>
                <p>{chantCount.value} / {targetChants.value} chants</p>
                <p>Progress: {Math.round((chantCount.value / targetChants.value) * 100)}%</p>
              </div>
              
              <button class="chant-btn" onClick={incrementChant}>
                🕉️
              </button>
              
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
                        color: '#fbbf24',
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
                  color: '#fbbf24',
                  padding: '0.8rem 1.5rem',
                  borderRadius: '25px',
                  cursor: 'pointer',
                  marginTop: '2rem'
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
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
              <h2 style={{ fontSize: '1.8rem', marginBottom: '1rem', fontWeight: 'bold' }}>
                Chanting Complete!
              </h2>
              
              <div style={{ fontSize: '1.2rem', marginBottom: '1rem', opacity: 0.9 }}>
                You chanted {chantCount.value} times
              </div>
              
              <div style={{ fontSize: '3rem', fontWeight: 'bold', margin: '1rem 0', textShadow: '0 0 20px rgba(255, 255, 255, 0.5)' }}>
                +{earnedKarma.value} ✨
              </div>
              
              <div style={{ fontSize: '1.1rem', marginBottom: '2rem', opacity: 0.9 }}>
                Karma Points Earned!
              </div>
              
              <button 
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '2px solid rgba(255, 255, 255, 0.5)',
                  color: '#1e293b',
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