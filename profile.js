document.addEventListener('DOMContentLoaded', () => {

    // KRİTİK DÜZELTME: Toast Bildirim Fonksiyonu (Kaybolmama sorunu GİDERİLDİ)
    function showNotification(message, type = 'success') {
        const container = document.getElementById('notification-container');
        if (!container) return; 
        
        const notification = document.createElement('div');
        notification.className = `toast-notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // ZORUNLU GECİKME (CRITICAL FIX): Tarayıcının bildirimi DOM'da çizmesini sağlar.
        setTimeout(() => {
            
            // 4 saniye sonra, kaybolma işlemini başlat
            setTimeout(() => {
                notification.classList.add('hide'); 
                
                // CSS geçişi (transition) bittikten sonra DOM'dan tamamen kaldır
                notification.addEventListener('transitionend', function handler() {
                    notification.remove();
                    // Olay dinleyicisini kaldırırız
                    notification.removeEventListener('transitionend', handler); 
                });
            }, 4000); // 4 saniye sonra kaybolma başlar

        }, 10); // 10 milisaniye gecikme, tarayıcının animasyonu başlatmasını sağlar
    }
    
    // Yardımcı fonksiyon: Header navigasyonunu kurar
    function setupNavigation() {
        const mainNav = document.getElementById('main-nav');
        if (mainNav) { 
            mainNav.innerHTML = `
                <ul>
                    <li><a href="feed.html">Akış</a></li>
                    <li><a href="explore.html">Keşfet</a></li>
                    <li><a href="messages.html">Mesajlar</a></li>
                </ul>
                <div class="user-actions">
                    <a href="profile.html" class="nav-button-secondary">Profilim</a>
                    <button id="logout-btn" class="nav-button-primary">Çıkış Yap</button>
                </div>
            `;
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.addEventListener('click', () => {
                     firebase.auth().signOut().then(() => {
                        window.location.href = 'avukat.html';
                     });
                });
            }
        }
    }
    setupNavigation(); 

    // Varsayılan Resim URL'leri
    const DEFAULT_BANNER = 'https://picsum.photos/id/1060/1500/500';
    const DEFAULT_PROFILE_PIC = 'https://picsum.photos/id/237/150/150';

    // Element Seçimleri ve Firebase Global Tanımlar
    const auth = firebase.auth();
    const db = firebase.firestore();
    const storage = firebase.storage();
    const displayNameElement = document.getElementById('display-name');
    const usernameElement = document.getElementById('username');
    const bioElement = document.getElementById('bio');
    const baroNoElement = document.getElementById('baro-no');
    const joinDateElement = document.getElementById('join-date');
    const bannerImg = document.getElementById('banner-img');
    const profileImg = document.getElementById('profile-img');
    const postProfileImg = document.getElementById('post-profile-img');
    const profileActions = document.querySelector('.profile-actions');
    const postTextarea = document.getElementById('post-textarea');
    const sharePostBtn = document.getElementById('share-post-btn');
    const feedContainer = document.getElementById('feed-container');
    const profileTabs = document.querySelector('.profile-tabs');
    const createPostContainer = document.querySelector('.create-post-container');
    const editProfileBtn = document.querySelector('.edit-profile-btn');
    const editProfileModal = document.getElementById('edit-profile-modal');
    const closeEditModalBtn = document.getElementById('close-edit-modal');
    const editProfileForm = document.getElementById('edit-profile-form');
    const editUsernameInput = document.getElementById('edit-username');
    const editBioInput = document.getElementById('edit-bio');
    const bannerUploadInput = document.getElementById('banner-upload');
    const profilePicUploadInput = document.getElementById('profile-pic-upload');
    const editStatusMessage = document.getElementById('edit-status-message');
    const removeBannerBtn = document.getElementById('remove-banner-btn');
    const removeProfilePicBtn = document.getElementById('remove-profile-pic-btn');
    const modalBannerPreview = document.getElementById('modal-banner-preview');
    const modalProfilePreview = document.getElementById('modal-profile-preview');
    const writeArticleBtn = document.getElementById('write-article-btn');
    const createArticleModal = document.getElementById('create-article-modal');
    const closeArticleModalBtn = document.getElementById('close-article-modal');
    const createArticleForm = document.getElementById('create-article-form');
    const articleTitleInput = document.getElementById('article-title');
    const articleContentInput = document.getElementById('article-content');

    let currentUser = null;

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadUserProfile(user.uid);
            loadUserContent(user.uid, 'post');
            if(profileActions) profileActions.style.display = 'block'; 
        } else {
            window.location.href = 'avukat.html';
        }
    });

    function loadUserProfile(uid) {
        db.collection('users').doc(uid).get().then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                if(displayNameElement) displayNameElement.textContent = userData.kullaniciAdi || "İsim Belirtilmemiş";
                if(usernameElement) usernameElement.textContent = `@${(userData.kullaniciAdi || "kullanici").toLowerCase()}`;
                if(bioElement) bioElement.textContent = userData.bio || "Henüz bir biyografi eklenmemiş.";
                if(baroNoElement) baroNoElement.innerHTML = `<i class="fas fa-gavel"></i> Baro No: ${userData.baroNumarasi || "Belirtilmemiş"}`;
                if (userData.katilimTarihi && joinDateElement) {
                    const date = new Date(userData.katilimTarihi);
                    const options = { year: 'numeric', month: 'long' };
                    const formattedDate = date.toLocaleDateString('tr-TR', options);
                    joinDateElement.innerHTML = `<i class="fas fa-calendar-alt"></i> ${formattedDate} tarihinde katıldı`;
                } else if (joinDateElement) { joinDateElement.style.display = 'none'; }
                
                const bannerSrc = userData.arkaPlanUrl || DEFAULT_BANNER;
                const profileSrc = userData.profilResmiUrl || DEFAULT_PROFILE_PIC;
                
                if(bannerImg) bannerImg.src = bannerSrc;
                if(profileImg) profileImg.src = profileSrc;
                if(postProfileImg) postProfileImg.src = profileSrc;

                if(bannerImg) bannerImg.onload = () => bannerImg.classList.add('loaded');
                if(profileImg) profileImg.onload = () => profileImg.classList.add('loaded');
                if(postProfileImg) postProfileImg.onload = () => postProfileImg.classList.add('loaded');
            }
        });
    }

    if (sharePostBtn) {
        sharePostBtn.addEventListener('click', () => {
            if (!postTextarea) return;
            const postContent = postTextarea.value;
            if (postContent.trim() === "") { return alert("Lütfen bir şeyler yazın."); }
            sharePostBtn.disabled = true;
            sharePostBtn.textContent = "Paylaşılıyor...";
            db.collection('posts').add({
                authorId: currentUser.uid,
                authorName: displayNameElement ? displayNameElement.textContent : 'Bilinmiyor',
                authorUsername: usernameElement ? usernameElement.textContent : 'Bilinmiyor',
                authorPhotoUrl: profileImg ? profileImg.src : DEFAULT_PROFILE_PIC,
                content: postContent,
                type: 'post',
                isFeatured: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                postTextarea.value = "";
                showNotification("Gönderiniz başarıyla paylaşıldı.", "success");
            }).catch(error => {
                console.error("Gönderi paylaşılırken hata:", error);
                showNotification("Gönderi paylaşılırken hata oluştu.", "error");
            }).finally(() => {
                sharePostBtn.disabled = false;
                sharePostBtn.textContent = "Paylaş";
            });
        });
    }
    
    if (writeArticleBtn) writeArticleBtn.addEventListener('click', () => { if(createArticleModal) createArticleModal.style.display = 'flex'; });
    if (closeArticleModalBtn) closeArticleModalBtn.addEventListener('click', () => { if(createArticleModal) createArticleModal.style.display = 'none'; });

    if (createArticleForm) {
        createArticleForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!articleTitleInput || !articleContentInput) return;
            const title = articleTitleInput.value;
            const content = articleContentInput.value;
            if (!title.trim() || !content.trim()) return alert('Başlık ve içerik boş olamaz.');

            db.collection('posts').add({
                authorId: currentUser.uid,
                authorName: displayNameElement ? displayNameElement.textContent : 'Bilinmiyor',
                authorUsername: usernameElement ? usernameElement.textContent : 'Bilinmiyor',
                authorPhotoUrl: profileImg ? profileImg.src : DEFAULT_PROFILE_PIC,
                title: title,
                content: content,
                type: 'article',
                isFeatured: false,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }).then(() => {
                createArticleForm.reset();
                if(createArticleModal) createArticleModal.style.display = 'none';
                if (profileTabs) {
                    const articleTab = profileTabs.querySelector('a[data-type="article"]');
                    if(articleTab) articleTab.click();
                }
                showNotification("Makaleniz başarıyla yayınlandı.", "success");
            }).catch(error => {
                console.error("Makale paylaşılırken hata:", error);
                showNotification("Makale yayınlanırken hata oluştu.", "error");
            });
        });
    }

    if (profileTabs) {
        profileTabs.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target;
            if (target.tagName === 'A') {
                if (target.dataset.type === 'media') {
                    return alert('Bu özellik yakında eklenecektir.');
                }
                const activeLi = profileTabs.querySelector('li.active');
                if(activeLi) activeLi.classList.remove('active');
                target.parentElement.classList.add('active');
                loadUserContent(currentUser.uid, target.dataset.type);
            }
        });
    }

    function loadUserContent(uid, type) {
        
        if (!feedContainer || !createPostContainer) return; 

        createPostContainer.style.display = (type === 'post' || type === 'article') ? 'flex' : 'none';
        
        feedContainer.style.opacity = '0';
        setTimeout(() => {
            let query;
            let emptyMessage = "İçerik bulunamadı.";

            if (type === 'post') {
                query = db.collection('posts').where('authorId', '==', uid).where('type', '==', 'post');
                emptyMessage = "Henüz hiç gönderi paylaşılmamış.";
            } else if (type === 'article') {
                query = db.collection('posts').where('authorId', '==', uid).where('type', '==', 'article');
                emptyMessage = "Henüz hiç makale paylaşılmamış.";
            } else if (type === 'featured') {
                query = db.collection('posts').where('authorId', '==', uid).where('isFeatured', '==', true);
                emptyMessage = "Henüz öne çıkarılan bir gönderi yok.";
            } else {
                return; 
            }

            feedContainer.innerHTML = `<p>İçerik yükleniyor...</p>`;

            query.orderBy('createdAt', 'desc').onSnapshot(querySnapshot => {
                  if (querySnapshot.empty) {
                      feedContainer.innerHTML = `<p>${emptyMessage}</p>`;
                  } else {
                      let contentHTML = "";
                      querySnapshot.forEach(doc => {
                          const item = doc.data();
                          const itemId = doc.id;
                          const itemDate = item.createdAt ? item.createdAt.toDate().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : '';
                          const pinButtonText = item.isFeatured ? "Öne Çıkarmayı Kaldır" : "Öne Çıkar";
                          
                          let itemHTML = `<div class="post ${item.type === 'article' ? 'article' : ''}">`;
                          if (item.type !== 'article') {
                            itemHTML += `<div class="post-author-photo-wrapper"><img src="${item.authorPhotoUrl || DEFAULT_PROFILE_PIC}" alt="profil resmi" class="post-author-photo"></div>`;
                          }
                          itemHTML += `<div class="post-body">
                                        <div class="post-author-info">
                                            <span class="post-author-name">${item.authorName}</span>
                                            <span class="post-author-username">${item.authorUsername} · ${itemDate}</span>
                                        </div>`;
                          if (item.type === 'article') {
                              itemHTML += `<h3 class="article-title">${item.title}</h3>
                                           <p class="post-content">${item.content.substring(0, 250)}...</p>`;
                          } else {
                              itemHTML += `<p class="post-content">${item.content.replace(/\n/g, '<br>')}</p>`;
                          }
                          itemHTML += `</div>
                                       <div class="post-actions-menu">
                                           <div class="three-dots-icon" data-id="${itemId}"><i class="fas fa-ellipsis-h"></i></div> 
                                           <div id="dropdown-${itemId}" class="dropdown-content">
                                               <a href="#" class="edit-post-btn" data-id="${itemId}">Gönderiyi Düzenle</a>
                                               <a href="#" class="pin-post-btn" data-id="${itemId}" data-featured="${!!item.isFeatured}">${pinButtonText}</a>
                                               <a href="#" class="delete-post-btn delete" data-id="${itemId}">Gönderiyi Sil</a>
                                           </div>
                                       </div>
                                   </div>`;
                          contentHTML += itemHTML;
                      });
                      feedContainer.innerHTML = contentHTML;
                  }
                  feedContainer.style.opacity = '1';
              }, error => {
                  console.error(`${type} yüklenirken hata:`, error);
                  if (error.code === 'permission-denied') {
                      feedContainer.innerHTML = `<p>⚠️ Veritabanı izin hatası. Lütfen Firebase kurallarınızı kontrol edin.</p>`;
                  } else {
                      feedContainer.innerHTML = `<p>İçerik yüklenirken bir hata oluştu.</p>`;
                  }
                  feedContainer.style.opacity = '1';
              });
        }, 300);
    }

    if (feedContainer) {
        feedContainer.addEventListener('click', (e) => {
            const targetIcon = e.target.closest('.three-dots-icon');
            if (targetIcon) {
                const postId = targetIcon.dataset.id;
                const dropdown = document.getElementById(`dropdown-${postId}`);
                document.querySelectorAll('.dropdown-content.show').forEach(menu => {
                    if (menu.id !== dropdown.id) { menu.classList.remove('show'); }
                });
                const iconRect = targetIcon.getBoundingClientRect();
                const spaceBelow = window.innerHeight - iconRect.bottom;
                if (spaceBelow < 150) { dropdown.classList.add('dropdown-up'); } 
                else { dropdown.classList.remove('dropdown-up'); }
                if(dropdown) dropdown.classList.toggle('show');
            }
            
            if (e.target.classList.contains('pin-post-btn')) {
                e.preventDefault();
                const postId = e.target.dataset.id;
                const isCurrentlyFeatured = e.target.dataset.featured === 'true';
                db.collection('posts').doc(postId).update({ isFeatured: !isCurrentlyFeatured })
                  .then(() => {
                      showNotification(`Gönderi başarıyla ${isCurrentlyFeatured ? 'öne çıkarılanlardan kaldırıldı' : 'öne çıkarıldı'}.`, "success");
                  }).catch(error => {
                       console.error("Öne çıkarılırken hata:", error);
                       showNotification("İşlem sırasında hata oluştu.", "error");
                  });
            }

            if (e.target.classList.contains('delete-post-btn')) {
                e.preventDefault();
                const postId = e.target.dataset.id;
                if (confirm("Bu gönderiyi kalıcı olarak silmek istediğinizden emin misiniz?")) {
                    db.collection('posts').doc(postId).delete()
                       .then(() => showNotification("Gönderi silindi.", "success"))
                       .catch(error => {
                           console.error("Gönderi silinirken hata:", error);
                           showNotification("Silme işlemi başarısız.", "error");
                       });
                }
            }
            if (e.target.classList.contains('edit-post-btn')) { e.preventDefault(); alert("Gönderi düzenleme özelliği yakında eklenecektir."); }
        });
    }

    window.addEventListener('click', (e) => {
        if (!e.target.closest('.three-dots-icon')) {
            document.querySelectorAll('.dropdown-content.show').forEach(menu => {
                menu.classList.remove('show');
            });
        }
    });

    if (editProfileBtn) {
        editProfileBtn.addEventListener('click', () => {
            if (!editProfileModal || !currentUser) return;
            db.collection('users').doc(currentUser.uid).get().then(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    if(editUsernameInput) editUsernameInput.value = userData.kullaniciAdi || '';
                    if(editBioInput) editBioInput.value = userData.bio || '';
                    if(modalBannerPreview) modalBannerPreview.src = userData.arkaPlanUrl || DEFAULT_BANNER;
                    if(modalProfilePreview) modalProfilePreview.src = userData.profilResmiUrl || DEFAULT_PROFILE_PIC;
                    editProfileModal.style.display = 'flex';
                }
            });
        });
    }
    
    if (closeEditModalBtn) closeEditModalBtn.addEventListener('click', () => { if (editProfileModal) editProfileModal.style.display = 'none'; });

    if (removeBannerBtn) {
        removeBannerBtn.addEventListener('click', () => {
            if (confirm("Arka plan resmini kaldırmak istediğinizden emin misiniz?")) {
                db.collection('users').doc(currentUser.uid).update({ arkaPlanUrl: "" }).then(() => { window.location.reload(); });
            }
        });
    }
    if (removeProfilePicBtn) {
        removeProfilePicBtn.addEventListener('click', () => {
            if (confirm("Profil resmini kaldırmak istediğinizden emin misiniz?")) {
                db.collection('users').doc(currentUser.uid).update({ profilResmiUrl: "" }).then(() => { window.location.reload(); });
            }
        });
    }

    if (editProfileForm) {
        editProfileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser || !editStatusMessage) return;
            
            editStatusMessage.textContent = 'Kaydediliyor...';
            const bannerFile = bannerUploadInput ? bannerUploadInput.files[0] : null;
            const profileFile = profilePicUploadInput ? profilePicUploadInput.files[0] : null;

            try {
                const doc = await db.collection('users').doc(currentUser.uid).get();
                let { arkaPlanUrl, profilResmiUrl } = doc.data();
                if (bannerFile) {
                    const bannerRef = storage.ref(`banners/${currentUser.uid}/${bannerFile.name}`);
                    await bannerRef.put(bannerFile);
                    arkaPlanUrl = await bannerRef.getDownloadURL();
                }
                if (profileFile) {
                    const profileRef = storage.ref(`profile_pics/${currentUser.uid}/${profileFile.name}`);
                    await profileRef.put(profileFile);
                    profilResmiUrl = await profileRef.getDownloadURL();
                }
                const updatedData = {
                    kullaniciAdi: editUsernameInput ? editUsernameInput.value : '',
                    bio: editBioInput ? editBioInput.value : '',
                    arkaPlanUrl: arkaPlanUrl,
                    profilResmiUrl: profilResmiUrl
                };
                await db.collection('users').doc(currentUser.uid).update(updatedData);
                editStatusMessage.textContent = 'Başarıyla kaydedildi!';
                
                showNotification("Profiliniz başarıyla güncellendi.", "success");
                
                setTimeout(() => {
                    if (editProfileModal) editProfileModal.style.display = 'none';
                    window.location.reload();
                }, 1500);
            } catch (error) { 
                editStatusMessage.textContent = `Hata: ${error.message}`; 
                showNotification("Profil güncellenirken hata oluştu.", "error");
            }
        });
    }
});