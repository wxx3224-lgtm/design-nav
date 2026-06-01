const STORAGE_KEY = 'designkit_data';
let data = {};
let editMode = false;

async function init() {
    try {
        localStorage.removeItem('designkit_full_data');
        localStorage.removeItem('designkit_user_cards');

        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored);
                if (parsed.links && Array.isArray(parsed.links)) {
                    data = parsed;
                } else {
                    throw new Error('invalid');
                }
            } catch(e) {
                localStorage.removeItem(STORAGE_KEY);
                const res = await fetch('data.json');
                data = await res.json();
                saveData();
            }
        } else {
            const res = await fetch('data.json');
            data = await res.json();
            saveData();
        }
        render();
    } catch (err) {
        document.getElementById('main').innerHTML = `<div class="error-state"><p>数据加载失败</p><p style="margin-top:0.5rem;font-size:0.8rem;">${err.message || '请检查网络连接后刷新页面'}</p></div>`;
    } finally {
        const loading = document.getElementById('loading');
        if (loading) { loading.classList.add('hidden'); setTimeout(() => loading.remove(), 300); }
    }
}

function saveData() { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }
function render() { renderNav(); renderMain(); }

// ---- Nav ----
function renderNav() {
    const nav = document.getElementById('nav');
    const sections = ['常用网站', '尺寸规范', '快捷复制'];
    nav.innerHTML = sections.map((s, i) =>
        `<a href="#section-${i}" class="${i === 0 ? 'active' : ''}" onclick="smoothScroll(event,'section-${i}')">${s}</a>`
    ).join('');
}

// ---- Main ----
function renderMain() {
    const main = document.getElementById('main');
    main.innerHTML = renderLinks() + renderSpecs() + renderCopy();
}

// ---- Links ----
function renderLinks() {
    let html = `<section class="section" id="section-0"><h2 class="section-title">常用网站</h2>`;
    data.links.forEach((cat, ci) => {
        html += `<div class="cat-section" data-cat-idx="${ci}">`;
        if (cat.subcategories) {
            cat.subcategories.forEach((sub, si) => {
                html += renderSubtitle(`${cat.category} · ${sub.name}`, ci, si);
                html += `<div class="cards-grid" data-cat="${ci}" data-sub="${si}">`;
                sub.items.forEach((item, ii) => { html += renderCard(item, ci, si, ii); });
                html += `<div class="card-add" onclick="openAddCard(${ci},${si})">+ 新增链接</div></div>`;
            });
        } else {
            html += renderSubtitle(cat.category, ci, null);
            html += `<div class="cards-grid" data-cat="${ci}">`;
            (cat.items || []).forEach((item, ii) => { html += renderCard(item, ci, null, ii); });
            html += `<div class="card-add" onclick="openAddCard(${ci},null)">+ 新增链接</div></div>`;
        }
        html += `</div>`;
    });
    html += `<button class="add-category-btn" onclick="addCategory()">+ 新增分类</button>`;
    html += `</section>`;
    return html;
}

function renderSubtitle(text, ci, si) {
    const idx = String(ci + 1).padStart(2, '0');
    const displayText = si === null ? `${idx} / ${text}` : text;
    return `<h3 class="section-subtitle">
        <span>${displayText}</span>
        <span class="subtitle-actions">
            <button class="subtitle-btn" onclick="renameCat(${ci},${si === null ? 'null' : si})" title="重命名">✏️</button>
            <button class="subtitle-btn" onclick="deleteCat(${ci},${si === null ? 'null' : si})" title="删除">🗑️</button>
        </span>
    </h3>`;
}

function renderCard(item, ci, si, ii) {
    const domain = (() => { try { return new URL(item.url).hostname; } catch(e) { return ''; } })();
    const favicon = domain ? `https://favicon.im/${domain}` : '';
    return `<a href="${item.url}" target="_blank" rel="noopener" class="card" draggable="true" data-ci="${ci}" data-si="${si !== null ? si : ''}" data-ii="${ii}">
        ${favicon ? `<img src="${favicon}" class="card-icon" alt="" onerror="this.style.display='none'">` : ''}
        <div class="card-name">${item.name}</div>
        <div class="card-desc">${item.desc || ''}</div>
        <div class="card-edit-controls">
            <button class="card-edit-btn" onclick="event.preventDefault();event.stopPropagation();editCard(${ci},${si === null ? 'null' : si},${ii})">✎</button>
            <button class="card-edit-btn del" onclick="event.preventDefault();event.stopPropagation();deleteCard(${ci},${si === null ? 'null' : si},${ii})">✕</button>
        </div>
    </a>`;
}

