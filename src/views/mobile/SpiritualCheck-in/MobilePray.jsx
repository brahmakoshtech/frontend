import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import spiritualClipService from '../../../services/spiritualClipService.js';
import spiritualStatsService from '../../../services/spiritualStatsService.js';

export default {
  name: 'MobilePray',
  setup() {
    const router = useRouter();
    const clips = ref([]);
    const loading = ref(true);
    const showModal = ref(false);
    const isSessionActive = ref(false);
    const sessionTime = ref(0);
    const targetDuration = ref(1);
    const selectedEmotion = ref('');
    const timer = ref(null);
    const showRewardModal = ref(false);
    const earnedKarma = ref(0);
    
    const emotions = [
      { emoji: '🙏', label: 'Grateful', value: 'grateful' },
      { emoji: '☮️', label: 'Peaceful', value: 'peaceful' },
      { emoji: '💝', label: 'Loving', value: 'loving' },
      { emoji: '✨', label: 'Hopeful', value: 'hopeful' },
      { emoji: '🕊️', label: 'Serene', value: 'serene' }
    ];
    
    const startTimer = () => {
      timer.value = setInterval(() => {
        sessionTime.value--;
        if (sessionTime.value <= 0) {
          endSession();
        }
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
    
    const startSession = () => {
      if (!selectedEmotion.value) {
        alert('Please select how you\'re feeling before starting');
        return;
      }
      
      showModal.value = false;
      isSessionActive.value = true;
      sessionTime.value = targetDuration.value * 60;
      startTimer();
    };
    
    const endSession = async () => {
      stopTimer();
      isSessionActive.value = false;
      
      const completedMinutes = targetDuration.value - Math.ceil(sessionTime.value / 60);
      const karmaPoints = Math.max(0, completedMinutes * 3);
      
      earnedKarma.value = karmaPoints;
      
      await saveSession(targetDuration.value, completedMinutes, karmaPoints, completedMinutes >= targetDuration.value ? 100 : (completedMinutes / targetDuration.value) * 100);
      
      showRewardModal.value = true;
      
      setTimeout(() => {
        showRewardModal.value = false;
        sessionTime.value = 0;
        selectedEmotion.value = '';
      }, 3000);
    };
    
    const openSessionModal = () => {
      showModal.value = true;
    };

    const saveSession = async (targetDuration, actualDuration, karmaPoints, completionPercentage = 100) => {
      try {
        const token = localStorage.getItem('token_user');
        if (!token) {
          console.warn('User not logged in, session not saved');
          return;
        }
        
        const sessionData = {
          type: 'prayer',
          title: 'Prayer Session',
          targetDuration: targetDuration,
          actualDuration: actualDuration,
          karmaPoints: karmaPoints,
          emotion: selectedEmotion.value,
          status: completionPercentage >= 100 ? 'completed' : 'incomplete',
          completionPercentage: Math.round(completionPercentage)
        };
        
        const response = await spiritualStatsService.saveSession(sessionData);
        if (response.success) {
          console.log('Prayer session saved successfully:', response.data?.statusMessage || response.message);
        }
      } catch (error) {
        console.error('Error saving prayer session:', error);
      }
    };
    
    const goBack = () => {
      router.push('/mobile/user/activities');
    };

    const fetchPrayerClips = async () => {
      try {
        loading.value = true;
        const response = await spiritualClipService.getAllClips({ type: 'prayer' });
        
        if (response.success && response.data) {
          clips.value = response.data;
        } else {
          clips.value = [
            {
              _id: '1',
              title: 'Daily Gratitude Prayer',
              description: 'Express thankfulness and connect with divine grace through heartfelt prayer.',
              type: 'prayer'
            },
            {
              _id: '2',
              title: 'Evening Reflection',
              description: 'End your day with peaceful prayer and spiritual contemplation.',
              type: 'prayer'
            },
            {
              _id: '3',
              title: 'Healing Prayer',
              description: 'Seek comfort and healing through the power of sincere prayer.',
              type: 'prayer'
            }
          ];
        }
      } catch (error) {
        console.error('Error fetching prayer clips:', error);
        clips.value = [
          {
            _id: '1',
            title: 'Daily Gratitude Prayer',
            description: 'Express thankfulness and connect with divine grace.',
            type: 'prayer'
          },
          {
            _id: '2',
            title: 'Evening Reflection',
            description: 'End your day with peaceful prayer and contemplation.',
            type: 'prayer'
          }
        ];
      } finally {
        loading.value = false;
      }
    };

    const playClip = (clip) => {
      console.log('Playing clip:', clip.title);
      alert(`Playing: ${clip.title}\n\n${clip.description}`);
    };

    onMounted(() => {
      fetchPrayerClips();
    });
    
    onUnmounted(() => {
      stopTimer();
    });

    return () => (
      <div class="pray-page">
        {!isSessionActive.value ? (
          <>
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
              <h3>🙏 Prayer Session</h3>
              <p>Connect with the divine through heartfelt prayer.</p>
              <button class="start-btn" onClick={openSessionModal}>
                Start Prayer Session
              </button>
            </div>
            
            {loading.value ? (
              <div class="loading">Loading prayer clips...</div>
            ) : (
              <div class="clips-list">
                {clips.value.map(clip => (
                  <div 
                    key={clip._id}
                    class="clip-item"
                  >
                    <div class="clip-title">{clip.title}</div>
                    <div class="clip-desc">{clip.description}</div>
                    
                    <div class="clip-media">
                      {clip.videoUrl && (
                        <video 
                          class="clip-video"
                          controls
                          preload="metadata"
                        >
                          <source src={clip.videoUrl} type="video/mp4" />
                        </video>
                      )}
                      
                      {clip.audioUrl && (
                        <audio 
                          class="clip-audio"
                          controls
                          preload="metadata"
                        >
                          <source src={clip.audioUrl} type="audio/mpeg" />
                        </audio>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <div class="session-screen">
            <div class="session-card">
              <h2 style={{ color: '#fbbf24', fontSize: '1.5rem', fontWeight: '600', marginBottom: '0.5rem' }}>Prayer in Progress</h2>
              <p style={{ color: '#fbbf24', fontSize: '0.9rem', marginBottom: '1rem', opacity: 0.9 }}>Feeling: {selectedEmotion.value}</p>
              
              <div class="prayer-circle">
                <div class="prayer-counter">{formatTime(sessionTime.value)}</div>
              </div>
              
              <p style={{ color: '#fbbf24', fontSize: '0.9rem', marginTop: '1rem', marginBottom: '2rem' }}>Target: {targetDuration.value} minutes</p>
              
              <button 
                style={{
                  background: 'rgba(251, 191, 36, 0.2)',
                  border: '2px solid rgba(251, 191, 36, 0.5)',
                  color: '#fbbf24',
                  padding: '0.8rem 2rem',
                  borderRadius: '25px',
                  fontSize: '1rem',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  backdropFilter: 'blur(10px)',
                  transition: 'all 0.3s ease'
                }}
                onClick={endSession}
              >
                End Session
              </button>
            </div>
          </div>
        )}
        
        {/* Session Modal */}
        {showModal.value && (
          <div class="modal-overlay">
            <div class="session-modal">
              <h3>🙏 Prayer Session</h3>
              
              <div class="emotion-section">
                <p>How are you feeling?</p>
                <div class="emotion-grid">
                  {emotions.map(emotion => (
                    <button
                      key={emotion.value}
                      class={`emotion-btn ${selectedEmotion.value === emotion.value ? 'selected' : ''}`}
                      onClick={() => selectedEmotion.value = emotion.value}
                    >
                      <span class="emotion-emoji">{emotion.emoji}</span>
                      <span class="emotion-label">{emotion.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div class="duration-section">
                <p>Duration (minutes)</p>
                <div class="duration-grid">
                  {[1, 3, 5, 10, 15, 20, 25, 30].map(duration => (
                    <button
                      key={duration}
                      class={`duration-btn ${targetDuration.value === duration ? 'selected' : ''}`}
                      onClick={() => targetDuration.value = duration}
                    >
                      {duration}m
                    </button>
                  ))}
                </div>
              </div>
              
              <div class="modal-actions">
                <button class="cancel-btn" onClick={() => showModal.value = false}>Cancel</button>
                <button class="start-btn" onClick={startSession}>Start Prayer</button>
              </div>
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
                You prayed for {targetDuration.value} minutes
              </div>
              
              <div class="karma-points">
                +{earnedKarma.value} ✨
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
        
        <style>{`
          .pray-page {
            padding: 1rem;
            min-height: 100vh;
            background: #f8fafc;
          }
          
          .page-header {
            background: white;
            color: #1e293b;
            padding: 1rem;
            margin-bottom: 1.5rem;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          
          .back-btn {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            color: #64748b;
            padding: 0.5rem 1rem;
            border-radius: 8px;
            font-size: 0.9rem;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .back-btn:hover {
            background: #e2e8f0;
            border-color: #cbd5e1;
          }
          
          .share-btn {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            color: #64748b;
            padding: 0.5rem;
            border-radius: 8px;
            font-size: 1.2rem;
            cursor: pointer;
            transition: all 0.2s ease;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .share-btn:hover {
            background: #e2e8f0;
            border-color: #cbd5e1;
            transform: scale(1.05);
          }
          
          .header-content {
            display: flex;
            align-items: center;
            gap: 0.8rem;
          }
          
          .activity-icon {
            font-size: 1.8rem;
          }
          
          .activity-title {
            font-size: 1.3rem;
            font-weight: 600;
            margin: 0;
          }
          
          .prayer-content {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          
          .session-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('https://usagif.com/wp-content/uploads/gif/outerspace-70.gif') center/cover,
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
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 25px;
            padding: 2rem 1.5rem;
            margin: 1rem auto;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            max-width: 320px;
            width: calc(100% - 2rem);
            min-height: 400px;
            text-align: center;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: space-between;
            box-sizing: border-box;
          }
          
          .prayer-circle {
            width: 140px;
            height: 140px;
            margin: 1rem auto;
            border-radius: 50%;
            background: linear-gradient(135deg, #fbbf24, #f59e0b);
            box-shadow: 0 0 40px rgba(251, 191, 36, 0.6), 0 0 80px rgba(245, 158, 11, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            animation: breathingGlow 4s ease-in-out infinite;
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
          
          .prayer-counter {
            font-size: 2.5rem;
            font-weight: 300;
            color: white;
            text-shadow: 0 0 20px rgba(255, 255, 255, 0.8);
          }
          
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            overflow: hidden;
            padding: 0.5rem;
          }
          
          .session-modal {
            background: white;
            border-radius: 16px;
            padding: 1rem;
            width: calc(100% - 2rem);
            max-width: 400px;
            max-height: 90vh;
            overflow-y: auto;
            overflow-x: hidden;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            box-sizing: border-box;
          }
          
          .emotion-section {
            margin: 1rem 0;
          }
          
          .emotion-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.4rem;
            margin-top: 0.8rem;
          }
          
          .emotion-btn {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 0.5rem 0.3rem;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.2rem;
            font-size: 0.7rem;
            text-align: center;
            line-height: 1.1;
            box-sizing: border-box;
          }
          
          .emotion-btn.selected {
            background: #fbbf24;
            border-color: #fbbf24;
            color: white;
          }
          
          .emotion-emoji {
            font-size: 1rem;
          }
          
          .emotion-label {
            font-size: 0.65rem;
            font-weight: 500;
          }
          
          .duration-section {
            margin: 1rem 0;
          }
          
          .duration-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.4rem;
            margin: 1rem 0;
          }
          
          .duration-btn {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 0.4rem 0.2rem;
            cursor: pointer;
            font-size: 0.7rem;
            transition: all 0.2s ease;
            text-align: center;
            box-sizing: border-box;
          }
          
          .duration-btn.selected {
            background: #fbbf24;
            border-color: #fbbf24;
            color: white;
          }
          
          .modal-actions {
            display: flex;
            gap: 1rem;
            margin-top: 2rem;
          }
          
          .cancel-btn {
            flex: 1;
            background: #f1f5f9;
            color: #64748b;
            border: none;
            padding: 0.75rem;
            border-radius: 8px;
            cursor: pointer;
          }
          
          .start-btn {
            flex: 1;
            background: #fbbf24;
            color: white;
            border: none;
            padding: 0.75rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
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
          
          .clips-list {
            margin-top: 2rem;
          }
          
          .clip-item {
            background: white;
            border-radius: 12px;
            padding: 1rem;
            margin-bottom: 1rem;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            cursor: pointer;
            transition: all 0.3s ease;
          }
          
          .clip-item:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }
          
          .clip-title {
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.5rem;
          }
          
          .clip-desc {
            color: #64748b;
            font-size: 0.9rem;
            line-height: 1.4;
            margin-bottom: 1rem;
          }
          
          .clip-media {
            margin-top: 1rem;
          }
          
          .clip-video {
            width: 100%;
            max-height: 200px;
            border-radius: 8px;
            margin-bottom: 0.5rem;
            object-fit: cover;
          }
          
          .clip-audio {
            width: 100%;
            height: 40px;
          }
          
          .loading {
            text-align: center;
            padding: 2rem;
            color: #64748b;
            background: white;
            border-radius: 12px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
        `}</style>
      </div>
    );
  }
};