// SCRUM Board Application

class ScrumBoard {
    constructor() {
        this.cards = this.loadCards();
        this.currentCardId = null;
        this.editMode = false;
        this.currentStatus = 'todo';

        this.init();
    }

    // Initialize the application
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.renderAllCards();
        this.updateAllCounts();
    }

    // Cache DOM elements
    cacheDOM() {
        // Containers
        this.containers = {
            todo: document.querySelector('.cards-container[data-status="todo"]'),
            doing: document.querySelector('.cards-container[data-status="doing"]'),
            done: document.querySelector('.cards-container[data-status="done"]')
        };

        // Card Modal
        this.cardModal = document.getElementById('cardModal');
        this.modalTitle = document.getElementById('modalTitle');
        this.cardTitleInput = document.getElementById('cardTitle');
        this.cardDescriptionInput = document.getElementById('cardDescription');
        this.colorPicker = document.getElementById('colorPicker');
        this.colorOptions = document.querySelectorAll('.color-option');
        this.saveCardBtn = document.getElementById('saveCardBtn');
        this.closeModalBtn = document.getElementById('closeModal');
        this.cancelBtn = document.getElementById('cancelBtn');
        this.selectedColor = 'gray';

        // Delete Modal
        this.deleteModal = document.getElementById('deleteModal');
        this.closeDeleteModalBtn = document.getElementById('closeDeleteModal');
        this.cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
        this.confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

        // Add Card Buttons
        this.addCardBtns = document.querySelectorAll('.add-card-btn');
    }

    // Bind event listeners
    bindEvents() {
        // Add card buttons
        this.addCardBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentStatus = e.target.dataset.status;
                this.openCardModal();
            });
        });

        // Card modal events
        this.saveCardBtn.addEventListener('click', () => this.saveCard());
        this.closeModalBtn.addEventListener('click', () => this.closeCardModal());
        this.cancelBtn.addEventListener('click', () => this.closeCardModal());
        this.cardModal.addEventListener('click', (e) => {
            if (e.target === this.cardModal) this.closeCardModal();
        });

        // Color picker events
        this.colorOptions.forEach(option => {
            option.addEventListener('click', () => {
                this.colorOptions.forEach(o => o.classList.remove('selected'));
                option.classList.add('selected');
                this.selectedColor = option.dataset.color;
            });
        });

        // Delete modal events
        this.confirmDeleteBtn.addEventListener('click', () => this.deleteCard());
        this.closeDeleteModalBtn.addEventListener('click', () => this.closeDeleteModal());
        this.cancelDeleteBtn.addEventListener('click', () => this.closeDeleteModal());
        this.deleteModal.addEventListener('click', (e) => {
            if (e.target === this.deleteModal) this.closeDeleteModal();
        });

        // Keyboard events
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closeCardModal();
                this.closeDeleteModal();
            }
            if (e.key === 'Enter' && this.cardModal.classList.contains('active')) {
                if (document.activeElement !== this.cardDescriptionInput) {
                    this.saveCard();
                }
            }
        });

        // Drag and drop for containers
        Object.values(this.containers).forEach(container => {
            container.addEventListener('dragover', (e) => this.handleDragOver(e));
            container.addEventListener('dragenter', (e) => this.handleDragEnter(e));
            container.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            container.addEventListener('drop', (e) => this.handleDrop(e));
        });
    }

    // Card Modal Methods
    openCardModal(cardId = null) {
        this.editMode = !!cardId;
        this.currentCardId = cardId;

        if (this.editMode) {
            const card = this.cards.find(c => c.id === cardId);
            if (card) {
                this.modalTitle.textContent = 'Edit Card';
                this.cardTitleInput.value = card.title;
                this.cardDescriptionInput.value = card.description || '';
                this.setSelectedColor(card.color || 'gray');
            }
        } else {
            this.modalTitle.textContent = 'Add New Card';
            this.cardTitleInput.value = '';
            this.cardDescriptionInput.value = '';
            this.setSelectedColor('gray');
        }

        this.cardModal.classList.add('active');
        setTimeout(() => this.cardTitleInput.focus(), 100);
    }

    setSelectedColor(color) {
        this.selectedColor = color;
        this.colorOptions.forEach(option => {
            option.classList.toggle('selected', option.dataset.color === color);
        });
    }

    closeCardModal() {
        this.cardModal.classList.remove('active');
        this.currentCardId = null;
        this.editMode = false;
    }

    saveCard() {
        const title = this.cardTitleInput.value.trim();
        if (!title) {
            this.cardTitleInput.focus();
            return;
        }

        const cardData = {
            title,
            description: this.cardDescriptionInput.value.trim(),
            color: this.selectedColor
        };

        if (this.editMode && this.currentCardId) {
            this.updateCard(this.currentCardId, cardData);
        } else {
            this.addCard(cardData);
        }

        this.closeCardModal();
    }

    // Delete Modal Methods
    openDeleteModal(cardId) {
        this.currentCardId = cardId;
        this.deleteModal.classList.add('active');
    }

    closeDeleteModal() {
        this.deleteModal.classList.remove('active');
        this.currentCardId = null;
    }

    // Card CRUD Operations
    addCard(cardData) {
        const card = {
            id: this.generateId(),
            title: cardData.title,
            description: cardData.description,
            color: cardData.color,
            status: this.currentStatus,
            createdAt: Date.now()
        };

        this.cards.push(card);
        this.saveCards();
        this.renderCard(card, true);
        this.updateCount(card.status);
    }

    updateCard(cardId, cardData) {
        const cardIndex = this.cards.findIndex(c => c.id === cardId);
        if (cardIndex !== -1) {
            this.cards[cardIndex] = {
                ...this.cards[cardIndex],
                ...cardData,
                updatedAt: Date.now()
            };
            this.saveCards();
            this.rerenderCard(cardId);
        }
    }

    deleteCard() {
        if (!this.currentCardId) return;

        const card = this.cards.find(c => c.id === this.currentCardId);
        if (card) {
            const status = card.status;
            this.cards = this.cards.filter(c => c.id !== this.currentCardId);
            this.saveCards();

            const cardElement = document.querySelector(`[data-card-id="${this.currentCardId}"]`);
            if (cardElement) {
                cardElement.remove();
            }

            this.updateCount(status);
        }

        this.closeDeleteModal();
    }

    moveCard(cardId, newStatus) {
        const card = this.cards.find(c => c.id === cardId);
        if (card && card.status !== newStatus) {
            const oldStatus = card.status;
            card.status = newStatus;
            card.updatedAt = Date.now();
            this.saveCards();
            this.updateCount(oldStatus);
            this.updateCount(newStatus);
        }
    }

    // Rendering Methods
    renderCard(card, isNew = false) {
        const container = this.containers[card.status];
        if (!container) return;

        const cardElement = this.createCardElement(card, isNew);
        container.appendChild(cardElement);
    }

    createCardElement(card, isNew = false) {
        const cardDiv = document.createElement('div');
        const cardColor = card.color || 'gray';
        cardDiv.className = `card color-${cardColor}${isNew ? ' new' : ''}`;
        cardDiv.dataset.cardId = card.id;
        cardDiv.draggable = true;

        cardDiv.innerHTML = `
            <div class="card-title">${this.escapeHtml(card.title)}</div>
            ${card.description ? `<div class="card-description">${this.escapeHtml(card.description)}</div>` : ''}
            <div class="card-footer">
                <span class="card-color-dot color-${cardColor}"></span>
                <div class="card-actions">
                    <button class="edit-btn" title="Edit">&#9998;</button>
                    <button class="delete-btn" title="Delete">&#10005;</button>
                </div>
            </div>
        `;

        // Bind card events
        cardDiv.addEventListener('dragstart', (e) => this.handleDragStart(e, card.id));
        cardDiv.addEventListener('dragend', (e) => this.handleDragEnd(e));

        const editBtn = cardDiv.querySelector('.edit-btn');
        const deleteBtn = cardDiv.querySelector('.delete-btn');

        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.currentStatus = card.status;
            this.openCardModal(card.id);
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.openDeleteModal(card.id);
        });

        return cardDiv;
    }

    rerenderCard(cardId) {
        const card = this.cards.find(c => c.id === cardId);
        if (!card) return;

        const oldElement = document.querySelector(`[data-card-id="${cardId}"]`);
        if (oldElement) {
            const newElement = this.createCardElement(card);
            oldElement.replaceWith(newElement);
        }
    }

    renderAllCards() {
        // Clear all containers
        Object.values(this.containers).forEach(container => {
            container.innerHTML = '';
        });

        // Sort cards by creation date (newest first)
        const sortedCards = [...this.cards].sort((a, b) => b.createdAt - a.createdAt);

        // Render each card
        sortedCards.forEach(card => this.renderCard(card));
    }

    // Drag and Drop Handlers
    handleDragStart(e, cardId) {
        e.dataTransfer.setData('text/plain', cardId);
        e.dataTransfer.effectAllowed = 'move';
        e.target.classList.add('dragging');
    }

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
        document.querySelectorAll('.cards-container').forEach(container => {
            container.classList.remove('drag-over');
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    }

    handleDragEnter(e) {
        e.preventDefault();
        const container = e.target.closest('.cards-container');
        if (container) {
            container.classList.add('drag-over');
        }
    }

    handleDragLeave(e) {
        const container = e.target.closest('.cards-container');
        if (container && !container.contains(e.relatedTarget)) {
            container.classList.remove('drag-over');
        }
    }

    handleDrop(e) {
        e.preventDefault();
        const container = e.target.closest('.cards-container');
        if (!container) return;

        container.classList.remove('drag-over');

        const cardId = e.dataTransfer.getData('text/plain');
        const newStatus = container.dataset.status;

        // Move the card element
        const cardElement = document.querySelector(`[data-card-id="${cardId}"]`);
        if (cardElement) {
            container.appendChild(cardElement);
            this.moveCard(cardId, newStatus);
        }
    }

    // Count Methods
    updateCount(status) {
        const count = this.cards.filter(c => c.status === status).length;
        const column = document.querySelector(`.column[data-status="${status}"]`);
        if (column) {
            const countElement = column.querySelector('.card-count');
            if (countElement) {
                countElement.textContent = count;
            }
        }
    }

    updateAllCounts() {
        ['todo', 'doing', 'done'].forEach(status => this.updateCount(status));
    }

    // Storage Methods
    loadCards() {
        try {
            const stored = localStorage.getItem('scrumboard_cards');
            return stored ? JSON.parse(stored) : [];
        } catch (e) {
            console.error('Error loading cards:', e);
            return [];
        }
    }

    saveCards() {
        try {
            localStorage.setItem('scrumboard_cards', JSON.stringify(this.cards));
        } catch (e) {
            console.error('Error saving cards:', e);
        }
    }

    // Utility Methods
    generateId() {
        return 'card_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.scrumBoard = new ScrumBoard();
});
