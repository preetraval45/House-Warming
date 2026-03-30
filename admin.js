/* =============================================
   ADMIN DASHBOARD - RSVP Management
   ============================================= */

let allRSVPs = [];
let currentSort = { field: 'submittedAt', direction: 'desc' };

document.addEventListener('DOMContentLoaded', () => {
    loadRSVPs();
    initControls();
});

/* =============================================
   LOAD RSVPs
   ============================================= */
function loadRSVPs() {
    const loading = document.getElementById('loadingState');
    const tableWrapper = document.getElementById('tableWrapper');
    const emptyState = document.getElementById('emptyState');

    loading.style.display = 'block';
    tableWrapper.style.display = 'none';
    emptyState.style.display = 'none';

    if (typeof firebase !== 'undefined' && firebase.database) {
        // Load from Firebase
        const db = firebase.database();
        db.ref('rsvps').on('value', (snapshot) => {
            allRSVPs = [];
            const data = snapshot.val();

            if (data) {
                Object.keys(data).forEach(key => {
                    allRSVPs.push({ id: key, ...data[key] });
                });
            }

            loading.style.display = 'none';
            renderDashboard();
        }, (error) => {
            console.error('Firebase error:', error);
            loading.innerHTML = '<p style="color: #D94F4F;">Error loading data. Check Firebase configuration.</p>';
        });
    } else {
        // Fallback: load from localStorage
        const stored = JSON.parse(localStorage.getItem('rsvps') || '[]');
        allRSVPs = stored.map((item, index) => ({ id: `local_${index}`, ...item }));
        loading.style.display = 'none';
        renderDashboard();
    }
}

/* =============================================
   RENDER DASHBOARD
   ============================================= */
function renderDashboard() {
    updateStats();
    renderTable();
}

function updateStats() {
    const total = allRSVPs.length;
    const attending = allRSVPs.filter(r => r.attending === 'yes');
    const declined = allRSVPs.filter(r => r.attending === 'no');
    const maybe = allRSVPs.filter(r => r.attending === 'maybe');

    // Calculate total guests (adults + children) for those attending or maybe
    let totalGuests = 0;
    [...attending, ...maybe].forEach(r => {
        const adults = parseInt(r.adults) || 0;
        const children = parseInt(r.children) || 0;
        totalGuests += adults + children;
    });

    document.getElementById('statTotal').textContent = total;
    document.getElementById('statYes').textContent = attending.length;
    document.getElementById('statNo').textContent = declined.length;
    document.getElementById('statMaybe').textContent = maybe.length;
    document.getElementById('statGuests').textContent = totalGuests;
}

