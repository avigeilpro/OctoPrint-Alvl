# coding=utf-8
from __future__ import absolute_import

import octoprint.plugin
from octoprint.server import user_permission
from flask import make_response, jsonify

class AlvlPlugin(octoprint.plugin.StartupPlugin,
				octoprint.plugin.AssetPlugin,
				octoprint.plugin.TemplatePlugin,
				octoprint.plugin.SettingsPlugin,
                octoprint.plugin.SimpleApiPlugin):
	def __init__(self):
		self.processing = False
		self.mesh = []
		self.isPSUOn = False


	def on_api_get(self, request):
		self.isPSUOn = True

	def get_api_commands(self):
		return dict(
			StartALvl=[]
		)

	def on_api_command(self, command, data):
		if not user_permission.can():
			return make_response("Insufficient rights", 403)
		self._logger.info("api command : " + command)
		if command == 'StartALvl':
			self._plugin_manager.send_plugin_message(self._identifier, dict(mesh="StartALvl"))
			return jsonify(alvlCommand=self.alvlCommand)

	def get_settings_defaults(self):
		return dict(alvlCommand = "G135",
			    alvlNF = "6",
				alvlNBCycle = "5",
				alvlMaxDiff = "0.1",
				alvlBedRadius = "100")
				#alvlOperate = "0")

	def on_after_startup(self):
		self.alvlCommand = self._settings.get(["alvlCommand"])
		self.alvlNF = self._settings.get(["alvlNF"])
		self.alvlNBCycle = self._settings.get(["alvlNBCycle"])
		self.alvlMaxDiff = self._settings.get(["alvlMaxDiff"])
		self.alvlBedRadius = self._settings.get(["alvlBedRadius"])

		#self.alvlOperate = self._settings.get(["alvlOperate"])
		if (self.alvlCommand != "G135"):
			self._logger.warn("WARNING! AUTO LEVEL COMMAND HAS BEEN CHANGED FROM DEFAULT \"G135\" TO \"" + self.alvlCommand + "\"")

	def get_assets(self):
		return dict(
			js=["js/alvl.js","js/delta_calibration_wizard.js"],
			css=["css/alvl.css"]
		)
	def get_template_configs(self):
		return [
			dict(type="sidebar", name="Auto Level", icon="arrows-alt-v", template="alvl_sidebar.jinja2", styles=["display: none"], data_bind="visible: loginState.isUser"),
			dict(type="settings", name="A-lvl Settings", template="alvl_settings.jinja2", custom_bindings=False)
			]

	def processGCODE(self, comm, line, *args, **kwargs):
		if "IP: " in line:
			self.processing = True
			self.mesh = [line]
			return line

		if self.processing and "ES: " in line:
			self.mesh.append(line)
			return line

		if self.processing and "AN: " in line:
			self.mesh.append(line)
			return line

		if self.processing and "P0: " in line:
			self.mesh.append(line)
			return line

		if self.processing and "P1: " in line:
			self.mesh.append(line)
			return line

		if self.processing and "P2: " in line:
			self.mesh.append(line)
			return line

		if self.processing and "P3: " in line:
			self.mesh.append(line)
			return line

		if self.processing and "P4: " in line:
			self.mesh.append(line)
			return line

		if self.processing and "P5: " in line:
			self.mesh.append(line)
			return line

		if self.processing and "P6: " in line:
			self.mesh.append(line)
			return line

		if self.processing and "P7: " in line:
			self.mesh.append(line)
			return line

		if self.processing and "P8: " in line:
			self.mesh.append(line)
			return line

		if self.processing and "P9: " in line:
			self.mesh.append(line)
			self._plugin_manager.send_plugin_message(self._identifier, dict(mesh=self.mesh))
			return line

		if self.processing and "Rod Lenght changed" in line:
			self.processing = False
			self._plugin_manager.send_plugin_message(self._identifier, dict(mesh="Ready"))
			return line

		return line

	def get_update_information(self):
		return dict(
			alvl=dict(
				displayName="Automatic Bed Leveling",
				displayVersion=self._plugin_version,

				# version check: github repository
				type="github_release",
				user="avigeilpro",
				repo="OctoPrint-Alvl",
				current=self._plugin_version,

				# update method: pip
				pip="https://github.com/avigeilpro/OctoPrint-Alvl/archive/{target_version}.zip"
			)
		)

__plugin_name__ = "Automatic Bed Leveling"
__plugin_pythoncompat__ = ">=2.7,<4"

def __plugin_load__():
	global __plugin_implementation__
	__plugin_implementation__ = __plugin_implementation__ = AlvlPlugin()

	global __plugin_hooks__
	__plugin_hooks__ = {
		"octoprint.comm.protocol.gcode.received": __plugin_implementation__.processGCODE,
		"octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
	}
