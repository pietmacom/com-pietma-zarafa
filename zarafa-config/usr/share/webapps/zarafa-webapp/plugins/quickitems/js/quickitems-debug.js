Ext.namespace('Zarafa.widgets.quickitems');

/**
 * @class Zarafa.widgets.quickitems.AbstractQuickItemWidget
 * @extends Zarafa.core.ui.widget.Widget
 *
 * Widget which can be used to quickly create a MAPI item.
 * This can be used to quickly create a mail, task, appointment,
 * sticky note, while using a minimum set of input fields.
 */
Zarafa.widgets.quickitems.AbstractQuickItemWidget = Ext.extend(Zarafa.core.ui.widget.Widget, {
	/**
	 * The record as created by {@link #createRecord} which is currently
	 * loaded in the widget.
	 * @property
	 * @type Ext.data.Record
	 * @protected
	 */
	record : undefined,

	/**
	 * @cfg {Object} Configuration object for the instantiation of the
	 * {@link Zarafa.core.ui.MessageContentPanel} in the {@link #wrap} property.
	 */
	wrapCfg : undefined,

	/**
	 * The embedded {@link Zarafa.core.ui.MessageContentPanel} which handles
	 * the sending/saving of the {@link #record}.
	 * @property
	 * @type Zarafa.core.ui.MessageContentPanel
	 * @protected
	 */
	wrap : undefined,

	/**
	 * @cfg {Boolean} resetOnSave {@link #reset} the widget when client recieves confirmation of message is saved.
	 */
	resetOnSave : true,

	/**
	 * @cfg {Boolean} resetOnSend {@link #reset} the widget when client recieves confirmation of message is sent.
	 */
	resetOnSend : true,

	/**
	 * @cfg {Boolean} hasDialog True if a {@link #tools} button should be added for opening the record
	 * inside a dialog (See {@link #dialog}).
	 */
	hasDialog : true,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		config.wrapCfg = Ext.applyIf(config.wrapCfg || {}, {
			stateful : false,
			height : 200,
			closeOnSave : false,
			closeOnSend : false
		});

		config.wrapCfg.recordComponentPluginConfig = Ext.applyIf(config.wrapCfg.recordComponentPluginConfig || {}, {
			useShadowStore : false // We put the record into the shadowstore ourselves.
		});

		this.wrap = new Zarafa.core.ui.MessageContentPanel(config.wrapCfg);
		// The wrap will have the recordcomponentupdater plugin installed,
		// we hack the 'update' and 'updateRecord' functions to this widget
		// to ensure the widget can update itself.
		this.wrap.update = this.update.createDelegate(this);
		this.wrap.updateRecord = this.updateRecord.createDelegate(this);

		Ext.applyIf(config, {
			name : 'quickitem',
			layout : 'fit',
			items : [this.wrap]
		});

		Zarafa.widgets.quickitems.AbstractQuickItemWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize the widget, this will add the 'plus' button to the {@link #tools}
	 * which can open the record in a new content panel.
	 * @protected
	 */
	initWidget : function()
	{
		Zarafa.widgets.quickitems.AbstractQuickItemWidget.superclass.initWidget.apply(this, arguments);

		if (this.hasDialog) {
			this.tools.unshift({
				id : 'plus',
				handler : this.dialog,
				scope : this
			});
		}
	},

	/**
	 * Initialize the events
	 * @protected
	 */
	initEvents : function()
	{
		Zarafa.widgets.quickitems.AbstractQuickItemWidget.superclass.initEvents.apply(this, arguments);

		this.mon(this, 'afterlayout', this.onAfterFirstLayout, this, { single : true });

		if (this.resetOnSave) {
			// Defer to ensure the all 'aftersaverecord' event handlers have completed
			// before we reset the content of the widget.
			this.mon(this.wrap, 'aftersaverecord', this.reset, this, { buffer : 1 });
		}
		if (this.resetOnSend) {
			// Defer to ensure the all 'aftersendrecord' event handlers have completed
			// before we reset the content of the widget.
			this.mon(this.wrap, 'aftersendrecord', this.reset, this, { buffer : 1 });
		}
	},

	/**
	 * Abandon editing of the record inside the widget and continue editing by
	 * {@link Zarafa.core.data.UIFactory#openCreateRecord opening it in a new dialog}.
	 * Afterwards it will {@link #reset} this widget.
	 * @private
	 */
	dialog : function()
	{
		this.wrap.inputAutoFocusPlugin.beginFocusEl.focus();
		this.wrap.saveRecord(false);
		Zarafa.core.data.UIFactory.openCreateRecord(this.record);

		// The record is now owned by the dialog, so clear our reference.
		this.record = null;
		this.reset();
	},

	/**
	 * This will {@link #createRecord create a new} {@link #record} and will
	 * {@link Zarafa.core.ui.MessageContentPanel#setRecord set it} to the {@link #wrap}.
	 * protected
	 */
	reset : function()
	{
		var store = container.getShadowStore();

		// Remove the old record from the Shadow Store
		if (this.record) {
			store.remove(this.record, true);
		}

		// Create a new record, put it into the shadowStore
		this.record = this.createRecord();
		store.add(this.record);

		// Load the record
		this.wrap.setRecord(this.record);
	},

	/**
	 * Create a new record which must be edited by this widget.
	 * Subclasses must implement this function.
	 * @return {Ext.data.Record} record The record to load into the {@link #wrap}
	 * @protected
	 */
	createRecord : Ext.emptyFn,

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 * Subclasses must implement this function.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @protected
	 */
	update : Ext.emptyFn,

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 * Subclasses must implement this function.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to update
	 * @protected
	 */
	updateRecord : Ext.emptyFn,

	/**
	 * Event handler which is fired for the first {@link #afterlayout} event.
	 * This will check if the {@link Zarafa.core.Container#getHierarchyStore hierarchy}
	 * has been loaded already, or if we need to wait a bit more. When the hierarchy is
	 * loaded the widget will be {@link #reset}.
	 * @private
	 */
	onAfterFirstLayout : function()
	{
		var hierarchy = container.getHierarchyStore();
		if (!hierarchy.getDefaultStore()) {
			this.mon(hierarchy, 'load', this.reset, this, { single : true });
		} else {
			this.reset();
		}
	},

	/**
	 * Called when the widget is being destroyed. If a {@link #record} is still
	 * active, this will {@link Zarafa.core.data.ShadowStore#remove remove} the
	 * {@link #record} from the {@link Zarafa.core.data.ShadowStore ShadowStore}.
	 * @protected
	 */
	onDestroy : function()
	{
		Zarafa.widgets.quickitems.AbstractQuickItemWidget.superclass.onDestroy.apply(this, arguments);

		if (this.record) {
			container.getShadowStore().remove(this.record, true);
		}
	}
});
Ext.namespace('Zarafa.widgets.quickitems');

/**
 * @class Zarafa.widgets.quickitems.QuickAppointmentWidget
 * @extends Zarafa.widgets.quickitems.AbstractQuickItemWidget
 *
 * Widget for creating an Appointment quickly with a minimum set of
 * input fields
 */
Zarafa.widgets.quickitems.QuickAppointmentWidget = Ext.extend(Zarafa.widgets.quickitems.AbstractQuickItemWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			wrapCfg : {
				recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
					allowWrite : true
				}),
				layout : 'fit',
				items : [{
					xtype : 'form',
					ref : 'formPanel',
					layout: {
						type: 'vbox',
						align: 'stretch'
					},
					border : false,
					bodyStyle: 'background-color: inherit; padding: 5px;',
					defaults: {
						border: false,
						labelLength: 100,
						style: 'padding-bottom: 2px'
					},
					items : [{
						xtype: 'zarafa.compositefield',
						hideLabel: true,
						anchor: '100%',
						items: [{
							xtype: 'label',
							width: 100,
							text: _('Subject') + ':'
						},{
							xtype: 'textfield',
							flex: 1,
							name: 'subject',
							value: undefined,
							listeners: {
								change : this.onChange,
								scope : this
							}
						}]
					},{
						xtype: 'zarafa.datetimeperiodfield',
						ref: '../datetimePeriod',
						defaultPeriod: container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_appointment_period'),
						timeIncrement: container.getSettingsModel().get('zarafa/v1/contexts/calendar/default_zoom_level'),
						width: 300,
						listeners: {
							change: this.onDateRangeFieldChange,
							scope: this
						},
						startFieldConfig: {
							fieldLabel: _('Start time'),
							labelWidth: 100,
							minValue : new Date().clearTime()
						},
						endFieldConfig: {
							fieldLabel: _('End time'),
							labelWidth: 100,
							minValue : new Date().clearTime()
						}
					},{
						xtype: 'zarafa.compositefield',
						hideLabel: true,
						anchor: '100%',
						items: [{
							xtype: 'spacer',
							width: 100
						},{
							xtype: 'checkbox',
							name: 'alldayevent',
							ref : '../../alldayCheck',
							hideLabel : false,
							boxLabel: _('All Day Event'),
							handler: this.onToggleAllDay,
							scope: this
						}]
					},{
						xtype: 'zarafa.editorfield',
						ref: '../editorField',
						htmlName : 'html_body',
						plaintextName : 'body',
						hideLabel: true,
						flex: 1,
						useHtml : false,
						defaultValue: '',
						listeners: {
							change : this.onBodyChange,
							scope : this
						}
					}]
				}]
			},
			buttons : [{
				text : _('Save'),
				handler : this.onSave,
				scope : this
			},{
				text : _('Discard'),
				handler : this.onDiscard,
				scope : this
			}]
		});

		Zarafa.widgets.quickitems.QuickAppointmentWidget.superclass.constructor.call(this, config);
	},

	/**
	 * @param {Object} field The field updated field
	 * @param {Object} value The value of the field updated
	 * @private
	 */
	onChange : function(field, value)
	{
		this.wrap.record.set(field.name, value);
	},

	/**
	 * Event handler which is triggered when one of the Input fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onBodyChange : function(field, newValue, oldValue)
	{
		this.wrap.record.beginEdit();
		if (field instanceof Ext.form.HtmlEditor) {
			this.wrap.record.set('isHTML', true);
		} else {
			this.wrap.record.set('isHTML', false);
		}
		this.wrap.record.set(field.name, newValue);
		this.wrap.record.endEdit();
	},

	/**
	 * Event handler which is fired when the {@link Zarafa.common.ui.DateRangeField} has been changed.
	 * This will update the start and due date inside the {@link #record} accordingly.
	 * @param {Ext.form.Field} field The field which has changed
	 * @param {Mixed} newValue The new value for the field
	 * @param {Mixed} oldValue The original value for the field
	 * @private
	 */
	onDateRangeFieldChange : function(field, newRange, oldRange)
	{
		this.updateStartDueDate(this.wrap.record, newRange);
	},

	/**
	 * A function called when the checked value changes for the
	 * all day event checkbox.
	 * @param {Ext.form.Checkbox} checkbox The Checkbox being toggled.
	 * @param {Boolean} checked The new checked state of the checkbox.
	 * @private
	 */
	onToggleAllDay : function(checkbox, checked)
	{
		if (this.wrap.record.get('alldayevent') !== checked) {
			var settingsModel = container.getSettingsModel();

			this.wrap.record.beginEdit();
			this.wrap.record.set('alldayevent', checked);
			if (checked) {
				this.updateStartDueDate(this.wrap.record, this.wrap.datetimePeriod.getValue());

				this.wrap.record.set('reminder_minutes', settingsModel.get('zarafa/v1/contexts/calendar/default_allday_reminder_time'));
				this.wrap.record.set('busystatus', Zarafa.core.mapi.BusyStatus.FREE);
			} else {
				var zoomLevel = settingsModel.get('zarafa/v1/contexts/calendar/default_zoom_level');
				var defaultPeriod = settingsModel.get('zarafa/v1/contexts/calendar/default_appointment_period');

				var startDate = new Date();
				if(this.wrap.record.get('startdate')) {
					// use existing date if it is set
					startDate = this.wrap.record.get('startdate').clearTime(true);
				}

				startDate = startDate.ceil(Date.MINUTE, zoomLevel);
				var dueDate = startDate.add(Date.MINUTE, defaultPeriod);

				this.wrap.record.set('reminder_minutes', settingsModel.get('zarafa/v1/contexts/calendar/default_reminder_time'));
				this.wrap.record.set('busystatus', Zarafa.core.mapi.BusyStatus.BUSY);
				this.wrap.record.set('startdate', startDate);
				this.wrap.record.set('duedate', dueDate);
				this.wrap.record.set('commonstart', startDate);
				this.wrap.record.set('commonend', dueDate);
				this.wrap.record.set('duration', (dueDate - startDate) / (60 * 1000));
			}
			this.wrap.record.endEdit();
		}
	},

	/**
	 * Update the 'startdate' and 'duedate' in the given record from
	 * the given daterange. When the appointment is an allday event, then
	 * the times are always set to midnight. However when selecting
	 * the duedate the user selects on which day the appointment
	 * ends, so in reality the appointment ends on 00:00 hours on
	 * the following day.
	 * @param {Zarafa.core.data.MAPIRecord} record the Record to update
	 * @param {Zarafa.core.DateRange} daterange the Daterange to apply
	 * @private
	 */
	updateStartDueDate : function(record, daterange)
	{
		var startDate = daterange.getStartDate().clone();
		var dueDate = daterange.getDueDate().clone();

		if (record.get('alldayevent') === true) {
			startDate = startDate.clearTime();
			dueDate = dueDate.add(Date.DAY, 1).clearTime();
		}

		record.beginEdit();
		record.set('startdate', startDate);
		record.set('duedate', dueDate);
		record.set('commonstart', startDate);
		record.set('commonend', dueDate);
		record.set('duration', (dueDate - startDate) / (60 * 1000));
		record.endEdit();
	},

	/**
	 * Create a new record which must be edited by this widget.
	 * @return {Ext.data.Record} record The record to load into the {@link #wrap}
	 * @protected
	 */
	createRecord : function()
	{
		var folder = container.getHierarchyStore().getDefaultFolder('calendar');
		var context = container.getContextByName('calendar');
		var model = context.getModel();

		return model.createRecord(folder);
	},

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @protected
	 */
	update : function(record, contentReset)
	{
		if (contentReset === true || record.isModifiedSinceLastUpdate('alldayevent')) {
			if (record.get('alldayevent')) {
				this.wrap.datetimePeriod.setEnabledTimeSelection(false);
			} else {
				this.wrap.datetimePeriod.setEnabledTimeSelection(true);
			}
		}

		this.wrap.formPanel.getForm().loadRecord(record);

		var startDate = record.get('startdate');
		var startDateUpdate = false;
		if (Ext.isDate(startDate)) {
			startDate = startDate.clone();
			startDateUpdate = contentReset || record.isModifiedSinceLastUpdate('startdate');
		}
		var dueDate = record.get('duedate');
		var dueDateUpdate = false;
		if (Ext.isDate(dueDate)) {
			dueDate = dueDate.clone();
			dueDateUpdate = contentReset || record.isModifiedSinceLastUpdate('duedate');
		}

		// For all day events we store the due date as 00:00 on the day after
		// it ends. For the UI, this means we have to substract 1 day to get
		// the date on which the appointment actually ends for the user.
		if (record.get('alldayevent')) {
			dueDate = dueDate.add(Date.DAY, -1);
		}
		
		if (startDateUpdate || dueDateUpdate) {
			this.wrap.datetimePeriod.getValue().set(startDate, dueDate);
		}
	},

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to update
	 * @protected
	 */
	updateRecord : function(record)
	{
		record.beginEdit();
		this.wrap.formPanel.getForm().updateRecord(record);
		this.updateStartDueDate(record, this.wrap.datetimePeriod.getValue());
		this.onToggleAllDay(this.wrap.alldayCheck, this.wrap.alldayCheck.getValue());
		this.onBodyChange(this.wrap.editorField, this.wrap.editorField.getValue());
		record.endEdit();
	},

	/**
	 * Event handler which is fired when the user pressed the 'Save' button.
	 * This will call {@link Zarafa.core.ui.MessageContentPanel#saveRecord} to start
	 * sending the mail.
	 * @private
	 */
	onSave : function()
	{
		this.wrap.saveRecord();
	},

	/**
	 * Event handler which is fired when the user pressed the 'Disacrd' button.
	 * This will call {@link #reset} to clear the contents.
	 * @private
	 */
	onDiscard : function()
	{
		this.reset();
	}
});

