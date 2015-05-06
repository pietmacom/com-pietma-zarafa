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
 * This is the view file.
 *
 * Created on 15.04.2009
 * Author: Manfred Kutas <m.kutas@zarafa.com>
 *
 * DEPENDS ON:
 * |------> view.js
 *
 * 
 */

MdmView.prototype = new View;
MdmView.prototype.constructor = MdmView;
MdmView.superclass = View.prototype;

// PUBLIC
/**
 * @constructor This view can be used for stickynote list module to display the sticknote items
 * @param {Int} moduleID
 * @param {HtmlElement} element
 * @param {Object} events
 * @param {XmlElement} data
 */
function MdmView(moduleID, element, events, data) {
    this.element = element;
    this.moduleID = moduleID;
    this.events = events;
    this.data = data;
    
    this.initView();
}

/**
 * Function will render the view and execute this.resizeView when done
 */
MdmView.prototype.initView = function() {
    // clear old elements
    dhtml.deleteAllChildren(this.element);
    
    var mdmContainer = dhtml.getElementById("mdmContainer["+this.moduleID+"]");
    
    if (!mdmContainer) mdmContainer = dhtml.addElement(this.element, "div", "mdmContainer", "mdmContainer["+this.moduleID+"]");

    
    var mdmDescription = dhtml.addElement(mdmContainer, "span", "mdmDescription", "mdmDescription["+this.moduleID+"]");
    mdmDescription.innerHTML = this.getMdmDescription();
    
    dhtml.addElement(mdmContainer, "br");
    dhtml.addElement(mdmContainer, "br");
    dhtml.addElement(mdmContainer, "br");
    
}

MdmView.prototype.addItem = function (items, properties, action, groupID) {

    var devices = action.getElementsByTagName("devices");
    
    if (devices.length > 0 ) {
        var mdmContainer = dhtml.getElementById("mdmContainer["+this.moduleID+"]");
        
        var devicesTable = '<table id="devicesTable['+this.moduleID+']" class="devicesTable" cellspacing="0">';
        var devicesTableHeader = '<tr class="headerdevices">';
        devicesTableHeader += '<td class="devicesTableHeader1">&nbsp;</td>';
        devicesTableHeader += '<td class="devicesTableHeader1">'+dgettext('plugin_mdm', "Device")+'</td>';
        devicesTableHeader += '<td class="devicesTableHeader2">'+dgettext('plugin_mdm', "Last sync time")+'</td>';
        devicesTableHeader += '<td class="devicesTableHeader1">'+dgettext('plugin_mdm', "Status")+'</td></tr>';
        
        var devicesTableContent = '';
    
        for (var i=0;i<devices.length;i++){
            devicesTableContent += '<tr id="devicerow_' + dhtml.getXMLValue(devices[i], "deviceid") + '">';
            devicesTableContent += '<td class="devicesTableContentInput"><input name="device" type="radio" value="' + dhtml.getXMLValue(devices[i], "deviceid") +'"></td>';
            devicesTableContent += '<td class="devicesTableContent1">' + dgettext('plugin_mdm', dhtml.getXMLValue(devices[i], "devicetype")) + '</td>';
            devicesTableContent += '<td class="devicesTableContent2">' + dhtml.getXMLValue(devices[i], "lastsync") + '</td>';
            
            devicesTableContent += '<td class="devicesTableContent1">';
            
            devicesTableContent += '<span id="devstatus_' + dhtml.getXMLValue(devices[i], "deviceid") + '">';
            var devstatus = dhtml.getXMLValue(devices[i], "rwstatus");
            switch (devstatus) {
                case '1': devicesTableContent += 'OK'; break;

                case '2': 
                    devicesTableContent += '<span class="wipeddevices">'+dgettext('plugin_mdm', "Pending wipe")+'</span>';
                    var wipereqby = dhtml.getXMLValue(devices[i], "wipereqby");
                    if (wipereqby != "undefined")
                        devicesTableContent += "<br>" + dgettext('plugin_mdm', "Wipe requested by:") +' '+ wipereqby;
                    
                    var wipereqdate = dhtml.getXMLValue(devices[i], "wipereqdate");
                    if (wipereqdate != "undefined") 
                        devicesTableContent +=" " + dgettext('plugin_mdm', "on") + " " + wipereqdate;
                    break;

                case '4': // Z-Push 2 definition
                    devicesTableContent += '<span class="wipeddevices">'+dgettext('plugin_mdm', "Requested wipe")+'</span>';
                    var wipereqby = dhtml.getXMLValue(devices[i], "wipereqby");
                    if (wipereqby != "undefined")
                        devicesTableContent += "<br>" + dgettext('plugin_mdm', "Wipe requested by:") +' '+ wipereqby;
                    
                    var wipereqdate = dhtml.getXMLValue(devices[i], "wipereqdate");
                    if (wipereqdate != "undefined") 
                        devicesTableContent +=" " + dgettext('plugin_mdm', "on") + " " + wipereqdate;
                    break;


                case '3':
                case '8': // Z-Push 2 definition
                    devicesTableContent += '<span class="wipeddevices">'+dgettext('plugin_mdm', "Wiped")+'</span>';
                    var wipeexec = dhtml.getXMLValue(devices[i], "wipeexec");
                    if (wipeexec != "0") 
                        devicesTableContent +=" " + dgettext('plugin_mdm', "on") + " "  + wipeexec;
                    var wipereqby = dhtml.getXMLValue(devices[i], "wipereqby");
                    if (wipereqby != "undefined")
                        devicesTableContent += "<br>" + dgettext('plugin_mdm', "Wipe requested by:") +' '+ wipereqby;
                    
                    var wipereqdate = dhtml.getXMLValue(devices[i], "wipereqdate");
                    if (wipereqdate != "undefined") 
                        devicesTableContent += " " + dgettext('plugin_mdm', "on") + " "  + wipereqdate;
                    break;
                default: devicesTableContent += dgettext('plugin_mdm', "Not available"); break;
            }
            devicesTableContent += '</span><br>';
            
            devicesTableContent += dgettext('plugin_mdm', "First sync on:")+' '+ dhtml.getXMLValue(devices[i], "firstsync") + '<br>';
            devicesTableContent += dgettext('plugin_mdm', "Device id:")+' ' + dhtml.getXMLValue(devices[i], "deviceid") + '<br>';
            devicesTableContent += dgettext('plugin_mdm', "User agent:")+' ' + dhtml.getXMLValue(devices[i], "useragent") + '<br>';
            devicesTableContent += '</tr>';

              
        }
        mdmContainer.innerHTML += devicesTable + devicesTableHeader + devicesTableContent + "</table><br>";
    }

    var mdmFooter = dhtml.addElement(mdmContainer, "span", "mdmDescription", "mdmDescription["+this.moduleID+"]");
    mdmFooter.innerHTML = this.getMdmFooter();
    
}


