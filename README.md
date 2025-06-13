DashStyle
A dynamic, zero-dependency, and fully configurable dashboard for Home Assistant.

DashStyle allows you to build a beautiful and functional dashboard directly from the Home Assistant UI without needing to manage complex YAML files or install third-party card dependencies like button-card.

Features
Zero Dependencies: Renders all cards and layouts with pure JavaScript. No more custom:button-card or other custom card requirements.

Live UI Configuration: A powerful built-in admin panel allows you to add/remove rooms, assign entities, and change styles without ever touching YAML.

Persistent Configuration: All your settings are saved directly within your Home Assistant instance, surviving restarts and browser cache clears.

Dynamic & Interactive: Cards update in real-time as entity states change, and are clickable to perform default actions (e.g., toggling lights, opening covers).

Theming Support: Easily change colors and fonts for the entire dashboard from the admin panel.

Installation
The recommended way to install DashStyle is through the Home Assistant Community Store (HACS).

Add Custom Repository:

Navigate to HACS -> Integrations.

Click the three-dots menu in the top right and select "Custom repositories".

In the "Repository" field, enter: https://github.com/mholzi/dashstyle

For the category, select "Integration".

Click "ADD".

Install the Integration:

The DashStyle integration will now appear in your HACS list.

Click on it and then click the "INSTALL" button.

Follow the prompts to complete the installation.

Restart Home Assistant:

After installation, you must restart Home Assistant for the integration to be loaded.

Configuration
Once installed, you can add and configure your dashboard from the main Home Assistant Integrations page.

Navigate to Settings > Devices & Services.

Click the "+ ADD INTEGRATION" button.

Search for "DashStyle" and click on it.

You will be prompted to give your dashboard a name. This name will appear in the sidebar. Click "SUBMIT".

Your new dashboard is now ready! Navigate to it from the sidebar. Use the "Admin" button in the top-right corner to start building your layout.

