let allRSVPs = [];
let adminSecret = '';

document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('loginBtn').addEventListener('click', handleLogin);
    document.getElementById('secretInput').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') handleLogin();
    });
});

function handleLogin() {
    const input = document.getElementById('secretInput');
    const error = document.getElementById('loginError');
    adminSecret = input.value.trim();

    if (!adminSecret) {
        error.classList.remove('hidden');
        return;
    }

    error.classList.add('hidden');
    document.getElementById('loginSection').classList.add('hidden');
    document.getElementById('dashboardSection').classList.remove('hidden');
    loadRSVPs();
    initControls();
}

async function loadRSVPs() {
    const loading = document.getElementById('loadingState');
    const tableWrapper = document.getElementById('tableWrapper');
    const emptyState = document.getElementById('emptyState');

    loading.classList.remove('hidden');
    tableWrapper.classList.add('hidden');
    emptyState.classList.add('hidden');

    try {
        const res = await fetch('/api/admin', {
            headers: { 'Authorization': `Bearer ${adminSecret}` }
        });

        if (!res.ok) {
            if (res.status === 401) {
                alert('Invalid admin secret.');
                document.getElementById('dashboardSection').classList.add('hidden');
                document.getElementById('loginSection').classList.remove('hidden');
                document.getElementById('loginError').classList.remove('hidden');
                return;
            }
            throw new Error('Server error');
        }

        const data = await res.json();
        allRSVPs = (data.rsvps || []).map((r, i) => ({
            id: r.id,
            fullName: r.full_name,
            email: r.email,
            phone: r.phone,
            attending: r.attending,
            adults: r.adults,
            children: r.children,
            message: r.message,
            submittedAt: r.submitted_at
        }));

        loading.classList.add('hidden');
        renderDashboard();
    } catch (err) {
        console.error('Error loading RSVPs:', err);
        loading.innerHTML = '<p style="color:#D94F4F;">Error loading data. Please try again.</p>';
    }
}

function renderDashboard() {
    updateStats();
    renderTable();
}

function updateStats() {
    const attending = allRSVPs.filter(r => r.attending === 'yes');
    const declined = allRSVPs.filter(r => r.attending === 'no');
    const maybe = allRSVPs.filter(r => r.attending === 'maybe');

    let totalGuests = 0;
    [...attending, ...maybe].forEach(r => {
        totalGuests += (parseInt(r.adults) || 0) + (parseInt(r.children) || 0);
    });

    document.getElementById('statTotal').textContent = allRSVPs.length;
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

    let filtered = allRSVPs.filter(r => {
        const matchesSearch = !searchTerm ||
            (r.fullName || '').toLowerCase().includes(searchTerm) ||
            (r.email || '').toLowerCase().includes(searchTerm);
        const matchesFilter = filterValue === 'all' || r.attending === filterValue;
        return matchesSearch && matchesFilter;
    });

    if (allRSVPs.length === 0) {
        tableWrapper.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    tableWrapper.classList.remove('hidden');
    emptyState.classList.add('hidden');

    tbody.innerHTML = filtered.map((rsvp, index) => {
        const date = rsvp.submittedAt
            ? new Date(rsvp.submittedAt).toLocaleDateString('en-US', {
                month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            })
            : 'N/A';

        const badgeClass = `badge-${rsvp.attending || 'maybe'}`;
        const statusText = rsvp.attending === 'yes' ? 'Attending'
            : rsvp.attending === 'no' ? 'Declined' : 'Maybe';

        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${escapeHtml(rsvp.fullName || '-')}</strong></td>
                <td>${escapeHtml(rsvp.email || '-')}</td>
                <td>${escapeHtml(rsvp.phone || '-')}</td>
                <td><span class="badge ${badgeClass}">${statusText}</span></td>
                <td>${escapeHtml(rsvp.adults || '0')}</td>
                <td>${escapeHtml(rsvp.children || '0')}</td>
                <td class="message-preview" title="${escapeHtml(rsvp.message || '')}">${escapeHtml(rsvp.message || '-')}</td>
                <td>${date}</td>
            </tr>
        `;
    }).join('');

    if (filtered.length === 0 && allRSVPs.length > 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:30px;color:#999;">No results match your search/filter.</td></tr>';
    }
}

function initControls() {
    document.getElementById('searchInput').addEventListener('input', () => renderTable());
    document.getElementById('filterSelect').addEventListener('change', () => renderTable());
    document.getElementById('refreshBtn').addEventListener('click', () => loadRSVPs());
    document.getElementById('exportBtn').addEventListener('click', exportCSV);
}

function exportCSV() {
    if (allRSVPs.length === 0) { alert('No RSVPs to export.'); return; }

    const headers = ['Name', 'Email', 'Phone', 'Attending', 'Adults', 'Children', 'Message', 'Submitted At'];
    const rows = allRSVPs.map(r => [
        csvEscape(r.fullName || ''),
        csvEscape(r.email || ''),
        csvEscape(r.phone || ''),
        csvEscape(r.attending || ''),
        r.adults || '0',
        r.children || '0',
        csvEscape(r.message || ''),
        r.submittedAt || ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `griha-pravesh-rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
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

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
