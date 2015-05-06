Ext.namespace("Zarafa.plugins.pimfolder");
Zarafa.plugins.pimfolder.PimPlugin=Ext.extend(Zarafa.core.Plugin,{initPlugin:function(){Zarafa.plugins.pimfolder.PimPlugin.superclass.initPlugin.apply(this,arguments);this.registerInsertionPoint("previewpanel.toolbar.right",this.makeAButtonInToolbarMenu,this);this.registerInsertionPoint("context.mail.contextmenu.options",this.makeAButtonInContextMenu,this);this.registerInsertionPoint("context.settings.category.plugins",this.createSettingsWidget,this)},makeAButtonInContextMenu:function(){var a=this.getTargetFolder();
if(a){a=a.getFullyQualifiedDisplayName();return[{xtype:"zarafa.conditionalitem",tooltip:String.format(_("Move currently selected message(s) to {0}"),a),text:String.format(_("Move to {0}"),a),iconCls:"icon_pim_setup",handler:this.moveSelectedMailsToFolder,scope:this}]}},makeAButtonInToolbarMenu:function(){var a=this.getTargetFolder();if(a){a=a.getFullyQualifiedDisplayName();return{xtype:"button",tooltip:String.format(_("Move current message to {0}"),a),overflowText:String.format(_("Move to {0}"),a),
iconCls:"icon_pim_setup",handler:this.moveOneMailToFolder,scope:this,plugins:["zarafa.recordcomponentupdaterplugin"],update:function(b){this.records=[b]}}}},moveSelectedMailsToFolder:function(a){this.moveMailsToFolder(a.parentMenu.records)},moveOneMailToFolder:function(a){this.moveMailsToFolder(a.records)},moveMailsToFolder:function(a){var b=this.getTargetFolder();if(!(b==undefined||a.length==0)){var c=undefined;Ext.each(a,function(d){c=d.store;d.moveTo(b)},this);c.save(a)}},getTargetFolder:function(){var a=
container.getSettingsModel(),b=a.get(this.getSettingsBase()+"/store_entryid");a=a.get(this.getSettingsBase()+"/folder_entryid");if(!Ext.isEmpty(b)&&!Ext.isEmpty(a))if(b=container.getHierarchyStore().getById(b))return b.getFolderStore().getById(a)},createSettingsWidget:function(){return{xtype:"zarafa.pimfoldersettingswidget",plugin:this}}});Zarafa.onReady(function(){container.registerPlugin(new Zarafa.core.PluginMetaData({name:"pimfolder",displayName:_("Personal Inbox Manager"),pluginConstructor:Zarafa.plugins.pimfolder.PimPlugin}))});
Ext.namespace("Zarafa.plugins.pimfolder");
Zarafa.plugins.pimfolder.PimPluginSettingsWidget=Ext.extend(Zarafa.settings.ui.SettingsWidget,{plugin:undefined,currentFolder:undefined,constructor:function(a){a=a||{};Ext.applyIf(a,{title:_("Personal Inbox Management Settings"),xtype:"panel",items:[{xtype:"zarafa.compositefield",hideLabel:true,items:[{xtype:"displayfield",autoWidth:true,ref:"../selectedFolderLabel"},{xtype:"button",text:_("Select another folder"),handler:this.onSelectFolder,scope:this}]}]});Zarafa.plugins.pimfolder.PimPluginSettingsWidget.superclass.constructor.call(this,
a)},onSelectFolder:function(){Zarafa.hierarchy.Actions.openFolderSelectionContent({callback:this.onFolderSelected,folder:this.currentFolder,scope:this})},onFolderSelected:function(a){var b=container.getSettingsModel();b.beginEdit();b.set("zarafa/v1/plugins/pimfolder/folder_entryid",a.get("entryid"));b.set("zarafa/v1/plugins/pimfolder/store_entryid",a.get("store_entryid"));b.endEdit();this.update(b)},update:function(){var a=_("(None)");if(this.currentFolder=this.plugin.getTargetFolder())a=this.currentFolder.getFullyQualifiedDisplayName();
this.selectedFolderLabel.setValue(String.format(_("E-mails are moved to {0}"),a));this.doLayout()}});Ext.reg("zarafa.pimfoldersettingswidget",Zarafa.plugins.pimfolder.PimPluginSettingsWidget);
