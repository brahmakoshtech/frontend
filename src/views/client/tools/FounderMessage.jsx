import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, PlusIcon, EyeIcon, PencilIcon, TrashIcon, UserIcon } from '@heroicons/vue/24/outline';

export default {
  name: 'ClientFounderMessage',
  setup() {
    const router = useRouter();
    const messages = ref([
      {
        id: 1,
        title: 'Welcome to Our Company',
        content: 'Dear valued customers, I am excited to welcome you to our growing family. Our commitment to excellence drives everything we do.',
        status: 'published',
        createdAt: '2024-01-15',
        views: 1250
      },
      {
        id: 2,
        title: 'Our Vision for 2024',
        content: 'As we step into 2024, I want to share our vision for the future and how we plan to serve you better.',
        status: 'draft',
        createdAt: '2024-01-10',
        views: 0
      }
    ]);

    const showAddModal = ref(false);
    const selectedMessage = ref(null);
    const newMessage = ref({
      title: '',
      content: '',
      status: 'draft'
    });

    const goBack = () => {
      router.push('/client/tools');
    };

    const addMessage = () => {
      messages.value.push({
        id: Date.now(),
        ...newMessage.value,
        createdAt: new Date().toISOString().split('T')[0],
        views: 0
      });
      newMessage.value = { title: '', content: '', status: 'draft' };
      showAddModal.value = false;
    };

    const deleteMessage = (id) => {
      messages.value = messages.value.filter(m => m.id !== id);
    };

    const toggleStatus = (message) => {
      message.status = message.status === 'published' ? 'draft' : 'published';
    };

    const viewMessage = (message) => {
      selectedMessage.value = message;
      if (message.status === 'published') {
        message.views++;
      }
    };

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
                  <div class="card-body p-0">
                    {messages.value.length === 0 ? (
                      <div class="text-center py-5">
                        <UserIcon style={{ width: '4rem', height: '4rem', color: '#dee2e6' }} />
                        <h4 class="text-muted mt-3">No messages yet</h4>
                        <p class="text-muted">Create your first founder message</p>
                      </div>
                    ) : (
                      <div class="table-responsive">
                        <table class="table table-hover mb-0">
                          <thead class="table-light">
                            <tr>
                              <th>Title</th>
                              <th>Status</th>
                              <th>Views</th>
                              <th>Created</th>
                              <th>Actions</th>
                            </tr>
                          </thead>
                          <tbody>
                            {messages.value.map(message => (
                              <tr key={message.id}>
                                <td>
                                  <div>
                                    <h6 class="mb-1">{message.title}</h6>
                                    <small class="text-muted">
                                      {message.content.substring(0, 60)}...
                                    </small>
                                  </div>
                                </td>
                                <td>
                                  <span class={`badge ${message.status === 'published' ? 'bg-success' : 'bg-warning'}`}>
                                    {message.status}
                                  </span>
                                </td>
                                <td>{message.views}</td>
                                <td>{new Date(message.createdAt).toLocaleDateString()}</td>
                                <td>
                                  <div class="btn-group btn-group-sm">
                                    <button 
                                      class="btn btn-outline-primary"
                                      onClick={() => viewMessage(message)}
                                    >
                                      <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                                    </button>
                                    <button 
                                      class="btn btn-outline-secondary"
                                      onClick={() => toggleStatus(message)}
                                    >
                                      {message.status === 'published' ? 'Unpublish' : 'Publish'}
                                    </button>
                                    <button 
                                      class="btn btn-outline-danger"
                                      onClick={() => deleteMessage(message.id)}
                                    >
                                      <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
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
                      <h4 class="mb-3">{selectedMessage.value.title}</h4>
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
                      <div class="mb-3">
                        <label class="form-label">Message Title</label>
                        <input 
                          type="text" 
                          class="form-control" 
                          v-model={newMessage.value.title}
                          placeholder="Enter message title"
                        />
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Status</label>
                        <select class="form-select" v-model={newMessage.value.status}>
                          <option value="draft">Draft</option>
                          <option value="published">Published</option>
                        </select>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Message Content</label>
                        <textarea 
                          class="form-control" 
                          rows="8"
                          v-model={newMessage.value.content}
                          placeholder="Write your founder message here..."
                        ></textarea>
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button class="btn btn-secondary" onClick={() => showAddModal.value = false}>Cancel</button>
                      <button class="btn btn-primary" onClick={addMessage}>Create Message</button>
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