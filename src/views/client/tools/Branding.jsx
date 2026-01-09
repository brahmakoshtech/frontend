import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ArrowLeftIcon, PlusIcon, PhotoIcon, TrashIcon, EyeIcon } from '@heroicons/vue/24/outline';

export default {
  name: 'ClientBranding',
  setup() {
    const router = useRouter();
    const brandAssets = ref([
      {
        id: 1,
        name: 'Company Logo',
        type: 'logo',
        format: 'PNG',
        size: '2.5 MB',
        url: 'https://via.placeholder.com/200x100',
        uploadDate: '2024-01-15'
      },
      {
        id: 2,
        name: 'Brand Colors',
        type: 'colors',
        format: 'PDF',
        size: '1.2 MB',
        url: 'https://via.placeholder.com/200x100',
        uploadDate: '2024-01-10'
      }
    ]);

    const showUploadModal = ref(false);
    const selectedAsset = ref(null);

    const goBack = () => {
      router.push('/client/tools');
    };

    const deleteAsset = (id) => {
      brandAssets.value = brandAssets.value.filter(asset => asset.id !== id);
    };

    const viewAsset = (asset) => {
      selectedAsset.value = asset;
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
                <h1 class="mb-0 text-primary">Brand Management</h1>
                <p class="text-muted mb-0">Manage your brand assets and guidelines</p>
              </div>
              <button 
                class="btn btn-primary"
                onClick={() => showUploadModal.value = true}
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <PlusIcon style={{ width: '1rem', height: '1rem' }} />
                Upload Asset
              </button>
            </div>

            <div class="row g-4">
              {brandAssets.value.map(asset => (
                <div key={asset.id} class="col-lg-3 col-md-4 col-sm-6">
                  <div class="card border-0 shadow-sm h-100">
                    <div class="card-img-top bg-light d-flex align-items-center justify-content-center" style={{ height: '150px' }}>
                      <img src={asset.url} alt={asset.name} class="img-fluid" style={{ maxHeight: '120px' }} />
                    </div>
                    <div class="card-body">
                      <h6 class="card-title">{asset.name}</h6>
                      <div class="d-flex justify-content-between text-muted small mb-2">
                        <span>{asset.format}</span>
                        <span>{asset.size}</span>
                      </div>
                      <p class="text-muted small">Uploaded: {new Date(asset.uploadDate).toLocaleDateString()}</p>
                      <div class="btn-group w-100">
                        <button class="btn btn-outline-primary btn-sm" onClick={() => viewAsset(asset)}>
                          <EyeIcon style={{ width: '1rem', height: '1rem' }} />
                        </button>
                        <button class="btn btn-outline-danger btn-sm" onClick={() => deleteAsset(asset.id)}>
                          <TrashIcon style={{ width: '1rem', height: '1rem' }} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {brandAssets.value.length === 0 && (
                <div class="col-12">
                  <div class="text-center py-5">
                    <PhotoIcon style={{ width: '4rem', height: '4rem', color: '#dee2e6' }} />
                    <h4 class="text-muted mt-3">No brand assets yet</h4>
                    <p class="text-muted">Upload your first brand asset</p>
                    <button class="btn btn-primary" onClick={() => showUploadModal.value = true}>
                      Upload Asset
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Upload Modal */}
            {showUploadModal.value && (
              <div class="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <div class="modal-dialog">
                  <div class="modal-content">
                    <div class="modal-header">
                      <h5 class="modal-title">Upload Brand Asset</h5>
                      <button class="btn-close" onClick={() => showUploadModal.value = false}></button>
                    </div>
                    <div class="modal-body">
                      <div class="mb-3">
                        <label class="form-label">Asset Name</label>
                        <input type="text" class="form-control" placeholder="Enter asset name" />
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Asset Type</label>
                        <select class="form-select">
                          <option>Logo</option>
                          <option>Colors</option>
                          <option>Typography</option>
                          <option>Guidelines</option>
                        </select>
                      </div>
                      <div class="mb-3">
                        <label class="form-label">Upload File</label>
                        <input type="file" class="form-control" accept="image/*,.pdf" />
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button class="btn btn-secondary" onClick={() => showUploadModal.value = false}>Cancel</button>
                      <button class="btn btn-primary">Upload Asset</button>
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