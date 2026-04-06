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
        allRSVPs = (data.rsvps || []).map(r => ({
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

    // Only count guests from accepted invitations
    let totalGuests = 0;
    attending.forEach(r => {
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
                <td><button class="btn btn-delete" onclick="deleteRSVP(${rsvp.id})">Delete</button></td>
            </tr>
        `;
    }).join('');

    if (filtered.length === 0 && allRSVPs.length > 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:30px;color:#999;">No results match your search/filter.</td></tr>';
    }
}

function initControls() {
    document.getElementById('searchInput').addEventListener('input', () => renderTable());
    document.getElementById('filterSelect').addEventListener('change', () => renderTable());
    document.getElementById('refreshBtn').addEventListener('click', () => loadRSVPs());
    document.getElementById('exportBtn').addEventListener('click', exportCSV);
    document.getElementById('addManualBtn').addEventListener('click', toggleManualForm);
    document.getElementById('manualForm').addEventListener('submit', submitManualRSVP);
}

// --- DELETE ---
async function deleteRSVP(id) {
    if (!confirm('Are you sure you want to delete this RSVP?')) return;

    try {
        const res = await fetch('/api/delete', {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminSecret}`
            },
            body: JSON.stringify({ id })
        });

        if (!res.ok) throw new Error('Delete failed');
        loadRSVPs();
    } catch (err) {
        alert('Error deleting RSVP. Please try again.');
        console.error(err);
    }
}
window.deleteRSVP = deleteRSVP;

// --- MANUAL ENTRY ---
function toggleManualForm() {
    const form = document.getElementById('manualFormWrapper');
    form.classList.toggle('hidden');
}

async function submitManualRSVP(e) {
    e.preventDefault();
    const form = e.target;

    const formData = {
        attending: form.attending.value,
        fullName: form.fullName.value.trim(),
        email: form.email.value.trim() || 'manual@admin.entry',
        phone: form.phone.value.trim(),
        adults: form.adults.value,
        children: form.children.value,
        message: form.message.value.trim()
    };

    if (!formData.fullName || !formData.adults) {
        alert('Name and number of adults are required.');
        return;
    }

    try {
        const res = await fetch('/api/rsvp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });

        if (!res.ok) throw new Error('Submit failed');

        form.reset();
        document.getElementById('manualFormWrapper').classList.add('hidden');
        loadRSVPs();
    } catch (err) {
        alert('Error adding RSVP. Please try again.');
        console.error(err);
    }
}

// --- CSV EXPORT (only accepted) ---
function exportCSV() {
    const accepted = allRSVPs.filter(r => r.attending === 'yes');
    if (accepted.length === 0) { alert('No accepted RSVPs to export.'); return; }

    const headers = ['Name', 'Email', 'Phone', 'Adults', 'Children', 'Message', 'Submitted At'];
    const rows = accepted.map(r => [
        csvEscape(r.fullName || ''),
        csvEscape(r.email || ''),
        csvEscape(r.phone || ''),
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
    link.download = `griha-pravesh-accepted-${new Date().toISOString().slice(0, 10)}.csv`;
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