Zarafa.onReady(function() {
	container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
		name : 'quickappt',
		displayName : _('Quick Appointment'),
		iconPath : 'plugins/quickitems/resources/images/quickappt.png',
		widgetConstructor : Zarafa.widgets.quickitems.QuickAppointmentWidget
	}));
});
Ext.namespace('Zarafa.widgets.quickitems');

/**
 * @class Zarafa.widgets.quickitems.QuickContactWidget
 * @extends Zarafa.widgets.quickitems.AbstractQuickItemWidget
 *
 * Widget for creating a contact quickly with a minimum set of
 * input fields
 */
Zarafa.widgets.quickitems.QuickContactWidget = Ext.extend(Zarafa.widgets.quickitems.AbstractQuickItemWidget, {

	/**
	 * The parser object which will be used to parse and combine different parts of name, address, phone number.
	 * @property
	 * @type Zarafa.contact.data.ContactDetailsParser
	 */
	contactParser : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		if (!config.contactParser) {
			var parserType = container.getSharedComponent(Zarafa.core.data.SharedComponentType['contact.detailsparser']);
			if (parserType) {
				config.contactParser = new parserType();
			}
		}

		Ext.applyIf(config, {
			wrapCfg : {
				recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
					allowWrite : true
				}),
				layout : 'fit',
				items : [{
					xtype : 'form',
					ref : 'formPanel',
					layout: {
						type: 'vbox',
						align: 'stretch'
					},
					border : false,
					bodyStyle: 'background-color: inherit; padding: 5px;',
					defaults: {
						border: false,
						labelLength: 100,
						style: 'padding-bottom: 2px'
					},
					items : [{
						xtype: 'zarafa.compositefield',
						hideLabel: true,
						anchor: '100%',
						autoHeight: true,
						items : [{
							xtype : 'label',
							width : 100,
							text : _('Full Name') + ':'
						},{
							xtype : 'textfield',
							flex : 1,
							name : 'display_name',
							ref : '../../fullnameField',
							listeners : {
								scope : this,
								change : this.onFullNameChange
							}
						}]
					},{
						xtype: 'zarafa.compositefield',
						hideLabel: true,
						anchor: '100%',
						autoHeight: true,
						items : [{
							xtype : 'splitbutton',
							width: 100,
							text : _('Mobile') + ':',
							handler : this.onPhoneButtonClick,
							scope: this,
							menu : this.initPhoneButtonMenu('cellular_telephone_number')
						},{
							xtype : 'textfield',
							ref : '../../telephoneField',
							flex: 1,
							name : 'telephone_number',
							property : 'cellular_telephone_number',
							listeners : {
								scope : this,
								change : this.onTelephoneNumberChange
							}
						}]
					},{
						xtype: 'zarafa.compositefield',
						hideLabel: true,
						anchor: '100%',
						autoHeight: true,
						items : [{
							xtype : 'label',
							width: 100,
							text : _('Email') + ':'
						},{
							xtype : 'textfield',
							flex: 1,
							ref : '../../mailAddressField',
							name : 'email_address_1',
							listeners : {
								scope : this,
								change : this.onChange
							}
						}]
					},{
						xtype: 'zarafa.editorfield',
						ref: '../editorField',
						htmlName : 'html_body',
						plaintextName : 'body',
						hideLabel: true,
						flex: 1,
						useHtml : false,
						defaultValue: '',
						listeners: {
							change : this.onBodyChange,
							scope : this
						}
					}]
				}]
			},
			buttons : [{
				text : _('Save'),
				handler : this.onSave,
				scope : this
			},{
				text : _('Discard'),
				handler : this.onDiscard,
				scope : this
			}]
		});

		Zarafa.widgets.quickitems.QuickContactWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Function will initialize button menu config object for the telephone buttons.
	 * group config option is used to group all checkbox items into a single select radio button group
	 * and its name should be unique across all instances of menu button
	 * @param {String} property will be used to show default selection
	 * @private
	 */
	initPhoneButtonMenu : function(property)
	{
		return {
			xtype : 'menu',
			listeners : {
				click : this.onMenuItemSelection,
				scope : this
			},
			defaults : {
				xtype : 'menucheckitem',
				group : 'phone_number'
			},
			items : [{
				text : _('Business'),
				property : 'business_telephone_number',
				checked : property == 'business_telephone_number'
			},{
				text : _('Company'),
				property : 'company_telephone_number',
				checked : property == 'company_telephone_number'
			},{
				text : _('Home'),
				property : 'home_telephone_number',
				checked : property == 'home_telephone_number'
			},{
				text : _('Mobile'),
				property : 'cellular_telephone_number',
				checked : property == 'cellular_telephone_number'
			},{
				text : _('Other'),
				property : 'other_telephone_number',
				checked : property == 'other_telephone_number'
			}]
		};
	},

	/**
	 * Function will be called whenever selection of address or telephone number
	 * will be changed, this function will change text of button and also change value
	 * of the corresponding textfield.
	 * @param {Ext.menu.Menu} Menu button manu
	 * @param {Ext.menu.CheckItem} CheckItem menu item that is selected
	 * @param {Ext.EventObject} EventObjectt event object
	 * @private
	 */
	onMenuItemSelection : function(menu, menuItem, eventObj)
	{
		if (!Ext.isEmpty(menuItem)) {
			var compositeField = menu.findParentByType('zarafa.compositefield');
			var buttonField = compositeField.findByType('splitbutton')[0];
			var textField = compositeField.findByType('textfield')[0];

			if(!Ext.isEmpty(buttonField) && !Ext.isEmpty(textField)) {
				// update text of button
				buttonField.setText(menuItem.initialConfig.text);

				// update corresponding textfield with new value
				textField.setValue(this.record.get(menuItem.property));
				textField.property = menuItem.property;
			}
		}
	},

	/**
	 * Function that will be called when one of the phone buttons is clicked,
	 * this function is used as wrapper to discard arguments passed with the handler
	 * and it will call function that will open the {@link Zarafa.contact.dialogs.ContactPhoneContentPanel ContactPhoneContentPanel}.
	 * @param {Ext.SplitButton} buttonEl split button element which was clicked.
	 * @param {Ext.EventObject} eventObj event object for the click event.
	 * @private
	 */
	onPhoneButtonClick : function(buttonEl, eventObj)
	{
		this.showDetailedPhoneContent(buttonEl.ownerCt.findByType('textfield')[0].property);
	},

	/**
	 * Event handler which is triggered when one of the Input fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Object} field The field updated field
	 * @param {Object} value The value of the field updated
	 * @private
	 */
	onChange : function(field, value)
	{
		this.wrap.record.set(field.name, value);
	},

	/**
	 * Event handler which is triggered when one of the Input fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Object} field The field updated field
	 * @param {Object} value The value of the field updated
	 * @private
	 */
	onTelephoneNumberChange : function(field, value)
	{
		this.wrap.record.set(field.property, value);
	},

	/**
	 * Event handler which is triggered when one of the Input fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Object} field The field updated field
	 * @param {Object} value The value of the field updated
	 * @private
	 */
	onFullNameChange : function(field, newValue)
	{
		var parsedData = this.contactParser.parseInfo('name', newValue);

		// sync properties
		this.wrap.record.set('display_name', newValue);
		this.wrap.record.set('display_name_prefix', parsedData['display_name_prefix']);
		this.wrap.record.set('given_name', parsedData['given_name']);
		this.wrap.record.set('middle_name', parsedData['middle_name']);
		this.wrap.record.set('surname', parsedData['surname']);
		this.wrap.record.set('generation', parsedData['generation']);

		// check for incomplete data and show detailed name dialog
		if(parsedData['incomplete_info'] === true) {
			var settingValue = container.getSettingsModel().get('zarafa/v1/contexts/contact/show_name_dialog');
			if(settingValue == true && !Ext.isEmpty(newValue)) {
				// show detailed dialog for full name
				this.showDetailedNameContent(parsedData);
			}
		}
	},

	/**
	 * Event handler which is triggered when one of the Input fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onBodyChange : function(field, newValue, oldValue)
	{
		this.wrap.record.beginEdit();
		if (field instanceof Ext.form.HtmlEditor) {
			this.wrap.record.set('isHTML', true);
		} else {
			this.wrap.record.set('isHTML', false);
		}
		this.wrap.record.set(field.name, newValue);
		this.wrap.record.endEdit();
	},

	/**
	 * Function will open detailed name dialog to enter incomplete information
	 * @param {Object} parsedData if string is already parsed into object then we can pass
	 * that object here in componentConfig so parsing will not be done twice
	 * @private
	 */
	showDetailedNameContent : function(parsedData)
	{
		Zarafa.contact.Actions.openDetailedNameContent(this.wrap.record, { parser : this.contactParser, parsedData : parsedData });
	},

	/**
	 * Function will open detailed phone dialog to enter incomplete information
	 * @param {String} property property that will be modified
	 * @private
	 */
	showDetailedPhoneContent : function(property)
	{
		Zarafa.contact.Actions.openDetailedPhoneContent(this.wrap.record, { parser : this.contactParser, property : property });
	},

	/**
	 * Create a new record which must be edited by this widget.
	 * @return {Ext.data.Record} record The record to load into the {@link #wrap}
	 * @protected
	 */
	createRecord : function()
	{
		var folder = container.getHierarchyStore().getDefaultFolder('contact');
		var context = container.getContextByName('contact');
		var model = context.getModel();

		return model.createRecord(folder);
	},

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @protected
	 */
	update : function(record, contentReset)
	{
		this.wrap.formPanel.getForm().loadRecord(record);
		this.wrap.telephoneField.setValue(record.get(this.wrap.telephoneField.property));
	},

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to update
	 * @protected
	 */
	updateRecord : function(record)
	{
		record.beginEdit();
		this.wrap.formPanel.getForm().updateRecord(record);
		this.onFullNameChange(this.wrap.fullnameField, this.wrap.fullnameField.getValue());

		record.updateSubject();
		record.updateAddressbookProps();

		record.endEdit();
	},

	/**
	 * Event handler which is fired when the user pressed the 'Save' button.
	 * This will call {@link Zarafa.core.ui.MessageContentPanel#saveRecord} to start
	 * sending the mail.
	 * @private
	 */
	onSave : function()
	{
		this.wrap.saveRecord();
	},

	/**
	 * Event handler which is fired when the user pressed the 'Disacrd' button.
	 * This will call {@link #reset} to clear the contents.
	 * @private
	 */
	onDiscard : function()
	{
		this.reset();
	}
});

