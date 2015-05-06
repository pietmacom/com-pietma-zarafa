<?php
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
 * This is the php plugin file.
 *
 * Created on 15.04.2009
 * Author: Manfred Kutas <m.kutas@zarafa.com>
 *
 */

class Pluginmdm extends Plugin {

    function Pluginmdm() {
        if (isset($GLOBALS['pluginconfig']['mdm']['zpush-2']) && $GLOBALS['pluginconfig']['mdm']['zpush-2'] == true) {
            define("ZPUSH2", true);

            define("SYNC_PROVISION_RWSTATUS_NA", 0);
            define("SYNC_PROVISION_RWSTATUS_OK", 1);
            define("SYNC_PROVISION_RWSTATUS_PENDING", 2);
            define("SYNC_PROVISION_RWSTATUS_REQUESTED", 4);
            define("SYNC_PROVISION_RWSTATUS_WIPED", 8);

            if (!isset($GLOBALS['pluginconfig']['mdm']['zpush-url'])) {
                // alert user
            }
        }
        else {
            define("ZPUSH2", false);

            define("SYNC_PROVISION_RWSTATUS_NA", 0);
            define("SYNC_PROVISION_RWSTATUS_OK", 1);
            define("SYNC_PROVISION_RWSTATUS_PENDING", 2);
            define("SYNC_PROVISION_RWSTATUS_WIPED", 3);

        }
    }

    function init(){
        $this->registerHook('server.plugin.mdmmodule.execute');
    }

    function execute($eventID, &$data){
        switch($eventID){
            case 'server.plugin.mdmmodule.execute':
                $this->moduleExecute($data['moduleObject']);
                break;
        }
    }

    /**
    * Function is triggered on
    *     - MailListModule->execute and
    *     - AlfrescoSpaceModule->execute
    * works with the complete module objects
    *
    * @param object $aModule related module object
    * @return void
    */
    function moduleExecute(&$aModule) {
        foreach($aModule->data as $action)
        {
            if(isset($action["attributes"]) && isset($action["attributes"]["type"])) {
                $store = $aModule->getActionStore($action);
                $parententryid = $aModule->getActionParentEntryID($action);
                switch($action["attributes"]["type"]) {

                    case "getDeviceList":
                        $result = $this->getDeviceList($aModule, $action);
                        break;

                    case "removeDeviceFromList":{
                        $result = $this->removeDeviceFromList($aModule, $action);
                        break;
                    }

                    case "wipeDataFromDevice":{
                        $result = $this->wipeDataFromDevice($aModule, $action);
                        break;
                    }

                    case "resyncDeviceFromList":{
                        $result = $this->resyncDeviceFromList($aModule, $action);
                        break;
                    }
                }
            }
        }
    }