function renderTable() {
    const tableWrapper = document.getElementById('tableWrapper');
    const emptyState = document.getElementById('emptyState');
    const tbody = document.getElementById('rsvpTableBody');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filterValue = document.getElementById('filterSelect').value;

    // Filter
    let filtered = allRSVPs.filter(r => {
        const matchesSearch = !searchTerm ||
            (r.fullName || '').toLowerCase().includes(searchTerm) ||
            (r.email || '').toLowerCase().includes(searchTerm);
        const matchesFilter = filterValue === 'all' || r.attending === filterValue;
        return matchesSearch && matchesFilter;
    });

    // Sort
    filtered.sort((a, b) => {
        let aVal = a[currentSort.field] || '';
        let bVal = b[currentSort.field] || '';

        if (currentSort.field === 'adults' || currentSort.field === 'children') {
            aVal = parseInt(aVal) || 0;
            bVal = parseInt(bVal) || 0;
        } else {
            aVal = String(aVal).toLowerCase();
            bVal = String(bVal).toLowerCase();
        }

        if (aVal < bVal) return currentSort.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return currentSort.direction === 'asc' ? 1 : -1;
        return 0;
    });

    if (allRSVPs.length === 0) {
        tableWrapper.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    tableWrapper.style.display = 'block';
    emptyState.style.display = 'none';

    tbody.innerHTML = filtered.map((rsvp, index) => {
        const date = rsvp.submittedAt
            ? new Date(rsvp.submittedAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })
            : 'N/A';

        const badgeClass = `badge-${rsvp.attending || 'maybe'}`;
        const statusText = rsvp.attending === 'yes' ? 'Attending'
            : rsvp.attending === 'no' ? 'Declined'
            : 'Maybe';

        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${escapeHtml(rsvp.fullName || '-')}</strong></td>
                <td>${escapeHtml(rsvp.email || '-')}</td>
                <td>${escapeHtml(rsvp.phone || '-')}</td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
                <td>${escapeHtml(rsvp.adults || '0')}</td>
                <td>${escapeHtml(rsvp.children || '0')}</td>
                <td>${escapeHtml(rsvp.dietary || '-')}</td>
                <td class="message-preview" title="${escapeHtml(rsvp.message || '')}">${escapeHtml(rsvp.message || '-')}</td>
                <td>${date}</td>
                <td><button class="btn btn-delete" onclick="deleteRSVP('${rsvp.id}')">Delete</button></td>
            </tr>
        `;
    }).join('');

    if (filtered.length === 0 && allRSVPs.length > 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="11" style="text-align:center; padding:30px; color:#999;">
                    No results match your search/filter.
                </td>
            </tr>
        `;
    }
}

/* =============================================
   CONTROLS
   ============================================= */
function initControls() {
    // Search
    document.getElementById('searchInput').addEventListener('input', () => renderTable());

    // Filter
    document.getElementById('filterSelect').addEventListener('change', () => renderTable());

    // Refresh
    document.getElementById('refreshBtn').addEventListener('click', () => loadRSVPs());

    // Export CSV
    document.getElementById('exportBtn').addEventListener('click', exportCSV);

    // Table header sorting
    document.querySelectorAll('.rsvp-table th[data-sort]').forEach(th => {
        th.addEventListener('click', () => {
            const field = th.dataset.sort;
            if (field === 'index') return;

            if (currentSort.field === field) {
                currentSort.direction = currentSort.direction === 'asc' ? 'desc' : 'asc';
            } else {
                currentSort.field = field;
                currentSort.direction = 'asc';
            }

            // Update sort icons
            document.querySelectorAll('.sort-icon').forEach(icon => icon.textContent = '');
            const icon = th.querySelector('.sort-icon');
            if (icon) icon.textContent = currentSort.direction === 'asc' ? ' ▲' : ' ▼';

            renderTable();
        });
    });
}

/* =============================================
   DELETE RSVP
   ============================================= */
function deleteRSVP(id) {
    if (!confirm('Are you sure you want to delete this RSVP?')) return;

    if (typeof firebase !== 'undefined' && firebase.database && !id.startsWith('local_')) {
        firebase.database().ref('rsvps/' + id).remove()
            .then(() => console.log('Deleted:', id))
            .catch(err => alert('Error deleting: ' + err.message));
    } else {
        // localStorage fallback
        const index = parseInt(id.replace('local_', ''));
        const stored = JSON.parse(localStorage.getItem('rsvps') || '[]');
        stored.splice(index, 1);
        localStorage.setItem('rsvps', JSON.stringify(stored));
        allRSVPs = stored.map((item, i) => ({ id: `local_${i}`, ...item }));
        renderDashboard();
    }
}

/* =============================================
   EXPORT CSV
   ============================================= */
function exportCSV() {
    if (allRSVPs.length === 0) {
        alert('No RSVPs to export.');
        return;
    }

    const headers = ['Name', 'Email', 'Phone', 'Attending', 'Adults', 'Children', 'Dietary Restrictions', 'Message', 'Submitted At'];

    const rows = allRSVPs.map(r => [
        csvEscape(r.fullName || ''),
        csvEscape(r.email || ''),
        csvEscape(r.phone || ''),
        csvEscape(r.attending || ''),
        r.adults || '0',
        r.children || '0',
        csvEscape(r.dietary || ''),
        csvEscape(r.message || ''),
        r.submittedAt || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `housewarming-rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();

    URL.revokeObjectURL(url);
}

function csvEscape(str) {
    str = String(str);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
    }
    return str;
}

/* =============================================
   UTILITIES
   ============================================= */
function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
