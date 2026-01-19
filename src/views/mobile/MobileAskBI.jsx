import { ref, onMounted } from 'vue';
import liveAvatarService from '../../services/liveAvatarService.js';

export default {
  name: 'MobileAskBI',
  setup() {
    const avatars = ref([]);
    const loading = ref(true);
    const error = ref(null);

    const fetchAvatars = async () => {
      try {
        loading.value = true;
        error.value = null;
        
        console.log('🔄 Fetching LiveAvatar data from public endpoint...');
        
        // Try to fetch real LiveAvatar data using public endpoint
        const data = await liveAvatarService.getAllPublic();
        
        console.log('✅ Raw data received:', data);
        console.log('📊 Total avatars received:', data?.length || 0);
        console.log('🔍 Each avatar isActive status:', data?.map(a => ({name: a.name, isActive: a.isActive})));
        
        // Filter only active avatars with isActive true
        const filteredAvatars = data.filter(avatar => 
          avatar.isActive === true
        );
        
        console.log('🔍 Filtered active avatars:', filteredAvatars);
        console.log('📈 Active avatars count:', filteredAvatars.length);
        
        avatars.value = filteredAvatars;
        
      } catch (err) {
        console.error('❌ Error fetching LiveAvatars:', err);
        console.error('🔍 Full error details:', {
          message: err.message,
          status: err.status,
          response: err.response
        });
        
        error.value = 'Unable to connect to server';
        avatars.value = []; // No fallback data
      } finally {
        loading.value = false;
      }
    };

    onMounted(() => {
      fetchAvatars();
    });

    return () => (
      <div class="container-fluid px-4">
        <div class="mb-4">
          <h1 class="display-5 fw-bold text-dark mb-2">ASK BI</h1>
          <p class="lead text-muted">Interact with our AI-powered spiritual guides</p>
        </div>

        {loading.value ? (
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
            <p class="mt-2 text-muted">Loading avatars...</p>
          </div>
        ) : error.value ? (
          <div class="alert alert-danger" role="alert">
            <strong>Error:</strong> {error.value}
            <br />
            <small class="text-muted">Please ensure the backend server is running and you have proper authentication.</small>
          </div>
        ) : null}
        
        {!loading.value && avatars.value.length === 0 ? (
          <div class="text-center py-5">
            <h3 class="text-muted">No Active Avatars</h3>
            <p class="text-muted">No spiritual guides are currently available.</p>
            <small class="text-muted d-block mt-2">Check browser console for debugging info</small>
          </div>
        ) : (
          <div class="row g-4">
            {avatars.value.map(avatar => (
              <div key={avatar._id} class="col-lg-4 col-md-6">
                <div class="card h-100 shadow-sm border-0">
                  {avatar.imageUrl && (
                    <img 
                      src={avatar.imageUrl} 
                      class="card-img-top" 
                      alt={avatar.name}
                      style={{ height: '200px', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjNjM2NmYxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMjQiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+QUk8L3RleHQ+PC9zdmc+';
                      }}
                    />
                  )}
                  <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                      <h5 class="card-title fw-bold">{avatar.name}</h5>
                      <span class="badge bg-success">LIVE</span>
                    </div>
                    <p class="card-text text-muted mb-3">{avatar.description}</p>
                    <div class="d-flex justify-content-between align-items-center mb-3">
                      <small class="text-muted">
                        👥 {avatar.viewers || 0} viewers
                      </small>
                      <small class="text-muted">
                        ⏰ {avatar.duration || '0m'}
                      </small>
                    </div>
                    <button class="btn btn-primary w-100">
                      💬 Start Conversation
                    </button>
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