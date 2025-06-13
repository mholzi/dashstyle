"""Dashboard registration."""
from homeassistant.core import HomeAssistant

async def async_register_dashboard(hass: HomeAssistant, name: str):
    """Register the dashboard."""
    dashboard_url = name.lower().replace(" ", "_")
    dashboard = {
        "mode": "yaml",
        "title": name,
        "icon": "mdi:view-dashboard",
        "show_in_sidebar": True,
        "filename": f"/{dashboard_url}.yaml",
    }
    hass.data["lovelace"]["dashboards"][dashboard_url] = dashboard
    # You would typically write the dashboard config to a file here
    # For this example, we will assume the main JS handles the view rendering
