document.addEventListener('DOMContentLoaded', () => {
    // Loader
    setTimeout(() => {
        document.getElementById('loader').classList.add('hidden');
    }, 1500);

    // Dynamic Offers Render
    const offersGrid = document.getElementById('dynamicOffersGrid');
    const savedOffers = JSON.parse(localStorage.getItem('barberOffers') || '[]');

    if (offersGrid && savedOffers.length > 0) {
        // Keep the default static offer or clear it? Let's clear and show only active offers if any exist, 
        // OR append them. Let's prepend them to highlight new offers.
        // For a cleaner look, if we have dynamic offers, let's replace the static ones or add to them.
        // Let's just append for now to keep the "Royal Package" visible.

        savedOffers.forEach(offer => {
            const offerEl = document.createElement('div');
            offerEl.className = 'offer-card';
            offerEl.setAttribute('data-tilt', '');
            offerEl.innerHTML = `
                <div class="offer-tag">عرض خاص 🔥</div>
                <h3>${offer.title}</h3>
                <p>عرض حصري لفترة محدودة من صالون المحترف.</p>
                <div class="price">
                    <span class="new-price">${offer.price} ج.م</span>
                </div>
                <a href="#booking" class="btn btn-primary">احجز العرض</a>
            `;
            offersGrid.insertBefore(offerEl, offersGrid.firstChild); // Add to top
        });
    }

    // Vanilla Tilt Init (Manually if not auto-init)
    const glassCards = document.querySelectorAll(".glass-card");
    if (glassCards.length > 0 && typeof VanillaTilt !== 'undefined') {
        VanillaTilt.init(glassCards, {
            max: 15,
            speed: 400,
            glare: true,
            "max-glare": 0.2,
        });
    }

    // Booking Wizard Logic
    let currentStep = 1;
    const totalSteps = 4;

    function showStep(step) {
        // Hide all steps
        document.querySelectorAll('.wizard-step').forEach(s => s.classList.remove('active'));
        // Show current
        const stepEl = document.getElementById(`step${step}`);
        if (stepEl) stepEl.classList.add('active');

        // Update header
        document.querySelectorAll('.step').forEach(s => {
            if (s.dataset.step == step) s.classList.add('active');
            else if (s.dataset.step > step) s.classList.remove('active');
        });
    }

    // Next Buttons
    document.querySelectorAll('.next-step').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep < totalSteps) {
                currentStep++;
                showStep(currentStep);
            }
        });
    });

    // Prev Buttons
    document.querySelectorAll('.prev-step').forEach(btn => {
        btn.addEventListener('click', () => {
            if (currentStep > 1) {
                currentStep--;
                showStep(currentStep);
            }
        });
    });

    // Time Slot Selection
    document.querySelectorAll('.time-slot').forEach(slot => {
        slot.addEventListener('click', function () {
            document.querySelectorAll('.time-slot').forEach(s => s.classList.remove('selected'));
            this.classList.add('selected');
        });
    });

    // Form Submit logic with LocalStorage
    const bookingForm = document.getElementById('bookingForm');
    if (bookingForm) {
        bookingForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Gather data
            const name = bookingForm.querySelector('input[type="text"]').value;
            const phone = bookingForm.querySelector('input[type="tel"]').value;
            const date = bookingForm.querySelector('input[type="date"]').value;
            const barber = bookingForm.querySelector('input[name="barber"]:checked').value;

            // Get selected services
            const selectedServices = [];
            let totalPrice = 0;
            bookingForm.querySelectorAll('input[name="service"]:checked').forEach(cb => {
                // Find parent card to get details
                const card = cb.closest('.service-option-card');
                const title = card.querySelector('.opt-title').innerText;
                const priceStr = card.querySelector('.opt-price').innerText;
                const price = parseInt(priceStr.match(/\d+/)[0]);

                selectedServices.push(title);
                totalPrice += price;
            });

            // Get selected time
            const selectedTimeBtn = document.querySelector('.time-slot.selected');
            const time = selectedTimeBtn ? selectedTimeBtn.innerText : 'غير محدد';

            if (selectedServices.length === 0) {
                alert('الرجاء اختيار خدمة واحدة على الأقل');
                return;
            }

            const newBooking = {
                id: Date.now(), // unique ID
                name: name,
                phone: phone,
                barber: barber,
                date: date,
                time: time,
                service: selectedServices.join(', '),
                price: totalPrice,
                status: 'pending'
            };

            // Save to LocalStorage
            const bookings = JSON.parse(localStorage.getItem('barberBookings') || '[]');
            bookings.unshift(newBooking); // Add to top
            localStorage.setItem('barberBookings', JSON.stringify(bookings));

            alert('🎉 تم حجز موعدك بنجاح! يمكنك رؤية الحجز في لوحة تحكم الأدمن.');
            window.location.reload();
        });
    }

    // Mobile Menu
    const toggle = document.querySelector('.mobile-toggle');
    if (toggle) {
        toggle.addEventListener('click', () => {
            // Toggle Menu
            const navMenu = document.getElementById('navMenu');
            navMenu.classList.toggle('active');

            // Toggle Icon Animation (Optional)
            toggle.classList.toggle('active');
        });
    }

    // Service Worker Registration
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./sw.js')
            .then(reg => console.log('SW registered!', reg))
            .catch(err => console.log('SW failed', err));
    }
});
