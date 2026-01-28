import { ref, onMounted } from 'vue';
import { useAuth } from '../../store/auth.js';

export default {
  name: 'MobileUserProfile',
  setup() {
    const { user, fetchCurrentUser } = useAuth();
    const loading = ref(false);
    const error = ref('');

    onMounted(async () => {
      loading.value = true;
      error.value = '';
      try {
        await fetchCurrentUser('user');
      } catch (e) {
        console.error('[MobileUserProfile] Failed to load user profile:', e);
        error.value = e.message || 'Failed to load profile';
      } finally {
        loading.value = false;
      }
    });

    const getProfileImageUrl = () => {
      if (!user.value) return null;
      // Prefer presigned URL if present
      return user.value.profileImageUrl || user.value.profileImage || null;
    };

    return () => {
      const imageUrl = getProfileImageUrl();

      return (
        <div class="mobile-profile">
          <div class="profile-container">
            <h1 class="profile-title">My Profile</h1>

            {loading.value && <div class="loading-state">Loading profile...</div>}
            {error.value && <div class="error-state">{error.value}</div>}

            {!loading.value && !error.value && user.value && (
              <div class="profile-content">
                {imageUrl && (
                  <div class="profile-image-container">
                    <img
                      src={imageUrl}
                      alt="Profile"
                      class="profile-image"
                    />
                  </div>
                )}
                
                <div class="info-section">
                  <h3 class="section-title">Basic Information</h3>
                  <div class="info-item">
                    <span class="info-label">Email:</span>
                    <span class="info-value">{user.value.email}</span>
                    {user.value.emailVerified && (
                      <span class="verified-badge">✓ Verified</span>
                    )}
                  </div>
                  {user.value.mobile && (
                    <div class="info-item">
                      <span class="info-label">Mobile:</span>
                      <span class="info-value">{user.value.mobile}</span>
                      {user.value.mobileVerified && (
                        <span class="verified-badge">✓ Verified</span>
                      )}
                    </div>
                  )}
                  {user.value.profile && user.value.profile.name && (
                    <div class="info-item">
                      <span class="info-label">Full Name:</span>
                      <span class="info-value">{user.value.profile.name}</span>
                    </div>
                  )}
                  {user.value.name && !user.value.profile?.name && (
                    <div class="info-item">
                      <span class="info-label">Name:</span>
                      <span class="info-value">{user.value.name}</span>
                    </div>
                  )}
                </div>

                {user.value.profile && (
                  <div class="info-section">
                    <h3 class="section-title">Profile Details</h3>
                    {user.value.profile.dob && (
                      <div class="info-item">
                        <span class="info-label">Date of Birth:</span>
                        <span class="info-value">
                          {new Date(user.value.profile.dob).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                    )}
                    {user.value.profile.timeOfBirth && (
                      <div class="info-item">
                        <span class="info-label">Time of Birth:</span>
                        <span class="info-value">{user.value.profile.timeOfBirth}</span>
                      </div>
                    )}
                    {user.value.profile.placeOfBirth && (
                      <div class="info-item">
                        <span class="info-label">Place of Birth:</span>
                        <span class="info-value">{user.value.profile.placeOfBirth}</span>
                      </div>
                    )}
                    {user.value.profile.gowthra && (
                      <div class="info-item">
                        <span class="info-label">Gowthra:</span>
                        <span class="info-value">{user.value.profile.gowthra}</span>
                      </div>
                    )}
                    {user.value.profile.profession && (
                      <div class="info-item">
                        <span class="info-label">Profession:</span>
                        <span class="info-value profession">{user.value.profile.profession.replace(/([A-Z])/g, ' $1').trim()}</span>
                      </div>
                    )}
                  </div>
                )}

                <div class="info-section">
                  <h3 class="section-title">Account Information</h3>
                  <div class="info-item">
                    <span class="info-label">Role:</span>
                    <span class="info-value role">{user.value.role || 'user'}</span>
                  </div>
                  {user.value.registrationStep !== undefined && (
                    <div class="info-item">
                      <span class="info-label">Registration Status:</span>
                      <span class={`info-value status-${user.value.registrationStep === 3 ? 'complete' : user.value.registrationStep >= 1 ? 'partial' : 'incomplete'}`}>
                        {user.value.registrationStep === 3 ? (
                          '✓ Completed'
                        ) : user.value.registrationStep === 2 ? (
                          'Mobile Verified'
                        ) : user.value.registrationStep === 1 ? (
                          'Email Verified'
                        ) : (
                          'Incomplete'
                        )}
                      </span>
                    </div>
                  )}
                  {user.value.isActive !== undefined && (
                    <div class="info-item">
                      <span class="info-label">Account Status:</span>
                      <span class={`info-value ${user.value.isActive ? 'status-active' : 'status-inactive'}`}>
                        {user.value.isActive ? '✓ Active' : '✗ Inactive'}
                      </span>
                    </div>
                  )}
                  {user.value.createdAt && (
                    <div class="info-item">
                      <span class="info-label">Member Since:</span>
                      <span class="info-value">
                        {new Date(user.value.createdAt).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <style>{`
            .mobile-profile {
              padding: 1rem;
              min-height: 100vh;
              background: #f8fafc;
            }
            
            .profile-container {
              max-width: 600px;
              margin: 0 auto;
            }
            
            .profile-title {
              font-size: 1.5rem;
              font-weight: 600;
              color: #1e293b;
              text-align: center;
              margin-bottom: 2rem;
            }
            
            .loading-state, .error-state {
              text-align: center;
              padding: 2rem;
              border-radius: 12px;
              margin-bottom: 1rem;
            }
            
            .loading-state {
              background: white;
              color: #64748b;
            }
            
            .error-state {
              background: #fef2f2;
              color: #dc2626;
              border: 1px solid #fecaca;
            }
            
            .profile-content {
              display: flex;
              flex-direction: column;
              gap: 1.5rem;
            }
            
            .profile-image-container {
              text-align: center;
              margin-bottom: 1rem;
            }
            
            .profile-image {
              width: 120px;
              height: 120px;
              border-radius: 50%;
              object-fit: cover;
              border: 3px solid #3b82f6;
              box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
            }
            
            .info-section {
              background: white;
              border-radius: 12px;
              padding: 1.5rem;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .section-title {
              font-size: 1.1rem;
              font-weight: 600;
              color: #1e293b;
              margin-bottom: 1rem;
              padding-bottom: 0.5rem;
              border-bottom: 2px solid #f1f5f9;
            }
            
            .info-item {
              display: flex;
              flex-direction: column;
              margin-bottom: 1rem;
              gap: 0.25rem;
            }
            
            .info-item:last-child {
              margin-bottom: 0;
            }
            
            .info-label {
              font-size: 0.85rem;
              font-weight: 500;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            
            .info-value {
              font-size: 0.95rem;
              color: #1e293b;
              font-weight: 500;
            }
            
            .info-value.profession,
            .info-value.role {
              text-transform: capitalize;
            }
            
            .verified-badge {
              font-size: 0.75rem;
              color: #059669;
              font-weight: 600;
              margin-top: 0.25rem;
            }
            
            .status-complete {
              color: #059669 !important;
              font-weight: 600;
            }
            
            .status-partial {
              color: #d97706 !important;
              font-weight: 600;
            }
            
            .status-incomplete {
              color: #dc2626 !important;
              font-weight: 600;
            }
            
            .status-active {
              color: #059669 !important;
              font-weight: 600;
            }
            
            .status-inactive {
              color: #dc2626 !important;
              font-weight: 600;
            }
            
            @media (max-width: 768px) {
              .mobile-profile {
                padding: 0.75rem;
              }
              
              .profile-title {
                font-size: 1.25rem;
                margin-bottom: 1.5rem;
              }
              
              .profile-image {
                width: 100px;
                height: 100px;
              }
              
              .info-section {
                padding: 1.25rem;
              }
              
              .section-title {
                font-size: 1rem;
              }
            }
            
            @media (max-width: 480px) {
              .mobile-profile {
                padding: 0.5rem;
              }
              
              .profile-title {
                font-size: 1.1rem;
                margin-bottom: 1rem;
              }
              
              .profile-image {
                width: 80px;
                height: 80px;
              }
              
              .info-section {
                padding: 1rem;
              }
              
              .section-title {
                font-size: 0.95rem;
              }
              
              .info-label {
                font-size: 0.8rem;
              }
              
              .info-value {
                font-size: 0.9rem;
              }
            }
          `}</style>
        </div>
      );
    };
  }
};