Zarafa.onReady(function() {
	container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
		name : 'quickcontact',
		displayName : _('Quick Contact'),
		iconPath : 'plugins/quickitems/resources/images/quickcontact.png',
		widgetConstructor : Zarafa.widgets.quickitems.QuickContactWidget
	}));
});
Ext.namespace('Zarafa.widgets.quickitems');

/**
 * @class Zarafa.widgets.quickitems.QuickMailWidget
 * @extends Zarafa.widgets.quickitems.AbstractQuickItemWidget
 *
 * Widget for creating a mail quickly with a minimum set of
 * input fields
 */
Zarafa.widgets.quickitems.QuickMailWidget = Ext.extend(Zarafa.widgets.quickitems.AbstractQuickItemWidget, {

	/**
	 * @cfg {Boolean} Enable the HTML editor
	 */
	useHtml : false,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			wrapCfg : {
				recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
					allowWrite : true
				}),
				layout : 'fit',
				items : [{
					xtype : 'form',
					ref : 'formPanel',
					layout: {
						type: 'vbox',
						align: 'stretch'
					},
					border : false,
					bodyStyle: 'background-color: inherit; padding: 5px;',
					defaults: {
						border: false,
						labelLength: 100,
						style: 'padding-bottom: 2px'
					},
					items : [{
						xtype: 'zarafa.compositefield',
						hideLabel: true,
						anchor: '100%',
						autoHeight: true,
						items: [{
							xtype: 'label',
							width: 100,
							text: _('To') + ':'
						},{
							xtype: 'zarafa.recipientfield',
							ref: '../toRecipientField',
							flex: 1,
							height: 30,
							defaultRecipientType: Zarafa.core.mapi.RecipientType.MAPI_TO
						}]			
					},{
						xtype: 'zarafa.compositefield',
						hideLabel: true,
						anchor: '100%',
						items: [{
							xtype: 'label',
							width: 100,
							text: _('Subject') + ':'
						},{
							xtype: 'textfield',
							flex: 1,
							name: 'subject',
							value: undefined,
							listeners: {
								change : this.onChange,
								scope : this
							}
						}]
					},{
						xtype: 'zarafa.editorfield',
						ref: '../editorField',
						htmlName : 'html_body',
						plaintextName : 'body',
						hideLabel: true,
						flex: 1,
						useHtml : config.useHtml,
						defaultValue: '',
						listeners: {
							change : this.onBodyChange,
							scope : this
						}
					}]
				}]
			},
			buttons : [{
				text : _('Send'),
				handler : this.onSend,
				scope : this
			},{
				text : _('Discard'),
				handler : this.onDiscard,
				scope : this
			}]
		});

		Zarafa.widgets.quickitems.QuickMailWidget.superclass.constructor.call(this, config);
	},

	/**
	 * @param {Object} field The field updated field
	 * @param {Object} value The value of the field updated
	 * @private
	 */
	onChange : function(field, value)
	{
		this.wrap.record.set(field.name, value);
	},

	/**
	 * Event handler which is triggered when one of the Input fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onBodyChange : function(field, newValue, oldValue)
	{
		this.wrap.record.beginEdit();
		if (field instanceof Ext.form.HtmlEditor) {
			this.wrap.record.set('isHTML', true);
		} else {
			this.wrap.record.set('isHTML', false);
		}
		this.wrap.record.set(field.name, newValue);
		this.wrap.record.endEdit();
	},

	/**
	 * Create a new record which must be edited by this widget.
	 * @return {Ext.data.Record} record The record to load into the {@link #wrap}
	 * @protected
	 */
	createRecord : function()
	{
		var folder = container.getHierarchyStore().getDefaultFolder('drafts');
		var context = container.getContextByName('mail');
		var model = context.getModel();

		return model.createRecord(folder);
	},

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @protected
	 */
	update : function(record, contentReset)
	{
		this.wrap.formPanel.getForm().loadRecord(record);
		if (contentReset) {
			this.wrap.formPanel.toRecipientField.setRecipientStore(record.getSubStore('recipients'));
		}
	},

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to update
	 * @protected
	 */
	updateRecord : function(record)
	{
		record.beginEdit();
		this.wrap.formPanel.getForm().updateRecord(record);
		this.onBodyChange(this.wrap.editorField, this.wrap.editorField.getValue());
		record.endEdit();
	},

	/**
	 * Event handler which is fired when the user pressed the 'Send' button.
	 * This will call {@link Zarafa.core.ui.MessageContentPanel#sendRecord} to start
	 * sending the mail.
	 * @private
	 */
	onSend : function()
	{
		this.wrap.sendRecord();
	},

	/**
	 * Event handler which is fired when the user pressed the 'Disacrd' button.
	 * This will call {@link #reset} to clear the contents.
	 * @private
	 */
	onDiscard : function()
	{
		this.reset();
	}
});

