import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, SparklesIcon, CalendarIcon, UsersIcon, FireIcon } from '@heroicons/vue/24/outline';
import sankalpService from '../../services/sankalpService';

export default {
  name: 'MobileSankalpas',
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const sankalpas = ref([]);

    const goBack = () => {
      router.back();
    };

    const fetchSankalpas = async () => {
      loading.value = true;
      try {
        const response = await sankalpService.getAll();
        const data = response.data || response || [];
        sankalpas.value = Array.isArray(data) ? data.filter(s => s.status === 'Active' && s.visibility === 'Public') : [];
      } catch (error) {
        console.error('Error fetching sankalpas:', error);
        sankalpas.value = [];
      } finally {
        loading.value = false;
      }
    };

    const viewDetails = (sankalp) => {
      router.push(`/mobile/user/sankalpas/${sankalp._id}`);
    };

    onMounted(() => {
      fetchSankalpas();
    });

    return () => (
      <div class="page-container">
        <style>{`
          * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
          }
          
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
            justify-content: center;
            gap: 0.75rem;
            position: relative;
          }
          
          .back-button {
            background: transparent;
            border: none;
            padding: 0.5rem;
            cursor: pointer;
            position: absolute;
            left: 0;
          }
          
          .back-icon {
            width: 1.5rem;
            height: 1.5rem;
            color: #1f2937;
          }
          
          .page-title {
            font-size: 1.25rem;
            font-weight: 700;
            color: #1f2937;
            text-align: center;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 0.5rem;
          }
          
          .title-icon {
            width: 1.5rem;
            height: 1.5rem;
            color: #9333ea;
          }
          
          .sankalpas-list {
            padding: 1rem;
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            max-width: 100%;
          }
          
          .sankalp-card {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
            cursor: pointer;
            transition: transform 0.2s;
            max-width: 100%;
          }
          
          .card-banner {
            height: 140px;
            background: linear-gradient(135deg, #9333ea 0%, #7e22ce 100%);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .card-banner img {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }
          
          .banner-icon {
            width: 3rem;
            height: 3rem;
            color: rgba(255, 255, 255, 0.9);
          }
          
          .card-content {
            padding: 1rem;
          }
          
          .card-header {
            margin-bottom: 0.75rem;
          }
          
          .card-title {
            font-size: 1.125rem;
            font-weight: 700;
            color: #1f2937;
            margin-bottom: 0.5rem;
          }
          
          .card-category {
            display: inline-block;
            background: #f3e8ff;
            color: #9333ea;
            padding: 0.25rem 0.75rem;
            border-radius: 8px;
            font-size: 0.75rem;
            font-weight: 600;
          }
          
          .card-description {
            color: #6b7280;
            line-height: 1.6;
            font-size: 0.875rem;
            margin-bottom: 1rem;
          }
          
          .karma-highlight {
            background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
            border-radius: 8px;
            padding: 0.75rem;
            margin-bottom: 1rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            border: 1px solid #86efac;
            flex-wrap: wrap;
            gap: 0.5rem;
          }
          
          .karma-item {
            display: flex;
            align-items: center;
            gap: 0.375rem;
          }
          
          .karma-text {
            color: #16a34a;
            font-weight: 700;
            font-size: 0.8125rem;
          }
          
          .card-stats {
            display: flex;
            gap: 1.5rem;
            padding-top: 1rem;
            border-top: 1px solid #f3f4f6;
            flex-wrap: wrap;
          }
          
          .stat-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            font-size: 0.8125rem;
            color: #6b7280;
          }
          
          .stat-icon {
            width: 1rem;
            height: 1rem;
            color: #9333ea;
          }
          
          .loading {
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            padding: 5rem 1rem;
            gap: 1rem;
          }
          
          .spinner {
            width: 3rem;
            height: 3rem;
            border: 3px solid #f3e8ff;
            border-top-color: #9333ea;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
          }
          
          .loading-text {
            color: #9333ea;
            font-weight: 600;
            font-size: 0.875rem;
          }
          
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
          
          .empty-state {
            text-align: center;
            padding: 4rem 1.5rem;
          }
          
          .empty-icon {
            width: 4rem;
            height: 4rem;
            color: #d1d5db;
            margin: 0 auto 1.5rem;
          }
          
          .empty-title {
            font-size: 1.125rem;
            font-weight: 700;
            color: #6b7280;
            margin-bottom: 0.75rem;
          }
          
          .empty-text {
            color: #9ca3af;
            font-size: 0.875rem;
            line-height: 1.5;
          }
          
          @media (max-width: 480px) {
            .page-title {
              font-size: 1.125rem;
            }
            
            .sankalpas-list {
              grid-template-columns: repeat(2, 1fr);
              padding: 0.75rem;
              gap: 0.75rem;
            }
            
            .card-content {
              padding: 0.875rem;
            }
            
            .card-banner {
              height: 120px;
            }
            
            .banner-icon {
              width: 2.5rem;
              height: 2.5rem;
            }
            
            .card-title {
              font-size: 1rem;
            }
            
            .card-description {
              font-size: 0.8125rem;
            }
            
            .karma-highlight {
              padding: 0.625rem;
            }
            
            .karma-text {
              font-size: 0.75rem;
            }
            
            .stat-item {
              font-size: 0.75rem;
            }
          }
          
          @media (max-width: 360px) {
            .header {
              padding: 0.875rem;
            }
            
            .page-title {
              font-size: 1rem;
            }
            
            .sankalpas-list {
              grid-template-columns: 1fr;
              padding: 0.5rem;
              gap: 0.75rem;
            }
            
            .card-banner {
              height: 100px;
            }
            
            .card-content {
              padding: 0.75rem;
            }
            
            .karma-highlight {
              flex-direction: column;
              align-items: flex-start;
            }
          }
        `}</style>
        
        <div class="header">
          <div class="header-top">
            <button class="back-button" onClick={goBack}>
              <ArrowLeftIcon class="back-icon" />
            </button>
            <h1 class="page-title">
              <SparklesIcon class="title-icon" />
              Sankalp
            </h1>
          </div>
        </div>
        
        {loading.value ? (
          <div class="loading">
            <div class="spinner"></div>
            <p class="loading-text">Loading sankalpas...</p>
          </div>
        ) : sankalpas.value.length === 0 ? (
          <div class="empty-state">
            <SparklesIcon class="empty-icon" />
            <h2 class="empty-title">No Sankalpas Available</h2>
            <p class="empty-text">Check back later for new spiritual resolutions to join</p>
          </div>
        ) : (
          <div class="sankalpas-list">
            {sankalpas.value.map(sankalp => (
              <div key={sankalp._id} class="sankalp-card" onClick={() => viewDetails(sankalp)}>
                <div class="card-banner">
                  {sankalp.bannerImage ? (
                    <img src={sankalp.bannerImage} alt={sankalp.title} />
                  ) : (
                    <SparklesIcon class="banner-icon" />
                  )}
                </div>
                
                <div class="card-content">
                  <div class="card-header">
                    <h3 class="card-title">{sankalp.title}</h3>
                    <span class="card-category">{sankalp.category}</span>
                  </div>
                  
                  <p class="card-description">{sankalp.description}</p>
                  
                  <div class="karma-highlight">
                    <div class="karma-item">
                      <FireIcon style="width: 1.125rem; height: 1.125rem; color: #16a34a;" />
                      <span class="karma-text">{sankalp.karmaPointsPerDay} pts/day</span>
                    </div>
                    <div class="karma-item">
                      <SparklesIcon style="width: 1.125rem; height: 1.125rem; color: #16a34a;" />
                      <span class="karma-text">+{sankalp.completionBonusKarma} bonus</span>
                    </div>
                  </div>
                  
                  <div class="card-stats">
                    <div class="stat-item">
                      <CalendarIcon class="stat-icon" />
                      <span>{sankalp.totalDays} days</span>
                    </div>
                    <div class="stat-item">
                      <UsersIcon class="stat-icon" />
                      <span>{sankalp.participantsCount} joined</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
};
