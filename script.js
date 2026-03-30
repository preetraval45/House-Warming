/* =============================================
   HOUSEWARMING INVITATION - MAIN SCRIPT
   ============================================= */

document.addEventListener('DOMContentLoaded', () => {
    initCountdown();
    initNavigation();
    initScrollAnimations();
    initFAQ();
    initRSVPForm();
    initParticles();
});

/* =============================================
   COUNTDOWN TIMER
   ============================================= */
function initCountdown() {
    const eventDate = new Date('April 19, 2026 16:00:00').getTime();

    function updateCountdown() {
        const now = new Date().getTime();
        const distance = eventDate - now;

        if (distance <= 0) {
            document.getElementById('days').textContent = '00';
            document.getElementById('hours').textContent = '00';
            document.getElementById('minutes').textContent = '00';
            document.getElementById('seconds').textContent = '00';

            const countdown = document.getElementById('countdown');
            if (countdown) {
                countdown.innerHTML = '<p style="color: var(--color-gold-light); font-size: 1.3rem; font-family: var(--font-heading);">The celebration is here! 🎉</p>';
            }
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('days').textContent = String(days).padStart(2, '0');
        document.getElementById('hours').textContent = String(hours).padStart(2, '0');
        document.getElementById('minutes').textContent = String(minutes).padStart(2, '0');
        document.getElementById('seconds').textContent = String(seconds).padStart(2, '0');
    }

    updateCountdown();
    setInterval(updateCountdown, 1000);
}

/* =============================================
   NAVIGATION
   ============================================= */
function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Scroll effect on navbar
    function handleScroll() {
        if (window.scrollY > 80) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Update active nav link based on scroll position
        updateActiveLink();
    }

    window.addEventListener('scroll', handleScroll, { passive: true });

    // Mobile toggle
    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('open');
        document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
    });

    // Close menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('open');
            document.body.style.overflow = '';
        });
    });

    // Close on outside click
    document.addEventListener('click', (e) => {
        if (navMenu.classList.contains('open') &&
            !navMenu.contains(e.target) &&
            !navToggle.contains(e.target)) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('open');
            document.body.style.overflow = '';
        }
    });

    // Update active navigation link
    function updateActiveLink() {
        const sections = document.querySelectorAll('section[id]');
        const scrollPos = window.scrollY + 150;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');
            const link = document.querySelector(`.nav-link[href="#${id}"]`);

            if (link) {
                if (scrollPos >= top && scrollPos < top + height) {
                    navLinks.forEach(l => l.classList.remove('active'));
                    link.classList.add('active');
                }
            }
        });
    }
}

/* =============================================
   SCROLL ANIMATIONS
   ============================================= */
function initScrollAnimations() {
    const elements = document.querySelectorAll('.animate-on-scroll');

    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        });

        elements.forEach(el => observer.observe(el));
    } else {
        // Fallback: show all elements
        elements.forEach(el => el.classList.add('visible'));
    }
}

/* =============================================
   FAQ ACCORDION
   ============================================= */
function initFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question.addEventListener('click', () => {
            const isOpen = item.classList.contains('open');

            // Close all others
            faqItems.forEach(other => {
                if (other !== item) {
                    other.classList.remove('open');
                    other.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
                }
            });

            // Toggle current
            item.classList.toggle('open');
            question.setAttribute('aria-expanded', !isOpen);
        });
    });
}

/* =============================================
   RSVP FORM
   ============================================= */
function initRSVPForm() {
    const form = document.getElementById('rsvpForm');
    const submitBtn = document.getElementById('submitBtn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Validate
        if (!validateForm(form)) return;

        // Show loading
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
        submitBtn.disabled = true;

        // Collect form data
        const formData = {
            attending: form.querySelector('input[name="attending"]:checked')?.value || '',
            fullName: form.fullName.value.trim(),
            email: form.email.value.trim(),
            phone: form.phone.value.trim(),
            adults: form.adults.value,
            children: form.children.value,
            dietary: form.dietary.value.trim(),
            message: form.message.value.trim(),
            submittedAt: new Date().toISOString(),
            timestamp: Date.now()
        };

        try {
            // Save to Firebase
            if (typeof firebase !== 'undefined' && firebase.database) {
                const db = firebase.database();
                await db.ref('rsvps').push(formData);
            } else {
                // Fallback: save to localStorage if Firebase is not configured
                const existing = JSON.parse(localStorage.getItem('rsvps') || '[]');
                existing.push(formData);
                localStorage.setItem('rsvps', JSON.stringify(existing));
                console.log('RSVP saved to localStorage (Firebase not configured)');
            }

            // Show success
            form.style.display = 'none';
            document.getElementById('rsvpSuccess').style.display = 'block';

        } catch (error) {
            console.error('Error submitting RSVP:', error);
            alert('There was an error submitting your RSVP. Please try again or contact us directly.');
        } finally {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
        }
    });
}

function validateForm(form) {
    let isValid = true;

    // Clear previous errors
    form.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));

    // Check attendance
    const attending = form.querySelector('input[name="attending"]:checked');
    if (!attending) {
        highlightRadioError(form.querySelector('.radio-group'));
        isValid = false;
    }

    // Check required fields
    const requiredFields = ['fullName', 'email', 'adults'];
    requiredFields.forEach(field => {
        const input = form[field];
        if (!input.value.trim()) {
            input.classList.add('error');
            isValid = false;
        }
    });

    // Validate email format
    const email = form.email.value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        form.email.classList.add('error');
        isValid = false;
    }

    if (!isValid) {
        // Scroll to first error
        const firstError = form.querySelector('.error, .radio-error');
        if (firstError) {
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    return isValid;
}

function highlightRadioError(radioGroup) {
    radioGroup.style.outline = '2px solid var(--color-error)';
    radioGroup.style.borderRadius = 'var(--radius-sm)';
    radioGroup.style.padding = '4px';

    setTimeout(() => {
        radioGroup.style.outline = '';
        radioGroup.style.padding = '';
    }, 3000);
}

// Reset form for another submission
function resetForm() {
    const form = document.getElementById('rsvpForm');
    const success = document.getElementById('rsvpSuccess');
    form.reset();
    form.style.display = 'block';
    success.style.display = 'none';
}

// Make resetForm available globally
window.resetForm = resetForm;

/* =============================================
   PARTICLES BACKGROUND
   ============================================= */
function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;

    // Reduce particles on mobile for performance
    const isMobile = window.innerWidth < 768;
    const count = isMobile ? 12 : 25;

    for (let i = 0; i < count; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = Math.random() * 100 + '%';
        particle.style.width = (Math.random() * 4 + 3) + 'px';
        particle.style.height = particle.style.width;
        particle.style.animationDuration = (Math.random() * 15 + 10) + 's';
        particle.style.animationDelay = (Math.random() * 10) + 's';
        particle.style.opacity = (Math.random() * 0.15 + 0.05).toString();
        container.appendChild(particle);
    }
}

/* =============================================
   SMOOTH SCROLL (fallback for older browsers)
   ============================================= */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth' });
        }
    });
});
