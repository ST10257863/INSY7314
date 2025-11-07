const API = import.meta.env.VITE_API_URL || 'http://localhost:8443';

export async function getCsrf() {
    await fetch(API + '/api/csrf-token', { credentials: 'include' });
}

export async function api(path, options = {}) {
    const opts = {
        credentials: 'include',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': getCookie('XSRF-TOKEN') || ''
        },
        ...options
    };
    return fetch(API + path, opts).then(r => r.json());
}

function getCookie(name) {
    const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    if (match) return decodeURIComponent(match[2]);
}
