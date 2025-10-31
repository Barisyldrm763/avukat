document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    // Filtre elemanlarını seç
    const searchInput = document.getElementById('search-input');
    const uzmanlikFilter = document.getElementById('uzmanlik-filter');
    const sehirFilter = document.getElementById('sehir-filter');     
    
    const resultsContainer = document.getElementById('results-container');
    const logoutBtn = document.getElementById('logout-btn');

    let allUsers = []; // Tüm kullanıcıları burada saklayacağız

    // Oturum kontrolü
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'avukat.html';
        } else {
            loadAllUsers();
        }
    });

    // Tüm avukatları Firestore'dan yükle
    async function loadAllUsers() {
        try {
            const snapshot = await db.collection('users').get();
            allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            applyFilters(); // Veri yüklendikten sonra filtreleri uygula (başlangıçta tümü gösterilir)
        } catch (error) {
            console.error("Kullanıcılar yüklenirken hata:", error);
            resultsContainer.innerHTML = '<p>Avukatlar yüklenirken bir hata oluştu.</p>';
        }
    }

    // Kullanıcıları ekranda göster
    function displayUsers(users) {
        if (users.length === 0) {
            resultsContainer.innerHTML = '<p>Arama kriterlerinize uygun avukat bulunamadı.</p>';
            return;
        }

        let usersHTML = '';
        users.forEach(user => {
            const profilePic = user.profilResmiUrl || 'https://picsum.photos/id/237/100/100';
            usersHTML += `
                <div class="user-card">
                    <img src="${profilePic}" alt="Profil Resmi">
                    <h3>${user.kullaniciAdi || 'İsim Yok'}</h3>
                    <p>Baro No: ${user.baroNumarasi || 'Belirtilmemiş'}</p>
                    
                    ${user.uzmanlikAlani ? `<p style="color: #0056b3; font-weight: bold; margin-top: 5px;">${user.uzmanlikAlani}</p>` : ''}
                    ${user.sehir ? `<p style="color: #666; font-size: 14px; margin-top: 5px;">${user.sehir}</p>` : ''}
                    
                    <a href="profile.html?uid=${user.id}" class="profile-link-btn">Profiline Git</a>
                </div>
            `;
        });
        resultsContainer.innerHTML = usersHTML;
    }

    // Tüm filtreleri uygulayan ana fonksiyon
    function applyFilters() {
        const searchTerm = searchInput.value.toLowerCase();
        const uzmanlik = uzmanlikFilter.value;
        const sehir = sehirFilter.value;

        let filteredUsers = allUsers;

        // 1. İsim filtresi
        if (searchTerm) {
            filteredUsers = filteredUsers.filter(user => 
                user.kullaniciAdi && user.kullaniciAdi.toLowerCase().includes(searchTerm)
            );
        }

        // 2. Uzmanlık filtresi
        if (uzmanlik !== 'tum') {
            filteredUsers = filteredUsers.filter(user => 
                user.uzmanlikAlani === uzmanlik
            );
        }

        // 3. Şehir filtresi
        if (sehir !== 'tum') {
            filteredUsers = filteredUsers.filter(user => 
                user.sehir === sehir
            );
        }

        displayUsers(filteredUsers);
    }

    // Tüm filtre elemanları için olay dinleyicileri
    searchInput.addEventListener('input', applyFilters);
    uzmanlikFilter.addEventListener('change', applyFilters);
    sehirFilter.addEventListener('change', applyFilters);

    // Çıkış Yap Butonu
    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'avukat.html';
            });
        });
    }

    // Dinamik olarak eklenen "Profiline Git" butonları için event delegation
    // (Eğer profile.html?uid=... linki yerine bir fonksiyon çalıştırsaydın gerekirdi,
    // a href kullandığın için şu an buna gerek yok.)
});