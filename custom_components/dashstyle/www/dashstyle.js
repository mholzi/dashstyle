/**
 * DashStyle - Zero Dependency Dashboard for Home Assistant
 * Manages both main dashboard view and admin configuration
 */

class DashStyle {
    constructor() {
        this.entryId = window.DASHSTYLE_ENTRY_ID;
        this.config = null;
        this.entities = [];
        this.isAdmin = false;
        this.currentView = 'main';
        
        this.init();
    }

    async init() {
        try {
            await this.loadConfig();
            await this.loadEntities();
            this.setupEventListeners();
            this.checkAdminPermissions();
            this.applyStyles();
            this.renderMainView();
            
            console.log('DashStyle initialized successfully');
        } catch (error) {
            console.error('Failed to initialize DashStyle:', error);
            this.showToast('Failed to initialize dashboard', 'error');
        }
    }

    // WebSocket and API methods
    async sendWebSocketCommand(type, data = {}) {
        return new Promise((resolve, reject) => {
            if (!window.hassConnection) {
                reject(new Error('Home Assistant connection not available'));
                return;
            }

            const message = {
                id: Date.now(),
                type: type,
                entry_id: this.entryId,
                ...data
            };

            const timeout = setTimeout(() => {
                reject(new Error('WebSocket command timeout'));
            }, 10000);

            const handleMessage = (event) => {
                const response = JSON.parse(event.data);
                if (response.id === message.id) {
                    clearTimeout(timeout);
                    window.removeEventListener('message', handleMessage);
                    
                    if (response.success === false) {
                        reject(new Error(response.error || 'Command failed'));
                    } else {
                        resolve(response.result || response);
                    }
                }
            };

            window.addEventListener('message', handleMessage);
            
            // For HA integration, we need to use the connection object
            if (window.hassConnection && window.hassConnection.sendMessage) {
                window.hassConnection.sendMessage(message);
            } else {
                // Fallback for direct WebSocket
                const ws = new WebSocket(`ws://${window.location.host}/api/websocket`);
                ws.onopen = () => ws.send(JSON.stringify(message));
                ws.onmessage = handleMessage;
            }
        });
    }

    async loadConfig() {
        try {
            this.config = await this.sendWebSocketCommand('dashstyle/get_config');
            console.log('Configuration loaded:', this.config);
        } catch (error) {
            console.error('Failed to load configuration:', error);
            // Use default config if loading fails
            this.config = {
                rooms: [],
                entities: {},
                styles: {
                    primary_color: '#03a9f4',
                    accent_color: '#ff9800',
                    background_color: '#f0f2f5',
                    card_background: '#ffffff',
                    text_color: '#333333',
                    font_family: 'Arial, sans-serif'
                },
                layout: {
                    columns: 3,
                    card_gap: '16px',
                    room_title_size: '24px'
                }
            };
        }
    }

    async loadEntities() {
        try {
            this.entities = await this.sendWebSocketCommand('dashstyle/get_entities');
            console.log(`Loaded ${this.entities.length} entities`);
        } catch (error) {
            console.error('Failed to load entities:', error);
            this.entities = [];
        }
    }

    async saveConfig() {
        try {
            await this.sendWebSocketCommand('dashstyle/save_config', { config: this.config });
            this.showToast('Configuration saved successfully', 'success');
            console.log('Configuration saved');
        } catch (error) {
            console.error('Failed to save configuration:', error);
            this.showToast('Failed to save configuration', 'error');
        }
    }

