import { ref } from 'vue';
import { useRouter } from 'vue-router';
<<<<<<< HEAD
import { ArrowLeftIcon, SparklesIcon, PlayIcon, PauseIcon, SpeakerWaveIcon } from '@heroicons/vue/24/outline';
=======
import { ArrowLeftIcon } from '@heroicons/vue/24/outline';
>>>>>>> c736c14b8f58dedbba903a2cfa06fd5828862d3c

export default {
  name: 'SoulMusicActivity',
  setup() {
    const router = useRouter();
<<<<<<< HEAD
    const currentTrack = ref(null);
    const isPlaying = ref(false);

    const goBack = () => {
      router.push('/client/activity');
    };

    const togglePlay = (track) => {
      if (currentTrack.value?.id === track.id) {
        isPlaying.value = !isPlaying.value;
      } else {
        currentTrack.value = track;
        isPlaying.value = true;
      }
    };

    const musicTracks = [
      {
        id: 1,
        title: 'Om Namah Shivaya',
        artist: 'Krishna Das',
        duration: '8:45',
        genre: 'Kirtan',
        description: 'Sacred chanting for Lord Shiva'
      },
      {
        id: 2,
        title: 'Hanuman Chalisa',
        artist: 'Hari Om Sharan',
        duration: '12:30',
        genre: 'Devotional',
        description: 'Powerful hymn to Lord Hanuman'
      },
      {
        id: 3,
        title: 'Gayatri Mantra',
        artist: 'Deva Premal',
        duration: '6:20',
        genre: 'Mantra',
        description: 'Universal prayer for enlightenment'
      },
      {
        id: 4,
        title: 'Shanti Mantra',
        artist: 'Snatam Kaur',
        duration: '9:15',
        genre: 'Peace Chant',
        description: 'Invocation for universal peace'
      },
      {
        id: 5,
        title: 'Maha Mrityunjaya',
        artist: 'Ananda Giri',
        duration: '11:00',
        genre: 'Healing',
        description: 'Great death-conquering mantra'
      }
    ];

    const playlists = [
      { name: 'Morning Devotion', count: 12, icon: '🌅' },
      { name: 'Evening Peace', count: 8, icon: '🌙' },
      { name: 'Healing Mantras', count: 15, icon: '🙏' },
      { name: 'Kirtan Collection', count: 20, icon: '🎵' }
    ];

    return () => (
      <div class="container-fluid px-3 px-lg-4">
        <div class="row">
          <div class="col-12">
            {/* Header */}
            <div class="rounded-4 p-4 mb-4 text-white shadow-lg" style={{ background: 'linear-gradient(135deg, #ec4899 0%, #db2777 100%)' }}>
              <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-3">
                <button 
                  class="btn btn-light btn-sm rounded-pill px-3" 
                  onClick={goBack}
                >
                  <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} class="me-1" />
                  Back
                </button>
                <div class="flex-grow-1">
                  <h1 class="mb-1 fw-bold fs-2">
                    <SparklesIcon style={{ width: '2rem', height: '2rem' }} class="me-2" />
                    Soul Music
                  </h1>
                  <p class="mb-0" style={{ opacity: 0.9 }}>Devotional music and spiritual songs</p>
                </div>
              </div>
            </div>

            <div class="row g-4">
              <div class="col-lg-8">
                {/* Now Playing */}
                {currentTrack.value && (
                  <div class="card border-0 shadow-sm rounded-4 mb-4">
                    <div class="card-body p-4">
                      <h5 class="fw-bold mb-3">Now Playing</h5>
                      <div class="d-flex align-items-center gap-3 p-3 bg-pink-subtle rounded-4">
                        <button 
                          class="btn btn-lg rounded-circle"
                          style={{ 
                            backgroundColor: '#ec4899',
                            color: 'white',
                            border: 'none',
                            width: '60px',
                            height: '60px'
                          }}
                          onClick={() => togglePlay(currentTrack.value)}
                        >
                          {isPlaying.value ? 
                            <PauseIcon style={{ width: '1.5rem', height: '1.5rem' }} /> :
                            <PlayIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                          }
                        </button>
                        <div class="flex-grow-1">
                          <h6 class="fw-bold mb-1">{currentTrack.value.title}</h6>
                          <p class="text-muted mb-1">{currentTrack.value.artist}</p>
                          <small class="text-muted">{currentTrack.value.description}</small>
                        </div>
                        <div class="text-end">
                          <span class="badge bg-pink px-2 py-1 rounded-pill">{currentTrack.value.genre}</span>
                          <div class="small text-muted mt-1">{currentTrack.value.duration}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Music Library */}
                <div class="card border-0 shadow-sm rounded-4">
                  <div class="card-body p-4">
                    <h4 class="fw-bold mb-3">Sacred Music Library</h4>
                    <div class="list-group list-group-flush">
                      {musicTracks.map(track => (
                        <div key={track.id} class="list-group-item border-0 p-3 rounded-3 mb-2 bg-light">
                          <div class="d-flex align-items-center gap-3">
                            <button 
                              class="btn btn-sm rounded-circle"
                              style={{ 
                                backgroundColor: currentTrack.value?.id === track.id && isPlaying.value ? '#ec4899' : '#f8f9fa',
                                color: currentTrack.value?.id === track.id && isPlaying.value ? 'white' : '#6c757d',
                                border: '1px solid #dee2e6',
                                width: '40px',
                                height: '40px'
                              }}
                              onClick={() => togglePlay(track)}
                            >
                              {currentTrack.value?.id === track.id && isPlaying.value ? 
                                <PauseIcon style={{ width: '1rem', height: '1rem' }} /> :
                                <PlayIcon style={{ width: '1rem', height: '1rem' }} />
                              }
                            </button>
                            <div class="flex-grow-1">
                              <h6 class="mb-1 fw-semibold">{track.title}</h6>
                              <div class="d-flex align-items-center gap-2">
                                <small class="text-muted">{track.artist}</small>
                                <span class="badge bg-secondary-subtle text-secondary px-2 py-1 rounded-pill small">
                                  {track.genre}
                                </span>
                              </div>
                            </div>
                            <div class="text-end">
                              <small class="text-muted">{track.duration}</small>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div class="col-lg-4">
                {/* Playlists */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Curated Playlists</h5>
                    <div class="d-flex flex-column gap-2">
                      {playlists.map((playlist, index) => (
                        <div key={index} class="p-3 bg-light rounded-3 d-flex align-items-center justify-content-between">
                          <div class="d-flex align-items-center gap-2">
                            <span style={{ fontSize: '1.2rem' }}>{playlist.icon}</span>
                            <div>
                              <div class="fw-semibold">{playlist.name}</div>
                              <small class="text-muted">{playlist.count} tracks</small>
                            </div>
                          </div>
                          <button class="btn btn-sm btn-outline-pink rounded-pill">
                            <PlayIcon style={{ width: '0.875rem', height: '0.875rem' }} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Benefits */}
                <div class="card border-0 shadow-sm rounded-4 mb-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Benefits</h5>
                    <div class="d-flex flex-column gap-2">
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">💖 Heart Opening</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">😊 Joy</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">🩹 Emotional Healing</span>
                      <span class="badge bg-light text-dark px-3 py-2 rounded-pill">🕊️ Peace</span>
                    </div>
                  </div>
                </div>

                {/* Audio Settings */}
                <div class="card border-0 shadow-sm rounded-4">
                  <div class="card-body p-4">
                    <h5 class="fw-bold mb-3">Audio Settings</h5>
                    <div class="mb-3">
                      <label class="form-label small fw-semibold">Volume</label>
                      <input type="range" class="form-range" min="0" max="100" value="75" />
                    </div>
                    <div class="d-flex align-items-center gap-2">
                      <SpeakerWaveIcon style={{ width: '1.25rem', height: '1.25rem' }} class="text-muted" />
                      <span class="small text-muted">High Quality Audio</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
=======
    const goBack = () => router.push('/client/activity');
    return () => (
      <div class="container-fluid px-4">
        <div class="row"><div class="col-12">
        <div class="d-flex align-items-center gap-3 mb-4">
        <button class="btn btn-outline-secondary btn-sm rounded-pill px-3" onClick={goBack}>
        <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} class="me-1" />Back</button>
        <div><h1 class="mb-0 fw-bold">🎶 Soul Music</h1><p class="text-muted mb-0">Devotional music</p></div></div>
        <div class="card border-0 shadow-sm rounded-4"><div class="card-body p-5 text-center">
        <div class="display-1 mb-3">🎶</div><h3 class="fw-bold mb-3">Soul Music</h3>
        <p class="text-muted">Coming soon</p></div></div></div></div></div>
>>>>>>> c736c14b8f58dedbba903a2cfa06fd5828862d3c
    );
  }
};