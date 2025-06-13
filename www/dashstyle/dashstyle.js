class DashStyle extends HTMLElement {
    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        // Initialize a default config object. In a later step, this will be loaded from storage.
        this.config = {
            rooms: [],
            styles: {}
        };
    }

    set hass(hass) {
        this._hass = hass;
        // For now, let's assume the admin user is always viewing.
        // In a real scenario, you'd check hass.user.is_admin
        this.isAdmin = true; 

        if (!this.content) {
            this.content = document.createElement('div');
            this.shadowRoot.appendChild(this.content);
            this.render();
        }
    }

    render() {
        this.content.innerHTML = `
            <style>
                .admin-panel {
                    display: ${this.isAdmin ? 'block' : 'none'};
                    padding: 16px;
                }
                .tabs {
                    display: flex;
                    border-bottom: 1px solid #ccc;
                    margin-bottom: 16px;
                }
                .tab {
                    padding: 8px 16px;
                    cursor: pointer;
                }
                .tab.active {
                    border-bottom: 2px solid var(--primary-color);
                    font-weight: bold;
                }
                .tab-content { display: none; }
                .tab-content.active { display: block; }
                .config-section {
                    background-color: #f9f9f9;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    padding: 16px;
                    margin-bottom: 16px;
                }
                h2, h3 {
                    margin-top: 0;
                    border-bottom: 1px solid #eee;
                    padding-bottom: 8px;
                }
                .form-group { margin-bottom: 12px; }
                label { display: block; margin-bottom: 4px; font-weight: 500; }
                input[type="text"], input[type="color"], select {
                    width: 100%;
                    padding: 8px;
                    box-sizing: border-box;
                    border: 1px solid #ccc;
                    border-radius: 4px;
                }
                button {
                    background-color: var(--primary-color);
                    color: white;
                    border: none;
                    padding: 10px 15px;
                    border-radius: 4px;
                    cursor: pointer;
                }
                button.delete { background-color: var(--error-color); }
                .item-list { list-style: none; padding-left: 0; }
                .item-list li {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 8px;
                    border-bottom: 1px solid #eee;
                }
            </style>

            <div id="main-view"></div>
            <div id="admin-view" class="admin-panel">
                <h1>DashStyle Configuration</h1>
                
                <div class="tabs">
                    <div class="tab active" data-tab="rooms">Rooms & Entities</div>
                    <div class="tab" data-tab="styling">Styling</div>
                </div>

                <div id="tab-rooms" class="tab-content active">
                    </div>

                <div id="tab-styling" class="tab-content">
                    </div>
                
                <button id="save-config">Save Configuration</button>
            </div>
        `;

        this._addEventListeners();
        this._renderAdminTabs();
    }

    _addEventListeners() {
        const tabs = this.content.querySelectorAll('.tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => this._handleTabClick(tab));
        });

        this.content.querySelector('#save-config').addEventListener('click', () => this._saveConfig());
    }

    _handleTabClick(clickedTab) {
        // Deactivate all tabs and content
        this.content.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
        this.content.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));

        // Activate the clicked tab and its content
        const tabName = clickedTab.dataset.tab;
        clickedTab.classList.add('active');
        this.content.querySelector(`#tab-${tabName}`).classList.add('active');
    }
    
    _renderAdminTabs() {
        // Placeholder for rendering tab content
    }

    _saveConfig() {
        console.log("Saving Configuration:", this.config);
        // Step 12 will implement the actual saving to Home Assistant storage.
        alert("Configuration saved to browser console. See Step 12 for persistence.");
    }
}

customElements.define('dash-style', DashStyle);
