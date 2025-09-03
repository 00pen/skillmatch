// Local PostgreSQL database helpers as alternative to Supabase
import axios from 'axios';

// Simple local database API wrapper
class LocalDatabase {
  constructor() {
    this.baseURL = '/api/db'; // Will need backend API
    this.isLocal = true;
  }

  // Auth methods
  async signUp(email, password, userData) {
    // For local database, we'll simulate auth
    try {
      const response = await axios.post(`${this.baseURL}/auth/signup`, {
        email,
        password,
        userData
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.response?.data?.error || error.message };
    }
  }

  async signIn(email, password) {
    try {
      const response = await axios.post(`${this.baseURL}/auth/signin`, {
        email,
        password
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.response?.data?.error || error.message };
    }
  }

  async signOut() {
    try {
      await axios.post(`${this.baseURL}/auth/signout`);
      return { error: null };
    } catch (error) {
      return { error: error.response?.data?.error || error.message };
    }
  }

  // Database operations
  async createUserProfile(userId, profileData) {
    try {
      const response = await axios.post(`${this.baseURL}/user-profiles`, {
        user_id: userId,
        ...profileData
      });
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.response?.data?.error || error.message };
    }
  }

  async getUserProfile(userId) {
    try {
      const response = await axios.get(`${this.baseURL}/user-profiles/${userId}`);
      return { data: response.data, error: null };
    } catch (error) {
      return { data: null, error: error.response?.data?.error || error.message };
    }
  }

  // Add other CRUD methods as needed
}

// Simple mock auth for development (until backend API is ready)
class MockAuth {
  constructor() {
    this.users = JSON.parse(localStorage.getItem('mockUsers') || '[]');
    this.currentUser = JSON.parse(localStorage.getItem('mockCurrentUser') || 'null');
    this.profiles = JSON.parse(localStorage.getItem('mockProfiles') || '[]');
  }

  async signUp(email, password, userData) {
    // Check if user already exists
    if (this.users.find(u => u.email === email)) {
      return { data: null, error: { message: 'User already exists' } };
    }

    // Create new user
    const newUser = {
      id: `user_${Date.now()}`,
      email,
      created_at: new Date().toISOString()
    };

    // Create user profile
    const newProfile = {
      id: `profile_${Date.now()}`,
      user_id: newUser.id,
      full_name: userData.fullName || '',
      role: userData.role || 'job-seeker',
      location: userData.location || '',
      current_job_title: userData.currentJobTitle || '',
      company_name: userData.companyName || '',
      industry: userData.industry || '',
      created_at: new Date().toISOString()
    };

    // Save to localStorage
    this.users.push(newUser);
    this.profiles.push(newProfile);
    localStorage.setItem('mockUsers', JSON.stringify(this.users));
    localStorage.setItem('mockProfiles', JSON.stringify(this.profiles));

    return { 
      data: { 
        user: newUser,
        session: { user: newUser }
      }, 
      error: null 
    };
  }

  async signIn(email, password) {
    const user = this.users.find(u => u.email === email);
    if (!user) {
      return { data: null, error: { message: 'Invalid login credentials' } };
    }

    // Set current user
    this.currentUser = user;
    localStorage.setItem('mockCurrentUser', JSON.stringify(user));

    return { 
      data: { 
        user,
        session: { user }
      }, 
      error: null 
    };
  }

  async signOut() {
    this.currentUser = null;
    localStorage.removeItem('mockCurrentUser');
    return { error: null };
  }

  async getCurrentUser() {
    return { user: this.currentUser, error: null };
  }

  onAuthStateChange(callback) {
    // Simple implementation - just call immediately with current state
    if (this.currentUser) {
      callback('SIGNED_IN', { user: this.currentUser });
    } else {
      callback('SIGNED_OUT', null);
    }
    
    // Return subscription object
    return {
      data: {
        subscription: {
          unsubscribe: () => {}
        }
      }
    };
  }

  // Profile methods
  async createUserProfile(userId, profileData) {
    const newProfile = {
      id: `profile_${Date.now()}`,
      user_id: userId,
      ...profileData,
      created_at: new Date().toISOString()
    };

    this.profiles.push(newProfile);
    localStorage.setItem('mockProfiles', JSON.stringify(this.profiles));
    
    return { data: newProfile, error: null };
  }

  async getUserProfile(userId) {
    const profile = this.profiles.find(p => p.user_id === userId);
    if (!profile) {
      return { data: null, error: { code: 'PGRST116', message: 'Profile not found' } };
    }
    return { data: profile, error: null };
  }

  async updateUserProfile(userId, updates) {
    const profileIndex = this.profiles.findIndex(p => p.user_id === userId);
    if (profileIndex === -1) {
      return { data: null, error: { message: 'Profile not found' } };
    }

    this.profiles[profileIndex] = {
      ...this.profiles[profileIndex],
      ...updates,
      updated_at: new Date().toISOString()
    };

    localStorage.setItem('mockProfiles', JSON.stringify(this.profiles));
    return { data: this.profiles[profileIndex], error: null };
  }

  async deleteUserAccount(userId) {
    // Remove user and profile
    this.users = this.users.filter(u => u.id !== userId);
    this.profiles = this.profiles.filter(p => p.user_id !== userId);
    
    localStorage.setItem('mockUsers', JSON.stringify(this.users));
    localStorage.setItem('mockProfiles', JSON.stringify(this.profiles));
    
    return { error: null };
  }
}

export const mockAuth = new MockAuth();
export const localDB = new LocalDatabase();