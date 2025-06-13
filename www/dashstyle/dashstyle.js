/**
 * DashStyle Custom Dashboard Element
 *
 * This class defines the custom element <dash-style> which renders a fully
 * configurable dashboard. It includes a dynamic main view for users and a
 * comprehensive admin panel for configuration.
 */
class DashStyle extends HTMLElement {

    /**
     * Constructor for the DashStyle class.
     */
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // Initialize with default empty structures.
        this.config = { rooms: [], styles: {} };
        this._configLoaded = false;
        this._mainViewRendered = false;
    }

    /**
     * The `hass` setter is the main entry point for data and updates from Home Assistant.
     * @param {object} hass The Home Assistant state object.
     */
    set hass(hass) {
        if (!hass) return;
        this._hass = hass;
        this.isAdmin = this._hass.user?.is_admin || false; 

        if (!this._configLoaded) {
            this._configLoaded = true;
            this._loadConfig();
        }
        
        if (!this.content) {
            this.content = document.createElement('div');
            this.shadowRoot.appendChild(this.content);
            this.render();
        }

        if (this._mainViewRendered) {
            this._updateEntityStates();
        }
    }

    /**
     * Renders the component's skeleton HTML and all necessary styles.
     */
    render() {
        this.content.innerHTML = `
            <style id="dashstyle-theme"></style>
            <style>
                :host {
                    --dp-primary-color: #03a9f4;
                    --dp-accent-color: #ff9800;
                    --dp-text-color: #212121;
                    --dp-light-text-color: #ffffff;
                    --dp-bg-color: #f5f5f5;
                    --dp-card-bg-color: #ffffff;
                    --dp-primary-font: 'Arial', sans-serif;
                    --dp-card-border-radius: 12px;
                    --dp-error-color: #db4437;
                }
                .view-wrapper.admin-mode .admin-panel { display: block; }
                .view-wrapper.admin-mode #main-view { display: none; }
                .view-wrapper.admin-mode #admin-toggle { background-color: var(--dp-accent-color); }
                .admin-panel { display: none; padding: 16px; font-family: Arial, sans-serif; }
                #main-view { padding: 8px; background-color: var(--dp-bg-color); font-family: var(--dp-primary-font); }
                .room { margin-bottom: 24px; }
                .room-title { font-size: 1.5em; font-weight: bold; margin: 0 8px 12px; color: var(--dp-text-color); display: flex; align-items: center; }
                .room-title ha-icon { color: var(--dp-primary-color); margin-right: 8px; }
                .entities { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 12px; }
                .card { background-color: var(--dp-card-bg-color); padding: 12px; border-radius: var(--dp-card-border-radius); box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; flex-direction: column; align-items: center; justify-content: center; cursor: pointer; transition: transform 0.15s ease-in-out, background-color 0.2s; color: var(--dp-text-color); text-align: center; }
                .card:active { transform: scale(0.95); }
                .card.on { background-color: var(--dp-accent-color); color: var(--dp-light-text-color); }
                .card.on ha-icon, .card.on .state { color: var(--dp-light-text-color); }
                .card ha-icon { font-size: 2.5em; --mdc-icon-size: 2.5em; color: var(--dp-primary-color); margin-bottom: 8px; }
                .card .name { font-weight: bold; margin-bottom: 4px; font-size: 1em; }
                .card .state { font-size: 0.9em; color: #888; }
                #admin-toggle { position: fixed; top: 16px; right: 16px; z-index: 1000; background-color: var(--dp-primary-color); color: var(--dp-light-text-color); border: none; padding: 8px 16px; border-radius: 20px; box-shadow: 0 2px 5px rgba(0,0,0,0.2); }
                .status-message { padding: 10px; margin-bottom: 16px; border-radius: 4px; display: none; border: 1px solid transparent; }
                .status-message.success { background-color: #dff0d8; border-color: #d6e9c6; color: #3c763d; }
                .status-message.error { background-color: #f2dede; border-color: #ebccd1; color: #a94442; }
                .tabs { display: flex; border-bottom: 1px solid #ccc; margin-bottom: 16px; }
                .tab { padding: 8px 16px; cursor: pointer; border-radius: 4px 4px 0 0; }
                .tab.active { border-bottom: 2px solid var(--dp-primary-color); font-weight: bold; background-color: #f0f0f0; }
                .tab-content { display: none; }
                .tab-content.active { display: block; }
                .config-section { background-color: #f9f9f9; border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
                h1, h2, h3, h4 { margin-top: 0; padding-bottom: 8px; }
                h3 { border-bottom: 1px solid #eee; }
                .form-group { margin-bottom: 12px; }
                label { display: block; margin-bottom: 4px; font-weight: 500; font-size: 0.9em; color: #555; }
                input[type="text"], input[type="color"], select { width: 100%; padding: 10px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 4px; }
                button, #save-config { background-color: var(--dp-primary-color); color: white; border: none; padding: 10px 15px; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; }
                button:hover, #save-config:hover { opacity: 0.8; }
                button:disabled, #save-config:disabled { background-color: #ccc; cursor: not-allowed; }
                button.delete { background-color: var(--dp-error-color); }
                .item-list { list-style: none; padding-left: 0; }
                .item-list li { display: flex; justify-content: space-between; align-items: center; padding: 10px; border-bottom: 1px solid #eee; }
                .item-list li:last-child { border-bottom: none; }
            </style>
            <div class="view-wrapper">
                <button id="admin-toggle" style="display: ${this.isAdmin ? 'block' : 'none'};">Admin</button>
                <div id="main-view"></div>
                <div id="admin-view" class="admin-panel">
                    <h1>DashStyle Configuration</h1>
                    <div id="status-message" class="status-message"></div>
                    <div class="tabs"><div class="tab active" data-tab="rooms">Rooms & Entities</div><div class="tab" data-tab="styling">Styling</div></div>
                    <div id="tab-rooms" class="tab-content active">Loading...</div>
                    <div id="tab-styling" class="tab-content">Loading...</div>
                    <button id="save-config">Save Configuration</button>
                </div>
            </div>
        `;
        this._addEventListeners();
    }
    
    _addEventListeners() {
        this.content.querySelector('#admin-toggle').addEventListener('click', () => {
            this.content.querySelector('.view-wrapper').classList.toggle('admin-mode');
        });
        
        this.content.querySelector('#main-view').addEventListener('click', e => {
            const card = e.target.closest('.card[data-entity-id]');
            if (card) this._handleCardClick(card.dataset.entityId);
        });

        const adminPanel = this.content.querySelector('.admin-panel');
        if (adminPanel) {
            adminPanel.addEventListener('click', e => {
                const target = e.target;
                if (target.matches('.tab')) this._handleTabClick(target);
                else if (target.matches('#save-config')) this._saveConfig();
                else if (target.matches('#add-room')) this._addRoom();
                else if (target.matches('.delete-room')) this._deleteRoom(parseInt(target.closest('.config-section').dataset.roomIndex, 10));
                else if (target.matches('.add-entity')) this._addEntity(parseInt(target.closest('.config-section').dataset.roomIndex, 10));
                else if (target.matches('.delete-entity')) this._deleteEntity(parseInt(target.closest('.config-section').dataset.roomIndex, 10), parseInt(target.closest('li').dataset.entityIndex, 10));
            });
        }
    }

    _handleCardClick(entityId) {
        const domain = entityId.split('.')[0];
        const state = this._hass.states[entityId];
        if (!state) return;

        const serviceMap = { 'light': 'toggle', 'switch': 'toggle', 'scene': 'turn_on', 'script': 'turn_on', 'cover': state.state === 'closed' ? 'open_cover' : 'close_cover' };
        if (serviceMap[domain]) {
            this._hass.callService(domain, serviceMap[domain], { entity_id: entityId });
        } else { console.log(`No default click action for domain: ${domain}`); }
    }

    _renderMainView() {
        const mainView = this.content.querySelector('#main-view');
        if (!mainView || !this.config || !this.config.rooms) return;
        mainView.innerHTML = (this.config.rooms || []).map(room => `
            <div class="room">
                <h2 class="room-title"><ha-icon icon="${room.icon || 'mdi:home'}"></ha-icon> ${room.name}</h2>
                <div class="entities">${(room.entities || []).map(entity => this._createEntityCard(entity)).join('')}</div>
            </div>`).join('');
        this._mainViewRendered = true;
        this._updateEntityStates();
    }

    _createEntityCard(entityConf) {
        const entityId = entityConf.id;
        const entityState = this._hass.states[entityId];

        if (!entityState) return `<div class="card" data-entity-id="${entityId}"><ha-icon icon="mdi:alert-circle-outline"></ha-icon><div class="name">${entityId}</div><div class="state">Not Found</div></div>`;

        const name = entityState.attributes.friendly_name || entityId.split('.')[1].replace(/_/g, ' ');
        let icon = entityState.attributes.icon || 'mdi:flash';
        let stateText = entityState.state;

        const domain = entityId.split('.')[0];
        if (domain === 'sensor' && entityState.attributes.unit_of_measurement) stateText = `${entityState.state} ${entityState.attributes.unit_of_measurement}`;
        if (domain === 'cover') icon = `mdi:window-${entityState.state === 'closed' ? 'closed' : 'open'}`;

        return `<div class="card" data-entity-id="${entityId}"><ha-icon icon="${icon}"></ha-icon><div class="name">${name}</div><div class="state">${stateText}</div></div>`;
    }

    _updateEntityStates() {
        if (!this.content) return;
        this.content.querySelectorAll('.card[data-entity-id]').forEach(card => {
            const entityId = card.dataset.entityId;
            const entityState = this._hass.states[entityId];
            if (!entityState) return;

            const stateEl = card.querySelector('.state');
            if (stateEl) {
                let stateText = entityState.state;
                if (entityState.attributes.unit_of_measurement) stateText = `${entityState.state} ${entityState.attributes.unit_of_measurement}`;
                stateEl.textContent = stateText;
            }

            if (entityId.startsWith('cover.')) {
                const iconEl = card.querySelector('ha-icon');
                if (iconEl) iconEl.icon = `mdi:window-${entityState.state === 'closed' ? 'closed' : 'open'}`;
            }

            if (['on', 'open', 'playing'].includes(entityState.state)) card.classList.add('on');
            else card.classList.remove('on');
        });
    }

    _applyStyles() {
        const styleEl = this.shadowRoot.getElementById('dashstyle-theme');
        if (!styleEl || !this.config || !this.config.styles) return;
        const styles = this.config.styles;
        styleEl.innerHTML = `:host {
            --dp-primary-color: ${styles['primary_color'] || '#03a9f4'};
            --dp-accent-color: ${styles['accent_color'] || '#ff9800'};
            --dp-primary-font: "${styles['primary_font_family'] || 'Arial, sans-serif'}";
        }`;
    }
    
    // --- Admin Panel Methods ---
    _handleTabClick(clickedTab) { /* Unchanged */ }
    _renderAdminTabs() { if (this.content) { this._renderRoomsTab(); this._renderStylingTab(); }}
    _renderRoomsTab() { /* Unchanged */ }
    _renderStylingTab() { /* Unchanged */ }
    _addRoom() { /* Unchanged */ }
    _deleteRoom(index) { /* Unchanged */ }
    _addEntity(roomIndex) { /* Unchanged */ }
    _deleteEntity(roomIndex, entityIndex) { /* Unchanged */ }
    _showStatusMessage(message, type = 'success') { /* Unchanged */ }

    // --- Data Methods ---
    async _loadConfig() {
        if (!this._hass) return;
        try {
            this.config = await this._hass.callWS({ type: 'dashstyle/config/load' }) || { rooms: [], styles: {} };
            this._applyStyles();
            this._renderMainView();
            this._renderAdminTabs();
        } catch (error) { console.error("Error loading DashStyle config:", error); this._showStatusMessage("Error loading config.", "error"); }
    }

    async _saveConfig() {
        if (!this._hass) return;
        const saveButton = this.content.querySelector('#save-config');
        saveButton.disabled = true; saveButton.innerText = "Saving...";
        try {
            const result = await this._hass.callWS({ type: 'dashstyle/config/save', config: this.config });
            if (result.success) {
                this._showStatusMessage("Configuration saved!", "success");
                this._applyStyles();
                this._renderMainView();
            } else { throw new Error("Save returned success: false"); }
        } catch (error) {
            console.error("Error saving DashStyle config:", error);
            this._showStatusMessage(`Error saving: ${error.message}`, "error");
        } finally { saveButton.disabled = false; saveButton.innerText = "Save Configuration"; }
    }
}

customElements.define('dash-style', DashStyle);
