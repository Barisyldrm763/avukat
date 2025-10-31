document.addEventListener('DOMContentLoaded', () => {

    // --- BÖLÜM 0: GLOBAL DEĞİŞKENLER ---
    const auth = firebase.auth();
    const db = firebase.firestore();


    // --- BÖLÜM 1: MODAL (POP-UP) KONTROLÜ ---
    const authModal = document.getElementById('auth-modal');
    const loginBtn = document.getElementById('login-btn');
    const registerBtn = document.getElementById('register-btn');
    const closeModalBtn = document.getElementById('close-modal');
    const loginView = document.getElementById('login-view');
    const registerView = document.getElementById('register-view');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');

    if (authModal) {
        const openModal = () => { authModal.style.display = 'flex'; };
        const closeModal = () => {
            authModal.style.display = 'none';
            const loginError = document.getElementById('login-error');
            const registerError = document.getElementById('register-error');
            if (loginError) loginError.style.display = 'none';
            if (registerError) registerError.style.display = 'none';
        };

        loginBtn.addEventListener('click', (e) => { e.preventDefault(); registerView.style.display = 'none'; loginView.style.display = 'block'; openModal(); });
        registerBtn.addEventListener('click', (e) => { e.preventDefault(); loginView.style.display = 'none'; registerView.style.display = 'block'; openModal(); });
        closeModalBtn.addEventListener('click', closeModal);
        authModal.addEventListener('click', (e) => { if (e.target === authModal) { closeModal(); } });
        showRegisterLink.addEventListener('click', (e) => { e.preventDefault(); loginView.style.display = 'none'; registerView.style.display = 'block'; });
        showLoginLink.addEventListener('click', (e) => { e.preventDefault(); registerView.style.display = 'none'; loginView.style.display = 'block'; });
    }


    // --- BÖLÜM 2: FIREBASE AUTHENTICATION İŞLEMLERİ ---
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    
    // DÜZENLENDİ: Kayıt işlemi artık katılım tarihini sunucu saatiyle kaydediyor
    if (registerForm) {
        registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const username = document.getElementById('register-username').value;
            const email = document.getElementById('register-email').value;
            const baroNo = document.getElementById('register-baro').value;
            const password = document.getElementById('register-password').value;
            const errorP = document.getElementById('register-error');

            auth.createUserWithEmailAndPassword(email, password)
                .then(userCredential => {
                    const user = userCredential.user;
                    // Veritabanına yeni alanı da ekleyerek kaydet
                    return db.collection('users').doc(user.uid).set({
                        kullaniciAdi: username,
                        baroNumarasi: baroNo,
                        email: email,
                        katilimTarihi: firebase.firestore.FieldValue.serverTimestamp() // Kayıt tarihi sunucu zaman damgası olarak eklendi
                    });
                })
                .then(() => {
                    // Kayıttan sonra doğrudan profile yönlendir
                    window.location.href = 'profile.html';
                })
                .catch(error => {
                    errorP.textContent = `Hata: ${error.message}`;
                    errorP.style.display = 'block';
                });
        });
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;
            const errorP = document.getElementById('login-error');

            auth.signInWithEmailAndPassword(email, password)
                .then(userCredential => {
                    console.log('Giriş yapıldı:', userCredential.user);
                    loginForm.reset();
                    // Giriş yapınca profile yönlendir
                    window.location.href = 'profile.html';
                })
                .catch(error => {
                    errorP.textContent = `Hata: ${error.message}`;
                    errorP.style.display = 'block';
                });
        });
    }


    // --- BÖLÜM 3: SAYFANIN DİĞER FONKSİYONLARI ---
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');

    if (contactForm) {
        contactForm.addEventListener('submit', function(event) {
            event.preventDefault();
            formStatus.innerHTML = '<p style="color: green;">Mesajınız başarıyla gönderildi!</p>';
            contactForm.reset();
            setTimeout(() => { formStatus.innerHTML = ''; }, 3000);
        });
    }
    
    const sections = document.querySelectorAll('section');
    const navLinks = document.querySelectorAll('header nav ul a');
    const activateMenuLink = () => {
        let currentSectionId = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            if (window.scrollY >= sectionTop - 75) {
                currentSectionId = section.getAttribute('id');
            }
        });

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    };
    window.addEventListener('scroll', activateMenuLink);
});