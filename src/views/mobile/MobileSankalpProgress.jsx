import { ref, onMounted, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useToast } from 'vue-toastification';
import { ArrowLeftIcon, SparklesIcon, FireIcon, CheckCircleIcon, XCircleIcon, CalendarIcon } from '@heroicons/vue/24/outline';
import userSankalpService from '../../services/userSankalpService';

export default {
  name: 'MobileSankalpProgress',
  setup() {
    const router = useRouter();
    const route = useRoute();
    const toast = useToast();
    const loading = ref(false);
    const reporting = ref(false);
    const userSankalp = ref(null);
    const progress = ref(null);

    const goBack = () => router.back();

    const todayReport = computed(() => {
      if (!userSankalp.value) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return userSankalp.value.dailyReports.find(r => {
        const d = new Date(r.date);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === today.getTime();
      });
    });

    const canReportToday = computed(() => {
      return todayReport.value && todayReport.value.status === 'not_reported' && userSankalp.value?.status === 'active';
    });

    const fetchProgress = async () => {
      loading.value = true;
      try {
        const response = await userSankalpService.getProgress(route.params.id);
        userSankalp.value = response.data.userSankalp;
        progress.value = response.data.progress;
      } catch (error) {
        console.error('Error:', error);
        toast.error('Failed to load progress');
      } finally {
        loading.value = false;
      }
    };

    const submitReport = async (status) => {
      reporting.value = true;
      try {
        const response = await userSankalpService.submitReport(route.params.id, status);
        toast.success(response.message);
        
        if (response.data.isCompleted) {
          toast.success(`🎉 Congratulations! +${response.data.completionBonus} bonus karma!`, { timeout: 5000 });
        }
        
        await fetchProgress();
      } catch (error) {
        console.error('Error:', error);
        toast.error(error.message || 'Failed to submit report');
      } finally {
        reporting.value = false;
      }
    };

    const getStatusIcon = (status) => {
      if (status === 'yes') return '✅';
      if (status === 'no') return '❌';
      return '⏳';
    };

    const getStatusColor = (status) => {
      if (status === 'yes') return '#10b981';
      if (status === 'no') return '#ef4444';
      return '#d1d5db';
    };

    onMounted(() => {
      fetchProgress();
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
          .content {
            padding: 1rem;
          }
          .progress-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .sankalp-title {
            font-size: 1.5rem;
            font-weight: 800;
            color: #1f2937;
            margin-bottom: 0.5rem;
          }
          .sankalp-category {
            display: inline-block;
            background: #f3e8ff;
            color: #9333ea;
            padding: 0.25rem 0.75rem;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 600;
            margin-bottom: 1rem;
          }
          .progress-bar-section {
            margin: 1.5rem 0;
          }
          .progress-label {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            font-size: 0.875rem;
            color: #6b7280;
          }
          .progress-bar-container {
            background: #e5e7eb;
            height: 12px;
            border-radius: 6px;
            overflow: hidden;
          }
          .progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #10b981 0%, #16a34a 100%);
            transition: width 0.3s;
          }
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 1rem;
            margin-top: 1.5rem;
          }
          .stat-box {
            background: #f9fafb;
            padding: 1rem;
            border-radius: 8px;
            text-align: center;
          }
          .stat-value {
            font-size: 1.75rem;
            font-weight: 800;
            color: #1f2937;
            margin-bottom: 0.25rem;
          }
          .stat-label {
            font-size: 0.75rem;
            color: #6b7280;
            font-weight: 600;
          }
          .karma-card {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border: 2px solid #86efac;
            border-radius: 12px;
            padding: 1.25rem;
            margin-bottom: 1rem;
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
            text-align: center;
          }
          .karma-value {
            font-size: 1.5rem;
            font-weight: 800;
            color: #16a34a;
          }
          .karma-label {
            font-size: 0.75rem;
            color: #059669;
            font-weight: 600;
          }
          .report-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            margin-bottom: 1rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .report-title {
            font-size: 1.125rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 1rem;
          }
          .today-status {
            background: #fef3c7;
            border: 2px solid #fbbf24;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            text-align: center;
          }
          .today-status-text {
            font-size: 0.875rem;
            color: #92400e;
            font-weight: 600;
          }
          .report-buttons {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 1rem;
          }
          .report-button {
            padding: 1rem;
            border: none;
            border-radius: 12px;
            font-size: 1rem;
            font-weight: 700;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
            transition: transform 0.2s;
          }
          .report-button:active {
            transform: scale(0.95);
          }
          .report-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
          .report-yes {
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4);
          }
          .report-no {
            background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
            color: white;
            box-shadow: 0 4px 12px rgba(239, 68, 68, 0.4);
          }
          .calendar-card {
            background: white;
            border-radius: 12px;
            padding: 1.5rem;
            box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          }
          .calendar-title {
            font-size: 1.125rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 0.5rem;
          }
          .calendar-grid {
            display: grid;
            grid-template-columns: repeat(7, 1fr);
            gap: 0.5rem;
          }
          .calendar-day {
            aspect-ratio: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 600;
            padding: 0.25rem;
          }
          .day-number {
            font-size: 0.625rem;
            color: #6b7280;
            margin-bottom: 0.125rem;
          }
          .day-icon {
            font-size: 1.25rem;
          }
          .completed-badge {
            background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
            color: white;
            padding: 0.75rem 1.5rem;
            border-radius: 12px;
            text-align: center;
            font-weight: 700;
            margin-bottom: 1rem;
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
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
        `}</style>

        <div class="header">
          <div class="header-top">
            <button class="back-button" onClick={goBack}>
              <ArrowLeftIcon class="back-icon" />
            </button>
            <h1 class="page-title">Progress & Reporting</h1>
          </div>
        </div>

        {loading.value ? (
          <div style="display: flex; justify-content: center; align-items: center; padding: 5rem;">
            <div class="loading-spinner"></div>
          </div>
        ) : userSankalp.value ? (
          <div class="content">
            <div class="progress-card">
              <h2 class="sankalp-title">{userSankalp.value.sankalpId?.title}</h2>
              <span class="sankalp-category">{userSankalp.value.sankalpId?.category}</span>

              {userSankalp.value.status === 'completed' && (
                <div class="completed-badge">
                  🎉 Sankalp Completed! Congratulations!
                </div>
              )}

              <div class="progress-bar-section">
                <div class="progress-label">
                  <span>Progress</span>
                  <span>{progress.value?.progressPercentage}%</span>
                </div>
                <div class="progress-bar-container">
                  <div class="progress-bar" style={`width: ${progress.value?.progressPercentage}%`}></div>
                </div>
              </div>

              <div class="stats-grid">
                <div class="stat-box">
                  <div class="stat-value">{progress.value?.currentDay}/{progress.value?.totalDays}</div>
                  <div class="stat-label">Days</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value" style="color: #10b981;">{progress.value?.yesCount}</div>
                  <div class="stat-label">Completed</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value" style="color: #ef4444;">{progress.value?.noCount}</div>
                  <div class="stat-label">Missed</div>
                </div>
                <div class="stat-box">
                  <div class="stat-value" style="color: #d1d5db;">{progress.value?.notReportedCount}</div>
                  <div class="stat-label">Pending</div>
                </div>
              </div>
            </div>

            <div class="karma-card">
              <div class="karma-title">
                <SparklesIcon style="width: 1.25rem; height: 1.25rem;" />
                Karma Points Earned
              </div>
              <div class="karma-grid">
                <div class="karma-item">
                  <div class="karma-value">{progress.value?.karmaEarned}</div>
                  <div class="karma-label">Daily Karma</div>
                </div>
                <div class="karma-item">
                  <div class="karma-value">{progress.value?.completionBonusEarned}</div>
                  <div class="karma-label">Bonus Karma</div>
                </div>
              </div>
            </div>

            {userSankalp.value.status === 'active' && (
              <div class="report-card">
                <h3 class="report-title">Today's Report</h3>
                
                {todayReport.value?.status !== 'not_reported' ? (
                  <div class="today-status">
                    <div class="today-status-text">
                      {todayReport.value?.status === 'yes' 
                        ? '✅ You completed today\'s sankalp!' 
                        : '❌ You marked today as missed'}
                    </div>
                  </div>
                ) : canReportToday.value ? (
                  <>
                    <div class="today-status">
                      <div class="today-status-text">
                        Did you complete today's sankalp?
                      </div>
                    </div>
                    <div class="report-buttons">
                      <button 
                        class="report-button report-yes"
                        onClick={() => submitReport('yes')}
                        disabled={reporting.value}
                      >
                        <CheckCircleIcon style="width: 1.5rem; height: 1.5rem;" />
                        Yes
                      </button>
                      <button 
                        class="report-button report-no"
                        onClick={() => submitReport('no')}
                        disabled={reporting.value}
                      >
                        <XCircleIcon style="width: 1.5rem; height: 1.5rem;" />
                        No
                      </button>
                    </div>
                  </>
                ) : (
                  <div class="today-status">
                    <div class="today-status-text">
                      ⏳ No report available for today
                    </div>
                  </div>
                )}
              </div>
            )}

            <div class="calendar-card">
              <h3 class="calendar-title">
                <CalendarIcon style="width: 1.25rem; height: 1.25rem;" />
                Daily Calendar
              </h3>
              <div class="calendar-grid">
                {userSankalp.value.dailyReports.map((report, index) => (
                  <div 
                    key={index}
                    class="calendar-day"
                    style={`background: ${getStatusColor(report.status)}15; border: 2px solid ${getStatusColor(report.status)};`}
                  >
                    <div class="day-number">Day {report.day}</div>
                    <div class="day-icon">{getStatusIcon(report.status)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  }
};
