document.addEventListener('DOMContentLoaded', () => {

    const auth = firebase.auth();
    const db = firebase.firestore();

    const userProfilePic = document.getElementById('user-profile-pic');
    const userDisplayName = document.getElementById('user-display-name');
    const userUsername = document.getElementById('user-username');
    const postProfileImg = document.getElementById('post-profile-img');
    const postTextarea = document.getElementById('post-textarea');
    const sharePostBtn = document.getElementById('share-post-btn');
    const feedStream = document.getElementById('feed-stream');
    const logoutBtn = document.getElementById('logout-btn');

    let currentUser = null;

    // Kullanıcı oturum durumunu dinle
    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadUserInfo(user.uid);
            loadFeedPosts();
        } else {
            // Kullanıcı oturum açmamışsa giriş sayfasına yönlendir
            window.location.href = 'avukat.html';
        }
    });

    // Kullanıcı bilgilerini yükle
    function loadUserInfo(uid) {
        db.collection('users').doc(uid).get().then(doc => {
            if (doc.exists) {
                const userData = doc.data();
                userDisplayName.textContent = userData.kullaniciAdi || "İsim Belirtilmemiş";
                userUsername.textContent = `@${(userData.kullaniciAdi || "kullanici").toLowerCase()}`;
                const profileSrc = userData.profilResmiUrl || 'https://picsum.photos/id/237/150/150';
                userProfilePic.src = profileSrc;
                postProfileImg.src = profileSrc;
            }
        }).catch(error => {
            console.error("Kullanıcı bilgileri yüklenirken hata:", error);
        });
    }

    // Tüm gönderileri akışa yükle
    function loadFeedPosts() {
        feedStream.innerHTML = `<p style="text-align: center;">Akış yükleniyor...</p>`;

        db.collection('posts').orderBy('createdAt', 'desc').onSnapshot(querySnapshot => {
            if (querySnapshot.empty) {
                feedStream.innerHTML = `<p style="text-align: center;">Henüz hiç gönderi paylaşılmamış.</p>`;
            } else {
                let postsHTML = "";
                querySnapshot.forEach(doc => {
                    const post = doc.data();
                    const postDate = post.createdAt ? post.createdAt.toDate().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' }) : '';

                    // Sadece 'post' türündeki gönderileri göster (makaleleri hariç tut)
                    if (post.type === 'post') {
                        postsHTML += `
                            <div class="post">
                                <div class="post-author-photo-wrapper">
                                    <img src="${post.authorPhotoUrl || 'https://picsum.photos/id/237/50/50'}" alt="profil resmi" class="post-author-photo">
                                </div>
                                <div class="post-body">
                                    <div class="post-author-info">
                                        <span class="post-author-name">${post.authorName}</span>
                                        <span class="post-author-username">${post.authorUsername} · ${postDate}</span>
                                    </div>
                                    <p class="post-content">${post.content.replace(/\n/g, '<br>')}</p>
                                </div>
                            </div>
                        `;
                    }
                });
                feedStream.innerHTML = postsHTML || `<p style="text-align: center;">Henüz hiç gönderi paylaşılmamış.</p>`;
            }
        }, error => {
            console.error("Akış gönderileri yüklenirken hata:", error);
            feedStream.innerHTML = `<p style="text-align: center;">Akış yüklenirken bir hata oluştu.</p>`;
        });
    }

    // Yeni gönderi paylaşma
    sharePostBtn.addEventListener('click', () => {
        const postContent = postTextarea.value;
        if (postContent.trim() === "") {
            return alert("Lütfen bir şeyler yazın.");
        }

        sharePostBtn.disabled = true;
        sharePostBtn.textContent = "Paylaşılıyor...";

        db.collection('posts').add({
            authorId: currentUser.uid,
            authorName: userDisplayName.textContent,
            authorUsername: userUsername.textContent,
            authorPhotoUrl: userProfilePic.src,
            content: postContent,
            type: 'post',
            isFeatured: false,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            postTextarea.value = "";
        }).catch(error => {
            console.error("Gönderi paylaşılırken hata:", error);
        }).finally(() => {
            sharePostBtn.disabled = false;
            sharePostBtn.textContent = "Paylaş";
        });
    });

    // Çıkış yapma işlevi
    logoutBtn.addEventListener('click', () => {
        auth.signOut().then(() => {
            window.location.href = 'index.html';
        }).catch(error => {
            console.error("Çıkış yapılırken hata:", error);
            alert("Çıkış yapılırken bir hata oluştu.");
        });
    });

});
