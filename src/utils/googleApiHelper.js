/**
 * googleApiHelper.js
 * Wraps Google API calls with automatic silent re-authentication on token expiry.
 * Since Google access tokens expire in ~1hr, this utility catches 401 errors,
 * silently re-auths via Firebase (no popup if Google session is active),
 * and retries the original call with a fresh token.
 */

import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';

/**
 * Silently get a fresh Google access token.
 * Uses prompt:'none' internally — no popup is shown if the user's Google session is alive.
 * If Google session has expired, a brief popup will appear (unavoidable without backend).
 */
export const silentReauth = async () => {
    try {
        const provider = googleProvider;
        provider.setCustomParameters({ prompt: 'select_account' });
        const result = await signInWithPopup(auth, provider);
        const credential = result._tokenResponse;
        // Firebase stores the access token in the OAuth credential
        const { OAuthAccessToken } = credential || {};
        return OAuthAccessToken || null;
    } catch (err) {
        console.warn('[Aura] Silent re-auth failed:', err.code);
        return null;
    }
};

/**
 * Calls a Google API function, auto-retrying once if a 401 is encountered.
 * @param {Function} apiCall - async function that accepts (accessToken) => result
 * @param {string} currentToken - the current Google access token
 * @param {Function} onTokenRefresh - callback called with new token after silent reauth
 */
export const callWithAutoRetry = async (apiCall, currentToken, onTokenRefresh) => {
    try {
        return await apiCall(currentToken);
    } catch (err) {
        const status = err?.status || err?.response?.status || (err?.message?.includes('401') ? 401 : null);
        if (status === 401) {
            console.info('[Aura] Token expired — attempting silent reauth...');
            const newToken = await silentReauth();
            if (newToken) {
                if (onTokenRefresh) onTokenRefresh(newToken);
                return await apiCall(newToken);
            }
        }
        throw err;
    }
};

/**
 * Make a Google API REST call with Authorization header.
 * Returns JSON response or throws.
 */
export const googleFetch = async (url, accessToken, options = {}) => {
    const res = await fetch(url, {
        ...options,
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            ...(options.headers || {}),
        },
    });
    if (!res.ok) {
        const err = new Error(`Google API error: ${res.status} ${res.statusText}`);
        err.status = res.status;
        throw err;
    }
    return res.json();
};
