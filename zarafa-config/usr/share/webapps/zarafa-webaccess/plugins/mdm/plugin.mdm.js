/*
 * Copyright 2005 - 2012  Zarafa B.V.
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License, version 3, 
 * as published by the Free Software Foundation with the following additional 
 * term according to sec. 7:
 *  
 * According to sec. 7 of the GNU Affero General Public License, version
 * 3, the terms of the AGPL are supplemented with the following terms:
 * 
 * "Zarafa" is a registered trademark of Zarafa B.V. The licensing of
 * the Program under the AGPL does not imply a trademark license.
 * Therefore any rights, title and interest in our trademarks remain
 * entirely with us.
 * 
 * However, if you propagate an unmodified version of the Program you are
 * allowed to use the term "Zarafa" to indicate that you distribute the
 * Program. Furthermore you may use our trademarks where it is necessary
 * to indicate the intended purpose of a product or service provided you
 * use it in accordance with honest practices in industrial or commercial
 * matters.  If you want to propagate modified versions of the Program
 * under the name "Zarafa" or "Zarafa Server", you may only do so if you
 * have a written permission by Zarafa B.V. (to acquire a permission
 * please contact Zarafa at trademark@zarafa.com).
 * 
 * The interactive user interface of the software displays an attribution
 * notice containing the term "Zarafa" and/or the logo of Zarafa.
 * Interactive user interfaces of unmodified and modified versions must
 * display Appropriate Legal Notices according to sec. 5 of the GNU
 * Affero General Public License, version 3, when you propagate
 * unmodified or modified versions of the Program. In accordance with
 * sec. 7 b) of the GNU Affero General Public License, version 3, these
 * Appropriate Legal Notices must retain the logo of Zarafa or display
 * the words "Initial Development by Zarafa" if the display of the logo
 * is not reasonably feasible for technical reasons. The use of the logo
 * of Zarafa in Legal Notices is allowed for unmodified and modified
 * versions of the software.
 * 
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 * GNU Affero General Public License for more details.
 *  
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 * 
 */

/**
 * Mdm (mobile device management) Module
 *
 * This is the plugin file.
 *
 * Created on 15.04.2009
 * Author: Manfred Kutas <m.kutas@zarafa.com>
 *
 */
Pluginmdm.prototype = new Plugin;
Pluginmdm.prototype.constructor = Pluginmdm;
Pluginmdm.superclass = Plugin.prototype;

function Pluginmdm(){}

Pluginmdm.prototype.init = function(){
    this.registerHook("client.module.hierarchymodule.sharedFoldersPane.buildup");
    this.registerHook("client.core.viewcontroller.initview.addcustomview");
    

}

Pluginmdm.prototype.execute = function(eventID, data){
    switch(eventID){
        case "client.module.hierarchymodule.sharedFoldersPane.buildup":
            this.placeSharedFoldersElement(data);
            break;
        case "client.core.viewcontroller.initview.addcustomview":
            this.addViews(data);
            break;
    }
}

Pluginmdm.prototype.placeSharedFoldersElement = function(data){
    var sharedFoldersElement = data["sharedFoldersElement"];

    if (sharedFoldersElement.lastChild.tagName.toLowerCase() != "br" ) {
        dhtml.addElement(sharedFoldersElement,"br");
    }

    var mdmLink = dhtml.addElement(sharedFoldersElement,"a", false, false, dgettext('plugin_mdm', "Open mobile device management"));
    dhtml.addEvent(this.id, mdmLink, "click", function(){
        // Delete the datepicker module when it has been loaded
        if (webclient.datepicker){
            webclient.deleteModule(webclient.datepicker);
            webclient.datepicker = null;
            dragdrop.updateTargets("folder");
        }
        webclient.loadModule("mdmmodule", "Mobile device management", "main", null, BORDER_LAYOUT);
    });

}

Pluginmdm.prototype.addViews = function(data){
    switch(data["view"]){
        case "mdm":
            data["viewcontroller"].viewObject = new MdmView(data["moduleID"], data["element"], data["events"], data["data"]);
            mdm = webclient.getModule(data["moduleID"]);
            if (mdm) {
                mdm.getDeviceList();
            }
            break;
    }
}


function cfmAction(moduleid, action) {
    var devices = document.getElementsByName("device");
    var deviceid = -1;
    
    for (var i=0; i<devices.length; i++) {
        if (devices[i].checked) {
            deviceid = devices[i].value; 
            break;
        }
    }

    if (deviceid == -1) {
        alert (dgettext('plugin_mdm', "No device selected"));
        return;
    }
    
    mdm = webclient.getModule(moduleid);
    
    
    if (mdm && deviceid) {
        switch (action){
            case "rmdev":
                if (confirm(dgettext('plugin_mdm', "Are you sure that you want to remove this device from the list?")))
                    mdm.removeDeviceFromList(deviceid);
                break;
            case "rsdev":
                if (confirm(dgettext('plugin_mdm', "Are you sure that you want to re-synchronize all data on this device? This will take several minutes. \nThis functionality is only available if used with Z-Push 2.")))
                    mdm.resyncDeviceFromList(deviceid);
                break;

            case "wpdev":
                if (confirm(dgettext('plugin_mdm', "Are you sure that you want to wipe all data from the device?"))) {
		    if (confirm(dgettext('plugin_mdm', "ARE YOU REALLY SURE?? ALL DATA WILL BE LOST!!")))
	                    mdm.wipeDataFromDevice(deviceid);
		}
                break;
        }
    }
}
