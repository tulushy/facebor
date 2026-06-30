/**
 * Copyright 2026 Facebor Project
 * Licensed under the Apache License, Version 2.0
 * http://www.apache.org/licenses/LICENSE-2.0
 */

// Данные
let DB = {
    users: [],
    chats: [],
    messages: {},
    currentUser: null
};

// Загрузка данных
function loadData() {
    const saved = localStorage.getItem('facebor_db');
    if (saved) {
        DB = JSON.parse(saved);
    }

    // Демо-пользователи при первом запуске
    if (DB.users.length === 0) {
        DB.users = [
            { id: 1, name: 'Анна Смирнова', username: 'anna', password: '123456', online: true },
            { id: 2, name: 'Петр Иванов', username: 'petr', password: '123456', online: false },
            { id: 3, name: 'Мария Козлова', username: 'maria', password: '123456', online: true }
        ];
        saveData();
    }
}

function saveData() {
    localStorage.setItem('facebor_db', JSON.stringify(DB));
}

// Рендеринг
function render() {
    const app = document.getElementById('app');
    document.getElementById('loading').style.display = 'none';

    if (!DB.currentUser) {
        renderAuth(app);
    } else {
        renderApp(app);
    }
}

// Экран авторизации
function renderAuth(app) {
    app.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100vh; background: var(--bg-primary);">
            <div style="background: var(--bg-secondary); border-radius: 20px; padding: 40px; width: 90%; max-width: 400px; text-align: center; box-shadow: var(--shadow);">
                <div style="font-size: 60px; margin-bottom: 16px;">💬</div>
                <h1 style="font-size: 28px; margin-bottom: 8px;">Facebor</h1>
                <p style="color: var(--text-secondary); margin-bottom: 24px;">Общайтесь свободно</p>
                
                <div id="loginSection">
                    <div class="form-group">
                        <input type="text" id="loginUsername" placeholder="Username" style="text-align: center;">
                    </div>
                    <div class="form-group">
                        <input type="password" id="loginPassword" placeholder="Пароль" style="text-align: center;">
                    </div>
                    <div class="error-msg" id="loginError"></div>
                    <button class="btn btn-primary" onclick="login()" style="margin-bottom: 12px;">Войти</button>
                    <p class="auth-switch">
                        Нет аккаунта? <a onclick="toggleAuth()">Зарегистрироваться</a>
                    </p>
                    <p style="color: var(--text-secondary); font-size: 12px; margin-top: 16px;">
                        Демо: anna / 123456
                    </p>
                </div>
                
                <div id="registerSection" style="display: none;">
                    <div class="form-group">
                        <input type="text" id="regName" placeholder="Имя" style="text-align: center;">
                    </div>
                    <div class="form-group">
                        <input type="text" id="regUsername" placeholder="Username" style="text-align: center;">
                    </div>
                    <div class="form-group">
                        <input type="password" id="regPassword" placeholder="Пароль" style="text-align: center;">
                    </div>
                    <div class="error-msg" id="regError"></div>
                    <button class="btn btn-primary" onclick="register()" style="margin-bottom: 12px;">Зарегистрироваться</button>
                    <p class="auth-switch">
                        Уже есть аккаунт? <a onclick="toggleAuth()">Войти</a>
                    </p>
                </div>
            </div>
        </div>
    `;
}

function toggleAuth() {
    const loginSec = document.getElementById('loginSection');
    const regSec = document.getElementById('registerSection');
    if (loginSec.style.display === 'none') {
        loginSec.style.display = 'block';
        regSec.style.display = 'none';
    } else {
        loginSec.style.display = 'none';
        regSec.style.display = 'block';
    }
}

function login() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;

    const user = DB.users.find(u => u.username === username && u.password === password);

    if (user) {
        DB.currentUser = user;
        saveData();
        render();
    } else {
        document.getElementById('loginError').textContent = 'Неверный username или пароль';
        document.getElementById('loginError').style.display = 'block';
    }
}

function register() {
    const name = document.getElementById('regName').value.trim();
    const username = document.getElementById('regUsername').value.trim();
    const password = document.getElementById('regPassword').value;

    if (!name || !username || !password) {
        document.getElementById('regError').textContent = 'Заполните все поля';
        document.getElementById('regError').style.display = 'block';
        return;
    }

    if (DB.users.find(u => u.username === username)) {
        document.getElementById('regError').textContent = 'Username уже занят';
        document.getElementById('regError').style.display = 'block';
        return;
    }

    const newUser = {
        id: Date.now(),
        name: name,
        username: username,
        password: password,
        online: true
    };

    DB.users.push(newUser);
    DB.currentUser = newUser;
    saveData();
    render();
}

// Основное приложение
let activeChatId = null;

function renderApp(app) {
    app.innerHTML = `
        <div class="sidebar" id="sidebar">
            <div class="sidebar-header">
                <h2>Facebor</h2>
                <div class="header-actions">
                    <button class="icon-btn" onclick="openNewChatModal()" title="Новый чат">✏️</button>
                    <button class="icon-btn" onclick="logout()" title="Выйти">🚪</button>
                </div>
            </div>
            <div class="search-container">
                <input type="text" class="search-input" placeholder="🔍 Поиск чатов..." oninput="filterChats(this.value)">
            </div>
            <div class="chat-list" id="chatList"></div>
            <div class="user-bar">
                <div class="user-bar-avatar">${DB.currentUser.name[0].toUpperCase()}</div>
                <div class="user-bar-info">
                    <div class="user-bar-name">${DB.currentUser.name}</div>
                    <div class="user-bar-username">@${DB.currentUser.username}</div>
                </div>
                <span style="color: var(--online); font-size: 12px;">● online</span>
            </div>
        </div>
        <div class="main-chat" id="mainChat">
            ${renderMainChat()}
        </div>
    `;

    updateChatList();

    // Обработчик Enter для поля ввода
    const msgInput = document.getElementById('messageInput');
    if (msgInput) {
        msgInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }
}

function renderMainChat() {
    if (!activeChatId) {
        return `
            <div class="chat-header">
                <div class="chat-header-info">
                    <div class="chat-header-name">Facebor</div>
                    <div class="chat-header-status">Общайтесь свободно</div>
                </div>
            </div>
            <div class="messages-area">
                <div class="empty-chat">
                    <div class="empty-chat-icon">💬</div>
                    <h3>Добро пожаловать в Facebor!</h3>
                    <p>Выберите чат или создайте новый, чтобы начать общение</p>
                </div>
            </div>
        `;
    }

    const chat = DB.chats.find(c => c.id === activeChatId);
    if (!chat) return '';

    const otherUserId = chat.participants.find(id => id !== DB.currentUser.id);
    const otherUser = DB.users.find(u => u.id === otherUserId);
    const chatMessages = DB.messages[activeChatId] || [];

    return `
        <div class="chat-header">
            <button class="back-btn" onclick="closeChat()">←</button>
            <div class="chat-avatar" style="width: 44px; height: 44px; font-size: 18px;">${otherUser.name[0]}</div>
            <div class="chat-header-info">
                <div class="chat-header-name">${otherUser.name} <span class="verified-badge">✓</span></div>
                <div class="chat-header-status">${otherUser.online ? '● online' : '○ был недавно'}</div>
            </div>
        </div>
        <div class="messages-area" id="messagesContainer">
            ${chatMessages.map(msg => {
                const isSent = msg.senderId === DB.currentUser.id;
                return `
                    <div class="message ${isSent ? 'sent' : 'received'}">
                        <div class="message-bubble">
                            ${msg.text}
                            <div class="message-time">${formatTime(msg.time)}</div>
                        </div>
                    </div>
                `;
            }).join('')}
        </div>
        <div class="input-area">
            <input type="text" class="message-input" id="messageInput" placeholder="Написать сообщение...">
            <button class="send-btn" onclick="sendMessage()">➤</button>
        </div>
    `;
}

// Чаты
function updateChatList() {
    const chatList = document.getElementById('chatList');
    if (!chatList) return;

    const userChats = DB.chats.filter(c => c.participants.includes(DB.currentUser.id));

    chatList.innerHTML = userChats.map(chat => {
        const otherUserId = chat.participants.find(id => id !== DB.currentUser.id);
        const otherUser = DB.users.find(u => u.id === otherUserId);
        const chatMessages = DB.messages[chat.id] || [];
        const lastMsg = chatMessages[chatMessages.length - 1];

        return `
            <div class="chat-item ${activeChatId === chat.id ? 'active' : ''}" onclick="openChat(${chat.id})">
                <div class="chat-avatar ${otherUser.online ? 'online' : ''}">${otherUser.name[0]}</div>
                <div class="chat-info">
                    <div class="chat-name">${otherUser.name}</div>
                    <div class="chat-last-message">${lastMsg ? lastMsg.text : 'Нет сообщений'}</div>
                </div>
                <div class="chat-meta">
                    <div class="chat-time">${lastMsg ? formatTime(lastMsg.time) : ''}</div>
                </div>
            </div>
        `;
    }).join('');
}

function openChat(chatId) {
    activeChatId = chatId;
    document.getElementById('mainChat').innerHTML = renderMainChat();
    updateChatList();
    scrollToBottom();

    // На мобильных скрываем сайдбар
    if (window.innerWidth <= 768) {
        document.getElementById('sidebar').classList.remove('mobile-open');
    }

    const msgInput = document.getElementById('messageInput');
    if (msgInput) {
        msgInput.focus();
        msgInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') sendMessage();
        });
    }
}

function closeChat() {
    activeChatId = null;
    document.getElementById('mainChat').innerHTML = renderMainChat();
    updateChatList();
}

function sendMessage() {
    const input = document.getElementById('messageInput');
    if (!input || !activeChatId) return;

    const text = input.value.trim();
    if (!text) return;

    if (!DB.messages[activeChatId]) {
        DB.messages[activeChatId] = [];
    }

    DB.messages[activeChatId].push({
        senderId: DB.currentUser.id,
        text: text,
        time: new Date().toISOString()
    });

    saveData();
    input.value = '';

    // Обновляем сообщения
    const messagesContainer = document.getElementById('messagesContainer');
    if (messagesContainer) {
        document.getElementById('mainChat').innerHTML = renderMainChat();
        scrollToBottom();
        document.getElementById('messageInput').focus();
    }

    updateChatList();
}

function scrollToBottom() {
    setTimeout(() => {
        const container = document.getElementById('messagesContainer');
        if (container) {
            container.scrollTop = container.scrollHeight;
        }
    }, 100);
}

// Новый чат
function openNewChatModal() {
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'newChatModal';
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Новый чат</h2>
                <button class="close-btn" onclick="closeModal('newChatModal')">✕</button>
            </div>
            <div class="form-group">
                <label>Username собеседника</label>
                <input type="text" id="newChatUsername" placeholder="Введите username">
            </div>
            <div class="error-msg" id="newChatError"></div>
            <button class="btn btn-primary" onclick="startNewChat()">Начать чат</button>
            <p style="color: var(--text-secondary); font-size: 12px; margin-top: 12px; text-align: center;">
                Доступны: anna, petr, maria
            </p>
        </div>
    `;
    document.body.appendChild(modal);

    modal.addEventListener('click', function(e) {
        if (e.target === modal) closeModal('newChatModal');
    });
}

