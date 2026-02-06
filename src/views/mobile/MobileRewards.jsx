import { ref, onMounted, computed } from 'vue';
import { useToast } from 'vue-toastification';
import spiritualRewardsService from '../../services/spiritualRewardsService.js';
import rewardRedemptionService from '../../services/rewardRedemptionService.js';
import api from '../../services/api.js';

export default {
  name: 'MobileRewards',
  setup() {
    const toast = useToast();
    const loading = ref(false);
    const rewards = ref([]);
    const selectedCategory = ref('All');
    const userKarmaPoints = ref(0);
    const redeeming = ref(false);
    const redeemedRewards = ref(new Set());
    const showSuccessModal = ref(false);
    const successData = ref(null);

    const categories = ['All', 'Seva', 'Yatra', 'Dan', 'Puja', 'Article', 'Other'];

    const fetchKarmaPoints = async () => {
      try {
        const response = await api.get('/karma-points');
        userKarmaPoints.value = response.data.karmaPoints || 0;
      } catch (error) {
        console.error('Failed to fetch karma points:', error);
      }
    };

    const fetchRedeemedRewards = async () => {
      try {
        const response = await rewardRedemptionService.getHistory();
        if (response.success) {
          redeemedRewards.value = new Set(response.data.map(item => item.rewardId?._id));
        }
      } catch (error) {
        console.error('Failed to fetch redeemed rewards:', error);
      }
    };

    const isRedeemed = (rewardId) => redeemedRewards.value.has(rewardId);

    const filteredRewards = computed(() => {
      if (selectedCategory.value === 'All') {
        return rewards.value;
      }
      return rewards.value.filter(r => r.category === selectedCategory.value);
    });

    const fetchRewards = async () => {
      try {
        loading.value = true;
        const response = await spiritualRewardsService.getAllRewards();
        if (response.success) {
          rewards.value = response.data.filter(r => r.isActive);
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        toast.error('Failed to load rewards');
      } finally {
        loading.value = false;
      }
    };

    const handleRedeem = async (reward) => {
      if (isRedeemed(reward._id)) {
        toast.info('🎁 You have already redeemed this reward!');
        return;
      }

      if (userKarmaPoints.value < reward.karmaPointsRequired) {
        toast.warning('⚠️ Not enough karma points!');
        return;
      }
      
      if (redeeming.value) return;
      
      try {
        redeeming.value = true;
        const response = await rewardRedemptionService.redeemReward(reward._id);
        
        if (response.success) {
          redeemedRewards.value.add(reward._id);
          userKarmaPoints.value = response.data.remainingKarmaPoints;
          
          successData.value = {
            title: reward.title,
            greetings: response.data.reward.greetings,
            pointsSpent: reward.karmaPointsRequired,
            remainingPoints: response.data.remainingKarmaPoints,
            image: reward.banner || reward.image
          };
          showSuccessModal.value = true;
        } else {
          toast.error(response.message);
        }
      } catch (error) {
        toast.error('Failed to redeem reward');
      } finally {
        redeeming.value = false;
      }
    };

    const closeSuccessModal = () => {
      showSuccessModal.value = false;
      successData.value = null;
    };

    onMounted(() => {
      fetchRewards();
      fetchKarmaPoints();
      fetchRedeemedRewards();
    });

    return () => (
      <div class="min-vh-100" style="background: #f8f9fa;">
        {/* Header */}
        <div class="bg-white shadow-sm sticky-top">
          <div class="px-3 py-3">
            <div class="d-flex align-items-center justify-content-between mb-2">
              <div>
                <h1 class="h5 fw-bold mb-0" style="color: #2c3e50;">🎁 Spiritual Rewards</h1>
                <p class="text-muted small mb-0">Redeem with your karma points</p>
              </div>
              <div class="text-end">
                <div class="badge" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 8px 14px; font-size: 14px; font-weight: 600; border-radius: 20px;">
                  ✨ {userKarmaPoints.value}
                </div>
              </div>
            </div>
          </div>

          {/* Category Tabs */}
          <div class="overflow-auto" style="-webkit-overflow-scrolling: touch;">
            <div class="d-flex gap-2 px-3 pb-3">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => selectedCategory.value = cat}
                  class="btn btn-sm"
                  style={{
                    padding: '6px 16px',
                    fontSize: '13px',
                    borderRadius: '20px',
                    border: 'none',
                    whiteSpace: 'nowrap',
                    background: selectedCategory.value === cat ? '#667eea' : '#e9ecef',
                    color: selectedCategory.value === cat ? 'white' : '#6c757d',
                    fontWeight: selectedCategory.value === cat ? '600' : '500',
                    transition: 'all 0.2s',
                    boxShadow: selectedCategory.value === cat ? '0 2px 8px rgba(102, 126, 234, 0.3)' : 'none'
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div class="px-3 py-3">
          {loading.value ? (
            <div class="text-center py-5">
              <div class="spinner-border" style="width: 3rem; height: 3rem; color: #667eea;" role="status">
                <span class="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : filteredRewards.value.length === 0 ? (
            <div class="text-center py-5">
              <div style="font-size: 64px; opacity: 0.3; margin-bottom: 16px;">🎁</div>
              <h5 class="text-muted mb-2">No rewards available</h5>
              <p class="text-muted">Check back later for new rewards</p>
            </div>
          ) : (
            <div class="row g-3">
              {filteredRewards.value.map(reward => (
                <div key={reward._id} class="col-6">
                  <div 
                    class="card border-0 h-100" 
                    style="border-radius: 16px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); transition: transform 0.2s;"
                  >
                    {/* Banner Image */}
                    {reward.banner && (
                      <div style="position: relative; height: 180px; overflow: hidden; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
                        <img
                          src={reward.banner}
                          alt={reward.title}
                          style="width: 100%; height: 100%; object-fit: cover;"
                        />
                        {/* Category Badge */}
                        <div style="position: absolute; top: 10px; left: 10px;">
                          <span class="badge" style="background: rgba(255,255,255,0.95); color: #333; font-size: 10px; padding: 5px 10px; border-radius: 12px; font-weight: 600; backdrop-filter: blur(10px);">
                            {reward.category}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div class="card-body" style="padding: 14px;">
                      {/* Title */}
                      <h6 class="fw-bold mb-2" style="font-size: 14px; color: #2c3e50; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 36px;">
                        {reward.title}
                      </h6>
                      
                      {/* Description */}
                      <p class="text-muted mb-3" style="font-size: 12px; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 34px;">
                        {reward.description}
                      </p>
                      
                      {/* Stats Row */}
                      <div class="d-flex align-items-center justify-content-between mb-3">
                        <div class="d-flex align-items-center" style="background: #fff3cd; padding: 6px 12px; border-radius: 12px;">
                          <span style="font-size: 14px; margin-right: 4px;">✨</span>
                          <span class="fw-bold" style="font-size: 13px; color: #856404;">{reward.karmaPointsRequired}</span>
                        </div>
                        <div class="d-flex align-items-center text-muted" style="font-size: 12px;">
                          <span style="margin-right: 4px;">👥</span>
                          <span>{reward.numberOfDevotees}</span>
                        </div>
                      </div>
                      
                      {/* Redeem Button */}
                      <button
                        onClick={() => handleRedeem(reward)}
                        disabled={isRedeemed(reward._id) || userKarmaPoints.value < reward.karmaPointsRequired}
                        class="btn w-100"
                        style={{
                          padding: '10px',
                          fontSize: '13px',
                          fontWeight: '600',
                          borderRadius: '10px',
                          border: 'none',
                          background: isRedeemed(reward._id)
                            ? 'linear-gradient(135deg, #27ae60 0%, #229954 100%)'
                            : userKarmaPoints.value >= reward.karmaPointsRequired
                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                            : '#e9ecef',
                          color: isRedeemed(reward._id) || userKarmaPoints.value >= reward.karmaPointsRequired ? 'white' : '#6c757d',
                          cursor: isRedeemed(reward._id) || userKarmaPoints.value < reward.karmaPointsRequired ? 'not-allowed' : 'pointer',
                          boxShadow: isRedeemed(reward._id)
                            ? '0 4px 12px rgba(39, 174, 96, 0.3)'
                            : userKarmaPoints.value >= reward.karmaPointsRequired
                            ? '0 4px 12px rgba(102, 126, 234, 0.3)'
                            : 'none',
                          transition: 'all 0.2s'
                        }}
                      >
                        {isRedeemed(reward._id)
                          ? '✅ Already Redeemed'
                          : userKarmaPoints.value >= reward.karmaPointsRequired
                          ? '🎁 Redeem Now'
                          : '🔒 Locked'}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Success Modal */}
        {showSuccessModal.value && successData.value && (
          <div 
            class="modal-overlay"
            onClick={closeSuccessModal}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px'
            }}
          >
            <div 
              class="modal-content"
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'white',
                borderRadius: '16px',
                maxWidth: '360px',
                width: '100%',
                padding: '24px',
                boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
              }}
            >
              {/* Success Icon */}
              <div style={{ textAlign: 'center', marginBottom: '16px' }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>🎉</div>
                <h3 style={{
                  margin: 0,
                  fontSize: '20px',
                  fontWeight: '600',
                  color: '#2c3e50'
                }}>Reward Redeemed!</h3>
              </div>

              {/* Content */}
              <div style={{
                background: '#f8f9fa',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px'
              }}>
                <h4 style={{
                  fontSize: '16px',
                  fontWeight: '600',
                  color: '#2c3e50',
                  marginBottom: '8px',
                  margin: 0
                }}>
                  {successData.value.title}
                </h4>
                <p style={{
                  fontSize: '13px',
                  color: '#666',
                  lineHeight: '1.5',
                  margin: '8px 0 0 0'
                }}>
                  {successData.value.greetings}
                </p>
              </div>

              {/* Points Info */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '12px 0',
                borderTop: '1px solid #e9ecef',
                borderBottom: '1px solid #e9ecef',
                marginBottom: '16px'
              }}>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>Spent</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#e74c3c' }}>-{successData.value.pointsSpent}</div>
                </div>
                <div style={{ width: '1px', background: '#e9ecef' }}></div>
                <div style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: '11px', color: '#999', marginBottom: '4px' }}>Balance</div>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#27ae60' }}>{successData.value.remainingPoints}</div>
                </div>
              </div>

              {/* Close Button */}
              <button
                onClick={closeSuccessModal}
                style={{
                  width: '100%',
                  padding: '12px',
                  background: '#667eea',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }
};