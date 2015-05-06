Ext.namespace('Zarafa.plugins.passwd');

/**
 * @class Zarafa.plugins.passwd.ABOUT
 *
 * The copyright string holding the copyright notice for the Zarafa passwd Plugin.
 */
Zarafa.plugins.passwd.ABOUT = ""
	+ "<p>Copyright (C) 2013  Saket Patel &lt;silentsakky@gmail.com&gt;</p>"

	+ "<p>This program is free software: you can redistribute it and/or modify "
	+ "it under the terms of the GNU Affero General Public License as "
	+ "published by the Free Software Foundation, either version 3 of the "
	+ "License, or (at your option) any later version.</p>"

	+ "<p>This program is distributed in the hope that it will be useful, "
	+ "but WITHOUT ANY WARRANTY; without even the implied warranty of "
	+ "MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the "
	+ "GNU Affero General Public License for more details.</p>"

	+ "<p>You should have received a copy of the GNU Affero General Public License "
	+ "along with this program. If not, see <a href=\"http://www.gnu.org/licenses/\" target=\"_blank\">http://www.gnu.org/licenses/</a>.</p>";Ext.namespace('Zarafa.plugins.passwd');

/**
 * @class Zarafa.plugins.passwd.PasswdPlugin
 * @extends Zarafa.core.Plugin
 *
 * Passwd plugin.
 * Allows users to change password from webapp.
 */
Zarafa.plugins.passwd.PasswdPlugin = Ext.extend(Zarafa.core.Plugin, {

	/**
	 * Initialize the plugin by registering to the insertion point
	 * to add something to the right end of the main tab bar.
	 * @protected
	 */
	initPlugin : function()
	{
		Zarafa.plugins.passwd.PasswdPlugin.superclass.initPlugin.apply(this, arguments);

		// Register categories for the settings
		this.registerInsertionPoint('context.settings.categories', this.createSettingsCategory, this);
	},

	/**
	 * Create the delegate {@link Zarafa.settings.ui.SettingsCategory Settings Category}
	 * to the {@link Zarafa.settings.SettingsContext}. This will create new
	 * {@link Zarafa.settings.ui.SettingsCategoryTab tabs} for the
	 * {@link Zarafa.calendar.ui.SettingsPasswdCategory Password}
	 * in the {@link Zarafa.settings.ui.SettingsCategoryWidgetPanel Widget Panel}.
	 * @param {String} insertionName insertion point name that is currently populated
	 * @param {Zarafa.settings.ui.SettingsMainPanel} settingsMainPanel settings main panel
	 * which is populating this insertion point
	 * @param {Zarafa.settings.SettingsContext} settingsContext settings context
	 * @return {Array} configuration object for the categories to register
	 * @private
	 */
	createSettingsCategory : function(insertionName, settingsMainPanel, settingsContext)
	{
		return {
			xtype : 'zarafa.settingspasswdcategory',
			settingsContext : settingsContext
		};
	}
});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'passwd',
		displayName : _('Password Change Plugin'),
		about : Zarafa.plugins.passwd.ABOUT,
		pluginConstructor : Zarafa.plugins.passwd.PasswdPlugin
	}));
});
Ext.namespace('Zarafa.plugins.passwd.data');

/**
 * @class Zarafa.plugins.passwd.data.ResponseHandler
 * @extends Zarafa.core.data.AbstractResponseHandler
 *
 * Passwd plugin specific response handler.
 */
Zarafa.plugins.passwd.data.PasswdResponseHandler = Ext.extend(Zarafa.core.data.AbstractResponseHandler, {

	/**
	 * @cfg {Function} callbackFn The function which will be called after success/failure response.
	 */
	callbackFn : undefined,

	/**
	 * @cfg {Object} scope The function scope that will be used when calling {@link #callbackFn}.
	 */
	scope : undefined,

	/**
	 * In case exception happened on server, server will return exception response with the display message.
	 * @param {Object} response Object contained the response data.
	 */
	doError : function(response)
	{
		var displayMessage = _('An unknown error occurred while changing password.');

		if(response.info) {
			displayMessage = response.info.display_message;
		}

		Ext.MessageBox.alert(_('Error'), displayMessage);

		this.callbackFn.apply(this.scope || this, [ false, response ]);
	},

	/**
	 * When password change is successfull server will send a success response including display message.
	 * @param {Object} response Object contained the response data.
	 */
	doSuccess : function(response)
	{
		var displayMessage = _('Password is changed successfully.');

		if(response.info) {
			displayMessage = response.info.display_message;
		}

		Ext.MessageBox.alert(_('Success'), displayMessage);

		this.callbackFn.apply(this.scope || this, [ true, response ]);
	}
});Ext.namespace('Zarafa.plugins.passwd.settings');

/**
 * @class Zarafa.plugins.passwd.settings.PasswdPanel
 * @extends Ext.form.FormPanel
 *
 * Panel which holds a form that will be used to change the password
 */
