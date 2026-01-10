import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, PlusIcon, EyeIcon, PencilIcon, TrashIcon, UserIcon, EllipsisVerticalIcon } from '@heroicons/vue/24/outline';
import founderMessageService from '../../../services/founderMessageService.js';

export default {
  name: 'ClientFounderMessage',
  setup() {
    const router = useRouter();
    const messages = ref([]);
    const loading = ref(false);
    const showAddModal = ref(false);
    const showEditModal = ref(false);
    const selectedMessage = ref(null);
    const activeDropdown = ref(null);
    const currentPage = ref(1);
    const itemsPerPage = 4;
    const editMessage = ref({
      _id: '',
      founderName: '',
      position: '',
      content: '',
      founderImage: null,
      status: 'draft'
    });
    const newMessage = ref({
      founderName: '',
      position: '',
      content: '',
      founderImage: null,
      status: 'draft'
    });

    const goBack = () => {
      router.push('/client/tools');
    };

    // Load all messages
    const loadMessages = async () => {
      loading.value = true;
      try {
        const response = await founderMessageService.getAllMessages();
        if (response.success) {
          // Convert S3 URLs to presigned URLs for better access
          let messagesList = await Promise.all(
            response.data.map(async (message) => {
              if (message.founderImage) {
                try {
                  const presignedUrl = await founderMessageService.getPresignedImageUrl(message.founderImage);
                  return { ...message, founderImage: presignedUrl };
                } catch (error) {
                  return message;
                }
              }
              return message;
            })
          );
          
          messages.value = messagesList;
        } else {
          console.error('Failed to load messages:', response.error);
        }
      } catch (error) {
        console.error('Error loading messages:', error);
      } finally {
        loading.value = false;
      }
    };

    // Add new message
    const addMessage = async () => {
      if (!newMessage.value.founderName || !newMessage.value.position || !newMessage.value.content) {
        alert('Please fill all required fields');
        return;
      }

      loading.value = true;
      try {
        // First create message without image (like testimonials)
        const { founderImage, ...messageData } = newMessage.value;
        const response = await founderMessageService.createMessage(messageData);
        
        if (response.success && response.data) {
          let createdMessage = response.data;
          
          // Upload image if provided and message ID exists
          if (founderImage && createdMessage._id) {
            try {
              const imageResponse = await founderMessageService.uploadImage(createdMessage._id, founderImage);
              
              if (imageResponse.success && imageResponse.data) {
                let imageUrl = imageResponse.data.imageUrl;
                if (imageUrl) {
                  // Get presigned URL for S3 images
                  try {
                    const presignedUrl = await founderMessageService.getPresignedImageUrl(imageUrl);
                    imageUrl = presignedUrl || imageUrl;
                  } catch (error) {
                    // Use original URL if presigned fails
                  }
                  
                  createdMessage.founderImage = imageUrl;
                }
              }
            } catch (imageError) {
              alert('Message created but image upload failed');
            }
          }
          
          messages.value.unshift(createdMessage);
          newMessage.value = { founderName: '', position: '', content: '', founderImage: null, status: 'draft' };
          showAddModal.value = false;
        } else {
          alert('Failed to create message: ' + response.error);
        }
      } catch (error) {
        alert('Error creating message');
      } finally {
        loading.value = false;
      }
    };

    // Delete message
    const deleteMessage = async (id) => {
      if (!confirm('Are you sure you want to delete this message?')) return;
      
      loading.value = true;
      try {
        const response = await founderMessageService.deleteMessage(id);
        if (response.success) {
          messages.value = messages.value.filter(m => m._id !== id);
          if (selectedMessage.value && selectedMessage.value._id === id) {
            selectedMessage.value = null;
          }
          // Reset to first page if current page becomes empty
          if (paginatedMessages.value.length === 0 && currentPage.value > 1) {
            currentPage.value = currentPage.value - 1;
          }
        } else {
          alert('Failed to delete message: ' + response.error);
        }
      } catch (error) {
        console.error('Error deleting message:', error);
        alert('Error deleting message');
      } finally {
        loading.value = false;
      }
    };

    // Toggle status
    const toggleStatus = async (message) => {
      loading.value = true;
      try {
        const response = await founderMessageService.toggleStatus(message._id);
        if (response.success) {
          // Update in main messages array
          const index = messages.value.findIndex(m => m._id === message._id);
          if (index !== -1) {
            messages.value[index] = { ...messages.value[index], ...response.data };
          }
          // Update selected message if it's the same
          if (selectedMessage.value && selectedMessage.value._id === message._id) {
            selectedMessage.value = { ...selectedMessage.value, ...response.data };
          }
        } else {
          alert('Failed to toggle status: ' + response.error);
        }
      } catch (error) {
        console.error('Error toggling status:', error);
        alert('Error toggling status');
      } finally {
        loading.value = false;
      }
    };

    // View message
    const viewMessage = async (message) => {
      let messageToShow = { ...message };
      
      // Get fresh presigned URL for image if exists
      if (message.founderImage && message.founderImage.includes('amazonaws.com')) {
        try {
          const presignedUrl = await founderMessageService.getPresignedImageUrl(message.founderImage);
          messageToShow.founderImage = presignedUrl;
          
          // Update the card image too
          const index = messages.value.findIndex(m => m._id === message._id);
          if (index !== -1) {
            messages.value[index].founderImage = presignedUrl;
          }
        } catch (error) {
          console.error('Error getting presigned URL:', error);
        }
      }
      
      selectedMessage.value = messageToShow;
      
      if (message.status === 'published') {
        try {
          const response = await founderMessageService.incrementViews(message._id);
          if (response.success) {
            const index = messages.value.findIndex(m => m._id === message._id);
            if (index !== -1) {
              messages.value[index] = { ...messages.value[index], views: response.data.views };
            }
            selectedMessage.value = { ...messageToShow, views: response.data.views };
          }
        } catch (error) {
          console.error('Error incrementing views:', error);
        }
      }
    };

    // Toggle dropdown
    const toggleDropdown = (messageId) => {
      activeDropdown.value = activeDropdown.value === messageId ? null : messageId;
    };

    // Pagination computed properties
    const totalPages = computed(() => Math.ceil(messages.value.length / itemsPerPage));
    const paginatedMessages = computed(() => {
      const start = (currentPage.value - 1) * itemsPerPage;
      const end = start + itemsPerPage;
      return messages.value.slice(start, end);
    });

    const goToPage = (page) => {
      if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
      }
    };

    // Open edit modal
    const openEditModal = (message) => {
      editMessage.value = {
        _id: message._id,
        founderName: message.founderName,
        position: message.position,
        content: message.content,
        founderImage: null,
        status: message.status
      };
      showEditModal.value = true;
    };

    // Update message
    const updateMessage = async () => {
      if (!editMessage.value.founderName || !editMessage.value.position || !editMessage.value.content) {
        alert('Please fill all required fields');
        return;
      }

      loading.value = true;
      try {
        const response = await founderMessageService.updateMessage(editMessage.value._id, editMessage.value);
        
        if (response.success) {
          const index = messages.value.findIndex(m => m._id === editMessage.value._id);
          if (index !== -1) {
            messages.value[index] = response.data;
          }
          showEditModal.value = false;
          editMessage.value = { _id: '', founderName: '', position: '', content: '', founderImage: null, status: 'draft' };
        } else {
          alert('Failed to update message: ' + response.error);
        }
      } catch (error) {
        alert('Error updating message');
      } finally {
        loading.value = false;
      }
    };

    // Load messages on component mount
    onMounted(() => {
      loadMessages();
    });

    return () => (
      <div class="container-fluid">
        <div class="row">
          <div class="col-12">
            <div class="d-flex align-items-center mb-4">
              <button 
                class="btn btn-outline-secondary me-3" 
                onClick={goBack}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <ArrowLeftIcon style={{ width: '1rem', height: '1rem' }} />
                Back to Tools
              </button>
              <div class="flex-grow-1">
                <h1 class="mb-0 text-primary">Founder Messages</h1>
                <p class="text-muted mb-0">Create and manage messages from leadership</p>
              </div>
              <button 
                class="btn btn-primary"
                onClick={() => showAddModal.value = true}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                Create New Message
              </button>
            </div>

            <div class="row">
              <div class="col-lg-8">
                <div class="card border-0 shadow-sm">
                  <div class="card-header bg-white">
                    <h5 class="mb-0">All Messages</h5>
                  </div>
                  <div class="card-body">
                    {messages.value.length === 0 ? (
                      <div class="text-center py-5">
                        <UserIcon style={{ width: '4rem', height: '4rem', color: '#dee2e6' }} />
                        <h4 class="text-muted mt-3">No messages yet</h4>
                        <p class="text-muted">Create your first founder message</p>
                      </div>
                    ) : (
                      <div class="row g-4">
                        {paginatedMessages.value.map(message => (
                          <div key={message._id} class="col-12">
                            <div class="card border-0 shadow-sm h-100 position-relative" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '16px', overflow: 'hidden' }}>
                              <div class="position-absolute w-100 h-100" style={{ background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(10px)' }}></div>
                              <div class="card-body position-relative" style={{ zIndex: 2 }}>
                                <div class="d-flex align-items-start">
                                  <div class="flex-shrink-0">
                                    {message.founderImage ? (
                                      <img 
                                        src={message.founderImage} 
                                        alt={message.founderName}
                                        class="rounded-circle border border-3 border-white shadow-sm"
                                        style={{ width: '70px', height: '70px', objectFit: 'cover' }}
                                      />
                                    ) : (
                                      <div class="rounded-circle d-flex align-items-center justify-content-center border border-3 border-white shadow-sm" style={{ width: '70px', height: '70px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                                        <UserIcon style={{ width: '2rem', height: '2rem', color: 'white' }} />
                                      </div>
                                    )}
                                  </div>
                                  <div class="flex-grow-1 ms-4">
                                    <div class="d-flex justify-content-between align-items-start mb-2">
                                      <div>
                                        <h5 class="mb-1 fw-bold" style={{ color: '#2d3748' }}>{message.founderName}</h5>
                                        <p class="mb-2 fw-medium" style={{ color: '#667eea', fontSize: '0.9rem' }}>{message.position}</p>
                                      </div>
                                      <div class="d-flex align-items-center gap-3">
                                        <span class={`badge px-3 py-2 fw-medium ${message.status === 'published' ? 'text-success' : 'text-warning'}`} style={{ background: message.status === 'published' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(251, 191, 36, 0.1)', border: `1px solid ${message.status === 'published' ? 'rgba(34, 197, 94, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`, borderRadius: '8px' }}>
                                          {message.status === 'published' ? '● Published' : '● Draft'}
                                        </span>
                                        <div class="dropdown position-relative">
                                          <button 
                                            class="btn btn-link p-2 text-muted"
                                            onClick={() => toggleDropdown(message._id)}
                                            style={{ borderRadius: '8px' }}
                                          >
                                            <EllipsisVerticalIcon style={{ width: '1.2rem', height: '1.2rem' }} />
                                          </button>
                                          {activeDropdown.value === message._id && (
                                            <div class="dropdown-menu show position-absolute end-0 shadow-lg border-0" style={{ minWidth: '160px', borderRadius: '12px', background: 'white', zIndex: 1000, top: '100%' }}>
                                              <button 
                                                class="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
                                                onClick={() => { openEditModal(message); toggleDropdown(null); }}
                                                disabled={loading.value}
                                                style={{ borderRadius: '8px', margin: '4px' }}
                                              >
                                                <PencilIcon style={{ width: '1rem', height: '1rem', color: '#8b5cf6' }} />
                                                <span class="fw-medium">Edit Message</span>
                                              </button>
                                              <button 
                                                class="dropdown-item d-flex align-items-center gap-2 py-2 px-3"
                                                onClick={() => { toggleStatus(message); toggleDropdown(null); }}
                                                disabled={loading.value}
                                                style={{ borderRadius: '8px', margin: '4px' }}
                                              >
                                                <div style={{ width: '1rem', height: '1rem', borderRadius: '50%', background: message.status === 'published' ? '#f59e0b' : '#10b981' }}></div>
                                                <span class="fw-medium">{message.status === 'published' ? 'Unpublish' : 'Publish'}</span>
                                              </button>
                                              <hr class="dropdown-divider my-1" />
                                              <button 
                                                class="dropdown-item d-flex align-items-center gap-2 py-2 px-3 text-danger"
                                                onClick={() => { deleteMessage(message._id); toggleDropdown(null); }}
                                                disabled={loading.value}
                                                style={{ borderRadius: '8px', margin: '4px' }}
                                              >
                                                <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                                                <span class="fw-medium">Delete</span>
                                              </button>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div class="mb-3 p-3 rounded-3" style={{ background: 'rgba(102, 126, 234, 0.05)', border: '1px solid rgba(102, 126, 234, 0.1)' }}>
                                      <p class="mb-0" style={{ color: '#4a5568', fontSize: '0.95rem', lineHeight: '1.6' }}>
                                        {message.content.length > 180 ? message.content.substring(0, 180) + '...' : message.content}
                                      </p>
                                    </div>
                                    <div class="d-flex justify-content-between align-items-center">
                                      <small class="text-muted d-flex align-items-center gap-1">
                                        <div class="rounded-circle" style={{ width: '6px', height: '6px', background: '#cbd5e0' }}></div>
                                        Created on {new Date(message.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                      </small>
                                      <button 
                                        class="btn btn-sm px-4 py-2 fw-medium"
                                        onClick={() => viewMessage(message)}
                                        disabled={loading.value}
                                        style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '0.85rem' }}
                                      >
                                        Read More
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Pagination */}
                    {messages.value.length > itemsPerPage && (
                      <div class="d-flex justify-content-center mt-4">
                        <nav>
                          <ul class="pagination pagination-sm">
                            <li class={`page-item ${currentPage.value === 1 ? 'disabled' : ''}`}>
                              <button class="page-link" onClick={() => goToPage(currentPage.value - 1)} disabled={currentPage.value === 1}>
                                Previous
                              </button>
                            </li>
                            {Array.from({ length: totalPages.value }, (_, i) => i + 1).map(page => (
                              <li key={page} class={`page-item ${currentPage.value === page ? 'active' : ''}`}>
                                <button class="page-link" onClick={() => goToPage(page)}>
                                  {page}
                                </button>
                              </li>
                            ))}
                            <li class={`page-item ${currentPage.value === totalPages.value ? 'disabled' : ''}`}>
                              <button class="page-link" onClick={() => goToPage(currentPage.value + 1)} disabled={currentPage.value === totalPages.value}>
                                Next
                              </button>
                            </li>
                          </ul>
                        </nav>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div class="col-lg-4">
                {selectedMessage.value ? (
                  <div class="card border-0 shadow-sm">
                    <div class="card-header bg-primary text-white">
                      <h5 class="mb-0">Message Preview</h5>
                    </div>
                    <div class="card-body">
                      {selectedMessage.value.founderImage && (
                        <div class="text-center mb-3">
                          <img 
                            src={selectedMessage.value.founderImage} 
                            alt={selectedMessage.value.founderName}
                            class="rounded-circle"
                            style={{ width: '80px', height: '80px', objectFit: 'cover' }}
                          />
                        </div>
                      )}
                      <h4 class="mb-1 text-center">{selectedMessage.value.founderName}</h4>
                      <p class="text-muted text-center mb-3">{selectedMessage.value.position}</p>
                      <div class="mb-3">
                        <span class={`badge ${selectedMessage.value.status === 'published' ? 'bg-success' : 'bg-warning'}`}>
                          {selectedMessage.value.status}
                        </span>
                        <span class="ms-2 text-muted">
                          {selectedMessage.value.views} views
                        </span>
                      </div>
                      <p class="text-muted">{selectedMessage.value.content}</p>
                      <hr />
                      <small class="text-muted">
                        Created on {new Date(selectedMessage.value.createdAt).toLocaleDateString()}
                      </small>
                    </div>
                  </div>
                ) : (
                  <div class="card border-0 shadow-sm">
                    <div class="card-body text-center py-5">
                      <UserIcon style={{ width: '3rem', height: '3rem', color: '#dee2e6' }} />
                      <h5 class="text-muted mt-3">Select a message</h5>
                      <p class="text-muted">Click on a message to preview it here</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Add Modal */}
            {showAddModal.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div class="modal-dialog modal-lg">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title">Create New Message</h5>
                      <button class="btn-close" onClick={() => showAddModal.value = false}></button>
                    </div>
                    <div class="modal-body">
                      <div class="row">
                        <div class="col-md-6">
                          <div class="mb-3">
                            <label class="form-label">Founder Name</label>
                            <input 
                              type="text" 
                              class="form-control" 
                              v-model={newMessage.value.founderName}
                              placeholder="Enter founder name"
                            />
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div class="mb-3">
                            <label class="form-label">Position</label>
                            <input 
                              type="text" 
                              class="form-control" 
                              v-model={newMessage.value.position}
                              placeholder="Enter position"
                            />
                          </div>
                        </div>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Founder Image</label>
                        <input 
                          type="file" 
                          class="form-control" 
                          accept="image/*"
                          onChange={(e) => newMessage.value.founderImage = e.target.files[0]}
                        />
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Message</label>
                        <textarea 
                          class="form-control" 
                          rows="6"
                          v-model={newMessage.value.content}
                          placeholder="Enter your message content"
                        ></textarea>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" v-model={newMessage.value.status}>
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button class="btn btn-secondary" onClick={() => showAddModal.value = false} disabled={loading.value}>
                        Cancel
                      </button>
                      <button class="btn btn-primary" onClick={addMessage} disabled={loading.value}>
                        {loading.value ? 'Creating...' : 'Create Message'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {/* Edit Modal */}
            {showEditModal.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div class="modal-dialog modal-lg">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title">Edit Message</h5>
                      <button class="btn-close" onClick={() => showEditModal.value = false}></button>
                    </div>
                    <div class="modal-body">
                      <div class="row">
                        <div class="col-md-6">
                          <div class="mb-3">
                            <label class="form-label">Founder Name</label>
                            <input 
                              type="text" 
                              class="form-control" 
                              v-model={editMessage.value.founderName}
                              placeholder="Enter founder name"
                            />
                          </div>
                        </div>
                        <div class="col-md-6">
                          <div class="mb-3">
                            <label class="form-label">Position</label>
                            <input 
                              type="text" 
                              class="form-control" 
                              v-model={editMessage.value.position}
                              placeholder="Enter position"
                            />
                          </div>
                        </div>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Founder Image (Optional)</label>
                        <input 
                          type="file" 
                          class="form-control" 
                          accept="image/*"
                          onChange={(e) => editMessage.value.founderImage = e.target.files[0]}
                        />
                        <small class="text-muted">Leave empty to keep current image</small>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Message</label>
                        <textarea 
                          class="form-control" 
                          rows="6"
                          v-model={editMessage.value.content}
                          placeholder="Enter your message content"
                        ></textarea>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" v-model={editMessage.value.status}>
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button class="btn btn-secondary" onClick={() => showEditModal.value = false} disabled={loading.value}>
                        Cancel
                      </button>
                      <button class="btn btn-primary" onClick={updateMessage} disabled={loading.value}>
                        {loading.value ? 'Updating...' : 'Update Message'}
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