// ---- Specs ----
function renderSpecs() {
    let html = `<section class="section" id="section-1"><h2 class="section-title">尺寸规范</h2>`;
    data.specs.forEach((group, gi) => {
        html += `<h3 class="section-subtitle"><span>${group.group}</span>
            <span class="subtitle-actions">
                <button class="subtitle-btn" onclick="renameGroup('specs',${gi})" title="重命名">✏️</button>
                <button class="subtitle-btn" onclick="deleteGroup('specs',${gi})" title="删除">🗑️</button>
            </span></h3>`;
        html += `<div class="dims-grid">`;
        group.items.forEach((item, ii) => {
            html += `<div class="dim-item" onclick="copyToClipboard('${item.value}')">
                <span class="dim-label">${item.label}</span>
                <code class="dim-value">${item.value}</code>
                <div class="item-edit-controls">
                    <button class="card-edit-btn" onclick="event.stopPropagation();editItem('specs',${gi},${ii})">✎</button>
                    <button class="card-edit-btn del" onclick="event.stopPropagation();deleteItem('specs',${gi},${ii})">✕</button>
                </div>
            </div>`;
        });
        html += `</div><div class="item-add" onclick="openAddItem('specs',${gi})">+ 新增规范</div>`;
    });
    html += `<button class="add-category-btn" onclick="addGroup('specs')">+ 新增分组</button></section>`;
    return html;
}

// ---- Copy ----
function renderCopy() {
    let html = `<section class="section" id="section-2"><h2 class="section-title">快捷复制</h2>`;
    data.quickCopy.forEach((group, gi) => {
        html += `<h3 class="section-subtitle"><span>${group.group}</span>
            <span class="subtitle-actions">
                <button class="subtitle-btn" onclick="renameGroup('quickCopy',${gi})" title="重命名">✏️</button>
                <button class="subtitle-btn" onclick="deleteGroup('quickCopy',${gi})" title="删除">🗑️</button>
            </span></h3>`;
        html += `<div class="copy-grid">`;
        group.items.forEach((item, ii) => {
            const isColor = /^#[0-9A-Fa-f]{3,8}$/.test(item.value);
            const swatch = isColor ? `<span class="color-swatch" style="background:${item.value}"></span>` : '';
            html += `<div class="copy-item" onclick="copyToClipboard(\`${item.value.replace(/`/g,'\\`')}\`)">
                <span class="copy-label">${swatch} ${item.label}</span>
                <span class="copy-value">${item.value}</span>
                <span class="copy-icon">⌘C</span>
                <div class="item-edit-controls">
                    <button class="card-edit-btn" onclick="event.stopPropagation();editItem('quickCopy',${gi},${ii})">✎</button>
                    <button class="card-edit-btn del" onclick="event.stopPropagation();deleteItem('quickCopy',${gi},${ii})">✕</button>
                </div>
            </div>`;
        });
        html += `</div><div class="item-add" onclick="openAddItem('quickCopy',${gi})">+ 新增复制项</div>`;
    });
    html += `<button class="add-category-btn" onclick="addGroup('quickCopy')">+ 新增分组</button></section>`;
    return html;
}

// ---- Edit Mode ----
function toggleEditMode() {
    editMode = !editMode;
    document.body.classList.toggle('edit-mode', editMode);
    if (editMode) {
        setupDragAndDrop();
    } else {
        destroyDragAndDrop();
    }
}

// ---- Drag & Drop ----
let dragItem = null;
let dragType = null;

function setupDragAndDrop() {
    // Card drag
    document.querySelectorAll('.card[draggable]').forEach(function(card) {
        card.addEventListener('dragstart', onCardDragStart);
        card.addEventListener('dragend', onCardDragEnd);
        card.addEventListener('dragover', onCardDragOver);
        card.addEventListener('dragleave', onCardDragLeave);
        card.addEventListener('drop', onCardDrop);
    });
    // Section drag
    document.querySelectorAll('.cat-section').forEach(function(sec) {
        sec.setAttribute('draggable', 'true');
        sec.addEventListener('dragstart', onSectionDragStart);
        sec.addEventListener('dragend', onSectionDragEnd);
        sec.addEventListener('dragover', onSectionDragOver);
        sec.addEventListener('dragleave', onSectionDragLeave);
        sec.addEventListener('drop', onSectionDrop);
    });
}

