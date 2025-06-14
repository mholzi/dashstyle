"""The My Custom Dashboard integration."""
from __future__ import annotations

import logging
from pathlib import Path

from homeassistant.core import HomeAssistant
from homeassistant.helpers.typing import ConfigType
from homeassistant.config_entries import ConfigEntry
from homeassistant.components.frontend import async_register_built_in_panel
from homeassistant.components.http import register_static_path

from.const import DOMAIN

_LOGGER = logging.getLogger(__name__)

async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    """Set up the My Custom Dashboard component."""
    # This function is called by Home Assistant during startup.
    # We don't need to do anything here for a UI-configured integration.
    return True

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up My Custom Dashboard from a config entry."""
    
    # 1. Serve the panel's static files
    panel_path = Path(__file__).parent / "www"
    url_path = f"/{DOMAIN}_files"
    register_static_path(hass.http.app, url_path, str(panel_path))
    _LOGGER.info(f"Registered static path {url_path} to serve {panel_path}")

    # 2. Register the custom panel
    panel_url = f"{url_path}/my-dashboard-panel.js"
    await async_register_built_in_panel(
        hass,
        webcomponent_name="my-dashboard-panel",
        frontend_url_path="my-dashboard",  # The URL path to access the panel
        sidebar_title="My Dashboard",
        sidebar_icon="mdi:view-dashboard-variant",
        module_url=panel_url,
        require_admin=False, # Set to True if only admins should see it
    )
    _LOGGER.info(f"Registered custom panel 'my-dashboard' with module URL {panel_url}")

    # Store the entry_id for later use (e.g., in async_unload_entry)
    hass.data.setdefault(DOMAIN, {})
    hass.data[entry.entry_id] = {}

    return True

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    # This is called when the user removes the integration.
    # Clean up by unregistering the panel.
    from homeassistant.components.frontend import async_remove_panel

    async_remove_panel(hass, "my-dashboard")
    _LOGGER.info("Removed custom panel 'my-dashboard'")
    
    # Remove the static path if needed (though HA handles this reasonably well)
    # and clean up hass.data
    hass.data.pop(entry.entry_id)

    return True
