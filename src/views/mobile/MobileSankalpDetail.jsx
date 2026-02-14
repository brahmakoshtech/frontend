import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import { ArrowLeftIcon, SparklesIcon, CalendarIcon, UsersIcon, FireIcon, CheckCircleIcon } from '@heroicons/vue/24/outline';
import sankalpService from '../../services/sankalpService';
import userSankalpService from '../../services/userSankalpService';

export default {
  name: 'MobileSankalpDetail',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const toast = useToast();
    const loading = ref(false);
    const joining = ref(false);
    const sankalp = ref(null);
    const isJoined = ref(false);
    const userSankalpId = ref(null);
    const showJoinModal = ref(false);
    const customDays = ref(null);
    const reminderTime = ref('09:00');

    const goBack = () => router.back();

    const fetchSankalp = async () => {
      loading.value = true;
      try {
        const response = await sankalpService.getById(route.params.id);
        sankalp.value = response.data;
        
        // Check if already joined
        const joinedResponse = await userSankalpService.checkJoined(route.params.id);
        isJoined.value = joinedResponse.data.isJoined;
        userSankalpId.value = joinedResponse.data.userSankalpId;
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load sankalp');
      } finally {
        loading.value = false;
      }
    };

    const joinSankalp = async () => {
      joining.value = true;
      try {
        await userSankalpService.join(route.params.id, customDays.value, reminderTime.value);
        toast.success('Successfully joined sankalp!');
        isJoined.value = true;
        showJoinModal.value = false;
        fetchSankalp();
      } catch (error) {
        console.error('Error:', error);
        toast.error(error.message || 'Failed to join sankalp');
      } finally {
        joining.value = false;
      }
    };

    const openJoinModal = () => {
      customDays.value = sankalp.value.totalDays;
      showJoinModal.value = true;
    };

    const goToProgress = () => {
      if (userSankalpId.value) {
        router.push(`/mobile/user/sankalpas/progress/${userSankalpId.value}`);
      }
    };

    onMounted(() => {
      fetchSankalp();
    });

    return () => (
      <div class="page-container">
        <style>{`
          .page-container {
            min-height: 100vh;
            background: linear-gradient(to bottom, #faf5ff 0%, #f3e8ff 100%);
            padding-bottom: 5rem;
          }
          .header {
            background: white;
            padding: 1rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
            position: sticky;
            top: 0;
            z-index: 10;
          }
          .header-top {
            display: flex;
            align-items: center;
            gap: 0.75rem;
          }
          .back-button {
            background: transparent;
            border: none;
            padding: 0.5rem;
            cursor: pointer;
          }
          .back-icon {
            width: 1.5rem;
            height: 1.5rem;
            color: #1f2937;
          }
          .page-title {
            font-size: 1.125rem;
            font-weight: 700;
            color: #1f2937;
          }
          .banner-section {
            width: 100%;
            height: 250px;
            background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .banner-section img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          .banner-icon-large {
            width: 5rem;
            height: 5rem;
            color: rgba(255, 255, 255, 0.9);
          }
          .content-section {
            padding: 1.5rem;
          }
          .title-section {
            margin-bottom: 1.5rem;
          }
          .main-title {
            font-size: 1.75rem;
            font-weight: 800;
            color: #1f2937;
            margin-bottom: 0.75rem;
          }
          .category-badge {
            display: inline-block;
            background: #f3e8ff;
            color: #9333ea;
            padding: 0.375rem 1rem;
            border-radius: 12px;
            font-size: 0.875rem;
            font-weight: 600;
            margin-right: 0.5rem;
          }
          .description-section {
            background: white;
            padding: 1.25rem;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          }
          .description-text {
            color: #4b5563;
            line-height: 1.7;
            font-size: 1rem;
          }
          .karma-section {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border: 2px solid #86efac;
            border-radius: 12px;
            padding: 1.25rem;
            margin-bottom: 1.5rem;
            box-shadow: 0 4px 12px rgba(134, 239, 172, 0.3);
          }
          .karma-title {
            font-size: 1rem;
            font-weight: 700;
            color: #16a34a;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .karma-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          .karma-item {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
          }
          .karma-label {
            font-size: 0.75rem;
            color: #059669;
            font-weight: 600;
          }
          .karma-value {
            font-size: 1.5rem;
            font-weight: 800;
            color: #16a34a;
          }
          .stats-section {
            background: white;
            padding: 1.25rem;
            border-radius: 12px;
            margin-bottom: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.06);
          }
          .stats-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          .stat-item {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 0.75rem;
            background: #f9fafb;
            border-radius: 8px;
          }
          .stat-icon {
            width: 2rem;
            height: 2rem;
            color: #9333ea;
          }
          .stat-content {
            display: flex;
            flex-direction: column;
          }
          .stat-label {
            font-size: 0.75rem;
            color: #6b7280;
          }
          .stat-value {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1f2937;
          }
          .join-button {
            width: 100%;
            background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
            color: white;
            border: none;
            padding: 1rem;
            border-radius: 12px;
            font-size: 1.125rem;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            box-shadow: 0 4px 12px rgba(147, 51, 234, 0.4);
            transition: transform 0.2s;
          }
          .join-button:hover {
            transform: translateY(-2px);
          }
          .join-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .joined-button {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          }
          .loading-spinner {
            width: 3rem;
            height: 3rem;
            border: 3px solid #f3e8ff;
            border-top-color: #9333ea;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          @keyframes spin {
            to { transform: rotate(360deg); }
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
            padding: 1rem;
          }
          .modal-content {
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            width: 100%;
            max-width: 400px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }
          .modal-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 1.5rem;
          }
          .form-group {
            margin-bottom: 1.25rem;
          }
          .form-label {
            display: block;
            font-size: 0.875rem;
            font-weight: 600;
            color: #374151;
            margin-bottom: 0.5rem;
          }
          .form-input {
            width: 100%;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            border-radius: 8px;
            font-size: 1rem;
            transition: border-color 0.2s;
          }
          .form-input:focus {
            outline: none;
            border-color: #9333ea;
          }
          .form-hint {
            display: block;
            font-size: 0.75rem;
            color: #6b7280;
            margin-top: 0.25rem;
          }
          .modal-actions {
            display: flex;
            gap: 0.75rem;
            margin-top: 1.5rem;
          }
          .btn-cancel {
            flex: 1;
            padding: 0.75rem;
            border: 2px solid #e5e7eb;
            background: white;
            color: #374151;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
          }
          .btn-confirm {
            flex: 1;
            padding: 0.75rem;
            border: none;
            background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
            color: white;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
          }
          .btn-confirm:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        `}</style>

        <div class="header">
          <div class="header-top">
            <button class="back-button" onClick={goBack}>
              <ArrowLeftIcon class="back-icon" />
            </button>
            <h1 class="page-title">Sankalp Details</h1>
          </div>
        </div>

        {loading.value ? (
          <div style="display: flex; justify-content: center; align-items: center; padding: 5rem;">
            <div class="loading-spinner"></div>
          </div>
        ) : sankalp.value ? (
          <>
            <div class="banner-section">
              {sankalp.value.bannerImage ? (
                <img src={sankalp.value.bannerImage} alt={sankalp.value.title} />
              ) : (
                <SparklesIcon class="banner-icon-large" />
              )}
            </div>

            <div class="content-section">
              <div class="title-section">
                <h1 class="main-title">{sankalp.value.title}</h1>
                <span class="category-badge">{sankalp.value.category}</span>
                {sankalp.value.subcategory && (
                  <span class="category-badge" style="background: #e0e7ff; color: #4f46e5;">
                    {sankalp.value.subcategory}
                  </span>
                )}
              </div>

              <div class="description-section">
                <p class="description-text">{sankalp.value.description}</p>
              </div>

              <div class="karma-section">
                <div class="karma-title">
                  <SparklesIcon style="width: 1.25rem; height: 1.25rem;" />
                  Karma Points Rewards
                </div>
                <div class="karma-grid">
                  <div class="karma-item">
                    <span class="karma-label">Daily Reward</span>
                    <span class="karma-value">+{sankalp.value.karmaPointsPerDay}</span>
                  </div>
                  <div class="karma-item">
                    <span class="karma-label">Completion Bonus</span>
                    <span class="karma-value">+{sankalp.value.completionBonusKarma}</span>
                  </div>
                </div>
              </div>

              <div class="stats-section">
                <div class="stats-grid">
                  <div class="stat-item">
                    <CalendarIcon class="stat-icon" />
                    <div class="stat-content">
                      <span class="stat-label">Duration</span>
                      <span class="stat-value">{sankalp.value.totalDays} days</span>
                    </div>
                  </div>
                  <div class="stat-item">
                    <UsersIcon class="stat-icon" />
                    <div class="stat-content">
                      <span class="stat-label">Participants</span>
                      <span class="stat-value">{sankalp.value.participantsCount}</span>
                    </div>
                  </div>
                  <div class="stat-item">
                    <FireIcon class="stat-icon" />
                    <div class="stat-content">
                      <span class="stat-label">Completion Rule</span>
                      <span class="stat-value" style="font-size: 0.875rem;">{sankalp.value.completionRule}</span>
                    </div>
                  </div>
                  <div class="stat-item">
                    <CheckCircleIcon class="stat-icon" />
                    <div class="stat-content">
                      <span class="stat-label">Completed</span>
                      <span class="stat-value">{sankalp.value.completedCount || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              {isJoined.value ? (
                <button class="join-button joined-button" onClick={goToProgress}>
                  <CheckCircleIcon style="width: 1.5rem; height: 1.5rem;" />
                  View Progress
                </button>
              ) : (
                <button 
                  class="join-button" 
                  onClick={openJoinModal}
                  disabled={joining.value}
                >
                  <SparklesIcon style="width: 1.5rem; height: 1.5rem;" />
                  Join Sankalp
                </button>
              )}
            </div>
          </>
        ) : null}

        {/* Join Modal */}
        {showJoinModal.value && (
          <div class="modal-overlay" onClick={() => showJoinModal.value = false}>
            <div class="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 class="modal-title">Join Sankalp</h3>
              
              <div class="form-group">
                <label class="form-label">Duration (Days)</label>
                <input 
                  type="number" 
                  class="form-input" 
                  v-model={customDays.value}
                  min="1"
                  placeholder={`Default: ${sankalp.value?.totalDays} days`}
                />
                <small class="form-hint">How many days do you want to commit?</small>
              </div>

              <div class="form-group">
                <label class="form-label">Daily Reminder Time</label>
                <input 
                  type="time" 
                  class="form-input" 
                  v-model={reminderTime.value}
                />
                <small class="form-hint">When should we remind you daily?</small>
              </div>

              <div class="modal-actions">
                <button class="btn-cancel" onClick={() => showJoinModal.value = false}>Cancel</button>
                <button class="btn-confirm" onClick={joinSankalp} disabled={joining.value}>
                  {joining.value ? 'Joining...' : 'Confirm & Join'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
};