    /**
     * Function retrieves the list of spaces, files or executes a search on Alfresco
     *
     * @param object $alfrescoSpaceModule the alfresco space module
     * @param array $action data transmitted from the request
     * @return boolean true on success or false on failure
     */
    function getDeviceList(&$aModule, $action){

        // Z-Push 1.x code
        if (!ZPUSH2) {
            $devicedata = mapi_getprops($GLOBALS['mapisession']->getDefaultMessageStore(),
                            array(SYNC_PROVISION_RWSTATUS, SYNC_PROVISION_POLKEY, SYNC_PROVISION_DEVID, SYNC_PROVISION_DEVTYPE, SYNC_PROVISION_USERAGENT,
                                    SYNC_PROVISION_WIPEREQDATE, SYNC_PROVISION_WIPEREQBY, SYNC_PROVISION_WIPEEXEC, SYNC_PROVISION_FIRSTSYNC, SYNC_PROVISION_LASTSYNC
                            ));
            if (isset($devicedata) && is_array($devicedata)) {
                if (isset($devicedata[SYNC_PROVISION_POLKEY]) && is_array($devicedata[SYNC_PROVISION_POLKEY])) {
                    $devices = array();
                    $devicescnt = count ($devicedata[SYNC_PROVISION_POLKEY]);

                    for ($i = 0; $i < $devicescnt; $i++) {
                        //generate some devid if it is not set,
                        //in order to be able to remove it later via mdm
                        if (!isset($devicedata[SYNC_PROVISION_DEVID][$i]) || ! $devicedata[SYNC_PROVISION_DEVID][$i]) {
                            $devicedata[SYNC_PROVISION_DEVID][$i] = mt_rand(0, 100000);
                            mapi_setprops($GLOBALS['mapisession']->getDefaultMessageStore(), array(SYNC_PROVISION_DEVID=>$devicedata[SYNC_PROVISION_DEVID]));
                        }

                        $device = array();
                        $device['policeykey']   = $devicedata[SYNC_PROVISION_POLKEY][$i];
                        $device['deviceid']     = $devicedata[SYNC_PROVISION_DEVID][$i];
                        $device['devicetype']   = $devicedata[SYNC_PROVISION_DEVTYPE][$i];
                        $device['useragent']    = $devicedata[SYNC_PROVISION_USERAGENT][$i];
                        $device['rwstatus']     = $devicedata[SYNC_PROVISION_RWSTATUS][$i];
                        $device['wipereqdate']  = ($devicedata[SYNC_PROVISION_WIPEREQDATE][$i] != "undefined") ? date("Y-m-d H:i", $devicedata[SYNC_PROVISION_WIPEREQDATE][$i]) : 0;
                        $device['wipereqby']    = $devicedata[SYNC_PROVISION_WIPEREQBY][$i];
                        $device['wipeexec']     = ($devicedata[SYNC_PROVISION_WIPEEXEC][$i] != "undefined") ? date("Y-m-d H:i", $devicedata[SYNC_PROVISION_WIPEEXEC][$i]) : 0;
                        $device['firstsync']    = date("Y-m-d H:i", $devicedata[SYNC_PROVISION_FIRSTSYNC][$i]);
                        $device['lastsync']     = date("Y-m-d H:i", $devicedata[SYNC_PROVISION_LASTSYNC][$i]);
                        $devices[] = $device;
                    }

                    array_push($aModule->responseData["action"], array("devices"=>$devices, "attributes"=>array("type"=>"getDeviceList")));
                    $GLOBALS["bus"]->addData($aModule->responseData);
                }
            }
        }
        // Z-Push-2 code
        else {
            $soap = $this->soapConnection();
            try {
                if ($soap)
                    $result = $soap->ListDevicesDetails();
            }
            catch (SoapFault $sf) {
                // alert user
            }

            if (isset($result) && is_array($result)){
                $devices = array();
                foreach ($result as $deviceobj) {
                    if (!isset($deviceobj->data) || !is_array($deviceobj->data))
                        continue;

                    $devicedata = $deviceobj->data;
                    $device = array();

                    $device['policeykey']   = $devicedata['policykey'];
                    $device['deviceid']     = $devicedata['deviceid'];
                    $device['devicetype']   = $devicedata['devicetype'];
                    $device['useragent']    = $devicedata['useragent'];
                    $device['rwstatus']     = $devicedata['wipestatus'];
                    $device['wipereqdate']  = ($devicedata['wiperequestedon'] != false) ? date("Y-m-d H:i", $devicedata['wiperequestedon']) : 0;
                    $device['wipereqby']    = ($devicedata['wiperequestedby'] != false) ? $devicedata['wiperequestedby'] : "unknown";
                    $device['wipeexec']     = ($devicedata['wipeactionon']  != false) ? date("Y-m-d H:i", $devicedata['wipeactionon']) : 0;
                    $device['firstsync']    = date("Y-m-d H:i", $devicedata['firstsynctime']);
                    $device['lastsync']     = date("Y-m-d H:i", $devicedata['lastsynctime']);

                    // TODO add missing data
                    /*
                     * lastupdatetime
                     * useragentHistory
                     * asversion
                     * nr of synchronized folders
                     * messages for user's attention
                     *
                     */
                    $devices[] = $device;
                }
                array_push($aModule->responseData["action"], array("devices"=>$devices, "attributes"=>array("type"=>"getDeviceList")));
                $GLOBALS["bus"]->addData($aModule->responseData);
            }

        }
        return true;
    }


