document.addEventListener('DOMContentLoaded', () => {
    const auth = firebase.auth();
    const db = firebase.firestore();

    const conversationsList = document.getElementById('conversations-list');
    const chatWelcome = document.getElementById('chat-welcome');
    const chatWindow = document.getElementById('chat-window');
    const chatHeaderName = document.getElementById('chat-header-name');
    const chatHeaderImg = document.getElementById('chat-header-img');
    const messagesArea = document.getElementById('messages-area');
    const messageForm = document.getElementById('message-form');
    const messageInput = document.getElementById('message-input');
    const logoutBtn = document.getElementById('logout-btn');

    let currentUser = null;
    let currentChatId = null;
    let unsubscribeMessages = null;

    auth.onAuthStateChanged(user => {
        if (user) {
            currentUser = user;
            loadConversations(user.uid);
        } else {
            window.location.href = 'avukat.html';
        }
    });

    async function loadConversations(userId) {
        // Kullanıcının dahil olduğu sohbetleri getir
        db.collection('conversations')
            .where('participants', 'array-contains', userId)
            .onSnapshot(async snapshot => {
                if (snapshot.empty) {
                    conversationsList.innerHTML = '<p>Henüz bir sohbetiniz yok.</p>';
                    return;
                }

                let conversationsHTML = '';
                for (const doc of snapshot.docs) {
                    const conversation = { id: doc.id, ...doc.data() };
                    const otherUserId = conversation.participants.find(p => p !== userId);
                    
                    // Diğer kullanıcının bilgilerini al
                    const userDoc = await db.collection('users').doc(otherUserId).get();
                    const otherUserData = userDoc.data();

                    const profilePic = otherUserData.profilResmiUrl || 'https://picsum.photos/id/237/50/50';
                    const lastMessage = conversation.lastMessage ? conversation.lastMessage.text.substring(0, 30) + '...' : 'Sohbeti başlatın...';
                    
                    conversationsHTML += `
                        <div class="conversation-item" data-id="${conversation.id}">
                            <img src="${profilePic}" alt="Profil Resmi">
                            <div class="conversation-details">
                                <h4>${otherUserData.kullaniciAdi}</h4>
                                <p>${lastMessage}</p>
                            </div>
                        </div>
                    `;
                }
                conversationsList.innerHTML = conversationsHTML;
                addConversationListeners();
            });
    }

    function addConversationListeners() {
        document.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', () => {
                // Önceki sohbetin dinleyicisini durdur
                if (unsubscribeMessages) {
                    unsubscribeMessages();
                }
                currentChatId = item.dataset.id;
                loadChat(currentChatId);

                // Aktif stili ayarla
                document.querySelectorAll('.conversation-item').forEach(i => i.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    async function loadChat(chatId) {
        chatWelcome.style.display = 'none';
        chatWindow.style.display = 'flex';

        const chatDoc = await db.collection('conversations').doc(chatId).get();
        const chatData = chatDoc.data();
        const otherUserId = chatData.participants.find(p => p !== currentUser.uid);
        
        const userDoc = await db.collection('users').doc(otherUserId).get();
        const otherUserData = userDoc.data();

        chatHeaderName.textContent = otherUserData.kullaniciAdi;
        chatHeaderImg.src = otherUserData.profilResmiUrl || 'https://picsum.photos/id/237/50/50';

        // Mesajları dinle
        unsubscribeMessages = db.collection('conversations').doc(chatId).collection('messages')
            .orderBy('createdAt', 'asc')
            .onSnapshot(snapshot => {
                messagesArea.innerHTML = '';
                snapshot.forEach(doc => {
                    const message = doc.data();
                    const messageClass = message.senderId === currentUser.uid ? 'sent' : 'received';
                    messagesArea.innerHTML += `<div class="message ${messageClass}">${message.text}</div>`;
                });
                // En alta kaydır
                messagesArea.scrollTop = messagesArea.scrollHeight;
            });
    }

    messageForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const text = messageInput.value;
        if (text.trim() === '' || !currentChatId) return;

        const messageData = {
            text: text,
            senderId: currentUser.uid,
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Mesajı sub-collection'a ekle
        await db.collection('conversations').doc(currentChatId).collection('messages').add(messageData);

        // Son mesajı ana sohbete güncelle
        await db.collection('conversations').doc(currentChatId).update({
            lastMessage: {
                text: text,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            }
        });

        messageInput.value = '';
    });

    if(logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            auth.signOut().then(() => {
                window.location.href = 'avukat.html';
            });
        });
    }
});