"""Config flow for My Custom Dashboard integration."""
from __future__ import annotations

import logging
from typing import Any

from homeassistant import config_entries
from homeassistant.data_entry_flow import FlowResult

from.const import DOMAIN

_LOGGER = logging.getLogger(__name__)

class MyDashboardConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for My Custom Dashboard."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> FlowResult:
        """Handle the initial step."""
        # Check if an entry already exists, only one is allowed.
        if self._async_current_entries():
            return self.async_abort(reason="single_instance_allowed")

        if user_input is not None:
            # User has confirmed, create the config entry.
            return self.async_create_entry(title="My Custom Dashboard", data={})

        # Show the confirmation form to the user.
        return self.async_show_form(step_id="user")