function startNewChat() {
    const username = document.getElementById('newChatUsername').value.trim();
    const otherUser = DB.users.find(u => u.username === username);

    if (!otherUser) {
        document.getElementById('newChatError').textContent = 'Пользователь не найден';
        document.getElementById('newChatError').style.display = 'block';
        return;
    }

    if (otherUser.id === DB.currentUser.id) {
        document.getElementById('newChatError').textContent = 'Нельзя начать чат с собой';
        document.getElementById('newChatError').style.display = 'block';
        return;
    }

    // Проверяем существующий чат
    const existingChat = DB.chats.find(c =>
        c.participants.includes(DB.currentUser.id) &&
        c.participants.includes(otherUser.id)
    );

    if (existingChat) {
        openChat(existingChat.id);
        closeModal('newChatModal');
        return;
    }

    const newChat = {
        id: Date.now(),
        participants: [DB.currentUser.id, otherUser.id]
    };

    DB.chats.push(newChat);
    DB.messages[newChat.id] = [];
    saveData();

    openChat(newChat.id);
    closeModal('newChatModal');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.remove();
}

// Поиск
function filterChats(query) {
    const items = document.querySelectorAll('.chat-item');
    const q = query.toLowerCase();

    items.forEach(item => {
        const name = item.querySelector('.chat-name').textContent.toLowerCase();
        item.style.display = name.includes(q) ? 'flex' : 'none';
    });
}

// Выход
function logout() {
    DB.currentUser = null;
    activeChatId = null;
    saveData();
    render();
}

// Вспомогательные функции
function formatTime(dateString) {
    const date = new Date(dateString);
    const now = new Date();

    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

// Инициализация
loadData();
render();