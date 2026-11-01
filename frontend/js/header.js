import { getUser, clearSession, onAuthChange } from './auth.js';
import { cartCount, onCartChange } from './cart.js';
import { loginUrl } from './nav.js';

const badge = document.querySelector('#cart-count');

function updateBadge() {
    const count = cartCount();
    badge.textContent = count;
    badge.hidden = count === 0;
}

updateBadge();
onCartChange(updateBadge);
window.addEventListener('pageshow', updateBadge);

const currentPage = location.pathname.split('/').pop() || 'index.html';
const AUTH_PAGES = ['login.html', 'register.html'];

const accountArea = document.createElement('div');
accountArea.className = 'account-area';
document.querySelector('.cart-link').before(accountArea);

function renderAccount() {
    accountArea.replaceChildren();

    const user = getUser();
    if (user) {
        const items = [];
    
        const greeting = document.createElement('span');
        greeting.className = 'account-greeting';
        greeting.textContent = `Hi, ${firstName(user.fullName)}`;
        items.push(greeting);

        if (user.role === 'ADMIN') {
           const manageLink = document.createElement('a');
           manageLink.href = 'admin-products.html';
           manageLink.className = 'account-cta';
           manageLink.textContent = 'Admin Dashboard';
           if (currentPage.startsWith('admin-')) {
            manageLink.setAttribute('aria-current', 'page');
           }
           items.push(manageLink);
        }

        items.push(navLink('my-orders.html', 'My orders', currentPage === 'my-orders.html'));

        const logoutButton = document.createElement('button');
        logoutButton.type = 'button';
        logoutButton.className = 'account-link';
        logoutButton.textContent = 'Log out';
        logoutButton.addEventListener('click', () => {
            clearSession();
            location.href = 'index.html';
        });
        items.push(logoutButton);

        accountArea.append(...items);
    } else if (!AUTH_PAGES.includes(currentPage)) {
        const loginLink = document.createElement('a');
        loginLink.href = loginUrl();
        loginLink.className = 'account-link';
        loginLink.textContent = 'Log in';

        accountArea.append(loginLink);
    }
}

function navLink(href, text, isCurrent) {
    const link = document.createElement('a');
    link.href = href;
    link.className = 'account-nav';
    link.textContent = text;
    if (isCurrent) {
        link.setAttribute('aria-current', 'page');
    }
    return link;
}

function firstName(fullname) {
    return fullname.trim().split(' ')[0];
}

renderAccount();
onAuthChange(renderAccount);
window.addEventListener('pageshow', renderAccount);

if (HTMLScriptElement.supports?.('speculationrules')) {
    const rules = document.createElement('script');
    rules.type = 'speculationrules';
    rules.textContent = JSON.stringify({
        prefetch: [{
            where: { href_matches: '/*' },
            eagerness: 'moderate',
        }],
    });
    document.head.append(rules);
}