    // UI Event Handlers
    setupEventListeners() {
        // Admin toggle
        const adminToggle = document.getElementById('admin-toggle');
        adminToggle?.addEventListener('click', () => this.toggleAdminView());

        // Refresh button
        const refreshButton = document.getElementById('refresh-button');
        refreshButton?.addEventListener('click', () => this.refresh());

        // Admin tabs
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchAdminTab(e.target.dataset.tab);
            });
        });

        // Room management
        document.getElementById('add-room-btn')?.addEventListener('click', () => this.addRoom());
        
        // Entity management
        document.getElementById('add-entity-btn')?.addEventListener('click', () => this.addEntity());
        
        // Style management
        document.getElementById('apply-styles-btn')?.addEventListener('click', () => this.applyStyles());
        
        // Layout management
        document.getElementById('apply-layout-btn')?.addEventListener('click', () => this.applyLayout());
        
        // Config actions
        document.getElementById('save-config-btn')?.addEventListener('click', () => this.saveConfig());
        document.getElementById('reset-config-btn')?.addEventListener('click', () => this.resetConfig());
    }

    checkAdminPermissions() {
        // Check if user has admin permissions
        // For now, we'll show the admin button to all users
        // In a real implementation, you'd check user permissions
        this.isAdmin = true;
        
        const adminButton = document.getElementById('admin-toggle');
        if (this.isAdmin && adminButton) {
            adminButton.style.display = 'flex';
        }
    }

    // View Management
    toggleAdminView() {
        const mainView = document.getElementById('main-view');
        const adminView = document.getElementById('admin-view');
        
        if (this.currentView === 'main') {
            mainView.style.display = 'none';
            adminView.style.display = 'block';
            this.currentView = 'admin';
            this.renderAdminView();
        } else {
            mainView.style.display = 'block';
            adminView.style.display = 'none';
            this.currentView = 'main';
            this.renderMainView();
        }
    }

    switchAdminTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        
        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(`${tabName}-tab`).classList.add('active');

        // Load tab-specific data
        this.loadAdminTabData(tabName);
    }

    // Main Dashboard Rendering
    renderMainView() {
        const container = document.getElementById('rooms-container');
        
        if (!this.config.rooms || this.config.rooms.length === 0) {
            container.innerHTML = `
                <div class="no-rooms">
                    <h2>No rooms configured</h2>
                    <p>Use the admin panel to add rooms and entities to your dashboard.</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.config.rooms.map(room => this.renderRoomCard(room)).join('');
        this.bindEntityInteractions();
    }

    renderRoomCard(room) {
        const roomEntities = this.config.entities[room.id] || [];
        const entitiesHtml = roomEntities.length > 0 
            ? roomEntities.map(entity => this.renderEntityCard(entity)).join('')
            : '<div class="no-entities">No entities configured</div>';

        return `
            <div class="room-card" data-room-id="${room.id}">
                <div class="room-header">
                    <div class="room-icon">${this.renderIcon(room.icon)}</div>
                    <h2 class="room-name">${room.name}</h2>
                </div>
                <div class="room-entities">
                    ${entitiesHtml}
                </div>
            </div>
        `;
    }

    renderEntityCard(entity) {
        const haEntity = this.entities.find(e => e.entity_id === entity.entity_id);
        const state = haEntity ? haEntity.state : 'unavailable';
        const friendlyName = haEntity ? haEntity.friendly_name : entity.entity_id;

        return `
            <div class="entity-card" data-entity-id="${entity.entity_id}">
                <div class="entity-info">
                    <div class="entity-name">${friendlyName}</div>
                    <div class="entity-state">${state}</div>
                </div>
                ${entity.type ? `<div class="entity-type">${entity.type}</div>` : ''}
            </div>
        `;
    }

    bindEntityInteractions() {
        document.querySelectorAll('.entity-card').forEach(card => {
            card.addEventListener('click', () => {
                const entityId = card.dataset.entityId;
                this.toggleEntity(entityId);
            });
        });
    }

    async toggleEntity(entityId) {
        try {
            // Call the appropriate service based on entity domain
            const domain = entityId.split('.')[0];
            let service = '';
            
            switch (domain) {
                case 'light':
                case 'switch':
                case 'fan':
                    service = 'toggle';
                    break;
                case 'cover':
                    service = 'toggle';
                    break;
                default:
                    // For other domains, show more info
                    this.showEntityDetails(entityId);
                    return;
            }

            await this.sendWebSocketCommand('call_service', {
                domain: domain,
                service: service,
                service_data: { entity_id: entityId }
            });

            // Refresh entities to update state
            await this.loadEntities();
            this.renderMainView();
            
        } catch (error) {
            console.error('Failed to toggle entity:', error);
            this.showToast('Failed to control entity', 'error');
        }
    }

    showEntityDetails(entityId) {
        const entity = this.entities.find(e => e.entity_id === entityId);
        if (entity) {
            alert(`Entity: ${entity.friendly_name}\nState: ${entity.state}\nEntity ID: ${entity.entity_id}`);
        }
    }

    // Admin Panel Rendering
    renderAdminView() {
        this.loadAdminTabData('rooms');
        this.populateEntitySelect();
        this.populateStyleInputs();
        this.populateLayoutInputs();
    }

    loadAdminTabData(tabName) {
        switch (tabName) {
            case 'rooms':
                this.renderRoomsList();
                break;
            case 'entities':
                this.renderEntitiesList();
                this.populateRoomSelect();
                break;
            case 'styles':
                this.populateStyleInputs();
                break;
            case 'layout':
                this.populateLayoutInputs();
                break;
        }
    }

    renderRoomsList() {
        const container = document.getElementById('rooms-list');
        const rooms = this.config.rooms || [];
        
        container.innerHTML = rooms.map(room => `
            <div class="config-item" data-room-id="${room.id}">
                <div class="config-item-info">
                    <div class="config-item-name">${room.name}</div>
                    <div class="config-item-details">Icon: ${room.icon} | Entities: ${(this.config.entities[room.id] || []).length}</div>
                </div>
                <div class="config-item-actions">
                    <button onclick="dashStyle.editRoom('${room.id}')">Edit</button>
                    <button onclick="dashStyle.deleteRoom('${room.id}')">Delete</button>
                </div>
            </div>
        `).join('') || '<div class="no-entities">No rooms configured</div>';
    }

    renderEntitiesList() {
        const container = document.getElementById('entities-list');
        const allEntities = [];
        
        Object.keys(this.config.entities).forEach(roomId => {
            const room = this.config.rooms.find(r => r.id === roomId);
            this.config.entities[roomId].forEach(entity => {
                allEntities.push({
                    ...entity,
                    roomName: room ? room.name : 'Unknown Room'
                });
            });
        });
        
        container.innerHTML = allEntities.map(entity => `
            <div class="config-item" data-entity-id="${entity.entity_id}">
                <div class="config-item-info">
                    <div class="config-item-name">${entity.entity_id}</div>
                    <div class="config-item-details">Room: ${entity.roomName} | Type: ${entity.type || 'None'}</div>
                </div>
                <div class="config-item-actions">
                    <button onclick="dashStyle.removeEntity('${entity.entity_id}')">Remove</button>
                </div>
            </div>
        `).join('') || '<div class="no-entities">No entities configured</div>';
    }

    populateRoomSelect() {
        const select = document.getElementById('room-select');
        if (!select) return;
        
        select.innerHTML = '<option value="">Select a room</option>' + 
            this.config.rooms.map(room => 
                `<option value="${room.id}">${room.name}</option>`
            ).join('');
    }

    populateEntitySelect() {
        const select = document.getElementById('entity-select');
        if (!select) return;
        
        const groupedEntities = {};
        this.entities.forEach(entity => {
            const domain = entity.domain;
            if (!groupedEntities[domain]) {
                groupedEntities[domain] = [];
            }
            groupedEntities[domain].push(entity);
        });
        
        let optionsHtml = '<option value="">Select an entity</option>';
        Object.keys(groupedEntities).sort().forEach(domain => {
            optionsHtml += `<optgroup label="${domain}">`;
            groupedEntities[domain].forEach(entity => {
                optionsHtml += `<option value="${entity.entity_id}">${entity.friendly_name}</option>`;
            });
            optionsHtml += '</optgroup>';
        });
        
        select.innerHTML = optionsHtml;
    }

    populateStyleInputs() {
        const styles = this.config.styles || {};
        
        const inputs = {
            'primary-color': styles.primary_color,
            'accent-color': styles.accent_color,
            'background-color': styles.background_color,
            'card-background': styles.card_background,
            'text-color': styles.text_color,
            'font-family': styles.font_family
        };
        
        Object.keys(inputs).forEach(id => {
            const input = document.getElementById(id);
            if (input && inputs[id]) {
                input.value = inputs[id];
            }
        });
    }

    populateLayoutInputs() {
        const layout = this.config.layout || {};
        
        const inputs = {
            'layout-columns': layout.columns,
            'card-gap': layout.card_gap ? parseInt(layout.card_gap) : 16,
            'room-title-size': layout.room_title_size ? parseInt(layout.room_title_size) : 24
        };
        
        Object.keys(inputs).forEach(id => {
            const input = document.getElementById(id);
            if (input && inputs[id] !== undefined) {
                input.value = inputs[id];
            }
        });
    }

    // Configuration Management
    addRoom() {
        const nameInput = document.getElementById('room-name-input');
        const iconInput = document.getElementById('room-icon-input');
        
        const name = nameInput.value.trim();
        const icon = iconInput.value.trim() || 'mdi:home';
        
        if (!name) {
            this.showToast('Please enter a room name', 'error');
            return;
        }
        
        const roomId = 'room_' + Date.now();
        const room = { id: roomId, name, icon };
        
        this.config.rooms.push(room);
        this.config.entities[roomId] = [];
        
        nameInput.value = '';
        iconInput.value = '';
        
        this.renderRoomsList();
        this.showToast('Room added successfully', 'success');
    }

    deleteRoom(roomId) {
        if (confirm('Are you sure you want to delete this room and all its entities?')) {
            this.config.rooms = this.config.rooms.filter(room => room.id !== roomId);
            delete this.config.entities[roomId];
            this.renderRoomsList();
            this.showToast('Room deleted successfully', 'success');
        }
    }

    addEntity() {
        const roomSelect = document.getElementById('room-select');
        const entitySelect = document.getElementById('entity-select');
        const typeInput = document.getElementById('entity-type-input');
        
        const roomId = roomSelect.value;
        const entityId = entitySelect.value;
        const type = typeInput.value.trim();
        
        if (!roomId) {
            this.showToast('Please select a room', 'error');
            return;
        }
        
        if (!entityId) {
            this.showToast('Please select an entity', 'error');
            return;
        }
        
        // Check if entity is already assigned to this room
        if (this.config.entities[roomId].some(e => e.entity_id === entityId)) {
            this.showToast('Entity is already assigned to this room', 'error');
            return;
        }
        
        const entity = { entity_id: entityId, type };
        this.config.entities[roomId].push(entity);
        
        typeInput.value = '';
        entitySelect.value = '';
        
        this.renderEntitiesList();
        this.showToast('Entity added successfully', 'success');
    }

    removeEntity(entityId) {
        Object.keys(this.config.entities).forEach(roomId => {
            this.config.entities[roomId] = this.config.entities[roomId].filter(
                entity => entity.entity_id !== entityId
            );
        });
        
        this.renderEntitiesList();
        this.showToast('Entity removed successfully', 'success');
    }

    applyStyles() {
        const styles = {
            primary_color: document.getElementById('primary-color').value,
            accent_color: document.getElementById('accent-color').value,
            background_color: document.getElementById('background-color').value,
            card_background: document.getElementById('card-background').value,
            text_color: document.getElementById('text-color').value,
            font_family: document.getElementById('font-family').value
        };
        
        this.config.styles = styles;
        this.updateCSSVariables();
        this.showToast('Styles applied successfully', 'success');
    }

    applyLayout() {
        const layout = {
            columns: parseInt(document.getElementById('layout-columns').value),
            card_gap: document.getElementById('card-gap').value + 'px',
            room_title_size: document.getElementById('room-title-size').value + 'px'
        };
        
        this.config.layout = layout;
        this.updateCSSVariables();
        this.showToast('Layout applied successfully', 'success');
    }

    updateCSSVariables() {
        const root = document.documentElement;
        const styles = this.config.styles || {};
        const layout = this.config.layout || {};
        
        // Apply style variables
        if (styles.primary_color) root.style.setProperty('--primary-color', styles.primary_color);
        if (styles.accent_color) root.style.setProperty('--accent-color', styles.accent_color);
        if (styles.background_color) root.style.setProperty('--background-color', styles.background_color);
        if (styles.card_background) root.style.setProperty('--card-background', styles.card_background);
        if (styles.text_color) root.style.setProperty('--text-color', styles.text_color);
        if (styles.font_family) root.style.setProperty('--font-family', styles.font_family);
        
        // Apply layout variables
        if (layout.columns) root.style.setProperty('--grid-columns', layout.columns);
        if (layout.card_gap) root.style.setProperty('--card-gap', layout.card_gap);
        if (layout.room_title_size) root.style.setProperty('--room-title-size', layout.room_title_size);
    }

    resetConfig() {
        if (confirm('Are you sure you want to reset the configuration to default? This action cannot be undone.')) {
            this.config = {
                rooms: [],
                entities: {},
                styles: {
                    primary_color: '#03a9f4',
                    accent_color: '#ff9800',
                    background_color: '#f0f2f5',
                    card_background: '#ffffff',
                    text_color: '#333333',
                    font_family: 'Arial, sans-serif'
                },
                layout: {
                    columns: 3,
                    card_gap: '16px',
                    room_title_size: '24px'
                }
            };
            
            this.renderAdminView();
            this.updateCSSVariables();
            this.renderMainView();
            this.showToast('Configuration reset successfully', 'success');
        }
    }

    // Utility Methods
    renderIcon(iconString) {
        // Simple icon renderer - in a real implementation you might want to use MDI icons
        if (iconString && iconString.startsWith('mdi:')) {
            return iconString.replace('mdi:', '🏠'); // Fallback to house emoji
        }
        return iconString || '🏠';
    }

    async refresh() {
        this.showToast('Refreshing dashboard...', 'success');
        await this.loadConfig();
        await this.loadEntities();
        this.renderMainView();
        if (this.currentView === 'admin') {
            this.renderAdminView();
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        if (!container) return;
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        
        container.appendChild(toast);
        
        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Remove after 3 seconds
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, 3000);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashStyle = new DashStyle();
});

console.log('DashStyle dashboard loaded!');