MdmView.prototype.deleteItems = function (item, groupID) {
    var row = dhtml.getElementById("devicerow_"+item);
    
    if (row) {
        var devicetable = row.parentNode;
        devicetable.removeChild(row);
        
        //check if only header row left
        //remove the device table if true
        if (devicetable.childNodes.length == 1) {
            dhtml.getElementById("mdmContainer["+this.moduleID+"]").removeChild(dhtml.getElementById("devicesTable["+this.moduleID+"]"));
        }
    }
}


MdmView.prototype.updateItem = function(item, properties, action, groupID){
    var deviceid = dhtml.getXMLValue(action, "deviceid", "none");
    var devstatus = dhtml.getXMLValue(action, "wipestatus", "none");
    
    var devinfo = dhtml.getElementById("devstatus_"+deviceid);
    
    if (devinfo) {
        var str = "";
        switch (devstatus) {
            case '1': str += 'OK'; break;
            case '2': str += '<span class="wipeddevices">'+ dgettext('plugin_mdm', "Pending wipe") +'</span>'; break;
            case '3': str += '<span class="wipeddevices">'+ dgettext('plugin_mdm', "Wiped") +'</span>'; break;
            default: str += 'Not available'; break;
        }
        str +="<br>";
        str += dgettext('plugin_mdm', "Wipe requested by:") + " " + dhtml.getXMLValue(action, "wipereqby", "none");
        str += " on " + dhtml.getXMLValue(action, "wipereqdate", "none");
        
        devinfo.innerHTML = str;
    }
}

MdmView.prototype.getMdmDescription = function() {
    return 	dgettext('plugin_mdm', "You can manage your mobile devices here.") + "<br><br>"+
    dgettext('plugin_mdm', "You can initiate a remote wipe in order to delete all private data from a lost device or delete the devices you are no longer using.");
}

MdmView.prototype.getMdmFooter = function() {
    return "<b>"+  dgettext('plugin_mdm', "Please be aware, that a wipe normally formats the ROM of your device (native ActiveSync)!!") +
           "<br>"+ dgettext('plugin_mdm', "All data including the operation system is lost and have to be reinstalled afterwards!!")+
           "<br>"+ dgettext('plugin_mdm', "Some devices like the iPhone will go into the recovery mode!") +
           "<br>"+ dgettext('plugin_mdm', "Depending on the device, inserted memory cards are also formatted!!")+
           "<br><br>" + dgettext('plugin_mdm', "Using the wipe is entirely YOUR OWN responsability!! You are warned!")+ "</b>";
}


MdmView.prototype.getMdmActionLinks = function() {
    return "<a href=\"#\" onclick='return cfmAction("+this.moduleID + ",\"rmdev\");'>"+dgettext('plugin_mdm', "Remove Device from List") +"...</a> &nbsp; | &nbsp; <a href=\"#\" onclick='return cfmAction("+this.moduleID + ",\"wpdev\");'>"+dgettext('plugin_mdm', "Wipe All Data from Device") +"...</a> &nbsp; | &nbsp; <a href=\"#\" onclick='return cfmAction("+this.moduleID + ",\"rsdev\");'>"+dgettext('plugin_mdm', "Re-Synchronize all data on device") +"...</a>";
}

function eventMdmWipeDataFromDevice(moduleObject, element, event)
{
    cfmAction(moduleObject.id, "wpdev");
}
function eventMdmRemoveDeviceFromList(moduleObject, element, event)
{
    cfmAction(moduleObject.id, "rmdev");
}
function eventMdmReSyncDeviceFromList(moduleObject, element, event)
{
    cfmAction(moduleObject.id, "rsdev");
}
