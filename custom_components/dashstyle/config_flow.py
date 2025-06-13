"""Config flow for DashStyle."""
import voluptuous as vol
from homeassistant import config_entries
from .const import DOMAIN

@config_entries.HANDLERS.register(DOMAIN)
class DashStyleConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for DashStyle."""

    VERSION = 1

    async def async_step_user(self, user_input=None):
        """Handle the initial step."""
        # Abort if an instance of DashStyle is already configured
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        if user_input is not None:
            # Create the config entry
            return self.async_create_entry(title=user_input["name"], data=user_input)

        # Show the form to the user
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({
                vol.Required("name", default="DashStyle"): str,
            }),
        )
