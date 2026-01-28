import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { 
  ArrowLeftIcon, 
  PlayIcon, 
  HeartIcon, 
  ShareIcon,
  EyeIcon,
  FilmIcon
} from '@heroicons/vue/24/outline';
import { brahmAvatarService } from '../../services/brahmAvatarService';
import { useToast } from 'vue-toastification';

export default {
  name: 'MobileBrahmAvatarReels',
  setup() {
    const router = useRouter();
    const toast = useToast();
    const reels = ref([]);
    const loading = ref(false);
    const selectedReel = ref(null);
    const showVideoModal = ref(false);

    const loadReels = async () => {
      try {
        loading.value = true;
        const response = await brahmAvatarService.getBrahmAvatars(true);
        
        // Handle nested data structure: response.data.data.data
        const reelsData = response.data?.data?.data || response.data?.data || [];
        reels.value = Array.isArray(reelsData) ? reelsData : [];
        
        // Clean and decode URLs, remove duplicates
        if (Array.isArray(reels.value)) {
          reels.value.forEach((reel) => {
            // Use videoUrl as primary, fallback to video
            const videoSource = reel.videoUrl || reel.video;
            if (videoSource) {
              reel.videoUrl = decodeUrl(videoSource);
              delete reel.video; // Remove duplicate
            }
            
            // Use imageUrl as primary, fallback to image
            const imageSource = reel.imageUrl || reel.image;
            if (imageSource) {
              reel.imageUrl = decodeUrl(imageSource);
              delete reel.image; // Remove duplicate
            }
          });
        }
      } catch (error) {
        console.error('Error loading reels:', error);
        toast.error('Failed to load reels');
        reels.value = [];
      } finally {
        loading.value = false;
      }
    };

    // Helper function to decode HTML entities in URLs
    const decodeUrl = (url) => {
      if (!url) return url;
      return url
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&#x3D;/g, '=');
    };

    const goBack = () => {
      router.push('/mobile/user/dashboard');
    };

    const playReel = (reel) => {
      selectedReel.value = reel;
      showVideoModal.value = true;
    };

    const closeVideoModal = () => {
      showVideoModal.value = false;
      selectedReel.value = null;
    };

    const likeReel = async (reelId) => {
      try {
        // Add like functionality here
        toast.success('Liked!');
      } catch (error) {
        toast.error('Failed to like');
      }
    };

    const shareReel = (reel) => {
      if (navigator.share) {
        navigator.share({
          title: reel.name,
          text: reel.description,
          url: window.location.href
        });
      } else {
        navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    };

    onMounted(() => {
      loadReels();
    });

    return () => (
      <div class="container-fluid px-3">
        <style>{`
          .reel-card {
            cursor: pointer;
            transition: all 0.3s ease;
            border-radius: 16px;
            overflow: hidden;
          }
          .reel-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 24px rgba(0,0,0,0.15) !important;
          }
          .reel-thumbnail {
            height: 200px;
            background-size: cover;
            background-position: center;
            position: relative;
          }
          .play-overlay {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0,0,0,0.7);
            border-radius: 50%;
            width: 60px;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.3s ease;
          }
          .reel-card:hover .play-overlay {
            background: rgba(255,149,0,0.9);
            transform: translate(-50%, -50%) scale(1.1);
          }
          .action-btn {
            transition: all 0.2s ease;
          }
          .action-btn:hover {
            transform: scale(1.1);
          }
        `}</style>

        {/* Header */}
        <div class="d-flex align-items-center mb-4 py-3">
          <button 
            onClick={goBack}
            class="btn btn-light me-3 rounded-circle p-2"
            style={{ width: '40px', height: '40px' }}
          >
            <ArrowLeftIcon style={{ width: '1.2rem', height: '1.2rem' }} />
          </button>
          <div>
            <h3 class="fw-bold mb-1">BrahmAvatar Reels</h3>
            <p class="text-muted mb-0 small">Spiritual content for your soul</p>
          </div>
        </div>

        {/* Loading */}
        {loading.value && (
          <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
              <span class="visually-hidden">Loading...</span>
            </div>
          </div>
        )}

        {/* Reels Grid */}
        {!loading.value && (
          <div class="row g-3">
            {reels.value.map(reel => (
              <div key={reel._id} class="col-6">
                <div class="reel-card card border-0 shadow-sm">
                  {/* Thumbnail */}
                  <div 
                    class="reel-thumbnail"
                    style={{
                      backgroundImage: `url(${reel.imageUrl || reel.image || '/placeholder-image.jpg'})`
                    }}
                    onClick={() => playReel(reel)}
                  >
                    <div class="play-overlay">
                      <PlayIcon 
                        style={{ 
                          width: '1.5rem', 
                          height: '1.5rem', 
                          color: 'white',
                          marginLeft: '2px'
                        }} 
                      />
                    </div>
                  </div>

                  {/* Content */}
                  <div class="card-body p-3">
                    <h6 class="card-title fw-bold mb-2 text-truncate">{reel.name}</h6>
                    <p class="card-text text-muted small mb-2" style={{ 
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {reel.description}
                    </p>

                    {/* Category and Type Badges */}
                    <div class="d-flex gap-1 mb-3">
                      <span class="badge bg-primary small px-2 py-1">{reel.category}</span>
                      <span class="badge bg-secondary small px-2 py-1">{reel.type}</span>
                    </div>

                    {/* Actions */}
                    <div class="d-flex align-items-center justify-content-between">
                      <div class="d-flex align-items-center gap-3">
                        <button 
                          onClick={() => likeReel(reel._id)}
                          class="action-btn btn btn-sm btn-outline-danger rounded-pill px-2"
                        >
                          <HeartIcon style={{ width: '1rem', height: '1rem' }} />
                          <span class="ms-1 small">{reel.likes || 0}</span>
                        </button>
                        
                        <button 
                          onClick={() => shareReel(reel)}
                          class="action-btn btn btn-sm btn-outline-primary rounded-pill px-2"
                        >
                          <ShareIcon style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      </div>
                      
                      <div class="d-flex align-items-center text-muted small">
                        <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                        <span class="ms-1">{reel.views || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading.value && reels.value.length === 0 && (
          <div class="text-center py-5">
            <div class="mb-3">
              <FilmIcon style={{ width: '4rem', height: '4rem', color: '#6c757d' }} />
            </div>
            <h5 class="text-muted">No Reels Available</h5>
            <p class="text-muted">Check back later for new spiritual content</p>
          </div>
        )}

        {/* Video Modal */}
        {showVideoModal.value && selectedReel.value && (
          <div 
            class="modal fade show d-block" 
            style={{ backgroundColor: 'rgba(0,0,0,0.8)' }}
            onClick={closeVideoModal}
          >
            <div class="modal-dialog modal-dialog-centered">
              <div class="modal-content bg-transparent border-0">
                <div class="modal-body p-0">
                  <video 
                    controls 
                    autoplay 
                    class="w-100 rounded"
                    style={{ maxHeight: '70vh' }}
                  >
                    <source src={selectedReel.value.videoUrl || selectedReel.value.video} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
};