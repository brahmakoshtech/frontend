import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import spiritualClipService from '../../../services/spiritualClipService.js';
import spiritualStatsService from '../../../services/spiritualStatsService.js';

export default {
  name: 'MobileMeditate',
  setup() {
    const router = useRouter();
    const clips = ref([]);
    const loading = ref(true);
    const showSessionModal = ref(false);
    const selectedEmotion = ref('calm');
    const selectedDuration = ref(5);
    const isSessionActive = ref(false);
    const sessionTimer = ref(0);
    const timerInterval = ref(null);
    const showRewardModal = ref(false);
    const earnedPoints = ref(0);
    const isUserLoggedIn = ref(false);
    
    // Check if user is logged in
    const checkUserAuth = () => {
      const token = localStorage.getItem('token_user');
      isUserLoggedIn.value = !!token;
      return !!token;
    };
    
    const goBack = () => {
      router.push('/mobile/user/activities');
    };

    const fetchMeditationClips = async () => {
      try {
        loading.value = true;
        console.log('Fetching meditation clips...');
        const response = await spiritualClipService.getAllClips({ type: 'meditation' });
        console.log('API Response:', response);
        
        if (response.success && response.data && response.data.length > 0) {
          clips.value = response.data;
          console.log('Loaded clips from API:', response.data.length);
        } else {
          console.log('No clips found, using fallback data');
          clips.value = [
            {
              _id: 'fallback-1',
              title: 'Morning Mindfulness',
              description: 'Start your day with peaceful awareness and gentle breathing exercises.',
              type: 'meditation'
            },
            {
              _id: 'fallback-2', 
              title: 'Deep Relaxation',
              description: 'Release tension and find inner calm through guided meditation.',
              type: 'meditation'
            }
          ];
        }
      } catch (error) {
        console.error('Error fetching meditation clips:', error);
        clips.value = [
          {
            _id: 'error-1',
            title: 'Connection Error - Morning Mindfulness',
            description: 'Start your day with peaceful awareness (offline mode).',
            type: 'meditation'
          }
        ];
      } finally {
        loading.value = false;
      }
    };

    const startSession = () => {
      showSessionModal.value = true;
    };

    const saveSession = async (targetDuration, actualDuration, emotion, karmaPoints) => {
      try {
        const token = localStorage.getItem('token_user');
        if (!token) {
          console.warn('User not logged in, session not saved');
          alert('⚠️ Please log in to save your meditation sessions and earn karma points!');
          return;
        }
        
        const sessionData = {
          type: 'meditation',
          title: 'Meditation Session',
          targetDuration: targetDuration,
          actualDuration: actualDuration,
          karmaPoints: karmaPoints,
          emotion: emotion
        };
        
        const response = await spiritualStatsService.saveSession(sessionData);
        if (response.success) {
          console.log('Session saved successfully:', response.data?.statusMessage || response.message);
          if (response.data?.statusMessage) {
            // Show status message to user
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

    const beginMeditation = () => {
      showSessionModal.value = false;
      isSessionActive.value = true;
      sessionTimer.value = selectedDuration.value * 60; // Convert to seconds
      
      timerInterval.value = setInterval(() => {
        sessionTimer.value--;
        if (sessionTimer.value <= 0) {
          isSessionActive.value = false;
          clearInterval(timerInterval.value);
          sessionTimer.value = 0;
          earnedPoints.value = selectedDuration.value * 3;
          // Save completed session to database
          saveSession(selectedDuration.value, selectedDuration.value, selectedEmotion.value, earnedPoints.value);
          showRewardModal.value = true;
        }
      }, 1000);
    };

    const endSession = () => {
      isSessionActive.value = false;
      clearInterval(timerInterval.value);
      sessionTimer.value = 0;
      alert('🧘‍♀️ Meditation session completed! Well done!');
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
      checkUserAuth();
      fetchMeditationClips();
    });

    return () => (
      <div class="meditate-page">
        {/* Floating Particles */}
        <style>{`
          .meditate-page {
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
          
          .meditation-content {
            background: white;
            border-radius: 12px;
            padding: 2rem;
            margin-bottom: 2rem;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            text-align: center;
          }
          
          .start-btn {
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          
          .start-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }
          
          .clips-list {
            margin-top: 0;
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
          }
          
          .session-modal {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.4);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
            padding: 1rem;
          }
          
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          
          .modal-content {
            background: white;
            border-radius: 20px;
            padding: 2rem 1.5rem;
            width: 100%;
            max-width: 380px;
            animation: scaleIn 0.4s ease;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.1);
            position: relative;
            overflow: hidden;
          }
          
          .modal-content::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, #667eea, #764ba2, #f093fb);
          }
          
          @keyframes scaleIn {
            from { transform: scale(0.8); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
          
          .emotion-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.4rem;
            margin: 0.8rem 0;
          }
          
          .emotion-btn {
            padding: 0.8rem 0.5rem;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            background: white;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.85rem;
            text-align: center;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          
          .emotion-btn:hover {
            border-color: #667eea;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          
          .emotion-btn.active {
            border-color: #667eea;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }
          
          .duration-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.4rem;
            margin: 0.8rem 0;
          }
          
          .duration-btn {
            padding: 0.8rem;
            border: 2px solid #e5e7eb;
            border-radius: 12px;
            background: white;
            cursor: pointer;
            transition: all 0.3s ease;
            font-size: 0.9rem;
            text-align: center;
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
          }
          
          .duration-btn:hover {
            border-color: #667eea;
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          }
          
          .duration-btn.active {
            border-color: #667eea;
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            transform: scale(1.05);
            box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
          }
          
          .session-screen {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80') center/cover,
                        linear-gradient(135deg, rgba(131, 96, 195, 0.8) 0%, rgba(46, 191, 145, 0.8) 50%, rgba(255, 236, 210, 0.8) 100%);
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
            padding: 1.5rem;
            margin: 1rem auto;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
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
          
          .zen-circle {
            width: 150px;
            height: 150px;
            margin: 1rem auto;
            border-radius: 50%;
            background: linear-gradient(135deg, #667eea, #764ba2);
            box-shadow: 0 0 40px rgba(102, 126, 234, 0.6), 0 0 80px rgba(118, 75, 162, 0.4);
            animation: breathingGlow 4s ease-in-out infinite;
          }
          
          @keyframes breathingGlow {
            0%, 100% { 
              transform: scale(1);
              box-shadow: 0 0 40px rgba(102, 126, 234, 0.6), 0 0 80px rgba(118, 75, 162, 0.4);
            }
            50% { 
              transform: scale(1.1);
              box-shadow: 0 0 60px rgba(102, 126, 234, 0.8), 0 0 120px rgba(118, 75, 162, 0.6);
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
            <div class="activity-icon">🧘♀️</div>
            <h1 class="activity-title">Meditation</h1>
          </div>
          <button class="share-btn" onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: 'Meditation Session - Brahmakosh',
                text: 'Join me in finding inner peace through meditation',
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
        
        <div class="meditation-content">
          <h3 style={{ marginBottom: '1.5rem', color: '#1e293b' }}>Guided Meditation Session</h3>
          <p style={{ marginBottom: '2rem', color: '#64748b', lineHeight: '1.6' }}>
            Take a moment to center yourself. Close your eyes, breathe deeply, 
            and let go of all worries. Focus on your breath and find your inner calm.
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
          
          <button class="start-btn" onClick={startSession}>
            🧘‍♀️ Start Meditation Session
          </button>
        </div>
        
        {loading.value ? (
          <div class="loading">Loading meditation clips...</div>
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
                      Your browser does not support the video tag.
                    </video>
                  )}
                  
                  {clip.audioUrl && (
                    <audio 
                      class="clip-audio"
                      controls
                      preload="metadata"
                    >
                      <source src={clip.audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio tag.
                    </audio>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Session Setup Modal */}
        {showSessionModal.value && (
          <div class="session-modal">
            <div class="modal-content">
              <h3 style={{ marginBottom: '1.5rem', color: '#1e293b', fontSize: '1.3rem', textAlign: 'center', fontWeight: '600' }}>Customize Your Meditation</h3>
              
              <div class="emotion-selector">
                <h4 style={{ marginBottom: '0.8rem', color: '#374151', fontSize: '1rem', fontWeight: '500' }}>How are you feeling?</h4>
                <div class="emotion-grid">
                  {[
                    { emotion: 'calm', emoji: '😌' },
                    { emotion: 'stressed', emoji: '😰' },
                    { emotion: 'anxious', emoji: '😟' },
                    { emotion: 'happy', emoji: '😊' },
                    { emotion: 'sad', emoji: '😢' },
                    { emotion: 'peaceful', emoji: '🕊️' }
                  ].map(item => (
                    <button 
                      key={item.emotion}
                      class={`emotion-btn ${selectedEmotion.value === item.emotion ? 'active' : ''}`}
                      onClick={() => selectedEmotion.value = item.emotion}
                    >
                      {item.emoji} {item.emotion}
                    </button>
                  ))}
                </div>
              </div>
              
              <div class="duration-selector">
                <h4 style={{ marginBottom: '0.8rem', color: '#374151', fontSize: '1rem', fontWeight: '500' }}>Duration (minutes)</h4>
                <div class="duration-grid">
                  {[1, 3, 5, 10, 15, 20, 25, 30].map(duration => (
                    <button 
                      key={duration}
                      class={`duration-btn ${selectedDuration.value === duration ? 'active' : ''}`}
                      onClick={() => selectedDuration.value = duration}
                    >
                      {duration}m
                    </button>
                  ))}
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '1.2rem' }}>
                <button 
                  style={{ 
                    flex: 1, 
                    padding: '0.8rem', 
                    border: '1px solid #d1d5db', 
                    borderRadius: '8px', 
                    background: 'white',
                    cursor: 'pointer'
                  }}
                  onClick={() => showSessionModal.value = false}
                >
                  Cancel
                </button>
                <button 
                  style={{ 
                    flex: 1, 
                    padding: '0.8rem', 
                    border: 'none', 
                    borderRadius: '8px', 
                    background: '#10b981',
                    color: 'white',
                    cursor: 'pointer'
                  }}
                  onClick={beginMeditation}
                >
                  Begin 🧘‍♀️
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Active Session Screen */}
        {isSessionActive.value && (
          <div class="session-screen">
            <div class="session-card">
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem', color: '#1e293b' }}>Meditation in Progress</h2>
            <p style={{ opacity: 0.9, marginBottom: '2rem', color: '#1e293b' }}>Feeling: {selectedEmotion.value}</p>
            
            <div class="zen-circle">
              <div class="zen-icon">🧘‍♀️</div>
            </div>
            
            <div class="session-timer">{formatTime(sessionTimer.value)}</div>
            
            <p style={{ opacity: 0.9, lineHeight: '1.6', color: '#1e293b' }}>
              Focus on your breath. Let thoughts come and go like clouds in the sky.
            </p>
            
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
                const completedMinutes = selectedDuration.value - Math.ceil(sessionTimer.value / 60);
                sessionTimer.value = 0;
                earnedPoints.value = Math.max(0, completedMinutes * 3);
                // Save partial/incomplete session
                if (completedMinutes > 0) {
                  saveSession(selectedDuration.value, completedMinutes, selectedEmotion.value, earnedPoints.value);
                } else {
                  // Save interrupted session with 0 actual duration
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
                Meditation Complete!
              </h2>
              
              <div style={{ fontSize: '1.2rem', marginBottom: '1rem', opacity: 0.9 }}>
                You meditated for {selectedDuration.value - Math.ceil(sessionTimer.value / 60)} minutes
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