function destroyDragAndDrop() {
    document.querySelectorAll('.card[draggable]').forEach(function(card) {
        card.removeEventListener('dragstart', onCardDragStart);
        card.removeEventListener('dragend', onCardDragEnd);
        card.removeEventListener('dragover', onCardDragOver);
        card.removeEventListener('dragleave', onCardDragLeave);
        card.removeEventListener('drop', onCardDrop);
    });
    document.querySelectorAll('.cat-section').forEach(function(sec) {
        sec.removeAttribute('draggable');
        sec.removeEventListener('dragstart', onSectionDragStart);
        sec.removeEventListener('dragend', onSectionDragEnd);
        sec.removeEventListener('dragover', onSectionDragOver);
        sec.removeEventListener('dragleave', onSectionDragLeave);
        sec.removeEventListener('drop', onSectionDrop);
    });
}

// Card sorting within same category
function onCardDragStart(e) {
    if (!editMode) { e.preventDefault(); return; }
    e.stopPropagation();
    dragItem = this;
    dragType = 'card';
    this.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
}

function onCardDragEnd() {
    this.classList.remove('dragging');
    document.querySelectorAll('.drag-over').forEach(function(el) { el.classList.remove('drag-over'); });
    dragItem = null;
    dragType = null;
}

function onCardDragOver(e) {
    e.preventDefault();
    if (dragType !== 'card' || this === dragItem || this.classList.contains('card-add')) return;
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('drag-over');
}

function onCardDragLeave() {
    this.classList.remove('drag-over');
}

function onCardDrop(e) {
    e.preventDefault();
    this.classList.remove('drag-over');
    if (!dragItem || dragType !== 'card' || this === dragItem) return;

    var fromCi = parseInt(dragItem.dataset.ci);
    var fromSi = dragItem.dataset.si !== '' ? parseInt(dragItem.dataset.si) : null;
    var fromIi = parseInt(dragItem.dataset.ii);
    var toCi = parseInt(this.dataset.ci);
    var toSi = this.dataset.si !== '' ? parseInt(this.dataset.si) : null;
    var toIi = parseInt(this.dataset.ii);

    // Only allow within same category grid
    if (fromCi !== toCi || fromSi !== toSi) return;

    var items = fromSi !== null ? data.links[fromCi].subcategories[fromSi].items : data.links[fromCi].items;
    var moved = items.splice(fromIi, 1)[0];
    var insertAt = toIi > fromIi ? toIi : toIi;
    items.splice(insertAt, 0, moved);

    saveData();
    render();
    if (editMode) setupDragAndDrop();
    showToast('排序已更新');
}

// Section sorting (entire category block)
function onSectionDragStart(e) {
    if (!editMode) { e.preventDefault(); return; }
    var target = e.target;
    var fromTitle = target.closest('.section-subtitle');
    if (!fromTitle && target !== this) { return; }
    dragItem = this;
    dragType = 'section';
    this.classList.add('section-dragging');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', '');
}

function onSectionDragEnd() {
    this.classList.remove('section-dragging');
    document.querySelectorAll('.section-drag-over').forEach(function(el) { el.classList.remove('section-drag-over'); });
    dragItem = null;
    dragType = null;
}

function onSectionDragOver(e) {
    if (dragType !== 'section' || this === dragItem) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    this.classList.add('section-drag-over');
}

function onSectionDragLeave(e) {
    if (!this.contains(e.relatedTarget)) {
        this.classList.remove('section-drag-over');
    }
}

function onSectionDrop(e) {
    e.preventDefault();
    this.classList.remove('section-drag-over');
    if (!dragItem || dragType !== 'section' || this === dragItem) return;

    var fromIdx = parseInt(dragItem.dataset.catIdx);
    var toIdx = parseInt(this.dataset.catIdx);

    var moved = data.links.splice(fromIdx, 1)[0];
    data.links.splice(toIdx, 0, moved);

    saveData();
    render();
    if (editMode) setupDragAndDrop();
    showToast('分类排序已更新');
}

// ---- Category CRUD ----
function addCategory() {
    const name = prompt('新分类名称：');
    if (!name?.trim()) return;
    data.links.push({ category: name.trim(), items: [] });
    saveData(); render(); showToast(`已创建: ${name.trim()}`);
}

function renameCat(ci, si) {
    const current = si !== null ? data.links[ci].subcategories[si].name : data.links[ci].category;
    document.getElementById('cat-modal-title').textContent = '重命名分类';
    document.getElementById('cat-name').value = current;
    document.getElementById('cat-idx').value = ci;
    document.getElementById('cat-sub-idx').value = si !== null ? si : '';
    document.getElementById('cat-modal').classList.add('show');
}

