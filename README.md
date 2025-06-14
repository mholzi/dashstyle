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

## Troubleshooting

### Dashboard Not Appearing in Sidebar

If your dashboard doesn't appear in the Home Assistant sidebar after installation:

1. **Ensure Proper Installation**: Make sure you've completed all installation steps and restarted Home Assistant.

2. **Check Integration Status**: Go to Settings > Devices & Services and verify that DashStyle is listed and shows as "Configured".

3. **Verify File Structure**: Ensure the following files exist in your Home Assistant installation:
   - `custom_components/dashstyle/__init__.py`
   - `custom_components/dashstyle/config_flow.py`
   - `custom_components/dashstyle/const.py`
   - `custom_components/dashstyle/manifest.json`
   - `www/dashstyle/dashstyle.js`
   - `www/dashstyle/panel.html`
   - `www/dashstyle/styles.css`

4. **Check Home Assistant Logs**: Look for any error messages related to DashStyle in the Home Assistant logs (Settings > System > Logs).

5. **Clear Browser Cache**: Clear your browser cache and refresh the Home Assistant page.

6. **Re-add Integration**: If the dashboard still doesn't appear, try removing and re-adding the integration:
   - Go to Settings > Devices & Services
   - Find DashStyle and click the three dots menu
   - Select "Delete"
   - Restart Home Assistant
   - Re-add the integration following the configuration steps above

### Required Resources

DashStyle requires the following resources to function properly:

- **Frontend Component**: The integration registers a custom panel in Home Assistant's frontend
- **Static File Serving**: JavaScript and HTML files are served from the `www/dashstyle/` directory
- **WebSocket API**: Custom WebSocket commands for configuration loading and saving
- **Storage**: Configuration is stored using Home Assistant's storage system

No additional card dependencies (like `button-card`) are required as DashStyle renders everything with pure JavaScript.

### Common Issues

**Issue**: "DashStyle integration not found"
**Solution**: Ensure HACS is properly installed and the repository was added correctly. Check that the installation completed successfully.

**Issue**: Dashboard appears but shows errors or doesn't load entities
**Solution**: Check that you have entities configured in Home Assistant and that the WebSocket connection is working properly.

**Issue**: Admin panel not accessible
**Solution**: Ensure your Home Assistant user has admin privileges, as the admin panel requires admin access for configuration changes.