    function removeDeviceFromList(&$aModule, $action){

        if (isset($action["deviceid"]))
            $deviceid = $action['deviceid'];

        // Z-Push 1.x code
        if (!ZPUSH2) {
            $devicedata = mapi_getprops($GLOBALS['mapisession']->getDefaultMessageStore(),
                            array(SYNC_PROVISION_RWSTATUS, SYNC_PROVISION_POLKEY, SYNC_PROVISION_DEVID, SYNC_PROVISION_DEVTYPE, SYNC_PROVISION_USERAGENT,
                                    SYNC_PROVISION_WIPEREQDATE, SYNC_PROVISION_WIPEREQBY, SYNC_PROVISION_WIPEEXEC, SYNC_PROVISION_FIRSTSYNC, SYNC_PROVISION_LASTSYNC
                            ));

            if (isset($devicedata[SYNC_PROVISION_DEVID]) && is_array($devicedata[SYNC_PROVISION_DEVID])) {
                $ak = array_search($deviceid, $devicedata[SYNC_PROVISION_DEVID]);
                    if ($ak !== false) {
                        if (count($devicedata[SYNC_PROVISION_DEVID]) == 1) {
                            mapi_deleteprops($GLOBALS['mapisession']->getDefaultMessageStore(), array(
                                SYNC_PROVISION_RWSTATUS, SYNC_PROVISION_POLKEY, SYNC_PROVISION_DEVID,
                                SYNC_PROVISION_DEVTYPE,SYNC_PROVISION_USERAGENT,SYNC_PROVISION_WIPEREQDATE,
                                SYNC_PROVISION_WIPEREQBY,SYNC_PROVISION_WIPEEXEC,SYNC_PROVISION_FIRSTSYNC,
                                SYNC_PROVISION_LASTSYNC)
                            );
                        }
                        else {
                            unset($devicedata[SYNC_PROVISION_RWSTATUS][$ak], $devicedata[SYNC_PROVISION_POLKEY][$ak], $devicedata[SYNC_PROVISION_DEVID][$ak],
                                $devicedata[SYNC_PROVISION_DEVTYPE][$ak],$devicedata[SYNC_PROVISION_USERAGENT][$ak],$devicedata[SYNC_PROVISION_WIPEREQDATE][$ak],
                                $devicedata[SYNC_PROVISION_WIPEREQBY][$ak],$devicedata[SYNC_PROVISION_WIPEEXEC][$ak],$devicedata[SYNC_PROVISION_FIRSTSYNC][$ak],
                                $devicedata[SYNC_PROVISION_LASTSYNC][$ak]);
                            mapi_setprops($GLOBALS['mapisession']->getDefaultMessageStore(),
                                        array(
                                            SYNC_PROVISION_RWSTATUS     => isset($devicedata[SYNC_PROVISION_RWSTATUS]) ? $devicedata[SYNC_PROVISION_RWSTATUS] : array(),
                                            SYNC_PROVISION_POLKEY       => isset($devicedata[SYNC_PROVISION_POLKEY]) ? $devicedata[SYNC_PROVISION_POLKEY] : array(),
                                            SYNC_PROVISION_DEVID        => isset($devicedata[SYNC_PROVISION_DEVID]) ? $devicedata[SYNC_PROVISION_DEVID] : array(),
                                            SYNC_PROVISION_DEVTYPE      => isset($devicedata[SYNC_PROVISION_DEVTYPE]) ? $devicedata[SYNC_PROVISION_DEVTYPE] : array(),
                                            SYNC_PROVISION_USERAGENT    => isset($devicedata[SYNC_PROVISION_USERAGENT]) ? $devicedata[SYNC_PROVISION_USERAGENT] : array(),
                                            SYNC_PROVISION_WIPEREQDATE  => isset($devicedata[SYNC_PROVISION_WIPEREQDATE]) ? $devicedata[SYNC_PROVISION_WIPEREQDATE] : array(),
                                            SYNC_PROVISION_WIPEREQBY    => isset($devicedata[SYNC_PROVISION_WIPEREQBY]) ? $devicedata[SYNC_PROVISION_WIPEREQBY] : array(),
                                            SYNC_PROVISION_WIPEEXEC     => isset($devicedata[SYNC_PROVISION_WIPEEXEC]) ? $devicedata[SYNC_PROVISION_WIPEEXEC] : array(),
                                            SYNC_PROVISION_FIRSTSYNC    => isset($devicedata[SYNC_PROVISION_FIRSTSYNC]) ? $devicedata[SYNC_PROVISION_FIRSTSYNC] : array(),
                                            SYNC_PROVISION_LASTSYNC     => isset($devicedata[SYNC_PROVISION_LASTSYNC]) ? $devicedata[SYNC_PROVISION_LASTSYNC] : array()
                                        ));
                        }

                    }
                    else {
                        dump("no device found: $deviceid");
                    }
            }
        }
        // Z-Push-2 code
        else {
            if ($deviceid) {
                $soap = $this->soapConnection();

                try {
                    if ($soap)
                        $result = $soap->RemoveDevice($deviceid);
                }
                catch (SoapFault $sf) {
                    // alert user
                }
            }
        }

        array_push($aModule->responseData["action"], array("deviceid" => $deviceid, "attributes"=>array("type" => "removeDeviceFromList")));
        $GLOBALS["bus"]->addData($aModule->responseData);

        return true;
    }


