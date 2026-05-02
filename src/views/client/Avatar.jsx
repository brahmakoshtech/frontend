import { ref, onMounted } from 'vue';
import { useToast } from 'vue-toastification';
import {
  PlayIcon,
  UserIcon,
  EyeIcon,
  XCircleIcon,
  VideoCameraIcon,
  ChatBubbleLeftRightIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/vue/24/outline';
import liveAvatarService from '../../services/liveAvatarService';

export default {
  name: 'Avatar',
  setup() {
    const toast = useToast();

    // ── Avatars tab ──
    const avatars = ref([]);
    const loading = ref(false);
    const showViewModal = ref(false);
    const showMediaModal = ref(false);
    const selectedAvatar = ref(null);
    const mediaContent = ref({ type: '', url: '' });

    // ── Conversations tab ──
    const activeTab = ref('avatars'); // 'avatars' | 'conversations' | 'voice'
    const conversations = ref([]);
    const convLoading = ref(false);
    const convMeta = ref({ page: 1, limit: 20, total: 0, pages: 0 });
    const convPage = ref(1);
    const voiceLogs = ref([]);
    const voiceLoading = ref(false);
    const voiceMeta = ref({ page: 1, limit: 20, total: 0, pages: 0 });
    const voicePage = ref(1);

    // ── Helpers ──
    const fmt = (iso) => {
      if (!iso) return '—';
      return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true,
      });
    };

    const fmtDuration = (mins) => {
      if (!mins && mins !== 0) return '—';
      if (mins < 1) return '< 1 min';
      if (mins < 60) return `${Math.round(mins)} min`;
      return `${Math.floor(mins / 60)}h ${Math.round(mins % 60)}m`;
    };

    // ── Load avatars ──
    const loadAvatars = async () => {
      try {
        loading.value = true;
        const data = await liveAvatarService.getAll();
        avatars.value = Array.isArray(data) ? data : [];
      } catch (error) {
        console.error('Error loading avatars:', error);
        toast.error('Failed to load avatars');
      } finally {
        loading.value = false;
      }
    };

    // ── Load conversations ──
    const loadConversations = async (page = 1) => {
      try {
        convLoading.value = true;
        const res = await liveAvatarService.getConversations({ page, limit: 20 });
        conversations.value = res.data || [];
        convMeta.value = res.meta || { page, limit: 20, total: 0, pages: 0 };
        convPage.value = page;
      } catch (error) {
        console.error('Error loading conversations:', error);
        toast.error('Failed to load conversations');
      } finally {
        convLoading.value = false;
      }
    };

    const loadVoiceLogs = async (page = 1) => {
      try {
        voiceLoading.value = true;
        const res = await liveAvatarService.getVoiceCallLogs({ page, limit: 20 });
        voiceLogs.value = res.data || [];
        voiceMeta.value = res.meta || { page, limit: 20, total: 0, pages: 0 };
        voicePage.value = page;
      } catch (error) {
        console.error('Error loading voice logs:', error);
      } finally {
        voiceLoading.value = false;
      }
    };

    const switchTab = (tab) => {
      activeTab.value = tab;
      if (tab === 'conversations' && conversations.value.length === 0) loadConversations(1);
      if (tab === 'voice' && voiceLogs.value.length === 0) loadVoiceLogs(1);
    };

    // ── Avatar modal helpers ──
    const openViewModal = (avatar) => { selectedAvatar.value = avatar; showViewModal.value = true; };
    const closeViewModal = () => { showViewModal.value = false; selectedAvatar.value = null; };
    const openMedia = (type, url) => { if (!url) return; mediaContent.value = { type, url }; showMediaModal.value = true; };
    const closeMediaModal = () => { showMediaModal.value = false; mediaContent.value = { type: '', url: '' }; };

    onMounted(loadAvatars);

    return () => (
      <div class="container-fluid px-3 px-lg-4">

        {/* Header */}
        <div class="bg-gradient-primary rounded-4 p-4 mb-4 shadow-lg">
          <div class="d-flex align-items-center gap-3">
            <div class="flex-grow-1">
              <h1 class="mb-1 fw-bold fs-2 text-dark">🎭 Avatar Management</h1>
              <p class="mb-0 text-dark" style={{ opacity: 0.8 }}>View and manage your live avatars</p>
              {activeTab.value === 'avatars' && !loading.value && avatars.value.length > 0 && (
                <small class="text-dark d-block mt-1" style={{ opacity: 0.8 }}>
                  {avatars.value.length} total • {avatars.value.filter(a => a.isActive).length} active
                </small>
              )}
              {activeTab.value === 'conversations' && !convLoading.value && (
                <small class="text-dark d-block mt-1" style={{ opacity: 0.8 }}>
                  {convMeta.value.total} total avatar conversations
                </small>
              )}
              {activeTab.value === 'voice' && !voiceLoading.value && (
                <small class="text-dark d-block mt-1" style={{ opacity: 0.8 }}>
                  {voiceMeta.value.total} total voice calls
                </small>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <ul class="nav nav-tabs mb-3 border-0" style={{ gap: '8px' }}>
          <li class="nav-item">
            <button
              class={`nav-link fw-semibold px-4 py-2 rounded-3 border-0 ${activeTab.value === 'avatars' ? 'active bg-primary text-white shadow-sm' : 'bg-light text-muted'}`}
              onClick={() => switchTab('avatars')}
            >
              <VideoCameraIcon style={{ width: '18px', height: '18px', marginRight: '6px', verticalAlign: 'middle' }} />
              Live Avatars
            </button>
          </li>
          <li class="nav-item">
            <button
              class={`nav-link fw-semibold px-4 py-2 rounded-3 border-0 d-flex align-items-center gap-2 ${activeTab.value === 'conversations' ? 'active bg-primary text-white shadow-sm' : 'bg-light text-muted'}`}
              onClick={() => switchTab('conversations')}
            >
              <ChatBubbleLeftRightIcon style={{ width: '18px', height: '18px' }} />
              Avatar Chats
              {convMeta.value.total > 0 && (
                <span class={`badge rounded-pill ${activeTab.value === 'conversations' ? 'bg-white text-primary' : 'bg-primary text-white'}`} style={{ fontSize: '0.7rem' }}>
                  {convMeta.value.total}
                </span>
              )}
            </button>
          </li>
          <li class="nav-item">
            <button
              class={`nav-link fw-semibold px-4 py-2 rounded-3 border-0 d-flex align-items-center gap-2 ${activeTab.value === 'voice' ? 'active bg-warning text-white shadow-sm' : 'bg-light text-muted'}`}
              onClick={() => switchTab('voice')}
            >
              <ClockIcon style={{ width: '18px', height: '18px' }} />
              Voice Calls
              {voiceMeta.value.total > 0 && (
                <span class={`badge rounded-pill ${activeTab.value === 'voice' ? 'bg-white text-warning' : 'bg-warning text-white'}`} style={{ fontSize: '0.7rem' }}>
                  {voiceMeta.value.total}
                </span>
              )}
            </button>
          </li>
        </ul>

        {/* ── AVATARS TAB ── */}
        {activeTab.value === 'avatars' && (
          <div class="card border-0 shadow-sm rounded-4">
            <div class="card-body p-3 p-md-4">
              <h5 class="fw-bold mb-3">Live Avatars</h5>
              {loading.value ? (
                <div class="text-center py-5">
                  <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
                </div>
              ) : avatars.value.length > 0 ? (
                <div class="row g-3">
                  {avatars.value.map(avatar => (
                    <div key={avatar._id} class="col-12 col-md-6 col-lg-4">
                      <div
                        class={`card h-100 border-0 shadow-sm position-relative ${!avatar.isActive ? 'opacity-50' : ''}`}
                        style={{ borderRadius: '16px', transition: 'all 0.3s ease' }}
                      >
                        {!avatar.isActive && (
                          <div
                            class="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
                            style={{ backgroundColor: 'rgba(0,0,0,0.1)', zIndex: 1, borderRadius: '16px' }}
                          >
                            <span class="badge bg-secondary px-3 py-2 rounded-pill shadow d-flex align-items-center gap-2">
                              <XCircleIcon style={{ width: '16px', height: '16px' }} />Disabled
                            </span>
                          </div>
                        )}
                        <div class="position-relative" style={{ height: '200px', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
                          {avatar.imageUrl ? (
                            <img src={avatar.imageUrl} alt={avatar.name} class="w-100 h-100" style={{ objectFit: 'cover', cursor: 'pointer' }} onClick={() => openMedia('image', avatar.imageUrl)} />
                          ) : (
                            <div class="w-100 h-100 d-flex align-items-center justify-content-center bg-light">
                              <UserIcon style={{ width: '3rem', height: '3rem', color: '#6c757d' }} />
                            </div>
                          )}
                        </div>
                        <div class="card-body p-3">
                          <div class="d-flex justify-content-between align-items-start mb-2">
                            <h6 class="fw-bold mb-0 text-truncate" style={{ fontSize: '1rem' }}>{avatar.name}</h6>
                            <button class="btn btn-light btn-sm rounded-circle d-flex align-items-center justify-content-center" onClick={() => openViewModal(avatar)} style={{ width: '36px', height: '36px', flexShrink: 0 }} title="View Details">
                              <EyeIcon style={{ width: '18px', height: '18px' }} />
                            </button>
                          </div>
                          <p class="text-muted small mb-3 lh-base" style={{ fontSize: '0.85rem' }}>
                            {(avatar.description?.length || 0) > 80 ? avatar.description.substring(0, 80) + '...' : avatar.description || '—'}
                          </p>
                          <div class="d-flex flex-wrap gap-1 mb-2">
                            <span class={`badge px-2 py-1 ${avatar.category === 'Deity' ? 'bg-primary' : avatar.category === 'Rashami' ? 'bg-success' : avatar.category === 'Expert' ? 'bg-warning text-dark' : 'bg-secondary'}`} style={{ fontSize: '0.75rem' }}>
                              {avatar.category === 'Deity' ? '🕉️ Deity' : avatar.category === 'Rashami' ? '🌟 Rashami' : avatar.category === 'Expert' ? '👨🏫 Expert' : avatar.category}
                            </span>
                            <span class="badge bg-light text-dark px-2 py-1" style={{ fontSize: '0.75rem' }}>{avatar.gender === 'Male' ? '👨 Male' : '👩 Female'}</span>
                          </div>
                          <div class="d-flex flex-wrap gap-1 mb-3">
                            {avatar.videoUrl && (
                              <span class="badge bg-success d-flex align-items-center gap-1" style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }} onClick={() => openMedia('video', avatar.videoUrl)}>
                                <PlayIcon style={{ width: '14px', height: '14px' }} />Video
                              </span>
                            )}
                            {avatar.imageUrl && (
                              <span class="badge bg-info d-flex align-items-center gap-1" style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '0.4rem 0.6rem' }} onClick={() => openMedia('image', avatar.imageUrl)}>
                                <UserIcon style={{ width: '14px', height: '14px' }} />Image
                              </span>
                            )}
                            {avatar.link && (
                              <a href={avatar.link} target="_blank" rel="noopener noreferrer" class="badge bg-warning text-dark text-decoration-none" style={{ fontSize: '0.8rem', padding: '0.4rem 0.6rem' }}>🔗 Link</a>
                            )}
                          </div>
                          <div class="d-flex justify-content-between align-items-center">
                            <small class="text-muted">{new Date(avatar.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</small>
                            <span class={`badge ${avatar.isActive ? 'bg-success' : 'bg-secondary'}`} style={{ fontSize: '0.7rem' }}>{avatar.isActive ? '✅ Active' : '❌ Inactive'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div class="text-center py-5">
                  <div class="mb-4 p-4 rounded-circle bg-light d-inline-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                    <VideoCameraIcon style={{ width: '4rem', height: '4rem', color: '#6c757d' }} />
                  </div>
                  <h4 class="text-muted mb-2">No avatars found</h4>
                  <p class="text-muted">Go to <strong>Tools → Live Avatar</strong> to create avatars.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CONVERSATIONS TAB ── */}
        {activeTab.value === 'conversations' && (
          <div class="card border-0 shadow-sm rounded-4">
            <div class="card-body p-3 p-md-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0">
                  <ChatBubbleLeftRightIcon style={{ width: '20px', height: '20px', marginRight: '8px', verticalAlign: 'middle' }} />
                  Avatar Conversations
                </h5>
                <span class="badge bg-primary rounded-pill px-3 py-2" style={{ fontSize: '0.85rem' }}>
                  Total: {convMeta.value.total}
                </span>
              </div>

              {convLoading.value ? (
                <div class="text-center py-5">
                  <div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div>
                </div>
              ) : conversations.value.length > 0 ? (
                <>
                  {/* Stats row */}
                  <div class="row g-3 mb-4">
                    <div class="col-6 col-md-4">
                      <div class="card border-0 bg-primary bg-opacity-10 rounded-3 p-3 text-center">
                        <div class="fw-bold fs-4 text-primary">{convMeta.value.total}</div>
                        <small class="text-muted">Total Conversations</small>
                      </div>
                    </div>
                    <div class="col-6 col-md-4">
                      <div class="card border-0 bg-success bg-opacity-10 rounded-3 p-3 text-center">
                        <div class="fw-bold fs-4 text-success">
                          {conversations.value.reduce((s, c) => s + (c.messagesCount || 0), 0)}
                        </div>
                        <small class="text-muted">Messages (This Page)</small>
                      </div>
                    </div>
                    <div class="col-6 col-md-4">
                      <div class="card border-0 bg-warning bg-opacity-10 rounded-3 p-3 text-center">
                        <div class="fw-bold fs-4 text-warning">
                          {new Set(conversations.value.map(c => c.user?._id)).size}
                        </div>
                        <small class="text-muted">Unique Users (This Page)</small>
                      </div>
                    </div>
                  </div>

                  {/* Table */}
                  <div class="table-responsive">
                    <table class="table table-hover align-middle" style={{ fontSize: '0.875rem' }}>
                      <thead class="table-light">
                        <tr>
                          <th>#</th>
                          <th>User</th>
                          <th>Avatar</th>
                          <th>
                            <ClockIcon style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                            Start Time
                          </th>
                          <th>
                            <ClockIcon style={{ width: '14px', height: '14px', marginRight: '4px' }} />
                            Last Active
                          </th>
                          <th>Messages</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conversations.value.map((conv, idx) => (
                          <tr key={conv._id}>
                            <td class="text-muted">{(convPage.value - 1) * convMeta.value.limit + idx + 1}</td>
                            <td>
                              {conv.user ? (
                                <div>
                                  <div class="fw-semibold">{conv.user.name || 'Unknown'}</div>
                                  <small class="text-muted">{conv.user.email || '—'}</small>
                                </div>
                              ) : <span class="text-muted">—</span>}
                            </td>
                            <td>
                              <div class="d-flex align-items-center gap-2">
                                {conv.avatar?.imageUrl ? (
                                  <img src={conv.avatar.imageUrl} style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #f5a623' }} />
                                ) : (
                                  <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'linear-gradient(135deg, #f5a623, #e8821a)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', flexShrink: 0 }}>🙏</div>
                                )}
                                <div>
                                  <div class="fw-semibold">{conv.avatar?.name || conv.avatarName || '—'}</div>
                                  {conv.avatar?.category && <small class="text-muted">{conv.avatar.category}</small>}
                                </div>
                              </div>
                            </td>
                            <td>
                              <span class="badge bg-success bg-opacity-10 text-success px-2 py-1 rounded-2" style={{ fontSize: '0.78rem' }}>
                                {fmt(conv.startTime)}
                              </span>
                            </td>
                            <td>
                              <span class="badge bg-danger bg-opacity-10 text-danger px-2 py-1 rounded-2" style={{ fontSize: '0.78rem' }}>
                                {fmt(conv.endTime)}
                              </span>
                            </td>
                            <td class="text-center">{conv.messagesCount ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination */}
                  {convMeta.value.pages > 1 && (
                    <div class="d-flex justify-content-between align-items-center mt-3">
                      <small class="text-muted">
                        Showing {(convPage.value - 1) * convMeta.value.limit + 1}–{Math.min(convPage.value * convMeta.value.limit, convMeta.value.total)} of {convMeta.value.total}
                      </small>
                      <div class="d-flex gap-2">
                        <button
                          class="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                          disabled={convPage.value <= 1}
                          onClick={() => loadConversations(convPage.value - 1)}
                        >
                          <ChevronLeftIcon style={{ width: '16px', height: '16px' }} /> Prev
                        </button>
                        <span class="btn btn-light btn-sm disabled">{convPage.value} / {convMeta.value.pages}</span>
                        <button
                          class="btn btn-outline-primary btn-sm d-flex align-items-center gap-1"
                          disabled={convPage.value >= convMeta.value.pages}
                          onClick={() => loadConversations(convPage.value + 1)}
                        >
                          Next <ChevronRightIcon style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div class="text-center py-5">
                  <div class="mb-4 p-4 rounded-circle bg-light d-inline-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                    <ChatBubbleLeftRightIcon style={{ width: '4rem', height: '4rem', color: '#6c757d' }} />
                  </div>
                  <h4 class="text-muted mb-2">No conversations yet</h4>
                  <p class="text-muted">Avatar conversations will appear here once users start chatting.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── VOICE CALLS TAB ── */}
        {activeTab.value === 'voice' && (
          <div class="card border-0 shadow-sm rounded-4">
            <div class="card-body p-3 p-md-4">
              <div class="d-flex justify-content-between align-items-center mb-3">
                <h5 class="fw-bold mb-0">
                  🎙️ Voice Agent Calls (Rashmi & Krishna)
                </h5>
                <span class="badge bg-warning rounded-pill px-3 py-2" style={{ fontSize: '0.85rem' }}>
                  Total: {voiceMeta.value.total}
                </span>
              </div>

              {voiceLoading.value ? (
                <div class="text-center py-5">
                  <div class="spinner-border text-warning" role="status"><span class="visually-hidden">Loading...</span></div>
                </div>
              ) : voiceLogs.value.length > 0 ? (
                <>
                  <div class="table-responsive">
                    <table class="table table-hover align-middle" style={{ fontSize: '0.875rem' }}>
                      <thead class="table-light">
                        <tr>
                          <th>#</th>
                          <th>User</th>
                          <th>Agent (Voice)</th>
                          <th>Start Time</th>
                          <th>End Time</th>
                          <th>Duration</th>
                          <th>Messages</th>
                          <th>Credits Used</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {voiceLogs.value.map((log, idx) => (
                          <tr key={log._id}>
                            <td class="text-muted">{(voicePage.value - 1) * voiceMeta.value.limit + idx + 1}</td>
                            <td>
                              {log.user ? (
                                <div>
                                  <div class="fw-semibold">{log.user.name || 'Unknown'}</div>
                                  <small class="text-muted">{log.user.email || '—'}</small>
                                </div>
                              ) : <span class="text-muted">—</span>}
                            </td>
                            <td>
                              <div class="fw-semibold">{log.agent?.name || '—'}</div>
                              <small class="text-muted">{log.agent?.voiceName || '—'}</small>
                            </td>
                            <td>
                              <span class="badge bg-success bg-opacity-10 text-success px-2 py-1 rounded-2" style={{ fontSize: '0.78rem' }}>
                                {fmt(log.startTime)}
                              </span>
                            </td>
                            <td>
                              {log.endTime ? (
                                <span class="badge bg-danger bg-opacity-10 text-danger px-2 py-1 rounded-2" style={{ fontSize: '0.78rem' }}>
                                  {fmt(log.endTime)}
                                </span>
                              ) : <span class="text-muted">—</span>}
                            </td>
                            <td>
                              <span class="badge bg-primary bg-opacity-10 text-primary px-2 py-1 rounded-2">
                                {fmtDuration(log.durationMinutes)}
                              </span>
                            </td>
                            <td class="text-center">{log.messagesCount ?? '—'}</td>
                            <td class="text-center">
                              <span class="badge bg-danger bg-opacity-10 text-danger px-2 py-1 rounded-2">
                                {log.creditsUsed ?? 0}
                              </span>
                            </td>
                            <td>
                              {log.status === 'ongoing' ? (
                                <span class="badge bg-success d-flex align-items-center gap-1" style={{ width: 'fit-content' }}>
                                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'white', display: 'inline-block', animation: 'pulse 1.5s infinite' }}></span>
                                  On Going
                                </span>
                              ) : (
                                <span class="badge bg-secondary">Completed</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {voiceMeta.value.pages > 1 && (
                    <div class="d-flex justify-content-between align-items-center mt-3">
                      <small class="text-muted">
                        Showing {(voicePage.value - 1) * voiceMeta.value.limit + 1}–{Math.min(voicePage.value * voiceMeta.value.limit, voiceMeta.value.total)} of {voiceMeta.value.total}
                      </small>
                      <div class="d-flex gap-2">
                        <button class="btn btn-outline-warning btn-sm d-flex align-items-center gap-1" disabled={voicePage.value <= 1} onClick={() => loadVoiceLogs(voicePage.value - 1)}>
                          <ChevronLeftIcon style={{ width: '16px', height: '16px' }} /> Prev
                        </button>
                        <span class="btn btn-light btn-sm disabled">{voicePage.value} / {voiceMeta.value.pages}</span>
                        <button class="btn btn-outline-warning btn-sm d-flex align-items-center gap-1" disabled={voicePage.value >= voiceMeta.value.pages} onClick={() => loadVoiceLogs(voicePage.value + 1)}>
                          Next <ChevronRightIcon style={{ width: '16px', height: '16px' }} />
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div class="text-center py-5">
                  <div class="mb-4 p-4 rounded-circle bg-light d-inline-flex align-items-center justify-content-center" style={{ width: '120px', height: '120px' }}>
                    <ClockIcon style={{ width: '4rem', height: '4rem', color: '#6c757d' }} />
                  </div>
                  <h4 class="text-muted mb-2">No voice calls yet</h4>
                  <p class="text-muted">Voice agent calls (Rashmi, Krishna) will appear here.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View Details Modal */}
        {showViewModal.value && selectedAvatar.value && (
          <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={closeViewModal}>
            <div class="modal-dialog modal-dialog-centered modal-dialog-scrollable" onClick={(e) => e.stopPropagation()}>
              <div class="modal-content border-0 shadow-lg rounded-4">
                <div class="modal-header border-0 pb-2">
                  <h5 class="modal-title fw-bold d-flex align-items-center gap-2">
                    <EyeIcon style={{ width: '1.5rem', height: '1.5rem' }} />{selectedAvatar.value.name}
                  </h5>
                  <button type="button" class="btn-close" onClick={closeViewModal}></button>
                </div>
                <div class="modal-body pt-2" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                  <div class="mb-3"><h6 class="fw-semibold mb-1 small text-muted">Agent ID</h6><p class="mb-0">{selectedAvatar.value.agentId || '—'}</p></div>
                  <div class="mb-3">
                    <h6 class="fw-semibold mb-1 small text-muted">Category</h6>
                    <span class={`badge px-3 py-2 ${selectedAvatar.value.category === 'Deity' ? 'bg-primary' : selectedAvatar.value.category === 'Rashami' ? 'bg-success' : selectedAvatar.value.category === 'Expert' ? 'bg-warning text-dark' : 'bg-secondary'}`}>{selectedAvatar.value.category}</span>
                  </div>
                  <div class="mb-3"><h6 class="fw-semibold mb-1 small text-muted">Gender</h6><p class="mb-0">{selectedAvatar.value.gender === 'Male' ? '👨 Male' : '👩 Female'}</p></div>
                  <div class="mb-3"><h6 class="fw-semibold mb-1 small text-muted">Description</h6><p class="mb-0 lh-base">{selectedAvatar.value.description || '—'}</p></div>
                  {selectedAvatar.value.link && (
                    <div class="mb-3"><h6 class="fw-semibold mb-1 small text-muted">External Link</h6><a href={selectedAvatar.value.link} target="_blank" rel="noopener noreferrer" class="btn btn-outline-primary btn-sm">🔗 Open Link</a></div>
                  )}
                  {selectedAvatar.value.videoUrl && (
                    <div class="mb-3">
                      <h6 class="fw-semibold mb-1 small text-muted d-flex align-items-center gap-1"><PlayIcon style={{ width: '16px', height: '16px' }} /> Video</h6>
                      <video controls class="w-100 rounded-3" style={{ maxHeight: '250px' }}><source src={selectedAvatar.value.videoUrl} type="video/mp4" /></video>
                    </div>
                  )}
                  {selectedAvatar.value.imageUrl && (
                    <div class="mb-3">
                      <h6 class="fw-semibold mb-1 small text-muted d-flex align-items-center gap-1"><UserIcon style={{ width: '16px', height: '16px' }} /> Image</h6>
                      <img src={selectedAvatar.value.imageUrl} alt={selectedAvatar.value.name} class="img-fluid rounded-3" style={{ maxHeight: '300px', width: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                  <div class="row">
                    <div class="col-6"><h6 class="fw-semibold mb-1 small text-muted">Status</h6><span class={`badge ${selectedAvatar.value.isActive ? 'bg-success' : 'bg-secondary'}`}>{selectedAvatar.value.isActive ? '✅ Active' : '❌ Inactive'}</span></div>
                    <div class="col-6"><h6 class="fw-semibold mb-1 small text-muted">Created</h6><small>{new Date(selectedAvatar.value.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</small></div>
                  </div>
                </div>
                <div class="modal-footer border-0 pt-2">
                  <button type="button" class="btn btn-secondary rounded-pill px-3 btn-sm" onClick={closeViewModal}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Media Preview Modal */}
        {showMediaModal.value && (
          <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.8)' }} onClick={closeMediaModal}>
            <div class="modal-dialog modal-dialog-centered modal-lg" onClick={(e) => e.stopPropagation()}>
              <div class="modal-content border-0 shadow-lg rounded-4">
                <div class="modal-header border-0 pb-2">
                  <h5 class="modal-title fw-bold">{mediaContent.value.type === 'video' ? '🎥 Video Preview' : '🖼️ Image Preview'}</h5>
                  <button type="button" class="btn-close" onClick={closeMediaModal}></button>
                </div>
                <div class="modal-body p-0">
                  {mediaContent.value.type === 'video' ? (
                    <video controls class="w-100" style={{ maxHeight: '70vh', borderRadius: '0 0 16px 16px' }}><source src={mediaContent.value.url} type="video/mp4" /></video>
                  ) : (
                    <img src={mediaContent.value.url} alt="Preview" class="w-100" style={{ maxHeight: '70vh', objectFit: 'contain', borderRadius: '0 0 16px 16px' }} />
                  )}
                </div>
                <div class="modal-footer border-0 pt-2">
                  <button type="button" class="btn btn-secondary rounded-pill px-3 btn-sm" onClick={closeMediaModal}>Close</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
};
