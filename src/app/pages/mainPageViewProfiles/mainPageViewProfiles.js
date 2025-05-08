import './mainPageViewProfiles.scss';

// chat-panel__form
const input = document.getElementById('search');
const clearButton = document.querySelector('.field-input-search__clear');

clearButton.addEventListener('click', () => {
    input.value = '';
    input.focus();
    clearButton.style.display = 'none';
});


input.addEventListener('input', () => {
    if (input.value) {
        clearButton.style.display = 'block';
    } else {
        clearButton.style.display = 'none';
    }
});


// Перенаправил и скрыл скролл recent-chats__list

const chatList = document.querySelector('.recent-chats__list');

chatList.addEventListener('wheel', (e) => {
    e.preventDefault();
    chatList.scrollLeft += e.deltaY;
});

chatList.style.overflow = 'hidden';

chatList.style.overflowY = 'scroll';
chatList.style.scrollbarWidth = 'none';
chatList.style.msOverflowStyle = 'none';

// Скрыл скролл для chat__messages

const messagesContainer = document.querySelector('.chat__messages');

messagesContainer.style.overflow = 'hidden';

messagesContainer.style.overflowY = 'scroll';
messagesContainer.style.scrollbarWidth = 'none'; // Для Firefox
messagesContainer.style.msOverflowStyle = 'none'; // Для IE