    function wipeDataFromDevice(&$aModule, $action){

        $data = array();
        if (isset($action["deviceid"]))
            $deviceid = $action['deviceid'];

        // Z-Push 1.x code
        if (!ZPUSH2) {
            $devicedata = mapi_getprops($GLOBALS['mapisession']->getDefaultMessageStore(),
                            array(SYNC_PROVISION_RWSTATUS, SYNC_PROVISION_POLKEY, SYNC_PROVISION_DEVID, SYNC_PROVISION_DEVTYPE, SYNC_PROVISION_USERAGENT,
                                    SYNC_PROVISION_WIPEREQDATE, SYNC_PROVISION_WIPEREQBY, SYNC_PROVISION_WIPEEXEC, SYNC_PROVISION_FIRSTSYNC, SYNC_PROVISION_LASTSYNC
                            ));

            if (isset($devicedata[SYNC_PROVISION_DEVID]) && is_array($devicedata[SYNC_PROVISION_DEVID])) {
                $ak = array_search($deviceid, $devicedata[SYNC_PROVISION_DEVID]);
                    if ($ak !== false) {

                        //$devicedata[SYNC_PROVISION_POLKEY][$ak] .= "0";
                        $devicedata[SYNC_PROVISION_WIPEREQDATE][$ak] = time();
                        $devicedata[SYNC_PROVISION_WIPEREQBY][$ak] = $GLOBALS['mapisession']->getUserName();
                        $devicedata[SYNC_PROVISION_RWSTATUS][$ak] = SYNC_PROVISION_RWSTATUS_PENDING;
                        $devicedata[SYNC_PROVISION_WIPEREQDATE][$ak] = time();
                        $devicedata[SYNC_PROVISION_POLKEY][$ak] = $devicedata[SYNC_PROVISION_POLKEY][$ak]."0";

                        mapi_setprops($GLOBALS['mapisession']->getDefaultMessageStore(),
                                        array(
                                            SYNC_PROVISION_RWSTATUS     => $devicedata[SYNC_PROVISION_RWSTATUS],
                                            SYNC_PROVISION_POLKEY       => $devicedata[SYNC_PROVISION_POLKEY],
                                            SYNC_PROVISION_DEVID        => $devicedata[SYNC_PROVISION_DEVID],
                                            SYNC_PROVISION_DEVTYPE      => $devicedata[SYNC_PROVISION_DEVTYPE],
                                            SYNC_PROVISION_USERAGENT    => $devicedata[SYNC_PROVISION_USERAGENT],
                                            SYNC_PROVISION_WIPEREQDATE  => $devicedata[SYNC_PROVISION_WIPEREQDATE],
                                            SYNC_PROVISION_WIPEREQBY    => $devicedata[SYNC_PROVISION_WIPEREQBY],
                                            SYNC_PROVISION_WIPEEXEC     => $devicedata[SYNC_PROVISION_WIPEEXEC],
                                            SYNC_PROVISION_FIRSTSYNC    => $devicedata[SYNC_PROVISION_FIRSTSYNC],
                                            SYNC_PROVISION_LASTSYNC     => $devicedata[SYNC_PROVISION_LASTSYNC]
                                        ));

                    }
                    else {
                    }
            }
            $devicedata = array();

            $devicedata = mapi_getprops($GLOBALS['mapisession']->getDefaultMessageStore(),
                            array(SYNC_PROVISION_RWSTATUS, SYNC_PROVISION_POLKEY, SYNC_PROVISION_DEVID, SYNC_PROVISION_DEVTYPE, SYNC_PROVISION_USERAGENT,
                                    SYNC_PROVISION_WIPEREQDATE, SYNC_PROVISION_WIPEREQBY, SYNC_PROVISION_WIPEEXEC, SYNC_PROVISION_FIRSTSYNC, SYNC_PROVISION_LASTSYNC
                            ));

            if (isset($devicedata[SYNC_PROVISION_DEVID]) && is_array($devicedata[SYNC_PROVISION_DEVID])) {
                $ak = array_search($deviceid, $devicedata[SYNC_PROVISION_DEVID]);
                    if ($ak !== false) {
                        $data["wipestatus"] = $devicedata[SYNC_PROVISION_RWSTATUS][$ak];
                        $data["wipereqby"] = $devicedata[SYNC_PROVISION_WIPEREQBY][$ak];
                        $data["wipereqdate"] = date ("Y-m-d H:i", $devicedata[SYNC_PROVISION_WIPEREQDATE][$ak]);
                    }
            }
        }
        // Z-Push-2 code
        else {
            if ($deviceid) {
                $soap = $this->soapConnection();
                try {
                    if ($soap)
                        $result = $soap->WipeDevice($deviceid);
                }
                catch (SoapFault $sf) {
                    // alert user
                }
            }
        }

        $data["deviceid"] = $deviceid;
        $data["attributes"] = array("type" => "wipeDataFromDevice");

        array_push($aModule->responseData["action"], $data);
        $GLOBALS["bus"]->addData($aModule->responseData);

        return true;
    }

