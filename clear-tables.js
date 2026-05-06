(function () {
    const page = (location.pathname.split('/').pop() || '').toLowerCase();

    function token() {
        return localStorage.getItem('authToken') || localStorage.getItem('token') || '';
    }

    function statusesFor(tbodyId) {
        if (tbodyId === 'pendingAssetTableBody') return ['pending_capital_master', 'pending'];
        if (tbodyId === 'pendingRequestsTableBody') {
            if (page === 'financemanager.html') return ['approved_by_capital_master'];
            if (page === 'cfo.html') return ['approved_by_finance_manager'];
            if (page === 'md.html') return ['approved_by_cfo'];
        }
        if (tbodyId === 'approvedRequestsTableBody') {
            if (page === 'financemanager.html') return ['approved_by_finance_manager', 'approved_by_cfo', 'approved_by_md'];
            if (page === 'cfo.html') return ['approved_by_cfo', 'approved_by_md'];
            if (page === 'md.html') return ['approved_by_md'];
        }
        if (tbodyId === 'deniedRequestsTableBody') {
            if (page === 'financemanager.html') return ['denied_by_finance_manager'];
            if (page === 'cfo.html') return ['denied_by_cfo'];
            if (page === 'md.html') return ['denied_by_md'];
        }
        if (tbodyId === 'assetTableBody' || tbodyId === 'allRequestsTableBody') return null;
        return undefined;
    }

    function refreshTables() {
        [
            'renderStats',
            'renderNotifications',
            'renderRecentTable',
            'renderAssetTable',
            'renderPendingAssetRequests',
            'renderAllAssetRequests',
            'initializePage'
        ].forEach(name => {
            if (typeof window[name] === 'function') {
                try { window[name](); } catch (error) { console.warn('Refresh skipped:', name, error); }
            }
        });
        if (typeof window.initializeDashboard === 'function') {
            try { window.initializeDashboard(); } catch (error) { console.warn('Dashboard refresh skipped:', error); }
        }
    }

    async function clearTable(tbodyId) {
        const statuses = statusesFor(tbodyId);
        if (statuses === undefined) return;

        if (!confirm('Clear all requests from this table?')) return;

        try {
            const response = await fetch('/api/assets/bulk', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token()
                },
                body: JSON.stringify(statuses ? { statuses } : {})
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok) throw new Error(data.error || 'Unable to clear this table');

            alert('Cleared ' + (data.deleted || 0) + ' request(s).');
            refreshTables();
            setTimeout(installClearButtons, 150);
        } catch (error) {
            alert('Error: ' + error.message);
        }
    }

    function makeButton(tbodyId) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'clear-all-table-btn';
        button.dataset.targetTable = tbodyId;
        button.innerHTML = '<i class="fa-solid fa-trash-can" style="margin-right:6px;"></i>Clear All';
        button.style.cssText = 'background:#fee2e2;color:#b91c1c;border:1px solid #fecaca;border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer;transition:.2s;margin-left:8px;';
        button.addEventListener('mouseover', () => { button.style.background = '#fecaca'; });
        button.addEventListener('mouseout', () => { button.style.background = '#fee2e2'; });
        button.addEventListener('click', () => clearTable(tbodyId));
        return button;
    }

    function installClearButtons() {
        document.querySelectorAll('tbody[id]').forEach(tbody => {
            const statuses = statusesFor(tbody.id);
            if (statuses === undefined) return;

            const section = tbody.closest('.full-section, .section-card, .users-table-section, .table-section') || tbody.closest('div');
            const header = section ? section.querySelector('.sc-header, .table-header') : null;
            if (!header || header.querySelector('[data-target-table="' + tbody.id + '"]')) return;

            header.appendChild(makeButton(tbody.id));
        });
    }

    window.clearRequestTable = clearTable;
    window.installClearButtons = installClearButtons;

    window.addEventListener('load', () => {
        installClearButtons();
        setTimeout(installClearButtons, 250);
    });

    const observer = new MutationObserver(() => installClearButtons());
    window.addEventListener('DOMContentLoaded', () => {
        if (document.body) observer.observe(document.body, { childList: true, subtree: true });
    });
})();
