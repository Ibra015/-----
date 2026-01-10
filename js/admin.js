/**
 * Admin Panel Logic (Final Mega Features)
 * - Finance, Barbers, Inventory, Loyalty, Offers, Reports
 */

document.addEventListener('DOMContentLoaded', () => {

    // === Data Init ===
    let bookings = JSON.parse(localStorage.getItem('barberBookings') || '[]');
    let expenses = JSON.parse(localStorage.getItem('barberExpenses') || '[]');
    let inventory = JSON.parse(localStorage.getItem('barberInventory') || '[]');
    let offers = JSON.parse(localStorage.getItem('barberOffers') || '[]');

    // Fix Data types: Ensure numbers are numbers
    inventory = inventory.map(i => ({ ...i, qty: Number(i.qty) }));

    // === 1. Render Dashboard & Counters ===
    function renderDashboard() {
        // Finance
        const income = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (Number(b.price) || 0), 0);
        const expenseSum = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const net = income - expenseSum;

        if (document.getElementById('todayBookings')) document.getElementById('todayBookings').innerText = bookings.length;
        if (document.getElementById('todayIncome')) document.getElementById('todayIncome').innerText = income + ' ج.م';
        if (document.getElementById('activeClients')) document.getElementById('activeClients').innerText = net + ' ج.م (+ صافي)';

        // Render Offers List in Dashboard
        const offersList = document.getElementById('activeOffersList');
        if (offersList) {
            offersList.innerHTML = offers.map(o => `
                <div style="display:flex; justify-content:space-between; background:rgba(255,255,255,0.05); padding:8px; margin-bottom:5px; border-radius:5px;">
                    <span>${o.title} (${o.price} ج.م)</span>
                    <button onclick="deleteOffer(${o.id})" style="color:red;border:none;background:none;cursor:pointer;">🗑️</button>
                </div>
            `).join('');
        }
    }

    // === 2. Inventory System ===
    function renderInventory() {
        const tbody = document.getElementById('inventoryTableBody');
        const alertBox = document.getElementById('invAlerts');
        if (!tbody) return;

        tbody.innerHTML = '';
        alertBox.innerHTML = '';

        inventory.forEach(item => {
            const lowStock = item.qty < 5;
            if (lowStock) {
                alertBox.innerHTML += `<div style="color:#ff4444; margin-bottom:5px;">⚠️ تنبيه: كمية <b>${item.name}</b> منخفضة جداً (${item.qty})</div>`;
            }

            tbody.innerHTML += `
                <tr>
                    <td>${item.name}</td>
                    <td style="color:${lowStock ? 'red' : 'lightgreen'}; font-weight:bold;">${item.qty}</td>
                    <td>${lowStock ? 'يطلب الشراء' : 'متوفر'}</td>
                    <td>
                        <button onclick="updateStock(${item.id}, 1)" class="btn-icon">➕</button>
                        <button onclick="updateStock(${item.id}, -1)" class="btn-icon">➖</button>
                        <button onclick="deleteStock(${item.id})" class="btn-icon delete">🗑️</button>
                    </td>
                </tr>
            `;
        });
    }

    window.updateStock = (id, delta) => {
        inventory = inventory.map(i => i.id === id ? { ...i, qty: i.qty + delta } : i);
        localStorage.setItem('barberInventory', JSON.stringify(inventory));
        renderInventory();
    };

    window.deleteStock = (id) => {
        if (confirm('حذف الصنف؟')) {
            inventory = inventory.filter(i => i.id !== id);
            localStorage.setItem('barberInventory', JSON.stringify(inventory));
            renderInventory();
        }
    };

    const invForm = document.getElementById('inventoryForm');
    if (invForm) {
        invForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const name = document.getElementById('invItem').value;
            const qty = document.getElementById('invQty').value;
            inventory.push({ id: Date.now(), name, qty: Number(qty) });
            localStorage.setItem('barberInventory', JSON.stringify(inventory));
            renderInventory();
            invForm.reset();
        });
    }

    // === 3. Loyalty System ===
    function renderLoyalty() {
        const tbody = document.getElementById('loyaltyTableBody');
        if (!tbody) return;

        // Group bookings by Phone
        const customers = {};
        bookings.forEach(b => {
            if (b.status === 'completed' || b.status === 'confirmed') {
                if (!customers[b.phone]) customers[b.phone] = { name: b.name, visits: 0, points: 0 };
                customers[b.phone].visits++;
                customers[b.phone].points += 10; // Rule: 10 pts per visit
            }
        });

        // Convert to array and sort
        const sorted = Object.entries(customers)
            .map(([phone, data]) => ({ phone, ...data }))
            .sort((a, b) => b.points - a.points);

        tbody.innerHTML = sorted.map((c, idx) => `
            <tr>
                <td>#${idx + 1}</td>
                <td>${c.name}</td>
                <td>${c.phone}</td>
                <td>${c.visits}</td>
                <td style="color:var(--gold)">${c.points} ⭐</td>
                <td>${c.points >= 100 ? '🎁 يستحق قصة مجانية' : (100 - c.points) + ' نقطة للمجاني'}</td>
            </tr>
        `).join('');
    }

    // === 4. Dynamic Offers ===
    const offerForm = document.getElementById('offerForm');
    if (offerForm) {
        offerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const title = document.getElementById('offerTitle').value;
            const price = document.getElementById('offerPrice').value;
            offers.unshift({ id: Date.now(), title, price });
            localStorage.setItem('barberOffers', JSON.stringify(offers));
            renderDashboard(); // Refresh offers list
            offerForm.reset();
            alert('تم نشر العرض بنجاح');
        });
    }

    window.deleteOffer = (id) => {
        offers = offers.filter(o => o.id !== id);
        localStorage.setItem('barberOffers', JSON.stringify(offers));
        renderDashboard();
    };

    // === 5. Reports & WhatsApp ===
    function renderBookings() {
        const tbody = document.getElementById('bookingsTableBody');
        if (!tbody) return;
        tbody.innerHTML = '';
        bookings.forEach(b => {
            // WhatsApp Link
            const waLink = `https://wa.me/2${b.phone}?text=مرحباً ${b.name}، نؤكد حجزك في صالون المحترف يوم ${b.date} الساعة ${b.time}`;

            tbody.innerHTML += `
                <tr>
                    <td>#${b.id}</td>
                    <td>${b.name}<br><small style="color:#aaa">${b.barber || ''}</small></td>
                    <td>${b.date}</td>
                    <td>${b.service}</td>
                    <td>${b.price}</td>
                    <td><span class="status-badge status-${b.status}">${b.status}</span></td>
                    <td>
                        <a href="${waLink}" target="_blank" class="btn-icon" style="color:#25D366; text-decoration:none;">💬 واتساب</a>
                    </td>
                    <td>
                        <button onclick="updateStatus(${b.id}, 'completed')" class="btn-icon">✅</button>
                        <button onclick="deleteBooking(${b.id})" class="btn-icon delete">🗑️</button>
                    </td>
                </tr>
             `;
        });
    }

    window.exportToCSV = () => {
        // BOM for Arabic support + Excel Separator Instruction
        let csv = '\uFEFFsep=,\r\nID,Name,Phone,Barber,Date,Service,Price,Status\n';
        bookings.forEach(b => {
            // Escape commas in service names
            const safeService = (b.service || '').replace(/,/g, ' + ');
            csv += `${b.id},${b.name},${b.phone},${b.barber || ''},${b.date},${safeService},${b.price},${b.status}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Salon_Report_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // === Router & Navigation ===
    // (Reusing existing router logic with new pages)

    // Global Actions Reuse
    window.updateStatus = (id, st) => {
        bookings = bookings.map(b => b.id == id ? { ...b, status: st } : b);
        localStorage.setItem('barberBookings', JSON.stringify(bookings));
        renderBookings();
        renderDashboard();
    };

    window.deleteBooking = (id) => {
        if (confirm('حذف؟')) {
            bookings = bookings.filter(b => b.id != id);
            localStorage.setItem('barberBookings', JSON.stringify(bookings));
            renderBookings();
            renderDashboard();
        }
    };

    // Finance Calculation (Reused from previous step logic, shortened for clarity here)
    // ... insert finance logic if page active ...

    // Page Switching
    document.querySelectorAll('.sidebar-link').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Active Class Logic
            document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
            link.classList.add('active');

            const page = link.getAttribute('data-page');
            document.getElementById(page + 'Page').classList.add('active');
            document.getElementById('pageTitle').innerText = link.querySelector('span:last-child').innerText;

            // Init Page Specifics
            if (page === 'inventory') renderInventory();
            if (page === 'loyalty') renderLoyalty();
            if (page === 'bookings') renderBookings();
            if (page === 'dashboard') renderDashboard();
            if (page === 'finance') {
                // Inject Finance HTML again if needed or assume static + dynamic
                // For now, let's assume the previous Finance Logic is loaded or we re-inject:
                // In a real app we'd modularize. Here we might need to manually trigger the finance render function
                // described in the previous turn. 
                // *SELF-CORRECTION*: I overwrote the previous finance logic in this file content. 
                // I should ensure Finance Logic is PRESENT in this file.
                renderFinanceUI();
            }
        });
    });

    // Finance UI Renderer (Restored)
    function renderFinanceUI() {
        const income = bookings.filter(b => b.status !== 'cancelled').reduce((sum, b) => sum + (Number(b.price) || 0), 0);
        const expenseSum = expenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
        const net = income - expenseSum;

        // Barbers Calc
        const barbers = {};
        bookings.forEach(b => {
            if (b.status !== 'cancelled') {
                const n = b.barber || 'غير محدد';
                if (!barbers[n]) barbers[n] = { revenue: 0, count: 0 };
                barbers[n].revenue += Number(b.price) || 0;
                barbers[n].count++;
            }
        });

        document.getElementById('financePage').innerHTML = `
            <div class="profit-summary-card">
                <h2>${net} ج.م</h2>
                <small>صافي الربح</small>
            </div>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px;">
                <div>
                    <h3>أداء الحلاقين</h3>
                    ${Object.entries(barbers).map(([name, data]) => `
                        <div class="barber-card">
                            <b>${name}</b>
                            <div style="margin-right:auto">${data.revenue} ج.م</div>
                        </div>
                    `).join('')}
                </div>
                <div>
                     <h3>المصروفات</h3>
                     <button onclick="addExpPrompt()" class="btn-primary" style="width:100%;margin-bottom:10px;">+ مصروف</button>
                     <ul style="list-style:none;">
                        ${expenses.map(e => `
                            <li style="display:flex; justify-content:space-between; padding:10px; background:rgba(255,255,255,0.05); margin-bottom:5px;">
                                <span>${e.description}</span>
                                <span style="color:red">-${e.amount}</span>
                            </li>
                        `).join('')}
                     </ul>
                </div>
            </div>
         `;
    }

    window.addExpPrompt = () => {
        const desc = prompt('وصف المصروف:');
        const amount = Number(prompt('المبلغ:'));
        if (desc && amount) {
            expenses.push({ id: Date.now(), description: desc, amount });
            localStorage.setItem('barberExpenses', JSON.stringify(expenses));
            renderFinanceUI();
        }
    };

    // Auto-Run
    renderDashboard();
});
