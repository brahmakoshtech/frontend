import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { 
  ArrowLeftIcon,
  PlusIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  BookOpenIcon,
  StarIcon,
  ChatBubbleLeftRightIcon,
  UserIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/vue/24/outline';
import { useToast } from 'vue-toastification';

export default {
  name: 'GeetaShlokaManagement',
  setup() {
    const route = useRoute();
    const router = useRouter();
    const toast = useToast();
    const { chapterId } = route.params;
    const chapter = route.state?.chapter;

    const loading = ref(false);
    const showShlokaModal = ref(false);
    const showEditModal = ref(false);
    const showViewModal = ref(false);
    const activeDropdown = ref(null);
    const selectedShloka = ref(null);
    const editingShloka = ref(null);
    const shlokas = ref([]);
    const searchTerm = ref('');
    const statusFilter = ref('all');
    const pageTitle = ref('Shloka Management');
    
    const shlokaForm = ref({
      chapterNumber: chapter?.chapterNumber || 1,
      chapterName: chapter?.name || '',
      section: '',
      shlokaNumber: '',
      shlokaIndex: '',
      sanskritShloka: '',
      hindiMeaning: '',
      englishMeaning: '',
      sanskritTransliteration: '',
      explanation: '',
      tags: '',
      status: 'draft',
      isActive: true
    });

    const editForm = ref({
      chapterNumber: chapter?.chapterNumber || 1,
      chapterName: chapter?.name || '',
      section: '',
      shlokaNumber: '',
      shlokaIndex: '',
      sanskritShloka: '',
      hindiMeaning: '',
      englishMeaning: '',
      sanskritTransliteration: '',
      explanation: '',
      tags: '',
      status: 'draft',
      isActive: true
    });

    const filteredShlokas = () => {
      return shlokas.value.filter(shloka => {
        const matchesSearch = shloka.sanskritShloka.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
                             shloka.hindiMeaning.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
                             shloka.englishMeaning.toLowerCase().includes(searchTerm.value.toLowerCase()) ||
                             shloka.tags.toLowerCase().includes(searchTerm.value.toLowerCase());
        const matchesStatus = statusFilter.value === 'all' || shloka.status === statusFilter.value;
        return matchesSearch && matchesStatus;
      });
    };

    // Auto-generate shloka index
    const updateShlokaIndex = () => {
      if (shlokaForm.value.chapterNumber && shlokaForm.value.shlokaNumber) {
        const chapterStr = shlokaForm.value.chapterNumber.toString().padStart(2, '0');
        const shlokaStr = shlokaForm.value.shlokaNumber.split('.')[1]?.padStart(3, '0') || '001';
        shlokaForm.value.shlokaIndex = `BG-${chapterStr}-${shlokaStr}`;
      }
    };

    const loadShlokas = async () => {
      try {
        loading.value = true;
        // Mock data - replace with actual API call
        shlokas.value = [
          {
            id: 1,
            chapterNumber: 1,
            section: 'Introduction',
            shlokaNumber: '1.1',
            shlokaIndex: 'BG-01-001',
            sanskritShloka: 'धृतराष्ट्र उवाच। धर्मक्षेत्रे कुरुक्षेत्रे समवेता युयुत्सवः।',
            hindiMeaning: 'धृतराष्ट्र ने कहा - धर्मभूमि कुरुक्षेत्र में युद्ध की इच्छा से एकत्रित हुए...',
            englishMeaning: 'Dhritarashtra said: On the holy field of Kurukshetra, gathered with the desire to fight...',
            sanskritTransliteration: 'dhṛtarāṣṭra uvāca dharma-kṣetre kuru-kṣetre samavetā yuyutsavaḥ',
            explanation: 'This is the opening verse of the Bhagavad Gita...',
            tags: 'dharma, kurukshetra, war, beginning',
            status: 'published',
            createdAt: new Date(),
            isActive: true
          }
        ];
      } catch (error) {
        console.error('Load shlokas error:', error);
        shlokas.value = [];
      } finally {
        loading.value = false;
      }
    };

    const goBack = () => {
      router.push('/client/tools/geeta-chapters');
    };

    const openShlokaModal = () => {
      showShlokaModal.value = true;
    };

    const submitShloka = async () => {
      try {
        loading.value = true;
        toast.info('Creating shloka...');
        
        updateShlokaIndex();
        
        const newShloka = {
          id: Date.now(),
          ...shlokaForm.value,
          createdAt: new Date(),
          isActive: true
        };
        
        shlokas.value.push(newShloka);
        
        toast.success('✓ Shloka created successfully!');
        showShlokaModal.value = false;
        
        // Reset form
        shlokaForm.value = {
          chapterNumber: chapter?.chapterNumber || 1,
          chapterName: chapter?.name || '',
          section: '',
          shlokaNumber: '',
          shlokaIndex: '',
          sanskritShloka: '',
          hindiMeaning: '',
          englishMeaning: '',
          sanskritTransliteration: '',
          explanation: '',
          tags: '',
          status: 'draft'
        };
        
      } catch (error) {
        console.error('Submit shloka error:', error);
        toast.error('❌ Failed to create shloka');
      } finally {
        loading.value = false;
      }
    };

    const toggleDropdown = (shlokaId) => {
      activeDropdown.value = activeDropdown.value === shlokaId ? null : shlokaId;
    };

    const viewShloka = (shloka) => {
      selectedShloka.value = shloka;
      showViewModal.value = true;
      activeDropdown.value = null;
    };

    const editShloka = (shloka) => {
      editingShloka.value = shloka;
      editForm.value = { ...shloka };
      showEditModal.value = true;
      activeDropdown.value = null;
    };

    const updateShloka = async () => {
      try {
        loading.value = true;
        toast.info('Updating shloka...');
        
        const index = shlokas.value.findIndex(s => s.id === editingShloka.value.id);
        if (index !== -1) {
          shlokas.value[index] = { 
            ...shlokas.value[index], 
            ...editForm.value,
            updatedAt: new Date()
          };
        }
        
        toast.success('✓ Shloka updated successfully!');
        showEditModal.value = false;
        
      } catch (error) {
        console.error('Update shloka error:', error);
        toast.error('❌ Failed to update shloka');
      } finally {
        loading.value = false;
      }
    };

    const deleteShloka = async (shlokaId) => {
      if (!confirm('Are you sure you want to delete this shloka?')) return;
      
      try {
        loading.value = true;
        shlokas.value = shlokas.value.filter(s => s.id !== shlokaId);
        toast.success('✓ Shloka deleted successfully!');
      } catch (error) {
        console.error('Delete shloka error:', error);
        toast.error('❌ Failed to delete shloka');
      } finally {
        loading.value = false;
      }
      
      activeDropdown.value = null;
    };

    const toggleShlokaStatus = (shloka) => {
      const index = shlokas.value.findIndex(s => s.id === shloka.id);
      if (index !== -1) {
        const newStatus = shlokas.value[index].isActive ? false : true;
        shlokas.value[index].isActive = newStatus;
        toast.success(`Shloka ${newStatus ? 'enabled' : 'disabled'} successfully!`);
      }
      activeDropdown.value = null;
    };

    const getStatusBadge = (status) => {
      const statusConfig = {
        published: { class: 'bg-success', text: 'Published', color: '#28a745' },
        draft: { class: 'bg-warning', text: 'Draft', color: '#ffc107' }
      };
      return statusConfig[status] || statusConfig.draft;
    };

    onMounted(() => {
      loadShlokas();
      if (chapter) {
        pageTitle.value = `${chapter.name} - Shloka Management`;
      }
    });

    return () => (
      <div class="container-fluid px-2 px-sm-3 px-lg-4">
        <style>{`
          .sanskrit-text {
            font-family: 'Noto Sans Devanagari', 'Devanagari Sangam MN', sans-serif;
            line-height: 1.8;
          }
          .shloka-card {
            transition: all 0.3s ease;
          }
          .shloka-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
          }
        `}</style>
        
        <div class="row">
          <div class="col-12">
            {/* Header */}
            <div class="bg-gradient-primary rounded-3 rounded-lg-4 p-3 p-md-4 mb-3 mb-md-4 text-white shadow-lg">
              <div class="d-flex flex-column flex-md-row align-items-start align-items-md-center gap-2 gap-md-3">
                <button 
                  class="btn btn-light btn-sm rounded-pill px-3" 
                  onClick={goBack}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}
                >
                  <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
                  <span class="d-none d-sm-inline">Back to Chapters</span>
                  <span class="d-sm-none">Back</span>
                </button>
                <div class="flex-grow-1">
                  <h1 class="mb-1 fw-bold fs-3 fs-md-2 text-dark">{pageTitle.value}</h1>
                  <p class="mb-0 text-dark d-none d-sm-block" style={{ opacity: 0.8, fontSize: '0.9rem' }}>
                    Manage sacred shlokas with Sanskrit, Hindi and English meanings
                  </p>
                </div>
                <button 
                  class="btn btn-light btn-sm btn-md-lg rounded-pill px-3 px-md-4 shadow-sm"
                  onClick={openShlokaModal}
                  disabled={loading.value}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', fontWeight: '600', minHeight: '40px', whiteSpace: 'nowrap' }}
                >
                  <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                  <span class="d-none d-sm-inline">Add Shloka</span>
                  <span class="d-sm-none">Add</span>
                </button>
              </div>
            </div>

            {/* Stats Cards */}
            <div class="row g-2 g-md-3 mb-3 mb-md-4">
              <div class="col-6 col-lg-3">
                <div class="card border-0 shadow-sm h-100">
                  <div class="card-body text-center p-2 p-md-3">
                    <div class="text-primary mb-1 mb-md-2">
                      <BookOpenIcon style={{ width: '1.5rem', height: '1.5rem' }} class="d-md-none" />
                      <BookOpenIcon style={{ width: '2rem', height: '2rem' }} class="d-none d-md-block" />
                    </div>
                    <h4 class="fw-bold mb-1 fs-5 fs-md-4">{filteredShlokas().length}</h4>
                    <small class="text-muted" style={{ fontSize: '0.75rem' }}>Total Shlokas</small>
                  </div>
                </div>
              </div>
              <div class="col-6 col-lg-3">
                <div class="card border-0 shadow-sm h-100">
                  <div class="card-body text-center p-2 p-md-3">
                    <div class="text-success mb-1 mb-md-2">
                      <StarIcon style={{ width: '1.5rem', height: '1.5rem' }} class="d-md-none" />
                      <StarIcon style={{ width: '2rem', height: '2rem' }} class="d-none d-md-block" />
                    </div>
                    <h4 class="fw-bold mb-1 fs-5 fs-md-4">{filteredShlokas().filter(s => s.status === 'published').length}</h4>
                    <small class="text-muted" style={{ fontSize: '0.75rem' }}>Published</small>
                  </div>
                </div>
              </div>
              <div class="col-6 col-lg-3">
                <div class="card border-0 shadow-sm h-100">
                  <div class="card-body text-center p-2 p-md-3">
                    <div class="text-warning mb-1 mb-md-2">
                      <ChatBubbleLeftRightIcon style={{ width: '1.5rem', height: '1.5rem' }} class="d-md-none" />
                      <ChatBubbleLeftRightIcon style={{ width: '2rem', height: '2rem' }} class="d-none d-md-block" />
                    </div>
                    <h4 class="fw-bold mb-1 fs-5 fs-md-4">{filteredShlokas().filter(s => s.status === 'draft').length}</h4>
                    <small class="text-muted" style={{ fontSize: '0.75rem' }}>Drafts</small>
                  </div>
                </div>
              </div>
              <div class="col-6 col-lg-3">
                <div class="card border-0 shadow-sm h-100">
                  <div class="card-body text-center p-2 p-md-3">
                    <div class="text-info mb-1 mb-md-2">
                      <UserIcon style={{ width: '1.5rem', height: '1.5rem' }} class="d-md-none" />
                      <UserIcon style={{ width: '2rem', height: '2rem' }} class="d-none d-md-block" />
                    </div>
                    <h4 class="fw-bold mb-1 fs-5 fs-md-4">{chapter?.chapterNumber || 1}</h4>
                    <small class="text-muted" style={{ fontSize: '0.75rem' }}>Chapter</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Search and Filter */}
            <div class="card border-0 shadow-sm mb-3 mb-md-4">
              <div class="card-body p-3">
                <div class="row g-3">
                  <div class="col-md-8">
                    <div class="input-group">
                      <span class="input-group-text">
                        <MagnifyingGlassIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                      </span>
                      <input
                        type="text"
                        class="form-control"
                        placeholder="Search shlokas..."
                        value={searchTerm.value}
                        onInput={(e) => searchTerm.value = e.target.value}
                      />
                    </div>
                  </div>
                  <div class="col-md-4">
                    <div class="input-group">
                      <span class="input-group-text">
                        <FunnelIcon style={{ width: '1.25rem', height: '1.25rem' }} />
                      </span>
                      <select
                        class="form-select"
                        value={statusFilter.value}
                        onChange={(e) => statusFilter.value = e.target.value}
                      >
                        <option value="all">All Status</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shlokas Grid */}
            <div class="row g-3">
              {filteredShlokas().map(shloka => (
                <div key={shloka.id} class="col-12">
                  <div class="card border-0 shadow-sm shloka-card position-relative overflow-hidden" style={{ borderRadius: '12px' }}>
                    {/* Disabled Overlay */}
                    {shloka.isActive === false && (
                      <div 
                        class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                        style={{ 
                          backgroundColor: 'rgba(255,255,255,0.7)',
                          zIndex: 5,
                          backdropFilter: 'blur(1px)',
                          pointerEvents: 'none'
                        }}
                      >
                        <div class="text-center">
                          <div class="text-muted mb-2" style={{ fontSize: '2rem' }}>⏸️</div>
                          <h6 class="text-muted fw-bold">Shloka Disabled</h6>
                        </div>
                      </div>
                    )}
                    
                    <div class="card-body p-3 p-md-4 position-relative" style={{ zIndex: 1 }}>
                      {/* Shloka Header */}
                      <div class="d-flex align-items-start justify-content-between mb-3">
                        <div class="d-flex align-items-center gap-3 flex-grow-1">
                          <div class="badge bg-primary p-2" style="background: linear-gradient(135deg, #f97316, #dc2626) !important;">
                            {shloka.shlokaIndex}
                          </div>
                          <div class="flex-grow-1 min-w-0">
                            <h6 class="fw-bold mb-1">Shloka {shloka.shlokaNumber}</h6>
                            {shloka.section && (
                              <small class="text-muted">{shloka.section}</small>
                            )}
                          </div>
                        </div>
                        <div class="d-flex align-items-center gap-2">
                          <span 
                            class="badge rounded-pill px-2 py-1"
                            style={{ 
                              backgroundColor: getStatusBadge(shloka.status).color + '20',
                              color: getStatusBadge(shloka.status).color,
                              fontSize: '0.75rem'
                            }}
                          >
                            {getStatusBadge(shloka.status).text}
                          </span>
                          <div class="dropdown">
                            <button 
                              class="btn btn-dark rounded-circle p-2 d-flex align-items-center justify-content-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleDropdown(shloka.id);
                              }}
                              style={{ 
                                width: '32px', 
                                height: '32px', 
                                border: 'none',
                                zIndex: 20,
                                position: 'relative'
                              }}
                            >
                              <EllipsisVerticalIcon style={{ width: '1rem', height: '1rem', color: 'white' }} />
                            </button>
                            {activeDropdown.value === shloka.id && (
                              <div 
                                class="dropdown-menu show position-absolute shadow" 
                                style={{ 
                                  zIndex: 1050, 
                                  borderRadius: '8px',
                                  right: '0',
                                  left: 'auto',
                                  top: '100%',
                                  minWidth: '150px'
                                }}
                                onClick={(e) => e.stopPropagation()}
                              >
                                <button class="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => viewShloka(shloka)}>
                                  <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                                  <span>View</span>
                                </button>
                                <button class="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => editShloka(shloka)}>
                                  <PencilIcon style={{ width: '1rem', height: '1rem' }} />
                                  <span>Edit</span>
                                </button>
                                <button class="dropdown-item d-flex align-items-center gap-2 py-2" onClick={() => toggleShlokaStatus(shloka)}>
                                  {shloka.isActive ? (
                                    <>
                                      <XCircleIcon style={{ width: '1rem', height: '1rem', color: '#dc3545' }} />
                                      <span>Disable</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircleIcon style={{ width: '1rem', height: '1rem', color: '#198754' }} />
                                      <span>Enable</span>
                                    </>
                                  )}
                                </button>
                                <hr class="dropdown-divider my-1" />
                                <button class="dropdown-item text-danger d-flex align-items-center gap-2 py-2" onClick={() => deleteShloka(shloka.id)}>
                                  <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                                  <span>Delete</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Shloka Content */}
                      <div class="row g-3">
                        <div class="col-12">
                          <h6 class="fw-semibold text-muted mb-2">Sanskrit:</h6>
                          <div class="bg-orange-50 p-3 rounded sanskrit-text" style={{ fontSize: '1.1rem' }}>
                            {shloka.sanskritShloka}
                          </div>
                        </div>

                        <div class="col-md-6">
                          <h6 class="fw-semibold text-muted mb-2">Hindi Meaning:</h6>
                          <div class="bg-light p-3 rounded">
                            {shloka.hindiMeaning.length > 100 
                              ? shloka.hindiMeaning.substring(0, 100) + '...' 
                              : shloka.hindiMeaning
                            }
                          </div>
                        </div>

                        <div class="col-md-6">
                          <h6 class="fw-semibold text-muted mb-2">English Meaning:</h6>
                          <div class="bg-light p-3 rounded">
                            {shloka.englishMeaning.length > 100 
                              ? shloka.englishMeaning.substring(0, 100) + '...' 
                              : shloka.englishMeaning
                            }
                          </div>
                        </div>

                        {shloka.tags && (
                          <div class="col-12">
                            <h6 class="fw-semibold text-muted mb-2">Tags:</h6>
                            <div class="d-flex flex-wrap gap-1">
                              {shloka.tags.split(',').map((tag, index) => (
                                <span key={index} class="badge bg-orange-100 text-orange-600">
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {filteredShlokas().length === 0 && (
              <div class="text-center py-5">
                <BookOpenIcon style={{ width: '4rem', height: '4rem', color: '#dee2e6' }} class="mb-3" />
                <h5 class="text-muted mb-2">No shlokas found</h5>
                <p class="text-muted mb-3">
                  {searchTerm.value || statusFilter.value !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'Start by adding your first shloka to this chapter'
                  }
                </p>
                {!searchTerm.value && statusFilter.value === 'all' && (
                  <button class="btn btn-primary rounded-pill px-4" onClick={openShlokaModal}>
                    <PlusIcon style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
                    Add First Shloka
                  </button>
                )}
              </div>
            )}

            {/* Add Shloka Modal */}
            {showShlokaModal.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div class="modal-dialog modal-xl modal-dialog-scrollable">
                  <div class="modal-content">
                    <div class="modal-header border-0 pb-0">
                      <h5 class="modal-title fw-bold">Add New Shloka</h5>
                      <button 
                        type="button" 
                        class="btn-close" 
                        onClick={() => showShlokaModal.value = false}
                      ></button>
                    </div>
                    <div class="modal-body px-3 px-md-4">
                      <form onSubmit={(e) => { e.preventDefault(); submitShloka(); }}>
                        <div class="row g-3">
                          <div class="col-md-6">
                            <label class="form-label fw-semibold">Chapter Number *</label>
                            <select
                              required
                              class="form-select"
                              value={shlokaForm.value.chapterNumber}
                              onChange={(e) => {
                                shlokaForm.value.chapterNumber = parseInt(e.target.value);
                                updateShlokaIndex();
                              }}
                            >
                              {Array.from({length: 18}, (_, i) => (
                                <option key={i + 1} value={i + 1}>Chapter {i + 1}</option>
                              ))}
                            </select>
                          </div>
                          <div class="col-md-6">
                            <label class="form-label fw-semibold">Chapter Name</label>
                            <input
                              type="text"
                              class="form-control bg-light"
                              value={shlokaForm.value.chapterName}
                              placeholder="Auto-filled from chapter selection"
                              readonly
                            />
                          </div>

                          <div class="col-md-6">
                            <label class="form-label fw-semibold">Section / Theme</label>
                            <input
                              type="text"
                              class="form-control"
                              value={shlokaForm.value.section}
                              onInput={(e) => shlokaForm.value.section = e.target.value}
                              placeholder="e.g., Introduction, Karma Yoga"
                            />
                          </div>
                          <div class="col-md-6">
                            <label class="form-label fw-semibold">Shloka Number *</label>
                            <input
                              type="text"
                              required
                              class="form-control"
                              value={shlokaForm.value.shlokaNumber}
                              onInput={(e) => {
                                shlokaForm.value.shlokaNumber = e.target.value;
                                updateShlokaIndex();
                              }}
                              placeholder="e.g., 2.47"
                            />
                          </div>

                          <div class="col-12">
                            <label class="form-label fw-semibold">Shloka Index (Auto-generated)</label>
                            <input
                              type="text"
                              class="form-control bg-light"
                              value={shlokaForm.value.shlokaIndex}
                              placeholder="BG-02-047"
                              readonly
                            />
                          </div>

                          <div class="col-12">
                            <label class="form-label fw-semibold">Sanskrit Shloka *</label>
                            <textarea
                              required
                              rows={4}
                              class="form-control sanskrit-text"
                              style={{ fontSize: '1.1rem' }}
                              value={shlokaForm.value.sanskritShloka}
                              onInput={(e) => shlokaForm.value.sanskritShloka = e.target.value}
                              placeholder="Enter Sanskrit shloka in Devanagari..."
                            />
                          </div>

                          <div class="col-12">
                            <label class="form-label fw-semibold">Hindi Meaning *</label>
                            <textarea
                              required
                              rows={4}
                              class="form-control"
                              value={shlokaForm.value.hindiMeaning}
                              onInput={(e) => shlokaForm.value.hindiMeaning = e.target.value}
                              placeholder="Enter Hindi translation and meaning..."
                            />
                          </div>

                          <div class="col-12">
                            <label class="form-label fw-semibold">English Meaning *</label>
                            <textarea
                              required
                              rows={4}
                              class="form-control"
                              value={shlokaForm.value.englishMeaning}
                              onInput={(e) => shlokaForm.value.englishMeaning = e.target.value}
                              placeholder="Enter English translation and meaning..."
                            />
                          </div>

                          <div class="col-12">
                            <label class="form-label fw-semibold">Sanskrit Transliteration (Optional)</label>
                            <textarea
                              rows={3}
                              class="form-control"
                              value={shlokaForm.value.sanskritTransliteration}
                              onInput={(e) => shlokaForm.value.sanskritTransliteration = e.target.value}
                              placeholder="Enter romanized Sanskrit text..."
                            />
                          </div>

                          <div class="col-12">
                            <label class="form-label fw-semibold">Explanation / Notes (Optional)</label>
                            <textarea
                              rows={4}
                              class="form-control"
                              value={shlokaForm.value.explanation}
                              onInput={(e) => shlokaForm.value.explanation = e.target.value}
                              placeholder="Enter detailed explanation, commentary, or notes..."
                            />
                          </div>

                          <div class="col-md-6">
                            <label class="form-label fw-semibold">Tags (Optional)</label>
                            <input
                              type="text"
                              class="form-control"
                              value={shlokaForm.value.tags}
                              onInput={(e) => shlokaForm.value.tags = e.target.value}
                              placeholder="karma, bhakti, duty, dharma, yoga..."
                            />
                            <div class="form-text">Separate multiple tags with commas</div>
                          </div>
                          <div class="col-md-6">
                            <label class="form-label fw-semibold">Status *</label>
                            <select
                              required
                              class="form-select"
                              value={shlokaForm.value.status}
                              onChange={(e) => shlokaForm.value.status = e.target.value}
                            >
                              <option value="draft">Draft</option>
                              <option value="published">Published</option>
                            </select>
                          </div>
                          <div class="col-md-6">
                            <label class="form-label fw-semibold">Active Status *</label>
                            <select
                              required
                              class="form-select"
                              value={shlokaForm.value.isActive}
                              onChange={(e) => shlokaForm.value.isActive = e.target.value === 'true'}
                            >
                              <option value="true">Active</option>
                              <option value="false">Inactive</option>
                            </select>
                          </div>
                        </div>
                      </form>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                      <button 
                        type="button" 
                        class="btn btn-secondary rounded-pill px-4" 
                        onClick={() => showShlokaModal.value = false}
                        disabled={loading.value}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-primary rounded-pill px-4" 
                        onClick={submitShloka}
                        disabled={loading.value}
                      >
                        {loading.value ? (
                          <>
                            <span class="spinner-border spinner-border-sm me-2"></span>
                            Creating...
                          </>
                        ) : (
                          'Create Shloka'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Edit Modal - Similar structure as Add Modal */}
            {showEditModal.value && editingShloka.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div class="modal-dialog modal-xl modal-dialog-scrollable">
                  <div class="modal-content">
                    <div class="modal-header border-0 pb-0">
                      <h5 class="modal-title fw-bold">Edit Shloka</h5>
                      <button 
                        type="button" 
                        class="btn-close" 
                        onClick={() => showEditModal.value = false}
                      ></button>
                    </div>
                    <div class="modal-body px-3 px-md-4">
                      {/* Similar form structure as Add Modal but with editForm */}
                      <p class="text-muted">Edit form content similar to add form...</p>
                    </div>
                    <div class="modal-footer border-0 pt-0">
                      <button 
                        type="button" 
                        class="btn btn-secondary rounded-pill px-4" 
                        onClick={() => showEditModal.value = false}
                        disabled={loading.value}
                      >
                        Cancel
                      </button>
                      <button 
                        type="button" 
                        class="btn btn-primary rounded-pill px-4" 
                        onClick={updateShloka}
                        disabled={loading.value}
                      >
                        {loading.value ? 'Updating...' : 'Update Shloka'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* View Modal */}
            {showViewModal.value && selectedShloka.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={() => showViewModal.value = false}>
                <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
                  <div class="modal-content border-0 shadow-lg rounded-4">
                    <div class="modal-header border-0 pb-2">
                      <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                        <EyeIcon style={{ width: '1.5rem', height: '1.5rem' }} />
                        {selectedShloka.value.shlokaIndex}
                      </h5>
                      <button type="button" class="btn-close" onClick={() => showViewModal.value = false}></button>
                    </div>
                    <div class="modal-body pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                      <div class="text-center mb-4">
                        <h4 class="fw-bold mb-1">Shloka {selectedShloka.value.shlokaNumber}</h4>
                        {selectedShloka.value.section && (
                          <p class="text-muted">{selectedShloka.value.section}</p>
                        )}
                        <span 
                          class="badge rounded-pill px-3 py-2"
                          style={{ 
                            backgroundColor: getStatusBadge(selectedShloka.value.status).color + '20',
                            color: getStatusBadge(selectedShloka.value.status).color
                          }}
                        >
                          {getStatusBadge(selectedShloka.value.status).text}
                        </span>
                      </div>
                      
                      <div class="mb-3">
                        <h6 class="fw-semibold mb-2 small text-muted">Sanskrit Shloka</h6>
                        <div class="bg-orange-50 p-3 rounded sanskrit-text" style={{ fontSize: '1.1rem' }}>
                          {selectedShloka.value.sanskritShloka}
                        </div>
                      </div>
                      
                      <div class="mb-3">
                        <h6 class="fw-semibold mb-2 small text-muted">Hindi Meaning</h6>
                        <p class="mb-0">{selectedShloka.value.hindiMeaning}</p>
                      </div>
                      
                      <div class="mb-3">
                        <h6 class="fw-semibold mb-2 small text-muted">English Meaning</h6>
                        <p class="mb-0">{selectedShloka.value.englishMeaning}</p>
                      </div>

                      {selectedShloka.value.sanskritTransliteration && (
                        <div class="mb-3">
                          <h6 class="fw-semibold mb-2 small text-muted">Sanskrit Transliteration</h6>
                          <p class="mb-0 font-monospace">{selectedShloka.value.sanskritTransliteration}</p>
                        </div>
                      )}

                      {selectedShloka.value.explanation && (
                        <div class="mb-3">
                          <h6 class="fw-semibold mb-2 small text-muted">Explanation</h6>
                          <p class="mb-0">{selectedShloka.value.explanation}</p>
                        </div>
                      )}
                      
                      {selectedShloka.value.tags && (
                        <div class="mb-3">
                          <h6 class="fw-semibold mb-2 small text-muted">Tags</h6>
                          <div class="d-flex flex-wrap gap-1">
                            {selectedShloka.value.tags.split(',').map((tag, index) => (
                              <span key={index} class="badge bg-primary">{tag.trim()}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div class="modal-footer border-0 pt-2">
                      <button type="button" class="btn btn-secondary rounded-pill px-3 btn-sm" onClick={() => showViewModal.value = false}>
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
};