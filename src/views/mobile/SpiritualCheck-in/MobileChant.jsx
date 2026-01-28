import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import spiritualClipService from '../../../services/spiritualClipService.js';
import spiritualStatsService from '../../../services/spiritualStatsService.js';

export default {
  name: 'MobileChant',
  setup() {
    const router = useRouter();
    const clips = ref([]);
    const loading = ref(true);
    const showModal = ref(false);
    const isSessionActive = ref(false);
    const sessionTime = ref(0);

    const targetChants = ref(108);
    const selectedEmotion = ref('');
    const selectedChantingName = ref('');
    const chantCount = ref(0);
    const timer = ref(null);
    const showRewardModal = ref(false);
    const earnedKarma = ref(0);
    
    const emotions = [
      { emoji: '🕉️', label: 'Devoted', value: 'devoted' },
      { emoji: '🔥', label: 'Energized', value: 'energized' },
      { emoji: '🌟', label: 'Focused', value: 'focused' },
      { emoji: '💫', label: 'Elevated', value: 'elevated' },
      { emoji: '🙏', label: 'Reverent', value: 'reverent' }
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
      if (!selectedEmotion.value) {
        alert('Please select how you\'re feeling before starting');
        return;
      }
      
      if (!selectedChantingName.value) {
        alert('Please select a chanting name before starting');
        return;
      }
      
      showModal.value = false;
      isSessionActive.value = true;
      sessionTime.value = 0;
      chantCount.value = 0;
      startTimer();
    };
    
    const endSession = async () => {
      stopTimer();
      isSessionActive.value = false;
      
      const completionPercentage = Math.min((chantCount.value / targetChants.value) * 100, 100);
      const karmaPoints = Math.floor(chantCount.value / 10);
      
      earnedKarma.value = karmaPoints;
      
      await saveSession(karmaPoints, completionPercentage);
      
      showRewardModal.value = true;
      
      setTimeout(() => {
        showRewardModal.value = false;
        sessionTime.value = 0;
        chantCount.value = 0;
        selectedEmotion.value = '';
        selectedChantingName.value = '';
      }, 3000);
    };
    
    const openSessionModal = () => {
      showModal.value = true;
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
          chantCount: chantCount.value
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
        clips.value = [
          {
            _id: '1',
            title: 'Gayatri Mantra',
            description: 'Sacred mantra for wisdom and enlightenment.',
            type: 'chanting'
          },
          {
            _id: '2',
            title: 'Om Namah Shivaya',
            description: 'Powerful Shiva mantra for transformation.',
            type: 'chanting'
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
      fetchChantingClips();
    });
    
    onUnmounted(() => {
      stopTimer();
    });

    return () => (
      <div class="chant-page">
        {/* Session Modal */}
        {showModal.value && (
          <div class="modal-overlay">
            <div class="session-modal">
              <h3>🕉️ Chanting Session</h3>
              
              <div class="chanting-name-section">
                <p>Select Chanting</p>
                <div class="chanting-name-grid">
                  {chantingNames.map(name => (
                    <button
                      key={name}
                      class={`chanting-name-btn ${selectedChantingName.value === name ? 'selected' : ''}`}
                      onClick={() => selectedChantingName.value = name}
                    >
                      {name}
                    </button>
                  ))}
                </div>
              </div>
              
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
              

              
              <div class="chants-section">
                <p>Target Chants</p>
                <div class="duration-grid">
                  {[27, 54, 108, 216].map(chants => (
                    <button
                      key={chants}
                      class={`duration-btn ${targetChants.value === chants ? 'selected' : ''}`}
                      onClick={() => targetChants.value = chants}
                    >
                      {chants}
                    </button>
                  ))}
                </div>
              </div>
              
              <div class="modal-actions">
                <button class="cancel-btn" onClick={() => showModal.value = false}>Cancel</button>
                <button class="start-btn" onClick={startSession}>Start Chanting</button>
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
                Chanting Complete!
              </h2>
              
              <div style={{ fontSize: '1.2rem', marginBottom: '1rem', opacity: 0.9 }}>
                You chanted {chantCount.value} times
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
        
        <style>{`
          .chant-page {
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
          
          .chant-content {
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
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(20px);
            border-radius: 25px;
            padding: 1.2rem;
            margin: 1rem auto;
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            max-width: 300px;
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
            width: calc(100% - 1rem);
            max-width: 450px;
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
          
          .chanting-name-section {
            margin: 1rem 0;
          }
          
          .chanting-name-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.4rem;
            margin-top: 0.8rem;
            max-height: 180px;
            overflow-y: auto;
            overflow-x: hidden;
          }
          
          .chanting-name-btn {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 0.5rem 0.3rem;
            cursor: pointer;
            transition: all 0.2s ease;
            font-size: 0.7rem;
            text-align: center;
            line-height: 1.1;
            word-wrap: break-word;
            overflow: hidden;
            white-space: nowrap;
            text-overflow: ellipsis;
          }
          
          .chanting-name-btn.selected {
            background: #f59e0b;
            border-color: #f59e0b;
            color: white;
          }
          
          .emotion-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.4rem;
            margin-top: 0.8rem;
          }
          
          .emotion-btn {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 0.4rem;
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 0.1rem;
          }
          
          .emotion-btn.selected {
            background: #f59e0b;
            border-color: #f59e0b;
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
            margin: 1.5rem 0;
          }
          
          .duration-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 0.5rem;
            margin: 1rem 0;
          }
          
          .duration-btn {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 0.5rem;
            cursor: pointer;
            font-size: 0.8rem;
            transition: all 0.2s ease;
          }
          
          .duration-btn.selected {
            background: #f59e0b;
            border-color: #f59e0b;
            color: white;
          }
          
          .duration-slider {
            width: 100%;
            margin-top: 0.5rem;
          }
          
          .chant-options {
            display: flex;
            justify-content: space-between;
            margin-top: 0.5rem;
            font-size: 0.8rem;
            color: #6b7280;
          }
          
          .modal-actions {
            display: flex;
            gap: 0.8rem;
            margin-top: 1.2rem;
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
            background: #f59e0b;
            color: white;
            border: none;
            padding: 0.75rem;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
          }
          
          .end-btn {
            background: linear-gradient(135deg, #ef4444, #dc2626);
            color: white;
            border: none;
            padding: 1rem 2rem;
            border-radius: 50px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.3s ease;
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
            font-weight: 600;
            margin-bottom: 0.5rem;
          }
          
          .clip-desc {
            color: #64748b;
            font-size: 0.9rem;
            margin-bottom: 1rem;
          }
          
          .clip-media {
            margin-top: 1rem;
          }
          
          .clip-video, .clip-audio {
            width: 100%;
            border-radius: 8px;
            margin-bottom: 0.5rem;
          }
          
          .clip-video {
            max-height: 200px;
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
          {!isSessionActive.value ? (
            <>
              <h2>🕉️ Sacred Mantra Chanting</h2>
              <p>Let the power of sacred mantras elevate your consciousness.</p>
              <button class="start-btn" onClick={openSessionModal}>
                Start Chanting Session
              </button>
            </>
          ) : (
            <div class="session-screen">
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
                
                <button 
                  style={{
                    background: 'rgba(255, 255, 255, 0.2)',
                    border: '1px solid rgba(255, 255, 255, 0.3)',
                    color: '#fbbf24',
                    padding: '0.6rem 1.2rem',
                    borderRadius: '20px',
                    cursor: 'pointer',
                    marginTop: '1rem'
                  }}
                  onClick={endSession}
                >
                  End Session
                </button>
              </div>
            </div>
          )}
        </div>
        
        {loading.value ? (
          <div class="loading">Loading chanting clips...</div>
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
      </div>
    );
  }
};