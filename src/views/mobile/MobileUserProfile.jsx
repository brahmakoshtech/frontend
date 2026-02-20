import { ref, onMounted } from 'vue';
import { useAuth } from '../../store/auth.js';
import { useRouter } from 'vue-router';
import rewardRedemptionService from '../../services/rewardRedemptionService.js';
import api from '../../services/api.js';

export default {
  name: 'MobileUserProfile',
  setup() {
    const { user, fetchCurrentUser } = useAuth();
    const router = useRouter();
    const loading = ref(false);
    const error = ref('');
    const activeTab = ref('profile');
    const history = ref([]);
    const historyLoading = ref(false);
    const bonusHistory = ref([]);
    const bonusHistoryLoading = ref(false);

    const fetchHistory = async () => {
      historyLoading.value = true;
      try {
        const response = await rewardRedemptionService.getHistory();
        if (response.success) {
          history.value = response.data;
        }
      } catch (e) {
        console.error('Failed to load history:', e);
      } finally {
        historyLoading.value = false;
      }
    };

    const fetchBonusHistory = async () => {
      if (!user.value?._id) return;
      bonusHistoryLoading.value = true;
      try {
        const response = await api.getUserKarmaPointsHistory(user.value._id);
        if (response.success || response.data?.transactions) {
          const transactions = response.data?.transactions || response.transactions || [];
          bonusHistory.value = [...transactions];
        }
      } catch (e) {
        console.error('[Bonus History] Error:', e);
      } finally {
        bonusHistoryLoading.value = false;
      }
    };

    const goToRewards = () => {
      router.push('/mobile/user/rewards');
    };

    const refreshUserData = async () => {
      try {
        await fetchCurrentUser('user');
      } catch (e) {
        console.error('[MobileUserProfile] Failed to refresh user data:', e);
      }
    };

    onMounted(async () => {
      loading.value = true;
      error.value = '';
      try {
        await fetchCurrentUser('user');
      } catch (e) {
        console.error('[MobileUserProfile] Failed to load user profile:', e);
        error.value = e.message || 'Failed to load profile';
      } finally {
        loading.value = false;
      }
    });

    const getProfileImageUrl = () => {
      if (!user.value) return null;
      return user.value.profileImageUrl || user.value.profileImage || null;
    };

    // Local color management for tiers
    const getTierColors = (tierName) => {
      const colors = {
        'Beginner': { gradient: 'linear-gradient(135deg, #90EE90 0%, #32CD32 100%)', shadow: 'rgba(144, 238, 144, 0.3)' },
        'Bronze': { gradient: 'linear-gradient(135deg, #CD7F32 0%, #B87333 100%)', shadow: 'rgba(205, 127, 50, 0.3)' },
        'Silver': { gradient: 'linear-gradient(135deg, #C0C0C0 0%, #A8A8A8 100%)', shadow: 'rgba(192, 192, 192, 0.3)' },
        'Gold': { gradient: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)', shadow: 'rgba(255, 215, 0, 0.3)' },
        'Platinum': { gradient: 'linear-gradient(135deg, #E5E4E2 0%, #B8B8B8 100%)', shadow: 'rgba(229, 228, 226, 0.3)' }
      };
      return colors[tierName] || colors['Beginner'];
    };

    return () => {
      const imageUrl = getProfileImageUrl();
      const currentPoints = user.value?.karmaPoints || 0;
      
      // Get benchmark from API
      const benchmarkData = user.value?.benchmark;
      const currentTier = benchmarkData?.current || { name: 'Beginner', icon: '🌿' };
      const nextBenchmark = benchmarkData?.next;
      const progress = benchmarkData?.progress || 0;
      
      // Apply local colors
      const tierColors = getTierColors(currentTier.name);
      const benchmark = { ...currentTier, ...tierColors };

      return (
        <div class="profile-page">
          <div class="header">
            <h1>My Account</h1>
          </div>

          <div class="tabs">
            <button 
              class={`tab ${activeTab.value === 'profile' ? 'active' : ''}`}
              onClick={() => activeTab.value = 'profile'}
            >
              Profile
            </button>
            <button 
              class={`tab ${activeTab.value === 'wallet' ? 'active' : ''}`}
              onClick={() => activeTab.value = 'wallet'}
            >
              Karma Wallet
            </button>
          </div>

          {loading.value && <div class="loading">Loading...</div>}
          {error.value && <div class="error">{error.value}</div>}

          {!loading.value && !error.value && user.value && (
            <div class="content">
              {activeTab.value === 'profile' && (
                <div class="tab-content">
                  {imageUrl && (
                    <div class="profile-image">
                      <img src={imageUrl} alt="Profile" />
                    </div>
                  )}
                  
                  <div class="section benchmark-section" style={{ background: benchmark.gradient, boxShadow: `0 4px 15px ${benchmark.shadow}` }}>
                    <div class="benchmark-badge">
                      <span class="badge-icon">{benchmark.icon}</span>
                      <h2 class="badge-name">{benchmark.name}</h2>
                      <p class="badge-points">{currentPoints} Points</p>
                    </div>
                    {nextBenchmark && (
                      <div class="progress-container">
                        <div class="progress-info">
                          <span class="progress-label">To {nextBenchmark.name}</span>
                          <span class="progress-percentage">{Math.floor(progress)}%</span>
                        </div>
                        <div class="progress-bar">
                          <div class="progress-fill" style={{ width: `${progress}%` }}></div>
                        </div>
                        <p class="progress-text">{nextBenchmark.min - currentPoints} points left</p>
                      </div>
                    )}
                  </div>
                  
                  <div class="section">
                    <h3>Basic Info</h3>
                    <div class="field">
                      <span class="label">Email:</span>
                      <span class="value">{user.value.email || 'N/A'}</span>
                    </div>
                    <div class="field">
                      <span class="label">Mobile:</span>
                      <span class="value">{user.value.mobile || 'N/A'}</span>
                    </div>
                    <div class="field">
                      <span class="label">Name:</span>
                      <span class="value">{user.value.profile?.name || user.value.name || 'N/A'}</span>
                    </div>
                    <div class="field">
                      <span class="label">Role:</span>
                      <span class="value">{user.value.role || 'N/A'}</span>
                    </div>
                    <div class="field">
                      <span class="label">Client ID:</span>
                      <span class="value">{user.value.clientId?.clientId || 'N/A'}</span>
                    </div>
                  </div>

                  <div class="section">
                    <h3>Profile Details</h3>
                    <div class="field">
                      <span class="label">Date of Birth:</span>
                      <span class="value">{user.value.profile?.dob ? new Date(user.value.profile.dob).toLocaleDateString() : 'N/A'}</span>
                    </div>
                    <div class="field">
                      <span class="label">Time of Birth:</span>
                      <span class="value">{user.value.profile?.timeOfBirth || 'N/A'}</span>
                    </div>
                    <div class="field">
                      <span class="label">Place of Birth:</span>
                      <span class="value">{user.value.profile?.placeOfBirth || 'N/A'}</span>
                    </div>
                    <div class="field">
                      <span class="label">Gowthra:</span>
                      <span class="value">{user.value.profile?.gowthra || 'N/A'}</span>
                    </div>
                    <div class="field">
                      <span class="label">Profession:</span>
                      <span class="value">{user.value.profile?.profession || 'N/A'}</span>
                    </div>
                  </div>

                  <div class="section">
                    <h3>Account Status</h3>
                    <div class="field">
                      <span class="label">Email Verified:</span>
                      <span class="value">{user.value.emailVerified ? 'Yes' : 'No'}</span>
                    </div>
                    <div class="field">
                      <span class="label">Mobile Verified:</span>
                      <span class="value">{user.value.mobileVerified ? 'Yes' : 'No'}</span>
                    </div>
                    <div class="field">
                      <span class="label">Registration Step:</span>
                      <span class="value">{user.value.registrationStep || 'N/A'}</span>
                    </div>
                    <div class="field">
                      <span class="label">Active:</span>
                      <span class="value">{user.value.isActive ? 'Yes' : 'No'}</span>
                    </div>
                    <div class="field">
                      <span class="label">Member Since:</span>
                      <span class="value">{user.value.createdAt ? new Date(user.value.createdAt).toLocaleDateString() : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab.value === 'wallet' && (
                <div class="tab-content">
                  <div class="section">
                    <h3>Karma Points</h3>
                    <div class="karma">
                      <span class="badge-icon-large">{benchmark.icon}</span>
                      <span class="points">{currentPoints}</span>
                      <p class="karma-label">{benchmark.name} Member</p>
                    </div>
                  </div>
                  
                  <div class="section">
                    <h3>Wallet Actions</h3>
                    <div class="wallet-actions">
                      <button class="action-btn" onClick={fetchHistory}>View Redemptions</button>
                      <button class="action-btn" onClick={fetchBonusHistory}>View Bonus History</button>
                      <button class="action-btn" onClick={goToRewards}>Redeem Points</button>
                    </div>
                  </div>

                  {bonusHistoryLoading.value && (
                    <div class="section">
                      <p style="text-align: center; color: #666;">Loading bonus history...</p>
                    </div>
                  )}

                  {!bonusHistoryLoading.value && bonusHistory.value && bonusHistory.value.length > 0 && (
                    <div class="section">
                      <h3>Bonus Points History ({bonusHistory.value.length})</h3>
                      {bonusHistory.value.map(item => (
                        <div key={item._id} class="bonus-item">
                          <div class="bonus-details">
                            <div class="bonus-header">
                              <span class="bonus-amount">+{item.amount} points</span>
                              <span class="bonus-date">{new Date(item.createdAt).toLocaleDateString()}</span>
                            </div>
                            <p class="bonus-desc">{item.description || 'Bonus points added'}</p>
                            <p class="bonus-by">Added by: {item.addedBy?.businessName || item.addedBy?.email || item.addedByRole}</p>
                            <p class="bonus-balance">Balance: {item.previousBalance} → {item.newBalance}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {!bonusHistoryLoading.value && (!bonusHistory.value || bonusHistory.value.length === 0) && (
                    <div class="section">
                      <p style="text-align: center; color: #999; padding: 2rem;">No bonus points history yet. Admin/Client will add bonus points to your account.</p>
                    </div>
                  )}

                  {historyLoading.value && (
                    <div class="section">
                      <p style="text-align: center; color: #666;">Loading redemptions...</p>
                    </div>
                  )}

                  {!historyLoading.value && history.value.length > 0 && (
                    <div class="section">
                      <h3>Redemption History</h3>
                      {history.value.map(item => (
                        <div key={item._id} class="history-item">
                          {item.rewardId?.image && (
                            <img src={item.rewardId.image} alt={item.rewardId.title} class="history-image" />
                          )}
                          <div class="history-details">
                            <h4>{item.rewardId?.title || 'Reward'}</h4>
                            <p class="history-category">{item.rewardId?.category} • {item.rewardId?.subcategory}</p>
                            <p class="history-points">-{item.karmaPointsSpent} points</p>
                            <p class="history-date">{new Date(item.redeemedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          <style>{`
            .profile-page {
              min-height: 100vh;
              background: #f8f9fa;
              padding: 0;
              width: 100%;
              overflow-x: hidden;
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            }
            
            .header {
              background: white;
              padding: 1.25rem;
              text-align: center;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .header h1 {
              margin: 0;
              font-size: 1.5rem;
              color: #1e293b;
              font-weight: 700;
              letter-spacing: 0.5px;
            }
            
            .tabs {
              display: flex;
              background: white;
              box-shadow: 0 2px 4px rgba(0,0,0,0.05);
            }
            
            .tab {
              flex: 1;
              padding: 1rem;
              border: none;
              background: none;
              color: #64748b;
              font-size: 1rem;
              font-weight: 600;
              cursor: pointer;
              border-bottom: 3px solid transparent;
              transition: all 0.3s ease;
            }
            
            .tab.active {
              color: #667eea;
              border-bottom-color: #667eea;
            }
            
            .loading, .error {
              text-align: center;
              padding: 2rem;
              color: #666;
            }
            
            .error {
              color: #e74c3c;
            }
            
            .content {
              padding: 1rem;
              max-width: 100%;
            }
            
            .profile-image {
              text-align: center;
              margin-bottom: 2rem;
            }
            
            .profile-image img {
              width: 100px;
              height: 100px;
              border-radius: 50%;
              object-fit: cover;
              border: 3px solid white;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            }
            
            .section {
              background: white;
              margin-bottom: 1rem;
              border-radius: 12px;
              padding: 1.25rem;
              box-shadow: 0 2px 8px rgba(0,0,0,0.08);
              width: 100%;
              box-sizing: border-box;
            }
            
            .section h3 {
              margin: 0 0 1rem 0;
              font-size: 1.15rem;
              color: #1e293b;
              font-weight: 700;
              border-bottom: 2px solid #f1f5f9;
              padding-bottom: 0.75rem;
            }
            
            .field {
              display: flex;
              justify-content: space-between;
              align-items: flex-start;
              padding: 0.75rem 0;
              border-bottom: 1px solid #f5f5f5;
              flex-wrap: wrap;
              gap: 0.5rem;
            }
            
            .field:last-child {
              border-bottom: none;
            }
            
            .label {
              font-weight: 600;
              color: #64748b;
              min-width: 100px;
              flex-shrink: 0;
              font-size: 0.9rem;
            }
            
            .value {
              color: #1e293b;
              text-align: right;
              word-break: break-word;
              flex: 1;
              font-weight: 500;
              font-size: 0.95rem;
            }
            
            .karma {
              text-align: center;
              padding: 1.5rem 1rem;
            }
            
            .points {
              font-size: 2.5rem;
              font-weight: 800;
              color: #667eea;
              display: block;
              text-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
            }
            
            .karma-label {
              margin: 0.75rem 0 0 0;
              color: #64748b;
              font-size: 1rem;
              font-weight: 600;
            }
            
            .bonus-label {
              margin: 0.25rem 0 0 0;
              color: #27ae60;
              font-size: 0.85rem;
              font-weight: 500;
            }
            
            .wallet-actions {
              display: flex;
              gap: 1rem;
              flex-wrap: wrap;
            }
            
            .action-btn {
              flex: 1;
              min-width: 120px;
              padding: 0.875rem;
              border: 2px solid #e2e8f0;
              background: white;
              color: #475569;
              border-radius: 8px;
              cursor: pointer;
              font-size: 0.9rem;
              font-weight: 600;
              transition: all 0.3s ease;
            }
            
            .action-btn:hover {
              background: #667eea;
              color: white;
              border-color: #667eea;
              transform: translateY(-2px);
              box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
            }
            
            .history-item {
              display: flex;
              gap: 1rem;
              padding: 1rem 0;
              border-bottom: 1px solid #f5f5f5;
            }
            
            .history-item:last-child {
              border-bottom: none;
            }
            
            .history-image {
              width: 60px;
              height: 60px;
              border-radius: 8px;
              object-fit: cover;
              flex-shrink: 0;
            }
            
            .history-details {
              flex: 1;
            }
            
            .history-details h4 {
              margin: 0 0 0.25rem 0;
              font-size: 1rem;
              color: #1e293b;
              font-weight: 600;
            }
            
            .history-category {
              margin: 0 0 0.25rem 0;
              font-size: 0.85rem;
              color: #64748b;
              font-weight: 500;
            }
            
            .history-points {
              margin: 0 0 0.25rem 0;
              font-size: 0.95rem;
              color: #ef4444;
              font-weight: 700;
            }
            
            .history-date {
              margin: 0;
              font-size: 0.8rem;
              color: #94a3b8;
              font-weight: 500;
            }
            
            .bonus-item {
              padding: 1rem 0;
              border-bottom: 1px solid #f5f5f5;
            }
            
            .bonus-item:last-child {
              border-bottom: none;
            }
            
            .bonus-header {
              display: flex;
              justify-content: space-between;
              align-items: center;
              margin-bottom: 0.5rem;
            }
            
            .bonus-amount {
              font-size: 1.15rem;
              font-weight: 700;
              color: #10b981;
            }
            
            .bonus-date {
              font-size: 0.8rem;
              color: #94a3b8;
              font-weight: 500;
            }
            
            .bonus-desc {
              margin: 0 0 0.25rem 0;
              font-size: 0.9rem;
              color: #475569;
              font-weight: 500;
            }
            
            .bonus-by {
              margin: 0 0 0.25rem 0;
              font-size: 0.85rem;
              color: #64748b;
            }
            
            .bonus-balance {
              margin: 0;
              font-size: 0.8rem;
              color: #94a3b8;
              font-weight: 500;
            }
            
            .benchmark-section {
              border-radius: 12px;
              overflow: hidden;
            }
            
            .benchmark-badge {
              text-align: center;
              padding: 1.25rem 1rem 1rem;
            }
            
            .badge-icon {
              font-size: 3rem;
              display: block;
              margin-bottom: 0.5rem;
              filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
            }
            
            .badge-icon-large {
              font-size: 2.5rem;
              display: block;
              margin-bottom: 0.5rem;
            }
            
            .badge-name {
              margin: 0;
              font-size: 1.5rem;
              font-weight: 800;
              color: white;
              text-shadow: 0 2px 8px rgba(0,0,0,0.25);
              letter-spacing: 0.5px;
            }
            
            .badge-points {
              margin: 0.5rem 0 0 0;
              font-size: 1rem;
              color: rgba(255,255,255,0.95);
              font-weight: 600;
            }
            
            .progress-container {
              padding: 1rem;
              background: rgba(255,255,255,0.15);
            }
            
            .progress-info {
              display: flex;
              justify-content: space-between;
              margin-bottom: 0.5rem;
              font-size: 0.85rem;
              color: white;
            }
            
            .progress-label {
              font-weight: 600;
            }
            
            .progress-percentage {
              font-weight: 700;
              background: rgba(255,255,255,0.25);
              padding: 0.15rem 0.4rem;
              border-radius: 8px;
            }
            
            .progress-bar {
              height: 8px;
              background: rgba(255,255,255,0.25);
              border-radius: 10px;
              overflow: hidden;
              margin-bottom: 0.5rem;
            }
            
            .progress-fill {
              height: 100%;
              background: white;
              border-radius: 10px;
              transition: width 0.5s ease;
            }
            
            .progress-text {
              margin: 0;
              font-size: 0.8rem;
              text-align: center;
              color: rgba(255,255,255,0.95);
              font-weight: 600;
            }
            
            /* Mobile Responsive Styles */
            @media (max-width: 480px) {
              .badge-icon {
                font-size: 2.5rem;
              }
              
              .badge-icon-large {
                font-size: 2rem;
              }
              
              .badge-name {
                font-size: 1.3rem;
              }
              
              .badge-points {
                font-size: 0.9rem;
              }
              
              .progress-info {
                font-size: 0.8rem;
              }
              
              .benchmark-badge {
                padding: 1rem 0.75rem 0.75rem;
              }
              
              .progress-container {
                padding: 0.75rem;
              }
              
              .header {
                padding: 0.75rem;
              }
              
              .header h1 {
                font-size: 1.25rem;
              }
              
              .tab {
                padding: 0.75rem 0.5rem;
                font-size: 0.9rem;
              }
              
              .content {
                padding: 0.75rem;
              }
              
              .section {
                padding: 0.75rem;
                margin-bottom: 0.75rem;
              }
              
              .section h3 {
                font-size: 1rem;
              }
              
              .field {
                flex-direction: column;
                align-items: flex-start;
                padding: 0.5rem 0;
                gap: 0.25rem;
              }
              
              .label {
                min-width: auto;
                font-size: 0.85rem;
              }
              
              .value {
                text-align: left;
                font-size: 0.9rem;
                font-weight: 500;
              }
              
              .profile-image img {
                width: 80px;
                height: 80px;
              }
              
              .points {
                font-size: 1.75rem;
              }
              
              .wallet-actions {
                flex-direction: column;
                gap: 0.75rem;
              }
              
              .action-btn {
                min-width: auto;
                padding: 1rem;
                font-size: 1rem;
              }
            }
            
            @media (max-width: 360px) {
              .badge-icon {
                font-size: 2rem;
              }
              
              .badge-icon-large {
                font-size: 1.75rem;
              }
              
              .badge-name {
                font-size: 1.15rem;
              }
              
              .badge-points {
                font-size: 0.85rem;
              }
              
              .benchmark-badge {
                padding: 0.75rem 0.5rem 0.5rem;
              }
              
              .progress-container {
                padding: 0.75rem;
              }
              
              .header {
                padding: 0.5rem;
              }
              
              .header h1 {
                font-size: 1.1rem;
              }
              
              .tab {
                padding: 0.5rem 0.25rem;
                font-size: 0.85rem;
              }
              
              .content {
                padding: 0.5rem;
              }
              
              .section {
                padding: 0.5rem;
                margin-bottom: 0.5rem;
              }
              
              .field {
                padding: 0.4rem 0;
              }
              
              .label {
                font-size: 0.8rem;
              }
              
              .value {
                font-size: 0.85rem;
              }
              
              .profile-image img {
                width: 70px;
                height: 70px;
              }
              
              .points {
                font-size: 1.5rem;
              }
            }
          `}</style>
        </div>
      );
    };
  }
};