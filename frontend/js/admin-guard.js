import { getUser, onAuthChange } from './auth.js';
import { redirectToLogin } from './nav.js';

export function isAdmin() {
    return getUser()?.role === 'ADMIN';
}

export function requireAdmin() {
    if (!getUser()) {
        redirectToLogin();
        return false;
    }
    if (!isAdmin()) {
        location.replace('index.html');
        return false;
    }

    onAuthChange(() => {
        if (!getUser()) {
            redirectToLogin();
        } else if (!isAdmin) {
            location.replace('index.html');
        }
    });
    return true;
}