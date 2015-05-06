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
 * This is the js module file.
 *
 * Created on 15.04.2009
 * Author: Manfred Kutas <m.kutas@zarafa.com>
 *
 */

mdmmodule.prototype = new ListModule;
mdmmodule.prototype.constructor = mdmmodule;
mdmmodule.superclass = ListModule.prototype;

function mdmmodule(id, element, title, data)
{
    if(arguments.length > 0) {
        this.init(id, element, title, data);
    }
}

mdmmodule.prototype.init = function(id, element, title, data)
{
    mdmmodule.superclass.init.call(this, id, element, title, data);

    // View Object
    this.viewController = new ViewController();

    mdmmodule.superclass.init.call(this, id, element, title, data);
    
    // Set Menu items
    this.menuItems = new Array();
    this.menuItems.push(webclient.menu.createMenuItem("mdm_wipe", dgettext('plugin_mdm', "Request wipe"), dgettext('plugin_mdm', "Wipe all data from device"), eventMdmWipeDataFromDevice));
    this.menuItems.push(webclient.menu.createMenuItem("mdm_remove", dgettext('plugin_mdm', "Remove from list"), dgettext('plugin_mdm', "Remove device from list"), eventMdmRemoveDeviceFromList));
    this.menuItems.push(webclient.menu.createMenuItem("mdm_resync", dgettext('plugin_mdm', "Resync device"), dgettext('plugin_mdm', "Resync device"), eventMdmReSyncDeviceFromList));
    

    webclient.menu.buildTopMenu(this.id, "task", this.menuItems, eventListNewMessage);
    webclient.menu.showMenu();
    
    this.initializeView();
}

mdmmodule.prototype.initializeView = function(view)
{
    this.setTitle(this.title, false, true);
    this.contentElement = dhtml.addElement(this.element, "div", "mdmContainer", "mdmContainer["+this.id+"]");
    
    var data = new Object();
    this.viewController.initView(this.id, "mdm", this.contentElement, this.events, data);
}

mdmmodule.prototype.getDeviceList = function(){
    webclient.xmlrequest.addData(this, "getDeviceList", {});
}


mdmmodule.prototype.execute = function(type, action){
    switch(type) {
        case "getDeviceList":
            this.listDevices(action);
            break;
        case "removeDeviceFromList":
            this.removeDevice(action);
            break;
        case "wipeDataFromDevice":
            this.wipeDevice(action);
            break;
        case "resyncDeviceFromList":
            this.resyncDevice(action);
            break;

    }
}


mdmmodule.prototype.listDevices = function(action){

    var items = Array;
    var properties = Array;
    this.viewController.addItem(items, properties, action, 0);
}

mdmmodule.prototype.removeDevice = function(action){

    var deviceid = dhtml.getXMLValue(action, "deviceid", "none");
    this.viewController.deleteItems(deviceid, 0);
}


mdmmodule.prototype.wipeDevice = function(action){

    var items = Array;
    var properties = Array;
    this.viewController.updateItem(Array, Array, action, 0);
}

mdmmodule.prototype.resyncDevice = function(action){

    var items = Array;
    var properties = Array;
    this.viewController.updateItem(Array, Array, action, 0);
}

mdmmodule.prototype.removeDeviceFromList = function(deviceid) {
    webclient.xmlrequest.addData(this, "removeDeviceFromList", {deviceid: deviceid});
    webclient.xmlrequest.sendRequest();
}


mdmmodule.prototype.wipeDataFromDevice = function(deviceid) {
    webclient.xmlrequest.addData(this, "wipeDataFromDevice", {deviceid: deviceid});
    webclient.xmlrequest.sendRequest();
}

mdmmodule.prototype.resyncDeviceFromList = function(deviceid) {
    webclient.xmlrequest.addData(this, "resyncDeviceFromList", {deviceid: deviceid});
    webclient.xmlrequest.sendRequest();
}

// Place holder functions
mdmmodule.prototype.list = function(){}