function submitCatRename(e) {
    e.preventDefault();
    const name = document.getElementById('cat-name').value.trim();
    const ci = parseInt(document.getElementById('cat-idx').value);
    const siVal = document.getElementById('cat-sub-idx').value;
    if (!name) return;
    if (siVal !== '') {
        data.links[ci].subcategories[parseInt(siVal)].name = name;
    } else {
        data.links[ci].category = name;
    }
    saveData(); closeCatModal(); render(); showToast('已重命名');
}

function closeCatModal(e) { if (e && e.target !== e.currentTarget) return; document.getElementById('cat-modal').classList.remove('show'); }

function deleteCat(ci, si) {
    const name = si !== null ? data.links[ci].subcategories[si].name : data.links[ci].category;
    if (!confirm(`删除「${name}」及其所有链接？`)) return;
    if (si !== null) { data.links[ci].subcategories.splice(si, 1); }
    else { data.links.splice(ci, 1); }
    saveData(); render(); showToast(`已删除: ${name}`);
}

// ---- Card CRUD ----
function openAddCard(ci, si) {
    document.getElementById('card-modal-title').textContent = '添加链接';
    document.getElementById('cf-btn').textContent = '添加';
    document.getElementById('cf-name').value = '';
    document.getElementById('cf-url').value = '';
    document.getElementById('cf-desc').value = '';
    document.getElementById('cf-tags').value = '';
    document.getElementById('cf-cat-idx').value = ci;
    document.getElementById('cf-sub-idx').value = si !== null ? si : '';
    document.getElementById('cf-item-idx').value = '';
    document.getElementById('card-modal').classList.add('show');
    document.getElementById('cf-url').focus();
}

// ---- URL Auto-fetch ----
let fetchController = null;

