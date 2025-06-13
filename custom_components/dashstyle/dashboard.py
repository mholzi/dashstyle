"""
Dashboard registration (DEPRECATED).

NOTE: The logic originally in this file has been moved to `__init__.py`
for better integration with Home Assistant's config entry system.
This file is no longer in use.

The `async_setup_entry` function in `__init__.py` now handles the
registration of the dashboard panel and the serving of the frontend
JavaScript file.
"""
from homeassistant.core import HomeAssistant


async def async_register_dashboard(hass: HomeAssistant, name: str):
    """
    DEPRECATED: Register the dashboard.

    This function is no longer called. The dashboard panel is now
    registered via `hass.components.lovelace.async_register_panel`
    within `async_setup_entry` in `__init__.py`.
    """
    dashboard_url = name.lower().replace(" ", "_")
    dashboard = {
        "mode": "js",
        "title": name,
        "icon": "mdi:view-dashboard",
        "show_in_sidebar": True,
        "frontend_url_path": f"/dashstyle/panel.js",
    }
    # The new method for registration is now used in __init__.py
    # hass.data["lovelace"]["dashboards"][dashboard_url] = dashboard