Zarafa.onReady(function() {
	container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
		name : 'quickmail',
		displayName : _('Quick Mail'),
		iconPath : 'plugins/quickitems/resources/images/quickmail.png',
		widgetConstructor : Zarafa.widgets.quickitems.QuickMailWidget
	}));
});
Ext.namespace('Zarafa.widgets.quickitems');

/**
 * @class Zarafa.widgets.quickitems.QuickNoteWidget
 * @extends Zarafa.widgets.quickitems.AbstractQuickItemWidget
 *
 * Widget for creating a Sticky note quickly with a minimum set of
 * input fields
 */
Zarafa.widgets.quickitems.QuickNoteWidget = Ext.extend(Zarafa.widgets.quickitems.AbstractQuickItemWidget, {

	/**
	 * The Color CSS class which currently has been applied to the Text area.
	 * @property
	 * @type String
	 */
	currentColorCls : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			wrapCfg : {
				recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
					allowWrite : true
				}),
				layout : 'fit',
				items : [{
					xtype : 'form',
					ref : 'formPanel',
					layout : 'fit',
					items : [{
						xtype : 'textarea',
						ref : '../editorField',
						name : 'body',
						listeners: {
							change : this.onChange,
							scope : this
						}
					}]
				}]
			},
			buttons : [{
				text : _('Save'),
				handler : this.onSave,
				scope : this
			},{
				text : _('Discard'),
				handler : this.onDiscard,
				scope : this
			}]
		});

		Zarafa.widgets.quickitems.QuickNoteWidget.superclass.constructor.call(this, config);
	},

	/**
	 * @param {Object} field The field updated field
	 * @param {Object} value The value of the field updated
	 * @private
	 */
	onChange : function(field, value)
	{
		this.wrap.record.set(field.name, value);
	},

	/**
	 * Create a new record which must be edited by this widget.
	 * @return {Ext.data.Record} record The record to load into the {@link #wrap}
	 * @protected
	 */
	createRecord : function()
	{
		var folder = container.getHierarchyStore().getDefaultFolder('note');
		var context = container.getContextByName('note');
		var model = context.getModel();

		return model.createRecord(folder);
	},

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @protected
	 */
	update : function(record, contentReset)
	{
		this.wrap.formPanel.getForm().loadRecord(record);

		if (contentReset || record.isModifiedSinceLastUpdate('icon_index')) {
			var iconIndex = record.get('icon_index');
			var textCls;

			switch (iconIndex) {
				case Zarafa.core.mapi.IconIndex['note_blue']:
					textCls = 'stickynote_dialog_blue';
					break;
				case Zarafa.core.mapi.IconIndex['note_green']:
					textCls = 'stickynote_dialog_green';
					break;
				case Zarafa.core.mapi.IconIndex['note_pink']:
					textCls= 'stickynote_dialog_pink';
					break;
				case Zarafa.core.mapi.IconIndex['note_yellow']:
				default:
					textCls = 'stickynote_dialog_yellow';
					break;
				case Zarafa.core.mapi.IconIndex['note_white']:
					textCls = 'stickynote_dialog_white';
					break;
			}

			this.wrap.editorField.removeClass(this.currentColorCls);
			this.currentColorCls = textCls;
			this.wrap.editorField.addClass(this.currentColorCls);
		}
	},

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to update
	 * @protected
	 */
	updateRecord : function(record)
	{
		record.beginEdit();
		this.wrap.formPanel.getForm().updateRecord(record);
		this.record.generateSubject();
		record.endEdit();
	},

	/**
	 * Event handler which is fired when the user pressed the 'Save' button.
	 * This will call {@link Zarafa.core.ui.MessageContentPanel#saveRecord} to start
	 * sending the mail.
	 * @private
	 */
	onSave : function()
	{
		this.wrap.saveRecord();
	},

	/**
	 * Event handler which is fired when the user pressed the 'Disacrd' button.
	 * This will call {@link #reset} to clear the contents.
	 * @private
	 */
	onDiscard : function()
	{
		this.reset();
	}
});

