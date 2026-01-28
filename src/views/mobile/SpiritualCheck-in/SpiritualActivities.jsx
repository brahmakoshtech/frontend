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
            padding: 1rem;
            min-height: 100vh;
            background: #f8fafc;
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
            grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
            gap: 1rem;
            margin-bottom: 2rem;
          }
          
          .activity-card {
            background: white;
            border-radius: 16px;
            padding: 1.5rem 1rem;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(0, 0, 0, 0.05);
            min-height: 140px;
            display: flex;
            flex-direction: column;
            justify-content: center;
          }
          
          .activity-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }
          
          .activity-icon {
            font-size: 2.5rem;
            margin-bottom: 0.75rem;
            display: block;
          }
          
          .activity-title {
            font-size: 1rem;
            font-weight: 600;
            color: #1e293b;
            margin-bottom: 0.25rem;
          }
          
          .activity-desc {
            font-size: 0.8rem;
            color: #64748b;
            line-height: 1.3;
          }
          
          .motivation {
            background: rgba(255, 255, 255, 0.9);
            border-radius: 16px;
            padding: 1.5rem;
            text-align: center;
            margin-bottom: 1.5rem;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          }
          
          .motivation-emoji {
            font-size: 1.5rem;
            margin-bottom: 0.75rem;
          }
          
          .motivation-title {
            font-size: 1.1rem;
            color: #1e293b;
            margin-bottom: 0.5rem;
            font-weight: 600;
          }
          
          .motivation-text {
            color: #64748b;
            line-height: 1.5;
            font-size: 0.9rem;
          }
          
          .stats {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 1rem;
            background: white;
            border-radius: 16px;
            padding: 1.5rem;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
          }
          
          .stat {
            text-align: center;
          }
          
          .stat-value {
            font-size: 1.5rem;
            font-weight: 700;
            color: #1e293b;
            margin-bottom: 0.25rem;
          }
          
          .stat-label {
            font-size: 0.75rem;
            color: #64748b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            font-weight: 500;
          }
          
          @media (max-width: 768px) {
            .spiritual-activities {
              padding: 0.75rem;
            }
            
            .activities-grid {
              grid-template-columns: repeat(2, 1fr);
              gap: 0.75rem;
            }
            
            .activity-card {
              padding: 1.25rem 0.75rem;
              min-height: 120px;
            }
            
            .activity-icon {
              font-size: 2rem;
            }
            
            .activity-title {
              font-size: 0.9rem;
            }
            
            .activity-desc {
              font-size: 0.75rem;
            }
            
            .motivation {
              padding: 1.25rem;
            }
            
            .motivation-title {
              font-size: 1rem;
            }
            
            .motivation-text {
              font-size: 0.85rem;
            }
            
            .stats {
              padding: 1.25rem;
            }
            
            .stat-value {
              font-size: 1.25rem;
            }
          }
          
          @media (max-width: 480px) {
            .spiritual-activities {
              padding: 0.5rem;
            }
            
            .section-title {
              font-size: 1.25rem;
              margin-bottom: 1.5rem;
            }
            
            .activities-grid {
              gap: 0.5rem;
            }
            
            .activity-card {
              padding: 1rem 0.5rem;
              min-height: 100px;
            }
            
            .activity-icon {
              font-size: 1.75rem;
              margin-bottom: 0.5rem;
            }
            
            .activity-title {
              font-size: 0.85rem;
            }
            
            .activity-desc {
              font-size: 0.7rem;
            }
            
            .motivation {
              padding: 1rem;
              margin-bottom: 1rem;
            }
            
            .motivation-emoji {
              font-size: 1.25rem;
            }
            
            .motivation-title {
              font-size: 0.95rem;
            }
            
            .motivation-text {
              font-size: 0.8rem;
            }
            
            .stats {
              padding: 1rem;
              gap: 0.75rem;
            }
            
            .stat-value {
              font-size: 1.1rem;
            }
            
            .stat-label {
              font-size: 0.7rem;
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