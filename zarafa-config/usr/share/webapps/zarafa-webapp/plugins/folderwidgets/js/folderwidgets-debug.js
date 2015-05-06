Ext.namespace('Zarafa.widgets.folderwidgets');

/**
 * @class Zarafa.widgets.folderwidgets.AbstractFolderWidget
 * @extends Zarafa.core.ui.widget.Widget
 *
 * Widget which can be used to show the contents of a
 * {@link Zarafa.hierarchy.data.MAPIFolderRecord folder}
 * using a particular restriction (during {@link #store}{@link Ext.data.Store#load})
 * or a filter (using {@link #store}{@link Ext.data.Store#applyFilter}).
 *
 * Refresh and reload times are configurable per instance of the
 * widget (keys: 'refreshinterval', default 10 seconds and
 * 'reloadinterval', default 5 minutes).  These values are in
 * miliseconds.  The refresh interval is when the view is updated.
 * This way, no stale records appear in the list.  The reload
 * interval is how often the calendar is fully reloaded from the
 * server, to show records that were added to the folder
 * outside of WebApp.
 */
Zarafa.widgets.folderwidgets.AbstractFolderWidget = Ext.extend(Zarafa.core.ui.widget.Widget, {
	/**
	 * The folder which is shown inside this widget. This is initialized
	 * by {@link #onHierarchyLoad}.
	 * @property
	 * @type Zarafa.hierarchy.data.MAPIFolderRecord
	 * @private
	 */
	folder : undefined,

	/**
	 * @cfg {Zarafa.core.data.MAPIStore} store The store which is being used for loading the records
	 */
	store : undefined,

	/**
	 * @cfg {String} folderType The folder type to obtain the desired folder
	 * from the {@link Zarafa.hierarchy.data.HierarchyStore hierarchy}.
	 */
	folderType : undefined,

	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		Ext.applyIf(config, {
			hasConfig : true
		});

		Zarafa.widgets.folderwidgets.AbstractFolderWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Initialize the event handlers for the {@link #store} and {@link Zarafa.hierarchy.data.HierarchyStore Hierarchy}.
	 * @protected
	 */
	initEvents : function()
	{
		Zarafa.widgets.folderwidgets.AbstractFolderWidget.superclass.initEvents.apply(this, arguments);

		// Wait for the hierarchy store to be loaded.
		var hierarchyStore = container.getHierarchyStore();
		this.mon(hierarchyStore, 'load', this.onHierarchyLoad, this);
		// needed when adding the widget after hierarchy load 
		this.onHierarchyLoad(hierarchyStore);

		// Wait for the store to be loaded, so we can activate
		// the refreshing and reloading times.
		this.mon(this.store, 'load', this.onStoreLoad, this, { single : true });

		// Listen for record updates, as that might have impact on the filtering
		// which should be applied.
		this.mon(this.store, 'update', this.onStoreUpdate, this);
	},

	/**
	 * Load the default calendar folder and retrieve the records.
	 * @param {Zarafa.hierarchy.data.HierarchyStore} hierarchyStore The store which fired the event
	 * @private
	 */
	onHierarchyLoad : function(hierarchyStore)
	{
		this.folder = hierarchyStore.getDefaultFolder(this.folderType);
		if (this.folder) {
			this.reloadStore();
		}
	},

	/**
	 * When the store has finished loading, update the filter for the first time.
	 * @private
	 */
	onStoreLoad : function()
	{
		// Periodically apply filter to remove outdated records from the view
		var interval = this.get('refreshinterval') || 10000;
		Ext.TaskMgr.start({
			run: this.updateFilter,
			interval: interval,
			scope: this
		});

		// Periodically reload data from the server to remove stale
		// data from the store.  But only do this when the store has
		// finished loading for the first time.
		interval = this.get('reloadinterval') || 300000;
		Ext.TaskMgr.start({
			run: this.reloadStore,
			interval: interval,
			scope : this
		});
	},

	/**
	 * When the store record has been changed, {@link #updateFilter apply filter}
	 * to ensure that unwanted records are immediately removed.
	 * @private
	 */
	onStoreUpdate : function()
	{
		this.updateFilter();
	},

	/**
	 * This will {@link Ext.data.Store#load load} the {@link #store}.
	 * @private
	 */
	reloadStore : function()
	{
		if (this.folder) {
			this.store.load({ folder : this.folder });
		}		
	},

	/**
	 * Update the filter.
	 * @private
	 */
	updateFilter : Ext.emptyFn,

	/**
	 * Configure the widget.  At this time, only the reload and
	 * refresh times can be configured.
	 * @todo Also allow the user to select the folder(s) to show here.
	 * @private
	 */
	config : function()
	{
		var win = new Ext.Window({
			title: _('Configure widget'),
			layout: 'fit',
			width: 320,
			height: 200,

			items: [{
				xtype: 'form',
				labelWidth: 120,
				frame: true,

				items: [{
					xtype: 'zarafa.spinnerfield',
					fieldLabel: _('Reload interval (ms)'),
					name: 'reloadinterval',
					minValue: 0,
					maxValue: 1800000,
					incrementValue: 1000,
					defaultValue: this.get('reloadinterval') || 300000,
					listeners: { 'change': this.onFieldChange, scope: this },
					plugins: ['zarafa.numberspinner']
				}, {
					xtype: 'zarafa.spinnerfield',
					fieldLabel: _('Refresh interval (ms)'),
					name: 'refreshinterval',
					minValue: 0,
					maxValue: 1800000,
					incrementValue: 1000,
					defaultValue: this.get('refreshinterval') || 10000,
					listeners: { 'change': this.onFieldChange, scope: this },
					plugins: ['zarafa.numberspinner']
				}],
				buttons: [{
					text: _('Close'),
					scope: this,
					handler: function() {
						win.close();
					}
				}]
			}]
		});

		win.show(this);
	},

	/**
	 * Event handler which is fired when one of the fields in the Configuration dialog
	 * has been changed. This will update the corresponding option in the settings.
	 * @param {Ext.form.Field} field The field whcih fired the event
	 * @param {Mixed} newValue The new value which was applied
	 * @param {Mixed} oldValue The old value which was applied
	 * @private
	 */
	onFieldChange : function(field, newValue, oldValue)
	{
		this.set(field.getName(), newValue);
	}
});
Ext.namespace('Zarafa.widgets.folderwidgets');

/**
 * @class Zarafa.widgets.folderwidgets.AppointmentsWidget
 * @extends Zarafa.widgets.folderwidgets.AbstractFolderWidget
 *
 * Widget that displays the appointments for today, from the default
 * calendar.  It only displays appointments that occur on or after the
 * current time, so outdated information is never shown.
 *
 * Refresh and reload times are configurable per instance of the
 * widget (keys: 'refreshinterval', default 10 seconds and
 * 'reloadinterval', default 5 minutes).  These values are in
 * miliseconds.  The refresh interval is when the view is updated.
 * This way, no stale appointments appear in the list.  The reload
 * interval is how often the calendar is fully reloaded from the
 * server, to show appointments that were added to the calendar
 * outside of WebApp.
 */
Zarafa.widgets.folderwidgets.AppointmentsWidget = Ext.extend(Zarafa.widgets.folderwidgets.AbstractFolderWidget, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var store = new Zarafa.calendar.AppointmentStore();

		Ext.applyIf(config, {
			height : 300,
			autoScroll: true,
			layout: 'fit',
			folderType : 'calendar',
			store : store,
			items : [{
				xtype: 'zarafa.gridpanel',
				store: store,
				border: true,
				hideHeaders: true,
				loadMask : {
					msg : _('Loading appointments') + '...'
				},
				sm: new Ext.grid.RowSelectionModel({
					singleSelect: true
				}),
				viewConfig: {
					deferEmptyText: false,
					emptyText: '<div class="emptytext">' + _('No appointments for today.') + '</div>',
					forceFit: true,
					enableRowBody: true,
					getRowClass: this.applyRowClass
				},
				colModel : new Ext.grid.ColumnModel({
					columns: [{
						header: _('Subject'),
						dataIndex: 'subject',
						editable: false,
						menuDisabled: true,
						renderer: this.subjectRenderer,
						width: 300
					}]
				}),
				listeners: {
					'rowcontextmenu' : this.onRowContextMenu,
					'rowdblclick': this.onRowDblClick,
					scope: this
				}
			}]
		});

		Zarafa.widgets.folderwidgets.AppointmentsWidget.superclass.constructor.call(this, config);
	},

	/**
	 * This will {@link Ext.data.Store#load load} the {@link #store} using
	 * a restriction which only allows todays appointments.
	 * @private
	 */
	reloadStore : function()
	{
		if (this.folder) {
			var now = new Date();
			var today = now.clearTime();
			var tomorrow = today.add(Date.DAY, 1);

			this.store.load({
				folder : this.folder,
				params : {
					restriction: {
						startdate: now.getTime() / 1000,
						duedate: tomorrow.getTime() / 1000
					}
				}
			});
		}		
	},

	/**
	 * Update the filter with the current time.  Items that end
	 * before now are removed.
	 * @private
	 */
	updateFilter : function() {
		this.store.filterBy(function(record) {
			var now = new Date();
			var startdate = record.get('startdate') || now;
			var duedate = record.get('duedate') || now;
			return (startdate >= now || duedate >= now) && startdate < now.clearTime().add(Date.DAY, 1);
		}, this);
	},			

	/**
	 * Render the subject, which is the time span + the subject of
	 * the appointment.  The passed value is the subject of the
	 * appointment, the rest of the data is retrieved through record.
	 *
	 * @param {Mixed} value The subject of the appointment
	 * @param {Object} metaData Used to set style information to gray out appointments that occur now
	 * @param {Ext.data.Record} record The record being displayed, used to retrieve the start and end times
	 * @param {Number} rowIndex The index of the rendered row
	 * @param {Number} colIndex The index of the rendered column
	 * @param {Ext.data.Store} store The store to which the record belongs 
	 * @private
	 */
	subjectRenderer : function(value, metaData, record, rowIndex, colIndex, store) {
			var now = new Date();
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			var starttime = (record.get('startdate') || now).format(_("G:i"));
			// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
			var duetime = (record.get('duedate') || now).format(_("G:i"));
			if ((record.get('startdate') || now) < now) {
				metaData.attr = "style='color: #888; font-weight: bold;'";
			} else {
				metaData.attr = "style='font-weight: bold;'";
			}

			var icons = '';
			var iconToString = function(icon) { return '<img src="' + icon.src + '" /> '; };

			if (record.get('private') === true) {
				icons += iconToString(Zarafa.calendar.ui.IconCache.getPrivateIcon());
			}
			if (record.get('recurring') === true) {
				if (record.get('exception') === true) {
					icons += iconToString(Zarafa.calendar.ui.IconCache.getExceptionIcon());
				} else {
					icons += iconToString(Zarafa.calendar.ui.IconCache.getRecurringIcon());
				}
			}

			if (record.get('alldayevent')) {
				// # TRANSLATORS: {0} is the subject of an all-day
				// # appointment, {1} is the html code to display
				// # icons.
				return String.format(_("Today: {1} {0}"),
									 Ext.util.Format.htmlEncode(value), icons);
			} else {
				// # TRANSLATORS: {0} is the subject of an
				// # appointment; {1} is the start time, {2} is the
				// # end time, {3} is the html code to display icons.
				return String.format(_("{1}&minus;{2}: {3} {0}"),
									 Ext.util.Format.htmlEncode(value), starttime, duetime,
									 icons);
			}
	},

	/**
	 * Add additional information to the row, in this case the
	 * location of the meeting.  TODO: add a preview of the body here.
	 * The location is rendered in its own table for future use.
	 *
	 * @param record The record being displayed.  If it has no
	 * location set, then the table is omitted entirely.
	 * @param {Number} rowIndex The index of the rendered row
	 * @param {Object} rowParams The row parameters
	 * @param {Ext.data.Store} store The store in which the record is placed
	 * @returns A string containing a space separated list of css
	 * classes to apply.  It will always contain 'today-item', and a
	 * second class that indicates the intended busy state of the
	 * appointment.
	 * @private
	 */
	applyRowClass : function(record, rowIndex, rowParams, store) {
		var location = record.get('location');
		if (location) {
			rowParams.body = '<table style="width: 100%; padding: 0; border-spacing: 0;">';
			rowParams.body += String.format('<tr><td style="width: 100%; font-size: 80%;"><i>{0}</i></td></tr>',
											Ext.util.Format.htmlEncode(location));
			rowParams.body += '</table>';
		} else {
			rowParams.body = '';
		}

		var css = 'today-item ';
		var busystatus = record.get('busystatus');
		switch (busystatus) {
		case Zarafa.core.mapi.BusyStatus.FREE:
			return css + 'today-free';
		case Zarafa.core.mapi.BusyStatus.TENTATIVE:
			return css + 'today-tentative';
		case Zarafa.core.mapi.BusyStatus.BUSY:
			return css + 'today-busy';
		case Zarafa.core.mapi.BusyStatus.OUTOFOFFICE:
			return css + 'today-outofoffice';
		default:
			return css + 'today-unknown';
		}
	},

	/**
	 * Event handler which is triggered when user opens context menu
	 * @param {Ext.grid.GridPanel} grid grid panel object
	 * @param {Number} rowIndex index of row
	 * @param {Ext.EventObject} eventObj eventObj object of the event
	 * @private
	 */
	onRowContextMenu : function(grid, rowIndex, event)
	{
		// check row is already selected or not, if its not selected then select it first
		var selectionModel = grid.getSelectionModel();
		if (!selectionModel.isSelected(rowIndex)) {
			selectionModel.selectRow(rowIndex);
		}

		// The ContextMenu needs the ContextModel for cases where we want to reply the mail.
		var model;
		if (this.folder) {
			var context = container.getContextByFolder(this.folder);
			if (context) {
				model = context.getModel();
			}
		}

		Zarafa.core.data.UIFactory.openDefaultContextMenu(selectionModel.getSelections(), { position : event.getXY(), model : model });
	},

	/**
	 * Called when the user double-clicks on an appointment.
	 * @param {Ext.grid.GridPanel} grid The grid which fired the event
	 * @param {Number} rowIndex The row which was double clicked
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onRowDblClick : function(grid, rowIndex, event)
	{
		var record = grid.getSelectionModel().getSelected();
		if (!Ext.isEmpty(record)) {
			if (record.isRecurringOccurence()) {
				record = record.convertToOccurenceRecord();
			}
		}
		Zarafa.core.data.UIFactory.openViewRecord(record);
	}
});

Zarafa.onReady(function() {
	container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
		name : 'appointments',
		displayName : _('Today\'s Appointments'),
		iconPath : 'plugins/folderwidgets/resources/images/appointments.png',
		widgetConstructor : Zarafa.widgets.folderwidgets.AppointmentsWidget
	}));
});
Ext.namespace('Zarafa.widgets.folderwidgets');

/**
 * @class Zarafa.widgets.folderwidgets.MailWidget
 * @extends Zarafa.widgets.folderwidgets.AbstractFolderWidget
 *
 * Widget that shows the unread mail.
 */
Zarafa.widgets.folderwidgets.MailWidget = Ext.extend(Zarafa.widgets.folderwidgets.AbstractFolderWidget, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var store = new Zarafa.mail.MailStore();

		// The store already has the default sort info, but we
		// must apply it still. (Bug in the ListModuleStore?).
		store.setDefaultSort(store.defaultSortInfo.field, store.defaultSortInfo.direction);

		// Create a restriction, we only want unread mails, so mails which
		// do not have the MSGFLAG_READ flag on the PR_MESSAGE_FLAGS
		store.setRestriction({
			'search' : Zarafa.core.data.RestrictionFactory.dataResBitmask(
				'0x00E070003', /* PR_MESSAGE_FLAGS */
				Zarafa.core.mapi.Restrictions.BMR_EQZ,
				Zarafa.core.mapi.MessageFlags.MSGFLAG_READ
			)
		});

		Ext.applyIf(config, {
			height : 200,
			autoScroll: true,
			layout: 'fit',
			folderType : 'inbox',
			store : store,
			items : [{
				xtype: 'zarafa.gridpanel',
				store: store,
				border: true,
				loadMask : {
					msg : _('Loading mail') + '...'
				},
				sm: new Ext.grid.RowSelectionModel({
					singleSelect: true
				}),
				viewConfig: {
					deferEmptyText: false,
					emptyText: '<div class="emptytext">' + _('No unread mail.') + '</div>',
					forceFit: true,

					// Enable the row body in which we can render
					// the subject of the mail and some icons
					// for the attachment and importance.
					enableRowBody : true,
					rowSelectorDepth : 15,
					getRowClass : this.viewConfigGetRowClass
				},
				colModel : new Ext.grid.ColumnModel({
					columns: [{
						header: _('From'),
						dataIndex: 'sent_representing_name',
						menuDisabled : true,
						renderer: Ext.util.Format.htmlEncode
					},{
						header: _('Received'),
						dataIndex: 'message_delivery_time',
						editable: false,
						menuDisabled : true,
						renderer : Zarafa.common.ui.grid.Renderers.datetime
					}]
				}),
				listeners: {
					'rowcontextmenu' : this.onRowContextMenu,
					'rowdblclick': this.onRowDblClick,
					scope: this
				}
			}]
		});

		Zarafa.widgets.folderwidgets.MailWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Update the filter. This will filter the records using
	 * {@link Zarafa.core.data.IPMRecord#isRead}.
	 * @private
	 */
        updateFilter : function()
	{
		this.store.filterBy(function(record) {
			return !record.isRead();
		}, this);
	},

	/**
	 * Apply custom style and content for the row body. This will always
	 * apply the Read/Unread style to the entire row. Optionally it will
	 * enable the row body containing the subject and icons for attachment
	 * and priority.
	 *
	 * @param {Ext.data.Record} record The {@link Ext.data.Record Record} corresponding to the current row.
	 * @param {Number} rowIndex The row index
	 * @param {Object} rowParams A config object that is passed to the row template during
	 * rendering that allows customization of various aspects of a grid row.
	 * If enableRowBody is configured true, then the following properties may be set by this function,
	 * and will be used to render a full-width expansion row below each grid row.
	 * @param {Ext.data.Store} store The Ext.data.Store this grid is bound to
	 * @return {String} a CSS class name to add to the row
	 * @private
	 */
	viewConfigGetRowClass : function(record, rowIndex, rowParams, store)
	{
		var cssClass = (record.isRead() ? 'mail_read' : 'mail_unread');

		var meta = {}; // Metadata object for Zarafa.common.ui.grid.Renderers.
		var value = ''; // The value which must be rendered
		rowParams.body = '<table cellspacing="0" cellpadding="0" border="0" style="width: 100%;">';
		rowParams.body += '<tr>';

		// Render the subject
		meta = {};
		value = Zarafa.common.ui.grid.Renderers.subject(record.get('subject'), meta, record);
		rowParams.body += String.format('<td style="width: 100%"><div class="grid_compact grid_compact_left {0}" style="height: 24px;">{1}</div></td>', meta.css, value);

		// Render the attachment icon (always aligned to the right)
		meta = {};
		value = Zarafa.common.ui.grid.Renderers.attachment(record.get('hasattach'), meta, record);
		rowParams.body += String.format('<td style="width: 24px"><div class="grid_compact {0}" style="height: 24px; width: 24px;">{1}</div></td>', meta.css, value);

		// Render the importance icon (always aligned to the right)
		meta = {};
		value = Zarafa.common.ui.grid.Renderers.importance(record.get('importance'), meta, record);
		rowParams.body += String.format('<td style="width: 24px"><div class="grid_compact {0}" style="height: 24px; width: 24px;">{1}</div></td>', meta.css, value);

		rowParams.body += '</tr></table>';
		return 'x-grid3-row-expanded ' + cssClass;
	},

	/**
	 * Event handler which is triggered when user opens context menu
	 * @param {Ext.grid.GridPanel} grid grid panel object
	 * @param {Number} rowIndex index of row
	 * @param {Ext.EventObject} eventObj eventObj object of the event
	 * @private
	 */
	onRowContextMenu : function(grid, rowIndex, event)
	{
		// check row is already selected or not, if its not selected then select it first
		var selectionModel = grid.getSelectionModel();
		if (!selectionModel.isSelected(rowIndex)) {
			selectionModel.selectRow(rowIndex);
		}

		// The ContextMenu needs the ContextModel for cases where we want to reply the mail.
		var model;
		if (this.folder) {
			var context = container.getContextByFolder(this.folder);
			if (context) {
				model = context.getModel();
			}
		}

		Zarafa.core.data.UIFactory.openDefaultContextMenu(selectionModel.getSelections(), { position : event.getXY(), model : model });
	},

	/**
	 * Called when the user double-clicks on a mail.
	 * @param {Ext.grid.GridPanel} grid The grid which fired the event
	 * @param {Number} rowIndex The row which was double clicked
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onRowDblClick : function(grid, rowIndex, event)
	{
		Zarafa.core.data.UIFactory.openViewRecord(grid.getSelectionModel().getSelected());
	}
});

Zarafa.onReady(function() {
	container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
		name : 'mail',
		displayName : _('Unread Mail'),
		iconPath : 'plugins/folderwidgets/resources/images/mail.png',
		widgetConstructor : Zarafa.widgets.folderwidgets.MailWidget
	}));
});
Ext.namespace('Zarafa.widgets.folderwidgets');

/**
 * @class Zarafa.widgets.folderwidgets.TasksWidget
 * @extends Zarafa.widgets.folderwidgets.AbstractFolderWidget
 *
 * Widget that current (non-completed) tasks.
 */
Zarafa.widgets.folderwidgets.TasksWidget = Ext.extend(Zarafa.widgets.folderwidgets.AbstractFolderWidget, {
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		config = config || {};

		var store = new Zarafa.task.TaskStore();

		// Create a restriction, we only want uncomplete tasks, so tasks which
		// do not have the status flag set to Zarafa.core.mapi.TaskStatus.COMPLETE
		store.setRestriction({
			'search' : Zarafa.core.data.RestrictionFactory.dataResProperty(
				'status',
				Zarafa.core.mapi.Restrictions.RELOP_NE,
				Zarafa.core.mapi.TaskStatus.COMPLETE
			)
		});

		Ext.applyIf(config, {
			height : 200,
			autoScroll: true,
			layout: 'fit',
			folderType : 'task',
			store : store,
			items : [{
				xtype: 'zarafa.gridpanel',
				store: store,
				border: true,
				loadMask : {
					msg : _('Loading tasks') + '...'
				},
				sm: new Ext.grid.RowSelectionModel({
					singleSelect: true
				}),
				viewConfig: {
					deferEmptyText: false,
					emptyText: '<div class="emptytext">' + _('No tasks.') + '</div>',
					forceFit: true
				},
				colModel : new Ext.grid.ColumnModel({
					columns: [{
						header: _('Owner'),
						dataIndex: 'owner',
						menuDisabled : true,
						renderer: Ext.util.Format.htmlEncode
					},{
						header: _('Subject'),
						dataIndex: 'subject',
						editable: false,
						menuDisabled : true,
						renderer: Ext.util.Format.htmlEncode
					}]
				}),
				listeners: {
					'rowcontextmenu' : this.onRowContextMenu,
					'rowdblclick': this.onRowDblClick,
					scope: this
				}
			}]
		});

		Zarafa.widgets.folderwidgets.TasksWidget.superclass.constructor.call(this, config);
	},

	/**
	 * Update the filter.
	 * @private
	 */
        updateFilter : function()
	{
		this.store.filterBy(function(record) {
			return (record.get('status') != Zarafa.core.mapi.TaskStatus.COMPLETE);
		}, this);
	},

	/**
	 * Event handler which is triggered when user opens context menu
	 * @param {Ext.grid.GridPanel} grid grid panel object
	 * @param {Number} rowIndex index of row
	 * @param {Ext.EventObject} eventObj eventObj object of the event
	 * @private
	 */
	onRowContextMenu : function(grid, rowIndex, event)
	{
		// check row is already selected or not, if its not selected then select it first
		var selectionModel = grid.getSelectionModel();
		if (!selectionModel.isSelected(rowIndex)) {
			selectionModel.selectRow(rowIndex);
		}

		// The ContextMenu needs the ContextModel for cases where we want to reply the mail.
		var model;
		if (this.folder) {
			var context = container.getContextByFolder(this.folder);
			if (context) {
				model = context.getModel();
			}
		}

		Zarafa.core.data.UIFactory.openDefaultContextMenu(selectionModel.getSelections(), { position : event.getXY(), model : model });
	},

	/**
	 * Called when the user double-clicks on a task.
	 * @param {Ext.grid.GridPanel} grid The grid which fired the event
	 * @param {Number} rowIndex The row which was double clicked
	 * @param {Ext.EventObject} event The event object
	 * @private
	 */
	onRowDblClick : function(grid, rowIndex, event)
	{
		Zarafa.core.data.UIFactory.openViewRecord(grid.getSelectionModel().getSelected());
	}
});

Zarafa.onReady(function() {
	container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
		name : 'tasks',
		displayName : _('Tasks'),
		iconPath : 'plugins/folderwidgets/resources/images/tasks.png',
		widgetConstructor : Zarafa.widgets.folderwidgets.TasksWidget
	}));
});
