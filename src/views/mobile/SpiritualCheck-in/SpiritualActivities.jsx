import { ref } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'SpiritualActivities',
  setup() {
    const router = useRouter();
    const activities = ref([
      { id: 1, title: 'Meditate', icon: '🧘♀️', desc: 'Find inner peace', route: '/mobile/user/meditate' },
      { id: 2, title: 'Pray', icon: '🙏', desc: 'Connect spiritually', route: '/mobile/user/pray' },
      { id: 3, title: 'Chant', icon: '🕉️', desc: 'Sacred sounds', route: '/mobile/user/chant' },
      { id: 4, title: 'Silence', icon: '🤫', desc: 'Peaceful stillness', route: '/mobile/user/silence' }
    ]);

    const handleActivity = (activity) => {
      router.push(activity.route);
    };

    return () => (
      <div class="spiritual-activities">
        <style>{`
          .spiritual-activities {
            padding: 0;
          }
          
          .section-title {
            text-align: center;
            font-size: 1.5rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 2rem;
          }
          
          .activities-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 1.5rem;
            margin-bottom: 3rem;
          }
          
          .activity-card {
            background: white;
            border-radius: 16px;
            padding: 2rem 1.5rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(0, 0, 0, 0.05);
          }
          
          .activity-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }
          
          .activity-icon {
            font-size: 3rem;
            margin-bottom: 1rem;
            display: block;
          }
          
          .activity-title {
            font-size: 1.2rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.5rem;
          }
          
          .activity-desc {
            font-size: 0.9rem;
            color: #64748b;
          }
          
          .motivation {
            background: rgba(255, 255, 255, 0.8);
            border-radius: 20px;
            padding: 2rem;
            text-align: center;
            margin-bottom: 2rem;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          }
          
          .motivation-emoji {
            font-size: 2rem;
            margin-bottom: 1rem;
          }
          
          .motivation-title {
            font-size: 1.4rem;
            color: #1e293b;
            margin-bottom: 0.8rem;
            font-weight: 600;
          }
          
          .motivation-text {
            color: #64748b;
            line-height: 1.6;
            font-size: 1rem;
          }
          
          .stats {
            display: flex;
            justify-content: center;
            gap: 3rem;
            background: white;
            border-radius: 16px;
            padding: 2rem;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          }
          
          .stat {
            text-align: center;
          }
          
          .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 0.5rem;
          }
          
          .stat-label {
            font-size: 0.9rem;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 1px;
            font-weight: 500;
          }
          
          @media (max-width: 768px) {
            .activities-grid {
              grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
              gap: 1rem;
            }
            
            .stats {
              flex-direction: column;
              gap: 1.5rem;
            }
            
            .motivation {
              padding: 1.5rem;
            }
          }
        `}</style>
        
        <div>
          <h2 class="section-title">Spiritual Check-In</h2>
          
          <div class="activities-grid">
            {activities.value.map(activity => (
              <div 
                key={activity.id}
                class="activity-card"
                onClick={() => handleActivity(activity)}
              >
                <span class="activity-icon">{activity.icon}</span>
                <h3 class="activity-title">{activity.title}</h3>
                <p class="activity-desc">{activity.desc}</p>
              </div>
            ))}
          </div>
          
          <div class="motivation">
            <div class="motivation-emoji">🌸 ✨ 🕊️</div>
            <h3 class="motivation-title">Small steps, big transformation</h3>
            <p class="motivation-text">
              Every moment of mindfulness counts. Start where you are, with what you have.
            </p>
          </div>
          
          <div class="stats">
            <div class="stat">
              <div class="stat-value">12</div>
              <div class="stat-label">Days</div>
            </div>
            <div class="stat">
              <div class="stat-value">340</div>
              <div class="stat-label">Points</div>
            </div>
            <div class="stat">
              <div class="stat-value">28</div>
              <div class="stat-label">Sessions</div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};