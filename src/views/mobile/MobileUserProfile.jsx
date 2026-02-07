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
        // response.data already has transactions directly (not response.data.data)
        if (response.success || response.data?.transactions) {
          const transactions = response.data?.transactions || response.transactions || [];
          bonusHistory.value = [...transactions];
          console.log('[Bonus History] Loaded:', bonusHistory.value.length, 'transactions');
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
        console.log('=== USER DATA REFRESHED ===');
        console.log('karmaPoints:', user.value?.karmaPoints);
        console.log('totalKarmaPoints:', user.value?.totalKarmaPoints);
        console.log('========================');
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

    return () => {
      const imageUrl = getProfileImageUrl();

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
              onClick={async () => {
                activeTab.value = 'wallet';
                await refreshUserData();
              }}
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
                      <span class="points">{user.value.totalKarmaPoints || user.value.karmaPoints || 0}</span>
                      <p class="karma-label">Total Points</p>
                      {user.value.bonusKarmaPoints > 0 && (
                        <p class="bonus-label">Includes {user.value.bonusKarmaPoints} bonus points</p>
                      )}
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
              background: #f5f5f5;
              padding: 0;
              width: 100%;
              overflow-x: hidden;
            }
            
            .header {
              background: white;
              padding: 1rem;
              text-align: center;
              border-bottom: 1px solid #eee;
            }
            
            .header h1 {
              margin: 0;
              font-size: 1.5rem;
              color: #333;
            }
            
            .tabs {
              display: flex;
              background: white;
              border-bottom: 1px solid #eee;
            }
            
            .tab {
              flex: 1;
              padding: 1rem;
              border: none;
              background: none;
              color: #666;
              font-size: 1rem;
              cursor: pointer;
              border-bottom: 2px solid transparent;
            }
            
            .tab.active {
              color: #333;
              border-bottom-color: #007bff;
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
              border-radius: 8px;
              padding: 1rem;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
              width: 100%;
              box-sizing: border-box;
            }
            
            .section h3 {
              margin: 0 0 1rem 0;
              font-size: 1.1rem;
              color: #333;
              border-bottom: 1px solid #eee;
              padding-bottom: 0.5rem;
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
              font-weight: 500;
              color: #666;
              min-width: 100px;
              flex-shrink: 0;
            }
            
            .value {
              color: #333;
              text-align: right;
              word-break: break-word;
              flex: 1;
            }
            
            .karma {
              text-align: center;
              padding: 1rem;
            }
            
            .points {
              font-size: 2rem;
              font-weight: bold;
              color: #27ae60;
              display: block;
            }
            
            .karma-label {
              margin: 0.5rem 0 0 0;
              color: #666;
              font-size: 0.9rem;
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
              padding: 0.75rem;
              border: 1px solid #ddd;
              background: white;
              color: #333;
              border-radius: 4px;
              cursor: pointer;
              font-size: 0.9rem;
            }
            
            .action-btn:hover {
              background: #f8f9fa;
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
              color: #333;
            }
            
            .history-category {
              margin: 0 0 0.25rem 0;
              font-size: 0.85rem;
              color: #666;
            }
            
            .history-points {
              margin: 0 0 0.25rem 0;
              font-size: 0.9rem;
              color: #e74c3c;
              font-weight: 600;
            }
            
            .history-date {
              margin: 0;
              font-size: 0.8rem;
              color: #999;
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
              font-size: 1.1rem;
              font-weight: 600;
              color: #27ae60;
            }
            
            .bonus-date {
              font-size: 0.8rem;
              color: #999;
            }
            
            .bonus-desc {
              margin: 0 0 0.25rem 0;
              font-size: 0.9rem;
              color: #333;
            }
            
            .bonus-by {
              margin: 0 0 0.25rem 0;
              font-size: 0.85rem;
              color: #666;
            }
            
            .bonus-balance {
              margin: 0;
              font-size: 0.8rem;
              color: #999;
            }
            
            /* Mobile Responsive Styles */
            @media (max-width: 480px) {
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