function setupUrlAutoFetch() {
    const urlInput = document.getElementById('cf-url');
    const nameInput = document.getElementById('cf-name');
    const descInput = document.getElementById('cf-desc');

    function handleUrlChange() {
        const url = urlInput.value.trim();
        if (!url || !url.startsWith('http')) return;
        if (nameInput.value.trim() && descInput.value.trim()) return;

        if (fetchController) fetchController.abort();
        fetchController = new AbortController();

        nameInput.placeholder = '正在智能抓取网站信息...';
        descInput.placeholder = '正在智能抓取网站信息...';
        nameInput.classList.add('fetching');
        descInput.classList.add('fetching');

        fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`, {
            signal: fetchController.signal
        })
        .then(function(res) { return res.json(); })
        .then(function(json) {
            if (json.status === 'success' && json.data) {
                if (!nameInput.value.trim() && json.data.title) {
                    nameInput.value = json.data.title.slice(0, 50);
                }
                if (!descInput.value.trim() && json.data.description) {
                    descInput.value = json.data.description.slice(0, 80);
                }
            }
        })
        .catch(function(e) {})
        .finally(function() {
            nameInput.placeholder = '网站名称';
            descInput.placeholder = '一句话描述（可选）';
            nameInput.classList.remove('fetching');
            descInput.classList.remove('fetching');
            fetchController = null;
        });
    }

    urlInput.addEventListener('paste', function() { setTimeout(handleUrlChange, 100); });
    urlInput.addEventListener('blur', handleUrlChange);
}

document.addEventListener('DOMContentLoaded', setupUrlAutoFetch);

function editCard(ci, si, ii) {
    const items = si !== null ? data.links[ci].subcategories[si].items : data.links[ci].items;
    const item = items[ii];
    document.getElementById('card-modal-title').textContent = '编辑链接';
    document.getElementById('cf-btn').textContent = '保存';
    document.getElementById('cf-name').value = item.name;
    document.getElementById('cf-url').value = item.url;
    document.getElementById('cf-desc').value = item.desc || '';
    document.getElementById('cf-tags').value = (item.tags || []).join(', ');
    document.getElementById('cf-cat-idx').value = ci;
    document.getElementById('cf-sub-idx').value = si !== null ? si : '';
    document.getElementById('cf-item-idx').value = ii;
    document.getElementById('card-modal').classList.add('show');
}

function deleteCard(ci, si, ii) {
    if (!confirm('删除这个链接？')) return;
    const items = si !== null ? data.links[ci].subcategories[si].items : data.links[ci].items;
    items.splice(ii, 1);
    saveData(); render(); showToast('已删除');
}

function submitCard(e) {
    e.preventDefault();
    const name = document.getElementById('cf-name').value.trim();
    const url = document.getElementById('cf-url').value.trim();
    const desc = document.getElementById('cf-desc').value.trim();
    const tags = document.getElementById('cf-tags').value.trim().split(/[,，]/).map(t => t.trim()).filter(Boolean);
    const ci = parseInt(document.getElementById('cf-cat-idx').value);
    const siVal = document.getElementById('cf-sub-idx').value;
    const iiVal = document.getElementById('cf-item-idx').value;
    if (!name || !url) return;

    const items = siVal !== '' ? data.links[ci].subcategories[parseInt(siVal)].items : data.links[ci].items;
    const card = { name, url, desc, tags };

    if (iiVal !== '') { items[parseInt(iiVal)] = card; showToast(`已更新: ${name}`); }
    else { items.push(card); showToast(`已添加: ${name}`); }

    saveData(); closeCardModal(); render();
}

function closeCardModal(e) { if (e && e.target !== e.currentTarget) return; document.getElementById('card-modal').classList.remove('show'); }

// ---- Spec/Copy Item CRUD ----
function addGroup(type) {
    const name = prompt('新分组名称：');
    if (!name?.trim()) return;
    data[type].push({ group: name.trim(), items: [] });
    saveData(); render(); showToast(`已创建: ${name.trim()}`);
}

function renameGroup(type, gi) {
    const name = prompt('新名称：', data[type][gi].group);
    if (!name?.trim()) return;
    data[type][gi].group = name.trim();
    saveData(); render(); showToast('已重命名');
}

function deleteGroup(type, gi) {
    if (!confirm(`删除「${data[type][gi].group}」及其所有条目？`)) return;
    data[type].splice(gi, 1);
    saveData(); render(); showToast('已删除');
}

function openAddItem(type, gi) {
    document.getElementById('item-modal-title').textContent = type === 'specs' ? '添加规范' : '添加复制项';
    document.getElementById('if-btn').textContent = '添加';
    document.getElementById('if-label').value = '';
    document.getElementById('if-value').value = '';
    document.getElementById('if-type').value = type;
    document.getElementById('if-group-idx').value = gi;
    document.getElementById('if-item-idx').value = '';
    document.getElementById('item-modal').classList.add('show');
}

function editItem(type, gi, ii) {
    const item = data[type][gi].items[ii];
    document.getElementById('item-modal-title').textContent = '编辑';
    document.getElementById('if-btn').textContent = '保存';
    document.getElementById('if-label').value = item.label;
    document.getElementById('if-value').value = item.value;
    document.getElementById('if-type').value = type;
    document.getElementById('if-group-idx').value = gi;
    document.getElementById('if-item-idx').value = ii;
    document.getElementById('item-modal').classList.add('show');
}

function deleteItem(type, gi, ii) {
    if (!confirm('删除这条数据？')) return;
    data[type][gi].items.splice(ii, 1);
    saveData(); render(); showToast('已删除');
}

function submitItem(e) {
    e.preventDefault();
    const label = document.getElementById('if-label').value.trim();
    const value = document.getElementById('if-value').value.trim();
    const type = document.getElementById('if-type').value;
    const gi = parseInt(document.getElementById('if-group-idx').value);
    const iiVal = document.getElementById('if-item-idx').value;
    if (!label || !value) return;

    if (iiVal !== '') { data[type][gi].items[parseInt(iiVal)] = { label, value }; showToast('已更新'); }
    else { data[type][gi].items.push({ label, value }); showToast(`已添加: ${label}`); }

    saveData(); closeItemModal(); render();
}

function closeItemModal(e) { if (e && e.target !== e.currentTarget) return; document.getElementById('item-modal').classList.remove('show'); }

// ---- Export & Reset ----
function exportData() {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'data.json'; a.click();
    showToast('已导出 data.json');
}

function resetData() {
    if (!confirm('恢复默认数据？所有修改将丢失。')) return;
    localStorage.removeItem(STORAGE_KEY);
    location.reload();
}

// ---- Utils ----
function copyToClipboard(text) {
    if (editMode) return;
    navigator.clipboard.writeText(text).then(() => {
        showToast(`已复制: ${text.length > 30 ? text.slice(0, 30) + '...' : text}`);
    });
}

function showToast(msg) {
    const t = document.getElementById('toast'); t.textContent = msg; t.classList.add('show');
    clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2000);
}

function smoothScroll(e, id) {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

window.addEventListener('scroll', () => {
    const sections = document.querySelectorAll('.section');
    const links = document.querySelectorAll('.nav a');
    let current = 0;
    sections.forEach((s, i) => { if (window.scrollY >= s.offsetTop - 120) current = i; });
    links.forEach((l, i) => l.classList.toggle('active', i === current));
});

init();
