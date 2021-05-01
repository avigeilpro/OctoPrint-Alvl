/*
 * Author: ntoff
 * License: AGPLv3
 */
$(function() {
    function AlvlViewModel(parameters) {
        var self = this;

        self.loginState = parameters[0];
        self.printerState = parameters[1];
        self.settings = parameters[2];

        self.alvlCommand = ko.observable("G135");
	      self.alvlNF = ko.observable("6");
        self.alvlNBCycle = ko.observable("5");
        self.alvlMaxDiff = ko.observable("0.1");
        self.alvlBedRadius = ko.observable("100");
        //self.alvlOperate = ko.observable("0");

        self.AlvlCounter = 0;
        self.Owner = 0;
        self.CalcResult = -1;
        var lvlcommand = "G135 R100";


	self.enableAlvl = ko.pureComputed(function() {
            return self.printerState.isOperational();
        });

        self.enableAlvlButton = ko.pureComputed(function() {
                return self.printerState.isOperational() && self.loginState.isUser(); // && (self.alvlOperate()==0);
        });

        self.alvlState = ko.pureComputed(function() {
            return self.loginState.isUser() > 0 ? "alvl_sidebar" : "alvl_sidebar_disabled";
        });

        self.buttonText = ko.pureComputed(function() {
            if (self.enableAlvl()) {
                return gettext("Auto Level");
            } else {
                return gettext("Offline");
            }
        });

        self.buttonTitle = ko.pureComputed(function() {
            self.alvlCommand(self.settings.settings.plugins.alvl.alvlCommand());
            self.alvlBedRadius(self.settings.settings.plugins.alvl.alvlBedRadius());
            lvlcommand=self.alvlCommand() + " R" + self.alvlBedRadius();
            return gettext("Sends " + lvlcommand + " to the printer IMMEDIATELY");
        });

        self.onBeforeBinding = function () {
            //self.alvlCommand(self.settings.settings.plugins.alvl.alvlCommand());
        };
		self.sendAlvlCommand = function () {
		if (self.enableAlvl()) {
                  self.AlvlCounter = 0;
                  self.alvlCommand(self.settings.settings.plugins.alvl.alvlCommand());
                  self.alvlBedRadius(self.settings.settings.plugins.alvl.alvlBedRadius());
                  lvlcommand=self.alvlCommand() + " R" + self.alvlBedRadius();
                  self.Owner=1;
                  //OctoPrint.control.sendGcode("M190 S90.000000");
                  OctoPrint.control.sendGcode(lvlcommand);
  		};
      };
    self.onDataUpdaterPluginMessage = function (plugin, mesh_data) {
        if (plugin !== "alvl") {
          return;
        }
        //console.log("Data updater alvl");
        if (mesh_data.mesh.indexOf("StartALvl") == 0){
          console.log("StartAlvl command received by plugin");
          self.sendAlvlCommand();
          return;
        }
        //console.log("Ready " + mesh_data.mesh.indexOf("Ready"));
        if ((mesh_data.mesh.indexOf("Ready") == 0) && (self.Owner==1)){
          self.alvlNBCycle(self.settings.settings.plugins.alvl.alvlNBCycle());
          if (self.AlvlCounter < (self.alvlNBCycle()-1)) {
            self.alvlBedRadius(self.settings.settings.plugins.alvl.alvlBedRadius());
            lvlcommand=self.alvlCommand() + " R" + self.alvlBedRadius();
            self.AlvlCounter = self.AlvlCounter +1;
            console.log("send new " + lvlcommand + "(" + self.AlvlCounter + ")");
            OctoPrint.control.sendGcode(lvlcommand);

          }else{
            self.Owner=0;
          }
          return;
        }
        mprobe=[];
	var lastresult="";
	var li=0;
	var color="red";

        for(item of mesh_data.mesh){
          mprobe.push(item.replace("\r\n", ""));
	  lastresult=lastresult+(((li==0)||(li==2)||(li==4)||(li==6)||(li==8)||(li==11)||(li==12))? item.replace("\r\n", "<br>") : item.replace("\r\n", "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"));
	  li+=1;
        }

        if (mprobe.length !== 13){
          return;
        }
        //console.log(mprobe);
      	self.alvlNF(self.settings.settings.plugins.alvl.alvlNF());
        self.alvlMaxDiff(self.settings.settings.plugins.alvl.alvlMaxDiff());
        self.alvlBedRadius(self.settings.settings.plugins.alvl.alvlBedRadius());
        self.CalcResult=-1;
        if (self.Owner==1){
          self.CalcResult=calc(self.alvlNF(),self.alvlMaxDiff(),self.alvlBedRadius());
          if (self.CalcResult<=self.alvlMaxDiff()){
            self.Owner=0;
	    var color="green";
          }
        }else{
          console.log("Not owner, skip calc");
        }
	//<p style="color:red;">Red paragraph text</p>

	lastresult='<p style="font-size:150%; color:' + color + ';"><b>Deviation = ' + ((self.CalcResult == -1) ? "NC" : self.CalcResult) + "</b></p>" + lastresult;
	document.getElementById("presult").innerHTML = lastresult;
        return;
      };
    }


	OCTOPRINT_VIEWMODELS.push({
        construct: AlvlViewModel,
        dependencies: [
			"loginStateViewModel",
			"printerStateViewModel",
			"settingsViewModel"],
        elements: ["#sidebar_plugin_alvl_wrapper"]
    });
});
