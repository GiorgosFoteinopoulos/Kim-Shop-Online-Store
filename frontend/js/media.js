export function showProductImage(mediaEl, product) {
    if (!product.imageUrl) {
        return;
    }

    const img = document.createElement('img');
    img.src = product.imageUrl;
    img.alt = product.name;
    img.className = 'product-photo';
    img.loading = 'lazy';
    img.decoding =  'async';
    img.referrerPolicy = 'no-referrer';

    img.addEventListener('load', () => mediaEl.classList.add('has-photo'));
    img.addEventListener('error', () => img.remove());

    mediaEl.append(img);
}
