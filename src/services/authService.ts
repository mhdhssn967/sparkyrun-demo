import { API_BASE_URL } from '../config/api';

export interface PlayerProfile {
  id: string;
  name: string;
  phone: string;
  age?: number | null;
  email?: string;
  createdAt?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: PlayerProfile;
  exists?: boolean;
  error?: string;
  message?: string;
}

/**
 * 1. Check if a mobile number is already registered
 */
export async function checkMobileNumber(phone: string): Promise<AuthResponse> {
  const cleanPhone = phone.trim().replace(/\D/g, '');
  try {
    const res = await fetch(`${API_BASE_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ phone: cleanPhone }),
    });
    return await res.json();
  } catch (error) {
    console.error('Failed to check mobile number:', error);
    return { success: false, error: 'Connection to server failed' };
  }
}

/**
 * 2. Register Player with Mobile Number and Name (Stored into PostgreSQL via Better Auth User Schema)
 */
export async function registerPlayer(phone: string, name: string): Promise<AuthResponse> {
  const cleanPhone = phone.trim().replace(/\D/g, '');
  try {
    const res = await fetch(`${API_BASE_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ phone: cleanPhone, name: name.trim() }),
    });
    const data: AuthResponse = await res.json();

    if (data.success && data.user) {
      // Persist authenticated user session locally
      localStorage.setItem('gf_player_session', JSON.stringify(data.user));
    }
    return data;
  } catch (error) {
    console.error('Registration failed:', error);
    return { success: false, error: 'Failed to complete registration' };
  }
}

/**
 * 3. Retrieve currently stored session (if any)
 */
export function getSavedPlayer(): PlayerProfile | null {
  try {
    const stored = localStorage.getItem('gf_player_session');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * 4. Verify Brand-Isolated QR Token (Popular Electricals)
 */
export async function verifyQrToken(tokenCode: string, brandSlug: string = 'popular') {
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/token/verify?token=${encodeURIComponent(tokenCode)}&brand=${encodeURIComponent(brandSlug)}`,
      {
        method: 'GET',
        credentials: 'include',
      }
    );
    return await res.json();
  } catch (error) {
    console.error('Token verification error:', error);
    return { valid: false, error: 'Failed to verify QR token' };
  }
}
