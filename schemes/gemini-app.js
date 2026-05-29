let data = {};

async function init() {
    const res = await fetch('gemini-data.json');
    data = await res.json();
    renderNav();
    renderAll();
}

function renderNav() {
    const nav = document.getElementById('nav');
    const sections = ['链接', '尺寸规范', '快捷复制'];
    nav.innerHTML = sections.map((s, i) =>
        `<a href="#section-${i}" class="${i === 0 ? 'active' : ''}">${s}</a>`
    ).join('');
}

function renderAll() {
    const main = document.getElementById('main');
    main.innerHTML = renderLinks() + renderDimensions() + renderQuickCopy();
}

function renderLinks() {
    return `<section class="section" id="section-0">
        <h2 class="section-title">链接</h2>
        ${data.links.map(cat => `
            <h3 class="section-subtitle">${cat.category}</h3>
            <div class="cards-grid">
                ${(cat.subcategories ? cat.subcategories.flatMap(s => s.items) : cat.items).map(item => {
                    const domain = new URL(item.url).hostname;
                    const favicon = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
                    return `<a href="${item.url}" target="_blank" rel="noopener" class="card">
                        <img src="${favicon}" class="card-icon" alt=""
                             onerror="this.style.display='none'">
                        <div class="card-name">${item.name}</div>
                        <div class="card-desc">${item.desc}</div>
                    </a>`;
                }).join('')}
            </div>
        `).join('')}
    </section>`;
}

function renderDimensions() {
    return `<section class="section" id="section-1">
        <h2 class="section-title">尺寸规范</h2>
        ${data.specs.map(group => `
            <h3 class="section-subtitle">${group.group}</h3>
            <div class="dims-grid">
                ${group.items.map(item => `
                    <div class="dim-item" onclick="copyToClipboard('${item.value}')">
                        <span class="dim-label">${item.label}</span>
                        <code class="dim-value">${item.value}</code>
                    </div>
                `).join('')}
            </div>
        `).join('')}
    </section>`;
}

function renderQuickCopy() {
    return `<section class="section" id="section-2">
        <h2 class="section-title">快捷复制</h2>
        ${data.quickCopy.map(group => `
            <h3 class="section-subtitle">${group.group}</h3>
            <div class="copy-grid">
                ${group.items.map(item => {
                    const isColor = /^#[0-9A-Fa-f]{6}$/.test(item.value);
                    const swatch = isColor ? `<span class="color-swatch" style="background:${item.value}"></span>` : '';
                    return `<div class="copy-item" onclick="copyToClipboard(\`${item.value.replace(/`/g, '\\`')}\`)">
                        <span class="copy-label">${swatch} ${item.label}</span>
                        <span class="copy-value">${item.value}</span>
                        <span class="copy-icon">⌘C</span>
                    </div>`;
                }).join('')}
            </div>
        `).join('')}
    </section>`;
}

function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast(`已复制: ${text.length > 30 ? text.slice(0, 30) + '...' : text}`);
    });
}

function showToast(msg) {
    const toast = document.getElementById('toast');
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2000);
}

// Scroll spy
window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.section');
    const links = document.querySelectorAll('.nav a');
    let current = 0;
    sections.forEach((s, i) => {
        if (window.scrollY >= s.offsetTop - 120) current = i;
    });
    links.forEach((l, i) => l.classList.toggle('active', i === current));
});

init();
