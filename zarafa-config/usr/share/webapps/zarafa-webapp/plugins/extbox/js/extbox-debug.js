Ext.namespace('Zarafa.plugins.extbox');

/**
 * @class Zarafa.plugins.extbox.ABOUT
 * @extends String
 *
 * The copyright string holding the copyright notice for the Zarafa extbox Plugin.
 */
Zarafa.plugins.extbox.ABOUT = ""
	+ "<p>Copyright (C) 2005-2013  Zarafa B.V. &lt;info@zarafa.com&gt;</p>"

	+ "<p>This program is free software: you can redistribute it and/or modify "
	+ "it under the terms of the GNU Affero General Public License as "
	+ "published by the Free Software Foundation, either version 3 of the "
	+ "License, or (at your option) any later version.</p>"

	+ "<p>This program is distributed in the hope that it will be useful, "
	+ "but WITHOUT ANY WARRANTY; without even the implied warranty of "
	+ "MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the "
	+ "GNU Affero General Public License for more details.</p>"

	+ "<p>You should have received a copy of the GNU Affero General Public License "
	+ "along with this program.  If not, see <a href=\"http://www.gnu.org/licenses/\" target=\"_blank\">http://www.gnu.org/licenses/</a>.</p>";
Ext.namespace('Zarafa.plugins.extbox');

/**
 * @class Zarafa.plugins.extbox.ExtBoxPlugin
 * @extends Zarafa.core.Plugin
 */
Zarafa.plugins.extbox.ExtBoxPlugin = Ext.extend(Zarafa.core.Plugin, {

	/**
	 * Fired when the user doubleclicked on a box
	 * @param {Zarafa.common.ui.BoxField} boxField Parent of the box
	 * @param {Zarafa.common.ui.Box} box The box that has been doubleclicked
	 * @param {Ext.data.Record} record The record that belongs to the box
	 */
	doOpen: function(record)
	{
		var filename = record.get('name');
		var lightBoxCfg = {
			easing: 'elasticOut', 
			resizeDuration: 0.6, 
			close: '&#215;',
			hideInfo: 'auto',
			href: record.getInlineImageUrl(),
			title: filename
		};
		Ext.ux.Lightbox.open(lightBoxCfg);
	},
	
	/**
	 * Bid for the type of shared component and the given record.
	 * This will bid on a common.create or common.view for a
	 * record with a message class set to IPM or IPM.Note.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Number} The bid for the shared component
	 */
	bidSharedComponent: function(type, record)
	{
		var bid = -1;
		switch (type) {
			case Zarafa.core.data.SharedComponentType['common.view']:
			{
				if (record instanceof Zarafa.core.data.IPMAttachmentRecord) {
					var filename = record.get('name');
					if(Ext.ux.Lightbox.isImage(filename))
					{
						bid=1;
					}
				}
				break;
			}
		}
		return bid;
	},

	/**
	 * Will return the reference to the shared component.
	 * Based on the type of component requested a component is returned.
	 * @param {Zarafa.core.data.SharedComponentType} type Type of component a context can bid for.
	 * @param {Ext.data.Record} record Optionally passed record.
	 * @return {Ext.Component} Component
	 */
	getSharedComponent: function(type, record)
	{
		var component;
		switch (type) {
			case Zarafa.core.data.SharedComponentType['common.view']:
				component = this;
				break;
		}
		return component;
	}

});

Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'extbox',
		displayName : _('Extbox Plugin'),
		about : Zarafa.plugins.extbox.ABOUT,
		pluginConstructor : Zarafa.plugins.extbox.ExtBoxPlugin
	}));
});