    function resyncDeviceFromList(&$aModule, $action){

        $data = array();
        if (isset($action["deviceid"]))
            $deviceid = $action['deviceid'];

        // Z-Push 1.x code
        if (!ZPUSH2) {
            // this is not available in Z-Push 1
        }
        // Z-Push-2 code
        else {
            if ($deviceid) {
                $soap = $this->soapConnection();
                try {
                    if ($soap)
                        $result = $soap->ResyncDevice($deviceid);
                }
                catch (SoapFault $sf) {
                    // alert user
                }
            }
        }

        $data["deviceid"] = $deviceid;
        $data["attributes"] = array("type" => "resyncDeviceFromList");

        array_push($aModule->responseData["action"], $data);
        $GLOBALS["bus"]->addData($aModule->responseData);

        return true;
    }

    function soapConnection() {
        // TODO target user may be different than logged in user (admin opening user store)
        $targetUser = $_SESSION["username"];

        if (! class_exists('SoapClient'))
            return false;

        $client = new SoapClient(null, array(
                                        'location' => $GLOBALS['pluginconfig']['mdm']['zpush-url'] ."/Microsoft-Server-ActiveSync?Cmd=WebserviceDevice&DeviceId=webservice&DeviceType=webservice&User=". urlencode($targetUser),
                                        'uri' => "http://z-push.sf.net/webservice",
                                        'trace' => 1,
                                        'login' => $_SESSION["username"],
                                        'password' => $_SESSION["password"]
                                        ));

        return $client;
    }
}
?>
