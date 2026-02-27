import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

export default {
  name: 'MobileGeetaShlokas',
  setup() {
    const router = useRouter();
    const loading = ref(false);
    const chapters = ref([]);
    const selectedChapter = ref(null);
    const shlokas = ref([]);
    const expandedShloka = ref(null);

    const loadChapters = async () => {
      try {
        loading.value = true;
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const token = localStorage.getItem('token_user');
        const response = await fetch(`${API_BASE_URL}/chapters`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await response.json();
        if (data.success) {
          chapters.value = data.data.filter(ch => ch.status === 'active');
        }
      } catch (error) {
        console.error('Error loading chapters:', error);
      } finally {
        loading.value = false;
      }
    };

    const loadShlokas = async (chapterNumber) => {
      try {
        loading.value = true;
        const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
        const token = localStorage.getItem('token_user');
        const response = await fetch(`${API_BASE_URL}/shlokas/chapter/${chapterNumber}`, {
          headers: token ? { 'Authorization': `Bearer ${token}` } : {}
        });
        const data = await response.json();
        if (data.success) {
          shlokas.value = data.data.filter(s => s.isActive !== false);
        }
      } catch (error) {
        console.error('Error loading shlokas:', error);
      } finally {
        loading.value = false;
      }
    };

    const selectChapter = (chapter) => {
      selectedChapter.value = chapter;
      expandedShloka.value = null;
      loadShlokas(chapter.chapterNumber);
    };

    const goBack = () => {
      if (selectedChapter.value) {
        selectedChapter.value = null;
        shlokas.value = [];
        expandedShloka.value = null;
      } else {
        router.push('/mobile/user/askbi/chat');
      }
    };

    const toggleShloka = (shlokaId) => {
      expandedShloka.value = expandedShloka.value === shlokaId ? null : shlokaId;
    };

    onMounted(() => {
      loadChapters();
    });

    return () => (
      <div style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(to bottom, #fff7ed 0%, #ffedd5 100%)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
          color: 'white',
          padding: '1.25rem 1rem',
          margin: '1rem',
          boxShadow: '0 4px 12px rgba(255, 107, 53, 0.3)',
          borderRadius: '20px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={goBack}
              style={{
                background: 'rgba(255, 255, 255, 0.25)',
                border: 'none',
                color: 'white',
                padding: '0.5rem',
                borderRadius: '12px',
                cursor: 'pointer',
                width: '40px',
                height: '40px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                flexShrink: 0,
                backdropFilter: 'blur(10px)'
              }}
            >
              ←
            </button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 style={{
                margin: 0,
                fontSize: '1.25rem',
                fontWeight: '700',
                letterSpacing: '0.5px'
              }}>
                {selectedChapter.value ? `अध्याय ${selectedChapter.value.chapterNumber}` : '🕉️ श्रीमद्भगवद्गीता'}
              </h2>
              <p style={{
                margin: '0.25rem 0 0 0',
                fontSize: '0.85rem',
                opacity: 0.95,
                fontWeight: '400'
              }}>
                {selectedChapter.value ? selectedChapter.value.name : 'Divine Knowledge of Life'}
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '1rem'
        }}>
          {loading.value ? (
            <div style={{ textAlign: 'center', padding: '3rem 0' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #f3f4f6',
                borderTop: '4px solid #f59e0b',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                margin: '0 auto'
              }}></div>
              <p style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.9rem' }}>Loading...</p>
            </div>
          ) : selectedChapter.value ? (
            /* Shlokas List */
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {shlokas.value.map(shloka => (
                <div
                  key={shloka._id}
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #fffbf5 100%)',
                    borderRadius: '16px',
                    padding: '1rem',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(255, 107, 53, 0.15)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onClick={() => toggleShloka(shloka._id)}
                >
                  {/* Shloka Header */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem'
                  }}>
                    <span style={{
                      background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                      color: 'white',
                      padding: '0.375rem 0.75rem',
                      borderRadius: '10px',
                      fontSize: '0.85rem',
                      fontWeight: '700',
                      boxShadow: '0 2px 6px rgba(255, 107, 53, 0.3)'
                    }}>
                      श्लोक {shloka.shlokaIndex}
                    </span>
                    <span style={{ 
                      fontSize: '1.25rem', 
                      color: '#ff6b35',
                      transition: 'transform 0.3s ease',
                      transform: expandedShloka.value === shloka._id ? 'rotate(90deg)' : 'rotate(0deg)'
                    }}>
                      ▶
                    </span>
                  </div>

                  {/* Sanskrit Shloka */}
                  <div style={{
                    background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
                    padding: '1rem',
                    borderRadius: '12px',
                    border: '2px solid rgba(255, 107, 53, 0.2)',
                    textAlign: 'center',
                    marginBottom: expandedShloka.value === shloka._id ? '0.75rem' : 0,
                    boxShadow: 'inset 0 2px 4px rgba(255, 107, 53, 0.05)'
                  }}>
                    <p style={{
                      margin: 0,
                      fontSize: '1rem',
                      fontWeight: '600',
                      color: '#c2410c',
                      fontFamily: 'serif',
                      lineHeight: '1.8',
                      wordBreak: 'break-word'
                    }}>
                      {shloka.sanskritShloka}
                    </p>
                  </div>

                  {/* Expanded Content */}
                  {expandedShloka.value === shloka._id && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '0.75rem' }}>
                      {/* Hindi Meaning */}
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem'
                        }}>
                          <span style={{ fontSize: '1rem' }}>🇮🇳</span>
                          <h6 style={{
                            margin: 0,
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            color: '#ff6b35'
                          }}>
                            हिंदी अर्थ
                          </h6>
                        </div>
                        <p style={{
                          margin: 0,
                          padding: '0.875rem',
                          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                          borderRadius: '12px',
                          fontSize: '0.9rem',
                          lineHeight: '1.6',
                          color: '#78350f',
                          border: '1px solid #fbbf24',
                          wordBreak: 'break-word',
                          boxShadow: 'inset 0 2px 4px rgba(251, 191, 36, 0.1)'
                        }}>
                          {shloka.hindiMeaning}
                        </p>
                      </div>

                      {/* English Meaning */}
                      <div>
                        <div style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          marginBottom: '0.5rem'
                        }}>
                          <span style={{ fontSize: '1rem' }}>🇬🇧</span>
                          <h6 style={{
                            margin: 0,
                            fontSize: '0.85rem',
                            fontWeight: '700',
                            color: '#ff6b35'
                          }}>
                            English Meaning
                          </h6>
                        </div>
                        <p style={{
                          margin: 0,
                          padding: '0.875rem',
                          background: 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)',
                          borderRadius: '12px',
                          fontSize: '0.9rem',
                          lineHeight: '1.6',
                          color: '#1e40af',
                          border: '1px solid #60a5fa',
                          wordBreak: 'break-word',
                          boxShadow: 'inset 0 2px 4px rgba(96, 165, 250, 0.1)'
                        }}>
                          {shloka.englishMeaning}
                        </p>
                      </div>

                      {/* Transliteration */}
                      {shloka.sanskritTransliteration && (
                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.5rem'
                          }}>
                            <span style={{ fontSize: '1rem' }}>🔤</span>
                            <h6 style={{
                              margin: 0,
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              color: '#ff6b35'
                            }}>
                              Transliteration
                            </h6>
                          </div>
                          <p style={{
                            margin: 0,
                            padding: '0.875rem',
                            background: 'linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)',
                            borderRadius: '12px',
                            fontSize: '0.85rem',
                            lineHeight: '1.5',
                            color: '#9f1239',
                            border: '1px solid #f9a8d4',
                            fontStyle: 'italic',
                            wordBreak: 'break-word',
                            boxShadow: 'inset 0 2px 4px rgba(249, 168, 212, 0.1)'
                          }}>
                            {shloka.sanskritTransliteration}
                          </p>
                        </div>
                      )}

                      {/* Explanation */}
                      {shloka.explanation && (
                        <div>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.5rem',
                            marginBottom: '0.5rem'
                          }}>
                            <span style={{ fontSize: '1rem' }}>💡</span>
                            <h6 style={{
                              margin: 0,
                              fontSize: '0.85rem',
                              fontWeight: '700',
                              color: '#ff6b35'
                            }}>
                              Explanation
                            </h6>
                          </div>
                          <p style={{
                            margin: 0,
                            padding: '0.875rem',
                            background: 'linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)',
                            borderRadius: '12px',
                            fontSize: '0.9rem',
                            lineHeight: '1.6',
                            color: '#065f46',
                            border: '1px solid #6ee7b7',
                            wordBreak: 'break-word',
                            boxShadow: 'inset 0 2px 4px rgba(110, 231, 183, 0.1)'
                          }}>
                            {shloka.explanation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}

              {shlokas.value.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>No shlokas available</p>
                </div>
              )}
            </div>
          ) : (
            /* Chapters Grid */
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem'
            }}>
              {chapters.value.map(chapter => (
                <div
                  key={chapter._id}
                  onClick={() => selectChapter(chapter)}
                  style={{
                    background: 'linear-gradient(135deg, #ffffff 0%, #fff7ed 100%)',
                    borderRadius: '16px',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
                    border: '1px solid rgba(255, 107, 53, 0.1)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    overflow: 'hidden'
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.transform = 'scale(0.95)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.12)';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.08)';
                  }}
                >
                  <div style={{
                    position: 'absolute',
                    top: '0.5rem',
                    right: '0.5rem',
                    background: 'linear-gradient(135deg, #ff6b35 0%, #f7931e 100%)',
                    color: 'white',
                    padding: '0.25rem 0.5rem',
                    borderRadius: '8px',
                    fontSize: '0.7rem',
                    fontWeight: '700',
                    boxShadow: '0 2px 6px rgba(255, 107, 53, 0.3)',
                    zIndex: 1
                  }}>
                    {chapter.chapterNumber}
                  </div>
                  {chapter.imageUrl && (
                    <img
                      src={chapter.imageUrl}
                      alt={chapter.name}
                      style={{
                        width: '100%',
                        height: '120px',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  <div style={{ padding: '1rem' }}>
                    <h3 style={{
                      margin: '0 0 0.5rem 0',
                      fontSize: '0.95rem',
                      fontWeight: '700',
                      color: '#1f2937',
                      lineHeight: '1.3',
                      wordBreak: 'break-word',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      minHeight: '2.5rem'
                    }}>
                      {chapter.name}
                    </h3>
                    {chapter.description && (
                      <p style={{
                        margin: '0 0 0.75rem 0',
                        fontSize: '0.8rem',
                        color: '#6b7280',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>
                        {chapter.description}
                      </p>
                    )}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.375rem',
                      background: 'rgba(255, 107, 53, 0.1)',
                      padding: '0.375rem 0.625rem',
                      borderRadius: '8px'
                    }}>
                      <span style={{ fontSize: '0.85rem' }}>📖</span>
                      <span style={{
                        fontSize: '0.75rem',
                        fontWeight: '600',
                        color: '#ff6b35'
                      }}>
                        {chapter.shlokaCount} श्लोक
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {chapters.value.length === 0 && (
                <div style={{
                  gridColumn: '1 / -1',
                  textAlign: 'center',
                  padding: '3rem 1rem'
                }}>
                  <p style={{ color: '#6b7280', fontSize: '0.95rem' }}>No chapters available</p>
                </div>
              )}
            </div>
          )}
        </div>

        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }
};