Zarafa.plugins.passwd.settings.PasswdPanel = Ext.extend(Ext.form.FormPanel, {

	/**
	 * @constructor
	 * @param {Object} config configuration object that needs to be used when creating this dialog
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			xtype : 'zarafa.passwdpanel',
			labelWidth : 150,
			defaults : {
				width : 200
			},
			border : false,
			items : [{
				xtype : 'displayfield',
				name : 'username',
				fieldLabel : 'User name'
			}, {
				xtype : 'textfield',
				name : 'current_password',
				fieldLabel : 'Current password',
				inputType : 'password',
				listeners : {
					change : this.onFieldChange,
					scope : this
				}
			}, {
				xtype : 'textfield',
				name : 'new_password',
				fieldLabel : 'New password',
				inputType : 'password',
				listeners : {
					change : this.onFieldChange,
					scope : this
				}
			}, {
				xtype : 'textfield',
				name : 'new_password_repeat',
				fieldLabel : 'Retype new password',
				inputType : 'password',
				listeners : {
					change : this.onFieldChange,
					scope : this
				}
			}]
		});

		this.addEvents(
			/**
			 * @event userchange
			 * Fires when a field is modified in the form panel
			 */
			'userchange'
		);

		Zarafa.plugins.passwd.settings.PasswdPanel.superclass.constructor.apply(this, arguments);

		this.on('afterrender', this.initialize, this);
	},

	/**
	 * Function will initialize this dialog with some default values and will
	 * also create object of {@link #saveMask}.
	 */
	initialize : function()
	{
		this.getForm().setValues({
			username : container.getUser().getUserName()
		});
	},

	/**
	 * Handler function will be called when user changes any field in the form.
	 * This will fire custom event on this form to indicate that settings model
	 * should be marked as dirty
	 */
	onFieldChange : function(field, newValue, oldValue)
	{
		this.fireEvent('userchange', this);
	}
});

Ext.reg('zarafa.passwdpanel', Zarafa.plugins.passwd.settings.PasswdPanel);Ext.namespace('Zarafa.plugins.passwd.settings');

/**
 * @class Zarafa.plugins.passwd.settings.SettingsPasswdCategory
 * @extends Zarafa.settings.ui.SettingsCategory
 * @xtype zarafa.settingspasswdcategory
 *
 * The passwd settings category that will allow users to change their passwords
 */
Zarafa.plugins.passwd.settings.SettingsPasswdCategory = Ext.extend(Zarafa.settings.ui.SettingsCategory, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			title : _('Change Password'),
			categoryIndex : 9997,
			xtype : 'zarafa.settingspasswdcategory',
			items : [{
				xtype : 'zarafa.settingspasswdwidget',
				settingsContext : config.settingsContext
			}]
		});

		Zarafa.plugins.passwd.settings.SettingsPasswdCategory.superclass.constructor.call(this, config);
	}
});

Ext.reg('zarafa.settingspasswdcategory', Zarafa.plugins.passwd.settings.SettingsPasswdCategory);
Ext.namespace('Zarafa.plugins.passwd.settings');

/**
 * @class Zarafa.plugins.passwd.settings.SettingsPasswdWidget
 * @extends Zarafa.settings.ui.SettingsWidget
 * @xtype zarafa.settingspasswdwidget
 *
 * The {@link Zarafa.settings.ui.SettingsWidget widget} for changing password
 * in the {@link Zarafa.plugins.passwd.settings.SettingsPasswdCategory password category}.
 */
Zarafa.plugins.passwd.settings.SettingsPasswdWidget = Ext.extend(Zarafa.settings.ui.SettingsWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			height : 175,
			width : 400,
			title : _('Change Password'),
			xtype : 'zarafa.settingspasswdwidget',
			layout : {
				// override from SettingsWidget
				type : 'fit'
			},
			items : [{
				xtype : 'zarafa.passwdpanel',
				ref : 'passwdPanel',
				listeners : {
					userchange : this.setModelDirty,
					scope : this
				}
			}]
		});

		Zarafa.plugins.passwd.settings.SettingsPasswdWidget.superclass.constructor.call(this, config);
	},

	/**
	 * initialize events for the {@link Zarafa.plugins.passwd.settings.SettingsPasswdWidget SettingsPasswdWidget}.
	 * @private
	 */
	initEvents : function()
	{
		Zarafa.plugins.passwd.settings.SettingsPasswdWidget.superclass.initEvents.call(this);

		// listen to savesettings and discardsettings to save/discard delegation data
		var contextModel = this.settingsContext.getModel();

		this.mon(contextModel, 'savesettings', this.onSaveSettings, this);
		this.mon(contextModel, 'discardsettings', this.onDiscardSettings, this);
	},

	/**
	 * Event handler will be called when {@link Zarafa.settings.SettingsContextModel#savesettings} event is fired.
	 * This will relay this event to {@link Zarafa.plugins.passwd.settings.PasswdPanel PasswdPanel} so it can
	 * save data.
	 * @private
	 */
	onSaveSettings : function()
	{
		// only save when this category is visible on screen
		if(this.ownerCt.isVisible()) {
			this.ownerCt.displaySavingMask();

			var data = this.passwdPanel.getForm().getFieldValues();

			// send request
			container.getRequest().singleRequest('passwdmodule', 'save', data, new Zarafa.plugins.passwd.data.PasswdResponseHandler({
				callbackFn : function(success, response) {
					this.ownerCt.hideSavingMask(success);
				},
				scope : this
			}));
		}
	},

	/**
	 * Event handler will be called when {@link Zarafa.settings.SettingsContextModel#discardsettings} event is fired.
	 * This will relay this event to {@link Zarafa.plugins.passwd.settings.PasswdPanel PasswdPanel} so it can
	 * discard current changes.
	 * @private
	 */
	onDiscardSettings : function()
	{
		this.passwdPanel.getForm().reset();
	},

	/**
	 * Function will be called when any field in {@link Zarafa.plugins.passwd.settings.PasswdPanel}
	 * is changed and we need to mark settings model as dirty.
	 * @private
	 */
	setModelDirty : function()
	{
		var model = this.settingsContext.getModel();

		if(!model.hasChanges()) {
			model.setDirty();
		}
	}
});

Ext.reg('zarafa.settingspasswdwidget', Zarafa.plugins.passwd.settings.SettingsPasswdWidget);