Zarafa.onReady(function() {
	container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
		name : 'quicknote',
		displayName : _('Quick Note'),
		iconPath : 'plugins/quickitems/resources/images/quicknote.png',
		widgetConstructor : Zarafa.widgets.quickitems.QuickNoteWidget
	}));
});
Ext.namespace('Zarafa.widgets.quickitems');

/**
 * @class Zarafa.widgets.quickitems.QuickTaskWidget
 * @extends Zarafa.widgets.quickitems.AbstractQuickItemWidget
 *
 * Widget for creating a task quickly with a minimum set of
 * input fields
 */
Zarafa.widgets.quickitems.QuickTaskWidget = Ext.extend(Zarafa.widgets.quickitems.AbstractQuickItemWidget, {

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			wrapCfg : {
				recordComponentPluginConfig : Ext.applyIf(config.recordComponentPluginConfig || {}, {
					allowWrite : true
				}),
				layout : 'fit',
				items : [{
					xtype : 'form',
					ref : 'formPanel',
					layout: {
						type: 'vbox',
						align: 'stretch'
					},
					border : false,
					bodyStyle: 'background-color: inherit; padding: 5px;',
					defaults: {
						border: false,
						labelLength: 100,
						style: 'padding-bottom: 2px'
					},
					items : [{
						xtype: 'zarafa.compositefield',
						hideLabel: true,
						anchor: '100%',
						items: [{
							xtype: 'label',
							width: 100,
							text: _('Subject') + ':'
						},{
							xtype: 'textfield',
							flex: 1,
							name: 'subject',
							value: undefined,
							listeners: {
								change : this.onChange,
								scope : this
							}
						}]
					},{
						xtype: 'zarafa.compositefield',
						hideLabel: true,
						anchor: '100%',
						items: [{
							xtype: 'label',
							width: 100,
							text: _('End date') + ':'
						},{
							xtype: 'datefield',
							ref: '../../dueDateField',
							emptyText : _('None'),
							flex: 1,
							name: 'commonend',
							utcname : 'duedate',
							// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
							format : _('d/m/Y'),
							minValue : new Date(),
							listeners: {
								change : this.onDueDateChange,
								scope : this
							}
						}]
					},{
						xtype: 'zarafa.editorfield',
						ref: '../editorField',
						htmlName : 'html_body',
						plaintextName : 'body',
						hideLabel: true,
						flex: 1,
						useHtml : false,
						defaultValue: '',
						listeners: {
							change : this.onBodyChange,
							scope : this
						}
					}]
				}]
			},
			buttons : [{
				text : _('Save'),
				handler : this.onSave,
				scope : this
			},{
				text : _('Discard'),
				handler : this.onDiscard,
				scope : this
			}]
		});

		Zarafa.widgets.quickitems.QuickTaskWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Event handler which is triggered when one of the Input fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Object} field The field updated field
	 * @param {Object} value The value of the field updated
	 * @private
	 */
	onChange : function(field, value)
	{
		this.wrap.record.set(field.name, value);
	},

	/**
	 * Event handler which is triggered when one of the Input fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onDueDateChange : function(field, newValue, oldValue)
	{
		if (Ext.isDate(newValue)) {
			this.wrap.record.set(field.name, newValue.clone());
			this.wrap.record.set(field.utcname, newValue.toUTC());
		} else {
			this.wrap.record.set(field.name, null);
			this.wrap.record.set(field.utcname, null);
		}
	},

	/**
	 * Event handler which is triggered when one of the Input fields
	 * has been changed by the user. It will validate the new value,
	 * and if correct, will apply it to the {@link Zarafa.core.data.IPMRecord record}.
	 * @param {Ext.form.Field} field The {@link Ext.form.Field field} which was changed.
	 * @param {Mixed} newValue The new value
	 * @param {Mixed} oldValue The old value
	 * @private
	 */
	onBodyChange : function(field, newValue, oldValue)
	{
		this.wrap.record.beginEdit();
		if (field instanceof Ext.form.HtmlEditor) {
			this.wrap.record.set('isHTML', true);
		} else {
			this.wrap.record.set('isHTML', false);
		}
		this.wrap.record.set(field.name, newValue);
		this.wrap.record.endEdit();
	},

	/**
	 * Create a new record which must be edited by this widget.
	 * @return {Ext.data.Record} record The record to load into the {@link #wrap}
	 * @protected
	 */
	createRecord : function()
	{
		var folder = container.getHierarchyStore().getDefaultFolder('task');
		var context = container.getContextByName('task');
		var model = context.getModel();

		return model.createRecord(folder);
	},

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record update the panel with.
	 * @param {Boolean} contentReset force the component to perform a full update of the data.
	 * @protected
	 */
	update : function(record, contentReset)
	{
		this.wrap.formPanel.getForm().loadRecord(record);
	},

	/**
	 * Updates the widget by loading data from the record into the {@link #wrap}.
	 *
	 * @param {Zarafa.core.data.IPMRecord} record The record to update
	 * @protected
	 */
	updateRecord : function(record)
	{
		record.beginEdit();
		this.wrap.formPanel.getForm().updateRecord(record);
		this.onDueDateChange(this.wrap.dueDateField, this.wrap.dueDateField.getValue());
		this.onBodyChange(this.wrap.editorField, this.wrap.editorField.getValue());
		record.endEdit();
	},

	/**
	 * Event handler which is fired when the user pressed the 'Save' button.
	 * This will call {@link Zarafa.core.ui.MessageContentPanel#saveRecord} to start
	 * sending the mail.
	 * @private
	 */
	onSave : function()
	{
		this.wrap.saveRecord();
	},

	/**
	 * Event handler which is fired when the user pressed the 'Disacrd' button.
	 * This will call {@link #reset} to clear the contents.
	 * @private
	 */
	onDiscard : function()
	{
		this.reset();
	}
});

Zarafa.onReady(function() {
	container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
		name : 'quicktask',
		displayName : _('Quick Task'),
		iconPath : 'plugins/quickitems/resources/images/quicktask.png',
		widgetConstructor : Zarafa.widgets.quickitems.QuickTaskWidget
	}));
});
