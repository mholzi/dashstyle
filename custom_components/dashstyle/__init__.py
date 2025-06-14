"""Custom integration to add a custom dashboard panel."""
import os
import logging
from homeassistant.core import HomeAssistant
from homeassistant.helpers.http import HomeAssistantView
from homeassistant.components import frontend

_LOGGER = logging.getLogger(__name__)

DOMAIN = "dashstyle"
PANEL_TITLE = "DashStyle"
PANEL_ICON = "mdi:view-dashboard"
PANEL_URL = "dashstyle-panel"
SIDEPAR_TITLE = "DashStyle"

async def async_setup(hass: HomeAssistant, config: dict):
    """Set up the DashStyle component."""
    
    # Register the panel (the sidebar entry)
    await frontend.async_register_panel_component(
        hass,
        "custom",
        PANEL_URL,
        SIDEPAR_TITLE,
        PANEL_ICON,
        None,
        config,
    )
    
    # Register a view to serve the HTML file.
    hass.http.register_view(DashStyleView)
    
    _LOGGER.info("DashStyle has been set up.")

    # Return boolean to indicate that initialization was successful.
    return True

class DashStyleView(HomeAssistantView):
    """View to serve the DashStyle HTML file."""

    url = f"/api/{DOMAIN}"
    name = f"api:{DOMAIN}"
    requires_auth = False # Set to True if you want to protect your dashboard

    async def get(self, request):
        """Handle the GET request for the dashboard."""
        
        # Get the path to the HTML file
        path = os.path.join(os.path.dirname(__file__), "www", "dashstyle.html")
        
        # Check if the file exists
        if not os.path.exists(path):
            return self.json_message("Dashboard HTML file not found", status_code=404)
            
        # Return the HTML file as a response
        return await self.hass.http.async_static_file(path)
