Ext.ns('Ext.ux');
// vim: ts=4:sw=4:nu:fdc=2:nospell
/**
  * Ext.ux.IconCombo Extension Class for Ext 2.x Library
  *
  * @author  Ing. Jozef Sakalos
  * @version $Id: Ext.ux.IconCombo.js 617 2007-12-20 11:29:56Z jozo $
  *
  * @class Ext.ux.IconCombo
  * @extends Ext.form.ComboBox
  */
Ext.ux.IconCombo = Ext.extend(Ext.form.ComboBox, {
    initComponent:function() {
 
        Ext.apply(this, {
            tpl:  '<tpl for=".">'
                + '<div class="x-combo-list-item ux-icon-combo-item '
                + '{' + this.iconClsField + '}">'
                + '{' + this.displayField + '}'
                + '</div></tpl>'
        });
 
        // call parent initComponent
        Ext.ux.IconCombo.superclass.initComponent.call(this);
 
    }, // end of function initComponent
 
    onRender:function(ct, position) {
        // call parent onRender
        Ext.ux.IconCombo.superclass.onRender.call(this, ct, position);
 
        // adjust styles
        this.wrap.applyStyles({position:'relative'});
        this.el.addClass('ux-icon-combo-input');
 
        // add div for icon
        this.icon = Ext.DomHelper.append(this.el.up('div.x-form-field-wrap'), {
            tag: 'div', style:'position:absolute'
        });
    }, // end of function onRender

	afterRender:function() {
		Ext.ux.IconCombo.superclass.afterRender.apply(this, arguments);
		if(undefined !== this.value) {
			this.setValue(this.value);
		}
	},// end of function afterRender
 
    setIconCls:function() {
        var rec = this.store.query(this.valueField, this.getValue()).itemAt(0);
        if(rec && this.icon) {
            this.icon.className = 'ux-icon-combo-icon ' + rec.get(this.iconClsField);
        }
    }, // end of function setIconCls
 
    setValue: function(value) {
        Ext.ux.IconCombo.superclass.setValue.call(this, value);
        this.setIconCls();
    }, // end of function setValue

	clearValue:function() {
		 Ext.ux.IconCombo.superclass.clearValue.call(this);
		if(this.icon) {
				this.icon.className = '';
		}
	}
});
 
// register xtype
Ext.reg('iconcombo', Ext.ux.IconCombo);Ext.namespace('Ext.ux');

/*
Source from : https://www.extjs.com/deploy/dev/examples/ux/DataView-more.js
 */
/*
 * @private
 * Drag selector for icon view
 */
Ext.ux.IconDragSelector = function(cfg){
    cfg = cfg || {};
    var view, proxy, tracker;
    var rs, bodyRegion, dragRegion = new Ext.lib.Region(0,0,0,0);
    var dragSafe = cfg.dragSafe === true;

    this.init = function(dataView){
        view = dataView;
        view.on('render', onRender);
    };

    function fillRegions(){
        rs = [];
        view.all.each(function(el){
            rs[rs.length] = el.getRegion();
        });
        bodyRegion = view.el.getRegion();
    }

    function cancelClick(){
        return false;
    }

    function onBeforeStart(e){
        return !dragSafe || e.target == view.el.dom;
    }

    function onStart(e){
        view.on('containerclick', cancelClick, view, {single:true});
        if(!proxy){
            proxy = view.el.createChild({cls:'x-view-selector'});
        }else{
            if(proxy.dom.parentNode !== view.el.dom){
                view.el.dom.appendChild(proxy.dom);
            }
            proxy.setDisplayed('block');
        }
        fillRegions();
        view.clearSelections();
    }

    function onDrag(e){
        var startXY = tracker.startXY;
        var xy = tracker.getXY();

        var x = Math.min(startXY[0], xy[0]);
        var y = Math.min(startXY[1], xy[1]);
        var w = Math.abs(startXY[0] - xy[0]);
        var h = Math.abs(startXY[1] - xy[1]);

        dragRegion.left = x;
        dragRegion.top = y;
        dragRegion.right = x+w;
        dragRegion.bottom = y+h;

        dragRegion.constrainTo(bodyRegion);
        proxy.setRegion(dragRegion);

        for(var i = 0, len = rs.length; i < len; i++){
            var r = rs[i], sel = dragRegion.intersect(r);
            if(sel && !r.selected){
                r.selected = true;
                view.select(i, true);
            }else if(!sel && r.selected){
                r.selected = false;
                view.deselect(i);
            }
        }
    }

    function onEnd(e){
        if (!Ext.isIE) {
            view.un('containerclick', cancelClick, view);    
        }        
        if(proxy){
            proxy.setDisplayed(false);
        }
    }

    function onRender(view){
        tracker = new Ext.dd.DragTracker({
            onBeforeStart: onBeforeStart,
            onStart: onStart,
            onDrag: onDrag,
            onEnd: onEnd
        });
        tracker.initEl(view.el);
    }
};// vim: ts=4:sw=4:nu:fdc=4:nospell
/**
 * Ext.ux.form.LovCombo, List of Values Combo
 *
 * @author    Ing. Jozef Sakáloš
 * @copyright (c) 2008, by Ing. Jozef Sakáloš
 * @date      16. April 2008
 * @version   $Id: Ext.ux.form.LovCombo.js 285 2008-06-06 09:22:20Z jozo $
 *
 * @license Ext.ux.form.LovCombo.js is licensed under the terms of the Open Source
 * LGPL 3.0 license. Commercial use is permitted to the extent that the 
 * code/component(s) do NOT become part of another Open Source or Commercially
 * licensed development library or toolkit without explicit permission.
 * 
 * License details: http://www.gnu.org/licenses/lgpl.html
 */
 
/*global Ext */
// add RegExp.escape if it has not been already added
if('function' !== typeof RegExp.escape) {
	RegExp.escape = function(s) {
		if('string' !== typeof s) {
			return s;
		}
		// Note: if pasting from forum, precede ]/\ with backslash manually
		return s.replace(/([.*+?^=!:${}()|[\]\/\\])/g, '\\$1');
	}; // eo function escape
}

// create namespace
Ext.ns('Ext.ux.form');
 
/**
 *
 * @class Ext.ux.form.LovCombo
 * @extends Ext.form.ComboBox
 */
Ext.ux.form.LovCombo = Ext.extend(Ext.form.ComboBox, {

	// {{{
    // configuration options
	/**
	 * @cfg {String} checkField name of field used to store checked state.
	 * It is automatically added to existing fields.
	 * Change it only if it collides with your normal field.
	 */
	 checkField:'checked'

	/**
	 * @cfg {String} separator separator to use between values and texts
	 */
    ,separator:','

	/**
	 * @cfg {String/Array} tpl Template for items. 
	 * Change it only if you know what you are doing.
	 */
	// }}}
    // {{{
    ,initComponent:function() {
        
		// template with checkbox
		if(!this.tpl) {
			this.tpl = 
				 '<tpl for=".">'
				+'<div class="x-combo-list-item">'
				+'<img class="ux-lovcombo-icon ux-lovcombo-icon-'
				+'{[values.' + this.checkField + '?"checked":"unchecked"' + ']}">'
				+'<div class="ux-lovcombo-item-text">{' + (this.displayField || 'text' )+ '}</div>'
				+'</div>'
				+'</tpl>'
			;
		}
 
        // call parent
        Ext.ux.form.LovCombo.superclass.initComponent.apply(this, arguments);

		// install internal event handlers
		this.on({
			 scope:this
			,beforequery:this.onBeforeQuery
			,blur:this.onRealBlur
		});

		// remove selection from input field
		this.onLoad = this.onLoad.createSequence(function() {
			if(this.el) {
				var v = this.el.dom.value;
				this.el.dom.value = '';
				this.el.dom.value = v;
			}
		});
 
    } // e/o function initComponent
    // }}}
	// {{{
	/**
	 * Disables default tab key bahavior
	 * @private
	 */
	,initEvents:function() {
		Ext.ux.form.LovCombo.superclass.initEvents.apply(this, arguments);

		// disable default tab handling - does no good
		this.keyNav.tab = false;

	} // eo function initEvents
	// }}}
	// {{{
	/**
	 * clears value
	 */
	,clearValue:function() {
		this.value = '';
		this.setRawValue(this.value);
		this.store.clearFilter();
		this.store.each(function(r) {
			r.set(this.checkField, false);
		}, this);
		if(this.hiddenField) {
			this.hiddenField.value = '';
		}
		this.applyEmptyText();
	} // eo function clearValue
	// }}}
	// {{{
	/**
	 * @return {String} separator (plus space) separated list of selected displayFields
	 * @private
	 */
	,getCheckedDisplay:function() {
		var re = new RegExp(this.separator, "g");
		return this.getCheckedValue(this.displayField).replace(re, this.separator + ' ');
	} // eo function getCheckedDisplay
	// }}}
	// {{{
	/**
	 * @return {String} separator separated list of selected valueFields
	 * @private
	 */
	,getCheckedValue:function(field) {
		field = field || this.valueField;
		var c = [];

		// store may be filtered so get all records
		var snapshot = this.store.snapshot || this.store.data;

		snapshot.each(function(r) {
			if(r.get(this.checkField)) {
				c.push(r.get(field));
			}
		}, this);

		return c.join(this.separator);
	} // eo function getCheckedValue
	// }}}
	// {{{
	/**
	 * beforequery event handler - handles multiple selections
	 * @param {Object} qe query event
	 * @private
	 */
	,onBeforeQuery:function(qe) {
		qe.query = qe.query.replace(new RegExp(this.getCheckedDisplay() + '[ ' + this.separator + ']*'), '');
	} // eo function onBeforeQuery
	// }}}
	// {{{
	/**
	 * blur event handler - runs only when real blur event is fired
	 */
	,onRealBlur:function() {
		this.list.hide();
		var rv = this.getRawValue();
		var rva = rv.split(new RegExp(RegExp.escape(this.separator) + ' *'));
		var va = [];
		var snapshot = this.store.snapshot || this.store.data;

		// iterate through raw values and records and check/uncheck items
		Ext.each(rva, function(v) {
			snapshot.each(function(r) {
				if(v === r.get(this.displayField)) {
					va.push(r.get(this.valueField));
				}
			}, this);
		}, this);
		this.setValue(va.join(this.separator));
		this.store.clearFilter();
	} // eo function onRealBlur
	// }}}
	// {{{
	/**
	 * before blur event - is empty function as all logic goes in onRealblur
	 */
	,beforeBlur: Ext.emptyFn
	// }}}
	// {{{
	/**
	 * Combo's onSelect override
	 * @private
	 * @param {Ext.data.Record} record record that has been selected in the list
	 * @param {Number} index index of selected (clicked) record
	 */
	,onSelect:function(record, index) {
        if(this.fireEvent('beforeselect', this, record, index) !== false){

			// toggle checked field
			record.set(this.checkField, !record.get(this.checkField));

			// display full list
			if(this.store.isFiltered()) {
				this.doQuery(this.allQuery);
			}
			// set (update) value and fire event
			this.setValue(this.getCheckedValue());
            this.fireEvent('select', this, record, index);
        }
	} // eo function onSelect
	// }}}
	// {{{
	/**
	 * Sets the value of the LovCombo
	 * @param {Mixed} v value
	 */
	,setValue:function(v) {
		if(v) {
			v = '' + v;
			if(this.valueField) {
				this.store.clearFilter();
				this.store.each(function(r) {
					var checked = !(!v.match(
						 '(^|' + this.separator + ')' + RegExp.escape(r.get(this.valueField))
						+'(' + this.separator + '|$)'))
					;

					r.set(this.checkField, checked);
				}, this);
				this.value = this.getCheckedValue();
				this.setRawValue(this.getCheckedDisplay());
				if(this.hiddenField) {
					this.hiddenField.value = this.value;
				}
			}
			else {
				this.value = v;
				this.setRawValue(v);
				if(this.hiddenField) {
					this.hiddenField.value = v;
				}
			}
			if(this.el) {
				this.el.removeClass(this.emptyClass);
			}
		}
		else {
			this.clearValue();
		}
	} // eo function setValue
	// }}}
	// {{{
	/**
	 * Selects all items
	 */
	,selectAll:function() {
        this.store.each(function(record){
            // toggle checked field
            record.set(this.checkField, true);
        }, this);

        //display full list
        this.doQuery(this.allQuery);
        this.setValue(this.getCheckedValue());
    } // eo full selectAll
	// }}}
	// {{{
	/**
	 * Deselects all items. Synonym for clearValue
	 */
    ,deselectAll:function() {
		this.clearValue();
    } // eo full deselectAll 
	// }}}

}); // eo extend
 
// register xtype
Ext.reg('lovcombo', Ext.ux.form.LovCombo); 
// eof
Ext.namespace('Ext.ux');

/*
 Source from :  http://www.sencha.com/forum/showthread.php?28460-Ext.util.MD5
 */

Ext.ux.MDHash = function(s,raw,hexcase,chrsz) {
	raw = raw || false;	
	hexcase = hexcase || false;
	chrsz = chrsz || 8;

	function safe_add(x, y){
		var lsw = (x & 0xFFFF) + (y & 0xFFFF);
		var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
		return (msw << 16) | (lsw & 0xFFFF);
	}
	function bit_rol(num, cnt){
		return (num << cnt) | (num >>> (32 - cnt));
	}
	function md5_cmn(q, a, b, x, s, t){
		return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s),b);
	}
	function md5_ff(a, b, c, d, x, s, t){
		return md5_cmn((b & c) | ((~b) & d), a, b, x, s, t);
	}
	function md5_gg(a, b, c, d, x, s, t){
		return md5_cmn((b & d) | (c & (~d)), a, b, x, s, t);
	}
	function md5_hh(a, b, c, d, x, s, t){
		return md5_cmn(b ^ c ^ d, a, b, x, s, t);
	}
	function md5_ii(a, b, c, d, x, s, t){
		return md5_cmn(c ^ (b | (~d)), a, b, x, s, t);
	}

	function core_md5(x, len){
		x[len >> 5] |= 0x80 << ((len) % 32);
		x[(((len + 64) >>> 9) << 4) + 14] = len;
		var a =  1732584193;
		var b = -271733879;
		var c = -1732584194;
		var d =  271733878;
		for(var i = 0; i < x.length; i += 16){
			var olda = a;
			var oldb = b;
			var oldc = c;
			var oldd = d;
			a = md5_ff(a, b, c, d, x[i+ 0], 7 , -680876936);
			d = md5_ff(d, a, b, c, x[i+ 1], 12, -389564586);
			c = md5_ff(c, d, a, b, x[i+ 2], 17,  606105819);
			b = md5_ff(b, c, d, a, x[i+ 3], 22, -1044525330);
			a = md5_ff(a, b, c, d, x[i+ 4], 7 , -176418897);
			d = md5_ff(d, a, b, c, x[i+ 5], 12,  1200080426);
			c = md5_ff(c, d, a, b, x[i+ 6], 17, -1473231341);
			b = md5_ff(b, c, d, a, x[i+ 7], 22, -45705983);
			a = md5_ff(a, b, c, d, x[i+ 8], 7 ,  1770035416);
			d = md5_ff(d, a, b, c, x[i+ 9], 12, -1958414417);
			c = md5_ff(c, d, a, b, x[i+10], 17, -42063);
			b = md5_ff(b, c, d, a, x[i+11], 22, -1990404162);
			a = md5_ff(a, b, c, d, x[i+12], 7 ,  1804603682);
			d = md5_ff(d, a, b, c, x[i+13], 12, -40341101);
			c = md5_ff(c, d, a, b, x[i+14], 17, -1502002290);
			b = md5_ff(b, c, d, a, x[i+15], 22,  1236535329);
			a = md5_gg(a, b, c, d, x[i+ 1], 5 , -165796510);
			d = md5_gg(d, a, b, c, x[i+ 6], 9 , -1069501632);
			c = md5_gg(c, d, a, b, x[i+11], 14,  643717713);
			b = md5_gg(b, c, d, a, x[i+ 0], 20, -373897302);
			a = md5_gg(a, b, c, d, x[i+ 5], 5 , -701558691);
			d = md5_gg(d, a, b, c, x[i+10], 9 ,  38016083);
			c = md5_gg(c, d, a, b, x[i+15], 14, -660478335);
			b = md5_gg(b, c, d, a, x[i+ 4], 20, -405537848);
			a = md5_gg(a, b, c, d, x[i+ 9], 5 ,  568446438);
			d = md5_gg(d, a, b, c, x[i+14], 9 , -1019803690);
			c = md5_gg(c, d, a, b, x[i+ 3], 14, -187363961);
			b = md5_gg(b, c, d, a, x[i+ 8], 20,  1163531501);
			a = md5_gg(a, b, c, d, x[i+13], 5 , -1444681467);
			d = md5_gg(d, a, b, c, x[i+ 2], 9 , -51403784);
			c = md5_gg(c, d, a, b, x[i+ 7], 14,  1735328473);
			b = md5_gg(b, c, d, a, x[i+12], 20, -1926607734);
			a = md5_hh(a, b, c, d, x[i+ 5], 4 , -378558);
			d = md5_hh(d, a, b, c, x[i+ 8], 11, -2022574463);
			c = md5_hh(c, d, a, b, x[i+11], 16,  1839030562);
			b = md5_hh(b, c, d, a, x[i+14], 23, -35309556);
			a = md5_hh(a, b, c, d, x[i+ 1], 4 , -1530992060);
			d = md5_hh(d, a, b, c, x[i+ 4], 11,  1272893353);
			c = md5_hh(c, d, a, b, x[i+ 7], 16, -155497632);
			b = md5_hh(b, c, d, a, x[i+10], 23, -1094730640);
			a = md5_hh(a, b, c, d, x[i+13], 4 ,  681279174);
			d = md5_hh(d, a, b, c, x[i+ 0], 11, -358537222);
			c = md5_hh(c, d, a, b, x[i+ 3], 16, -722521979);
			b = md5_hh(b, c, d, a, x[i+ 6], 23,  76029189);
			a = md5_hh(a, b, c, d, x[i+ 9], 4 , -640364487);
			d = md5_hh(d, a, b, c, x[i+12], 11, -421815835);
			c = md5_hh(c, d, a, b, x[i+15], 16,  530742520);
			b = md5_hh(b, c, d, a, x[i+ 2], 23, -995338651);
			a = md5_ii(a, b, c, d, x[i+ 0], 6 , -198630844);
			d = md5_ii(d, a, b, c, x[i+ 7], 10,  1126891415);
			c = md5_ii(c, d, a, b, x[i+14], 15, -1416354905);
			b = md5_ii(b, c, d, a, x[i+ 5], 21, -57434055);
			a = md5_ii(a, b, c, d, x[i+12], 6 ,  1700485571);
			d = md5_ii(d, a, b, c, x[i+ 3], 10, -1894986606);
			c = md5_ii(c, d, a, b, x[i+10], 15, -1051523);
			b = md5_ii(b, c, d, a, x[i+ 1], 21, -2054922799);
			a = md5_ii(a, b, c, d, x[i+ 8], 6 ,  1873313359);
			d = md5_ii(d, a, b, c, x[i+15], 10, -30611744);
			c = md5_ii(c, d, a, b, x[i+ 6], 15, -1560198380);
			b = md5_ii(b, c, d, a, x[i+13], 21,  1309151649);
			a = md5_ii(a, b, c, d, x[i+ 4], 6 , -145523070);
			d = md5_ii(d, a, b, c, x[i+11], 10, -1120210379);
			c = md5_ii(c, d, a, b, x[i+ 2], 15,  718787259);
			b = md5_ii(b, c, d, a, x[i+ 9], 21, -343485551);
			a = safe_add(a, olda);
			b = safe_add(b, oldb);
			c = safe_add(c, oldc);
			d = safe_add(d, oldd);
		}
		return [a, b, c, d];
	}
	function str2binl(str){
		var bin = [];
		var mask = (1 << chrsz) - 1;
		for(var i = 0; i < str.length * chrsz; i += chrsz) {
			bin[i>>5] |= (str.charCodeAt(i / chrsz) & mask) << (i%32);
		}
		return bin;
	}
	function binl2str(bin){
		var str = "";
		var mask = (1 << chrsz) - 1;
		for(var i = 0; i < bin.length * 32; i += chrsz) {
			str += String.fromCharCode((bin[i>>5] >>> (i % 32)) & mask);
		}
		return str;
	}
	
	function binl2hex(binarray){
		var hex_tab = hexcase ? "0123456789ABCDEF" : "0123456789abcdef";
		var str = "";
		for(var i = 0; i < binarray.length * 4; i++) {
			str += hex_tab.charAt((binarray[i>>2] >> ((i%4)*8+4)) & 0xF) + hex_tab.charAt((binarray[i>>2] >> ((i%4)*8  )) & 0xF);
		}
		return str;
	}
	return (raw ? binl2str(core_md5(str2binl(s), s.length * chrsz)) : binl2hex(core_md5(str2binl(s), s.length * chrsz))	);
};
/** ************************************************************
	Ext.ux.TinyMCE v0.8.7
	ExtJS form field containing TinyMCE v3.4.x.

	Author: Andrew Mayorov et al.
	http://blogs.byte-force.com/xor

	Copyright (c)2008-2011 BYTE-force
	www.byte-force.com

	License: LGPLv2.1 or later
*/

(function() {

	Ext.namespace("Ext.ux");

	var tmceInitialized = false;

	// Lazy references to classes. To be filled in the initTinyMCE method.
	var WindowManager;
	var ControlManager;
	// Create a new Windows Group for the dialogs
	/*var windowGroup = new Ext.WindowGroup();
	windowGroup.zseed = 12000;*/


	/** ----------------------------------------------------------
	Ext.ux.TinyMCE
	*/
	Ext.ux.TinyMCE = Ext.extend( Ext.form.Field, {

		// TinyMCE Settings specified for this instance of the editor.
		tinymceSettings: null,

		// Validation properties
		allowBlank: true,
		invalidText: _("The value in this field is invalid"),
		invalidClass: "invalid-content-body",
		minLengthText : _('The minimum length for this field is {0}'),
		maxLengthText : _('The maximum length for this field is {0}'),
		blankText : _('This field is required'),

		// HTML markup for this field
		hideMode: 'offsets',

		/** ----------------------------------------------------------
		*/
		constructor: function(cfg) {

			var config = {
				tinymceSettings: {
					accessibility_focus: false
				}
			};

			Ext.apply(config, cfg);

			// Add events
			this.addEvents({
				"editorcreated": true
			});

			Ext.ux.TinyMCE.superclass.constructor.call(this, config);
		},

		/** ----------------------------------------------------------
		*/
		initComponent: function() {
			this.tinymceSettings = this.tinymceSettings || {};
			Ext.ux.TinyMCE.initTinyMCE({ language: this.tinymceSettings.language });
		},

		/** ----------------------------------------------------------
		*/
		initEvents: function() {
			this.originalValue = this.getValue();
		},
	
		/** ----------------------------------------------------------
		*/
		onRender: function(ct, position) {
			Ext.ux.TinyMCE.superclass.onRender.call(this, ct, position);
			
			// Fix size if it was specified in config
			if (Ext.type(this.width) == "number") {
				this.tinymceSettings.width = this.width;
			}
			if (Ext.type(this.height) == "number") {
				this.tinymceSettings.height = this.height;
			}

			//this.el.dom.style.border = '0 none';
			this.el.dom.setAttribute('tabIndex', -1);
			this.el.addClass('x-hidden');

			// Wrap textarea into DIV
			this.textareaEl = this.el;
			var wrapElStyle = { overflow: "hidden" };
			if( Ext.isIE ) { // fix IE 1px bogus margin
				wrapElStyle["margin-top"] = "-1px";
				wrapElStyle["margin-bottom"] = "-1px";
			}
			this.wrapEl = this.el.wrap({ style: wrapElStyle });
			this.actionMode = "wrapEl"; // Set action element to the new wrapper
			this.positionEl = this.wrapEl;
	
			var id = this.getId();

			// Create TinyMCE editor.
			this.ed = new tinymce.Editor(id, this.tinymceSettings);

			// Disable ctrl-f shortcut
		 	this.ed.addShortcut("ctrl+f","","");

			// Validate value onKeyPress
			var validateContentTask = new Ext.util.DelayedTask( this.validate, this );
			this.ed.onKeyPress.add(function(ed, controlManager) {
				validateContentTask.delay( 250 );
			} .createDelegate(this));

			// Set up editor events' handlers
			this.ed.onBeforeRenderUI.add(function(ed, controlManager) {
				// Replace control manager
				ed.controlManager = new ControlManager(this, ed);
			} .createDelegate(this));

			this.ed.onPostRender.add(function(ed, controlManager) {
				var s = ed.settings;

				// Modify markup.
				var tbar = Ext.get(Ext.DomQuery.selectNode("#" + this.ed.id + "_tbl td.mceToolbar"));
				if( tbar != null ) {
					// If toolbar is present
					var tbars = tbar.select("table.mceToolbar");
					Ext.DomHelper
						.append( tbar,
							{ tag: "div", cls: "_tbar-wrap", style: { overflow: "hidden"} }
							, true )
						.appendChild(tbars);
				}

				// Change window manager
				ed.windowManager = new WindowManager({
					control: this,
					editor: this.ed,
					manager: this.manager
				});
				// Patch css-style for validation body like ExtJS
				Ext.get(ed.getContentAreaContainer()).addClass('patch-content-body');

				// Event of focused body
				Ext.Element.fly(s.content_editable ? ed.getBody() : ed.getWin())
					.on("focus", this.onFocus, this);

				// Event of blur body
				// TODO: This does not work on IE. Is it important to have the hasFocus set to false?
				//Ext.Element.fly(s.content_editable ? ed.getBody() : ed.getWin())
				//	.on("blur", this.onBlur, this,
				//		this.inEditor && Ext.isWindows && Ext.isGecko ? { buffer: 10 } : null
				//	);

			} .createDelegate(this));

			// Wire events
			var fireChangeEvent = function(ed, level) {
				this.fireEvent("change", this, level.content);
			} .createDelegate(this)

			this.ed.onChange.add( fireChangeEvent );
			this.ed.onUndo.add( fireChangeEvent );
			this.ed.onRedo.add( fireChangeEvent );

			this.ed.onKeyDown.add(function(ed, e) {
				this.fireEvent("keydown", this, Ext.EventObject );
			} .createDelegate(this));

			this.ed.onKeyUp.add(function(ed, e) {
				this.fireEvent("keyup", this, Ext.EventObject );
			} .createDelegate(this));

			this.ed.onKeyPress.add(function(ed, e) {
				this.fireEvent("keypress", this, Ext.EventObject );
			} .createDelegate(this));

			// Render the editor
			this.ed.render();

			// Fix editor size when control will be visible
			(function fixEditorSize() {

				// If element is not visible yet, wait.
				if( !this.isVisible() ) {
					arguments.callee.defer( 50, this );
					return;
				}

				var size = this.getSize();
				this.withEd( function() {
					this._setEditorSize( size.width, size.height );

					// Indicate that editor is created
					this.fireEvent("editorcreated", this);
				});
			}).call( this );
		},

		/** ----------------------------------------------------------
		*/
		getResizeEl: function() {
			return this.wrapEl;
		},

		/** ----------------------------------------------------------
		* Returns the name attribute of the field if available
		* @return {String} name The field name
		*/
		getName: function() {
			return this.rendered && this.textareaEl.dom.name
				? this.textareaEl.dom.name : (this.name || '');
		},

		/** ----------------------------------------------------------
		*/
		initValue: function() {
			if (!this.rendered)
				Ext.ux.TinyMCE.superclass.initValue.call(this);
			else {
				if (this.value !== undefined) {
					this.setValue(this.value);
				}
				else {
					var v = this.textareaEl.value;
					if ( v )
						this.setValue( v );
				}
			}
		},

		/** ----------------------------------------------------------
		*/
		beforeDestroy: function() {
			// Remove textarea before the editor to avoid exception during ed.remove()
			if( this.wrapEl )
				this.wrapEl.remove();

			if( this.ed ) {
				this.ed.remove();
			}
			if( this.wrapEl ) Ext.destroy( this.wrapEl );
			Ext.ux.TinyMCE.superclass.beforeDestroy.call( this );
		},

		/** ----------------------------------------------------------
		*/
		getRawValue : function(){

			if( !this.rendered || !this.ed.initialized )
				return Ext.value( this.value, '' );

			var v = this.ed.getContent();
			if(v === this.emptyText){
				v = '';
			}
			return v;
		},

		/** ----------------------------------------------------------
		*/
		getValue: function() {

			if( !this.rendered || !this.ed.initialized )
				return Ext.value( this.value, '' );

			var v = this.ed.getContent();
			if( v === this.emptyText || v === undefined ){
				v = '';
			}
			return v;
		},

		/** ----------------------------------------------------------
		*/
		setRawValue: function(v) {
			this.value = v;
			if (this.rendered)
				this.withEd(function() {
					this.ed.undoManager.clear();
					this.ed.setContent(v === null || v === undefined ? '' : v);
					this.ed.startContent = this.ed.getContent({ format: 'raw' });
				});
		},

		/** ----------------------------------------------------------
		*/
		setValue: function(v) {
            if (this.value !== v) {
			    this.value = v;
		    	if (this.rendered) {
			    	this.withEd(function() {
					    this.ed.undoManager.clear();
				    	this.ed.setContent(v === null || v === undefined ? '' : v);
				    	this.ed.startContent = this.ed.getContent({ format: 'raw' });
				    	this.validate();
				    });
                }
            }
		},

		insertAtCursor: function(v) {
			// Call tiny MCE insert content function
		   this.ed.execCommand('mceInsertContent', false, v);
           this.ed.undoManager.clear();
		},

		/** ----------------------------------------------------------
		*/
		isDirty: function() {
			if (this.disabled || !this.rendered) {
				return false;
			}
			return this.ed && this.ed.initialized && this.ed.isDirty();
		},

		/** ----------------------------------------------------------
		*/
		syncValue: function() {
			if (this.rendered && this.ed.initialized)
				this.ed.save();
		},

		/** ----------------------------------------------------------
		*/
		getEd: function() {
			return this.ed;
		},

		/** ----------------------------------------------------------
		*/
		disable: function() {
			this.withEd(function() {
				var bodyEl = this.ed.getBody();
				bodyEl = Ext.get(bodyEl);

				if (bodyEl.hasClass('mceContentBody')) {
					bodyEl.removeClass('mceContentBody');
					bodyEl.addClass('mceNonEditable');
				}
			});
			Ext.ux.TinyMCE.superclass.disable.call( this );
		},

		/** ----------------------------------------------------------
		*/
		enable: function() {
			this.withEd(function() {
				var bodyEl = this.ed.getBody();
				bodyEl = Ext.get(bodyEl);

				if (bodyEl.hasClass('mceNonEditable')) {
					bodyEl.removeClass('mceNonEditable');
					bodyEl.addClass('mceContentBody');
				}
			});
			Ext.ux.TinyMCE.superclass.enable.call( this );
		},

		/** ----------------------------------------------------------
		*/
		onResize: function(aw, ah) {
			if( Ext.type( aw ) != "number" ){
				aw = this.getWidth();
			}
			if( Ext.type(ah) != "number" ){
				ah = this.getHeight();
			}
			if (aw == 0 || ah == 0)
				return;

			if( this.rendered && this.isVisible() ) {
				this.withEd(function() { this._setEditorSize( aw, ah ); });
			}
		},

		/** ----------------------------------------------------------
			Sets control size to the given width and height
		*/
		_setEditorSize: function( width, height ) {

			// We currently support only advanced theme resize
			if( !this.ed.theme.AdvancedTheme ) return;

			// Minimal width and height for advanced theme
			if( width < 100 ) width = 100;
			if( height < 129 ) height = 129;

			// Set toolbar div width
			var edTable = Ext.get(this.ed.id + "_tbl"),
				edIframe = Ext.get(this.ed.id + "_ifr"),
				edToolbar = edTable.child( "._tbar-wrap" );

			var toolbarWidth = width;
			if( edTable )
				toolbarWidth = width - edTable.getFrameWidth( "lr" );

			var toolbarHeight = 0;
			if( edToolbar ) {
				toolbarHeight = edToolbar.getHeight();
				var toolbarTd = edToolbar.findParent( "td", 5, true );
				toolbarHeight += toolbarTd.getFrameWidth( "tb" );
				edToolbar.setWidth( toolbarWidth );
			}

			var edStatusbarTd = edTable.child( ".mceStatusbar" );
			var statusbarHeight = 0;
			if( edStatusbarTd ) {
				statusbarHeight += edStatusbarTd.getHeight();
			}

			var iframeHeight = height - toolbarHeight - statusbarHeight;
			var iframeTd = edIframe.findParent( "td", 5, true );
			if( iframeTd )
				iframeHeight -= iframeTd.getFrameWidth( "tb" );

			// Resize iframe and container
			edTable.setSize( width, height );
			edIframe.setSize( toolbarWidth, iframeHeight );
		},

		/** ----------------------------------------------------------
		*/
		focus: function(selectText, delay) {
			if (delay) {
				this.focus.defer(typeof delay == 'number' ? delay : 10, this, [selectText, false]);
				return;
			}

			this.withEd(function() {
				this.ed.focus();
				/*if (selectText === true) {
				// TODO: Select editor's content
				}*/
			});

			return this;
		},

		/** ----------------------------------------------------------
		*/
		processValue : function( value ){
			return Ext.util.Format.stripTags( value );
		},

		/** ----------------------------------------------------------
		*/
		validateValue: function( value ) {
			if(Ext.isFunction(this.validator)){
				var msg = this.validator(value);
				if(msg !== true){
					this.markInvalid(msg);
					return false;
				}
			}
			if(value.length < 1 || value === this.emptyText){ // if it's blank
				 if(this.allowBlank){
					 this.clearInvalid();
					 return true;
				 }else{
					 this.markInvalid(this.blankText);
					 return false;
				 }
			}
			if(value.length < this.minLength){
				this.markInvalid(String.format(this.minLengthText, this.minLength));
				return false;
			}
			if(value.length > this.maxLength){
				this.markInvalid(String.format(this.maxLengthText, this.maxLength));
				return false;
			}
			if(this.vtype){
				var vt = Ext.form.VTypes;
				if(!vt[this.vtype](value, this)){
					this.markInvalid(this.vtypeText || vt[this.vtype +'Text']);
					return false;
				}
			}
			if(this.regex && !this.regex.test(value)){
				this.markInvalid(this.regexText);
				return false;
			}
			return true;
		},

		/** ----------------------------------------------------------
		If ed (local editor instance) is already initilized, calls
		specified function directly. Otherwise - adds it to ed.onInit event.
		*/
		withEd: function(func) {

			// If editor is not created yet, reschedule this call.
			if (!this.ed) this.on(
				"editorcreated",
				function() { this.withEd(func); },
				this);

			// Else if editor is created and initialized
			else if (this.ed.initialized) func.call(this);

			// Else if editor is created but not initialized yet.
			else this.ed.onInit.add(function() { func.defer(10, this); } .createDelegate(this));
		},

		/** ----------------------------------------------------------
			internal
			Unbind blur and focus events coming from DOM node. Used while opening aux windows.
		*/
		_unbindBlurAndFocus: function() {
			//this.onBlur = Ext.emptyFn;
			/*this.mun( this.el, 'focus' );
			this.mun( this.el, 'blur' );*/
			Ext.util.Observable.capture( this, function() { return false; } );
		},

		/** ----------------------------------------------------------
			internal
			Bind blur and focus events coming from DOM. Used to return back normal blur and focus opearaions.
			Code is copied from initEvents method.
		*/
		_bindBlurAndFocus: function() {
			this.ed.focus();
			Ext.util.Observable.releaseCapture( this );

			/*this.mon(this.el, 'focus', this.onFocus, this);

			// standardise buffer across all browsers + OS-es for consistent event order.
			// (the 10ms buffer for Editors fixes a weird FF/Win editor issue when changing OS window focus)
			this.mon(this.el, 'blur', this.onBlur, this, this.inEditor ? {buffer:10} : null);*/
		}
	});

	// Add static members
	Ext.apply(Ext.ux.TinyMCE, {

		/**
		Static field with all the plugins that should be loaded by TinyMCE.
		Should be set before first component would be created.
		@static
		*/
		tinymcePlugins: "pagebreak,style,layer,table,advhr,advimage,advlink,emotions,iespell,insertdatetime,preview,media,searchreplace,print,contextmenu,paste,directionality,noneditable,visualchars,nonbreaking,xhtmlxtras,template",

		/** ----------------------------------------------------------
			Inits TinyMCE and other necessary dependencies.
		*/
		initTinyMCE: function(settings) {
			if (!tmceInitialized) {

				// Create lazy classes
				/** ----------------------------------------------------------
				WindowManager
				*/
				WindowManager = Ext.extend( tinymce.WindowManager, {

					// Reference to ExtJS control Ext.ux.TinyMCE.
					control: null,

					/** ----------------------------------------------------------
						Config parameters:
						control - reference to Ext.ux.TinyMCE control
						editor - reference to TinyMCE intstance.
						mangager - WindowGroup to use for the popup window. Could be empty.
					*/
					constructor: function( cfg ) {
						WindowManager.superclass.constructor.call(this, cfg.editor);

						// Set reference to host control
						this.control = cfg.control;

						// Set window group
						this.manager = cfg.manager;
					},

					/** ----------------------------------------------------------
					*/
					alert: function(txt, cb, s) {
						Ext.MessageBox.alert("", this.editor.getLang(txt,txt), function() {
							if (!Ext.isEmpty(cb)) {
								cb.call(this);
							}
						}, s);
					},

					/** ----------------------------------------------------------
					*/
					confirm: function(txt, cb, s) {
						Ext.MessageBox.confirm("", this.editor.getLang(txt,txt), function(btn) {
							if (!Ext.isEmpty(cb)) {
								cb.call(this, btn == "yes");
							}
						}, s);
					},

					/** ----------------------------------------------------------
					*/
					open: function(s, p) {

						this.control._unbindBlurAndFocus();

						s = s || {};
						p = p || {};

						if (!s.type)
							this.bookmark = this.editor.selection.getBookmark('simple');

						s.width = parseInt(s.width || 320);
						s.height = parseInt(s.height || 240) + (tinymce.isIE ? 8 : 0);
						s.min_width = parseInt(s.min_width || 150);
						s.min_height = parseInt(s.min_height || 100);
						s.max_width = parseInt(s.max_width || 2000);
						s.max_height = parseInt(s.max_height || 2000);
						s.movable = true;
						s.resizable = true;
						p.mce_width = s.width;
						p.mce_height = s.height;
						p.mce_inline = true;

						this.features = s;
						this.params = p;

						var win = new Ext.Window(
						{
							title: s.name,
							width: s.width,
							height: s.height,
							minWidth: s.min_width,
							minHeight: s.min_height,
							resizable: true,
							maximizable: s.maximizable,
							minimizable: s.minimizable,
							modal: true,
							stateful: false,
							constrain: true,
							manager: this.manager,
							layout: "fit",
							items: [
								new Ext.BoxComponent({
									autoEl: {
										tag: 'iframe',
										src: s.url || s.file
									},
									style : 'border-width: 0px;'
								})
							],
							listeners: {
								beforeclose: function() {
									this.control._bindBlurAndFocus();
								},
								scope: this
							}
						});

						p.mce_window_id = win.getId();

						win.show(null,
							function() {
								if (s.left && s.top)
									win.setPagePosition(s.left, s.top);
								var pos = win.getPosition();
								s.left = pos[0];
								s.top = pos[1];
								this.onOpen.dispatch(this, s, p);
							},
							this
						);

						return win;
					},

					/** ----------------------------------------------------------
					*/
					close: function(win) {

						// Probably not inline
						if (!win.tinyMCEPopup || !win.tinyMCEPopup.id) {
							WindowManager.superclass.close.call(this, win);
							return;
						}

						var w = Ext.getCmp(win.tinyMCEPopup.id);
						if (w) {
							this.onClose.dispatch(this);
							w.close();
						}
					},

					/** ----------------------------------------------------------
					*/
					setTitle: function(win, ti) {

						// Probably not inline
						if (!win.tinyMCEPopup || !win.tinyMCEPopup.id) {
							WindowManager.superclass.setTitle.call(this, win, ti);
							return;
						}

						var w = Ext.getCmp(win.tinyMCEPopup.id);
						if (w) w.setTitle(ti);
					},

					/** ----------------------------------------------------------
					*/
					resizeBy: function(dw, dh, id) {

						var w = Ext.getCmp(id);
						if (w) {
							var size = w.getSize();
							w.setSize(size.width + dw, size.height + dh);
						}
					},

					/** ----------------------------------------------------------
					*/
					focus: function(id) {
						var w = Ext.getCmp(id);
						if (w) w.setActive(true);
					}

				});

				/** ----------------------------------------------------------
				ControlManager
				*/
				ControlManager = Ext.extend( tinymce.ControlManager, {

					// Reference to ExtJS control Ext.ux.TinyMCE.
					control: null,

					/** ----------------------------------------------------------
					*/
					constructor: function(control, ed, s) {
						this.control = control;
						ControlManager.superclass.constructor.call(this, ed, s);
					},

					/** ----------------------------------------------------------
					*/
					createDropMenu: function(id, s) {
						// Call base method
						var res = ControlManager.superclass.createDropMenu.call(this, id, s);
						// Modify returned result
						var orig = res.showMenu;
						res.showMenu = function(x, y, px) {
							orig.call(this, x, y, px);
							Ext.fly('menu_' + this.id).setStyle("z-index", 200001);
						};

						return res;
					},

					/** ----------------------------------------------------------
					*/
					createColorSplitButton: function(id, s) {
						// Call base method
						var res = ControlManager.superclass.createColorSplitButton.call(this, id, s);

						// Modify returned result
						var orig = res.showMenu;
						res.showMenu = function(x, y, px) {
							orig.call(this, x, y, px);
							Ext.fly(this.id + '_menu').setStyle("z-index", 200001);
						};

						return res;
					}
				});

				// Init TinyMCE
				var s = {
					mode: "none",
					plugins: Ext.ux.TinyMCE.tinymcePlugins,
					theme: "advanced"
				};
				Ext.apply(s, settings);

				if (!tinymce.dom.Event.domLoaded)
					tinymce.dom.Event._pageInit();

				tinyMCE.init(s);
				tmceInitialized = true;
			}
		}
	});

	Ext.ComponentMgr.registerType("tinymce", Ext.ux.TinyMCE);

})();// XRegExp 1.5.0
// (c) 2007-2010 Steven Levithan
// MIT License
// <http://xregexp.com>
// Provides an augmented, extensible, cross-browser implementation of regular expressions,
// including support for additional syntax, flags, and methods

var XRegExp;

if (XRegExp) {
    // Avoid running twice, since that would break references to native globals
    throw Error("can't load XRegExp twice in the same frame");
}

// Run within an anonymous function to protect variables and avoid new globals
(function () {

    //---------------------------------
    //  Constructor
    //---------------------------------

    // Accepts a pattern and flags; returns a new, extended `RegExp` object. Differs from a native
    // regular expression in that additional syntax and flags are supported and cross-browser
    // syntax inconsistencies are ameliorated. `XRegExp(/regex/)` clones an existing regex and
    // converts to type XRegExp
    XRegExp = function (pattern, flags) {
        var output = [],
            currScope = XRegExp.OUTSIDE_CLASS,
            pos = 0,
            context, tokenResult, match, chr, regex;

        if (XRegExp.isRegExp(pattern)) {
            if (flags !== undefined)
                throw TypeError("can't supply flags when constructing one RegExp from another");
            return clone(pattern);
        }
        // Tokens become part of the regex construction process, so protect against infinite
        // recursion when an XRegExp is constructed within a token handler or trigger
        if (isInsideConstructor)
            throw Error("can't call the XRegExp constructor within token definition functions");

        flags = flags || "";
        context = { // `this` object for custom tokens
            hasNamedCapture: false,
            captureNames: [],
            hasFlag: function (flag) {return flags.indexOf(flag) > -1;},
            setFlag: function (flag) {flags += flag;}
        };

        while (pos < pattern.length) {
            // Check for custom tokens at the current position
            tokenResult = runTokens(pattern, pos, currScope, context);

            if (tokenResult) {
                output.push(tokenResult.output);
                pos += (tokenResult.match[0].length || 1);
            } else {
                // Check for native multicharacter metasequences (excluding character classes) at
                // the current position
                if (match = real.exec.call(nativeTokens[currScope], pattern.slice(pos))) {
                    output.push(match[0]);
                    pos += match[0].length;
                } else {
                    chr = pattern.charAt(pos);
                    if (chr === "[")
                        currScope = XRegExp.INSIDE_CLASS;
                    else if (chr === "]")
                        currScope = XRegExp.OUTSIDE_CLASS;
                    // Advance position one character
                    output.push(chr);
                    pos++;
                }
            }
        }

        regex = RegExp(output.join(""), real.replace.call(flags, flagClip, ""));
        regex._xregexp = {
            source: pattern,
            captureNames: context.hasNamedCapture ? context.captureNames : null
        };
        return regex;
    };


    //---------------------------------
    //  Public properties
    //---------------------------------

    XRegExp.version = "1.5.0";

    // Token scope bitflags
    XRegExp.INSIDE_CLASS = 1;
    XRegExp.OUTSIDE_CLASS = 2;


    //---------------------------------
    //  Private variables
    //---------------------------------

    var replacementToken = /\$(?:(\d\d?|[$&`'])|{([$\w]+)})/g,
        flagClip = /[^gimy]+|([\s\S])(?=[\s\S]*\1)/g, // Nonnative and duplicate flags
        quantifier = /^(?:[?*+]|{\d+(?:,\d*)?})\??/,
        isInsideConstructor = false,
        tokens = [],
        // Copy native globals for reference ("native" is an ES3 reserved keyword)
        real = {
            exec: RegExp.prototype.exec,
            test: RegExp.prototype.test,
            match: String.prototype.match,
            replace: String.prototype.replace,
            split: String.prototype.split
        },
        compliantExecNpcg = real.exec.call(/()??/, "")[1] === undefined, // check `exec` handling of nonparticipating capturing groups
        compliantLastIndexIncrement = function () {
            var x = /^/g;
            real.test.call(x, "");
            return !x.lastIndex;
        }(),
        compliantLastIndexReset = function () {
            var x = /x/g;
            real.replace.call("x", x, "");
            return !x.lastIndex;
        }(),
        hasNativeY = RegExp.prototype.sticky !== undefined,
        nativeTokens = {};

    // `nativeTokens` match native multicharacter metasequences only (including deprecated octals,
    // excluding character classes)
    nativeTokens[XRegExp.INSIDE_CLASS] = /^(?:\\(?:[0-3][0-7]{0,2}|[4-7][0-7]?|x[\dA-Fa-f]{2}|u[\dA-Fa-f]{4}|c[A-Za-z]|[\s\S]))/;
    nativeTokens[XRegExp.OUTSIDE_CLASS] = /^(?:\\(?:0(?:[0-3][0-7]{0,2}|[4-7][0-7]?)?|[1-9]\d*|x[\dA-Fa-f]{2}|u[\dA-Fa-f]{4}|c[A-Za-z]|[\s\S])|\(\?[:=!]|[?*+]\?|{\d+(?:,\d*)?}\??)/;


    //---------------------------------
    //  Public methods
    //---------------------------------

    // Lets you extend or change XRegExp syntax and create custom flags. This is used internally by
    // the XRegExp library and can be used to create XRegExp plugins. This function is intended for
    // users with advanced knowledge of JavaScript's regular expression syntax and behavior. It can
    // be disabled by `XRegExp.freezeTokens`
    XRegExp.addToken = function (regex, handler, scope, trigger) {
        tokens.push({
            pattern: clone(regex, "g" + (hasNativeY ? "y" : "")),
            handler: handler,
            scope: scope || XRegExp.OUTSIDE_CLASS,
            trigger: trigger || null
        });
    };

    // Accepts a pattern and flags; returns an extended `RegExp` object. If the pattern and flag
    // combination has previously been cached, the cached copy is returned; otherwise the newly
    // created regex is cached
    XRegExp.cache = function (pattern, flags) {
        var key = pattern + "/" + (flags || "");
        return XRegExp.cache[key] || (XRegExp.cache[key] = XRegExp(pattern, flags));
    };

    // Accepts a `RegExp` instance; returns a copy with the `/g` flag set. The copy has a fresh
    // `lastIndex` (set to zero). If you want to copy a regex without forcing the `global`
    // property, use `XRegExp(regex)`. Do not use `RegExp(regex)` because it will not preserve
    // special properties required for named capture
    XRegExp.copyAsGlobal = function (regex) {
        return clone(regex, "g");
    };

    // Accepts a string; returns the string with regex metacharacters escaped. The returned string
    // can safely be used at any point within a regex to match the provided literal string. Escaped
    // characters are [ ] { } ( ) * + ? - . , \ ^ $ | # and whitespace
    XRegExp.escape = function (str) {
        return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    };

    // Accepts a string to search, regex to search with, position to start the search within the
    // string (default: 0), and an optional Boolean indicating whether matches must start at-or-
    // after the position or at the specified position only. This function ignores the `lastIndex`
    // property of the provided regex
    XRegExp.execAt = function (str, regex, pos, anchored) {
        regex = clone(regex, "g" + ((anchored && hasNativeY) ? "y" : ""));
        regex.lastIndex = pos = pos || 0;
        var match = regex.exec(str);
        if (anchored)
            return (match && match.index === pos) ? match : null;
        else
            return match;
    };

    // Breaks the unrestorable link to XRegExp's private list of tokens, thereby preventing
    // syntax and flag changes. Should be run after XRegExp and any plugins are loaded
    XRegExp.freezeTokens = function () {
        XRegExp.addToken = function () {
            throw Error("can't run addToken after freezeTokens");
        };
    };

    // Accepts any value; returns a Boolean indicating whether the argument is a `RegExp` object.
    // Note that this is also `true` for regex literals and regexes created by the `XRegExp`
    // constructor. This works correctly for variables created in another frame, when `instanceof`
    // and `constructor` checks would fail to work as intended
    XRegExp.isRegExp = function (o) {
        return Object.prototype.toString.call(o) === "[object RegExp]";
    };

    // Executes `callback` once per match within `str`. Provides a simpler and cleaner way to
    // iterate over regex matches compared to the traditional approaches of subverting
    // `String.prototype.replace` or repeatedly calling `exec` within a `while` loop
    XRegExp.iterate = function (str, origRegex, callback, context) {
        var regex = clone(origRegex, "g"),
            i = -1, match;
        while (match = regex.exec(str)) {
            callback.call(context, match, ++i, str, regex);
            if (regex.lastIndex === match.index)
                regex.lastIndex++;
        }
        if (origRegex.global)
            origRegex.lastIndex = 0;
    };

    // Accepts a string and an array of regexes; returns the result of using each successive regex
    // to search within the matches of the previous regex. The array of regexes can also contain
    // objects with `regex` and `backref` properties, in which case the named or numbered back-
    // references specified are passed forward to the next regex or returned. E.g.:
    // var xregexpImgFileNames = XRegExp.matchChain(html, [
    //     {regex: /<img\b([^>]+)>/i, backref: 1}, // <img> tag attributes
    //     {regex: XRegExp('(?ix) \\s src=" (?<src> [^"]+ )'), backref: "src"}, // src attribute values
    //     {regex: XRegExp("^http://xregexp\\.com(/[^#?]+)", "i"), backref: 1}, // xregexp.com paths
    //     /[^\/]+$/ // filenames (strip directory paths)
    // ]);
    XRegExp.matchChain = function (str, chain) {
        return function recurseChain (values, level) {
            var item = chain[level].regex ? chain[level] : {regex: chain[level]},
                regex = clone(item.regex, "g"),
                matches = [], i;
            for (i = 0; i < values.length; i++) {
                XRegExp.iterate(values[i], regex, function (match) {
                    matches.push(item.backref ? (match[item.backref] || "") : match[0]);
                });
            }
            return ((level === chain.length - 1) || !matches.length) ?
                matches : recurseChain(matches, level + 1);
        }([str], 0);
    };


    //---------------------------------
    //  New RegExp prototype methods
    //---------------------------------

    // Accepts a context object and arguments array; returns the result of calling `exec` with the
    // first value in the arguments array. the context is ignored but is accepted for congruity
    // with `Function.prototype.apply`
    RegExp.prototype.apply = function (context, args) {
        return this.exec(args[0]);
    };

    // Accepts a context object and string; returns the result of calling `exec` with the provided
    // string. the context is ignored but is accepted for congruity with `Function.prototype.call`
    RegExp.prototype.call = function (context, str) {
        return this.exec(str);
    };


    //---------------------------------
    //  Overriden native methods
    //---------------------------------

    // Adds named capture support (with backreferences returned as `result.name`), and fixes two
    // cross-browser issues per ES3:
    // - Captured values for nonparticipating capturing groups should be returned as `undefined`,
    //   rather than the empty string.
    // - `lastIndex` should not be incremented after zero-length matches.
    RegExp.prototype.exec = function (str) {
        var match = real.exec.apply(this, arguments),
            name, r2;
        if (match) {
            // Fix browsers whose `exec` methods don't consistently return `undefined` for
            // nonparticipating capturing groups
            if (!compliantExecNpcg && match.length > 1 && indexOf(match, "") > -1) {
                r2 = RegExp(this.source, real.replace.call(getNativeFlags(this), "g", ""));
                // Using `str.slice(match.index)` rather than `match[0]` in case lookahead allowed
                // matching due to characters outside the match
                real.replace.call(str.slice(match.index), r2, function () {
                    for (var i = 1; i < arguments.length - 2; i++) {
                        if (arguments[i] === undefined)
                            match[i] = undefined;
                    }
                });
            }
            // Attach named capture properties
            if (this._xregexp && this._xregexp.captureNames) {
                for (var i = 1; i < match.length; i++) {
                    name = this._xregexp.captureNames[i - 1];
                    if (name)
                       match[name] = match[i];
                }
            }
            // Fix browsers that increment `lastIndex` after zero-length matches
            if (!compliantLastIndexIncrement && this.global && !match[0].length && (this.lastIndex > match.index))
                this.lastIndex--;
        }
        return match;
    };

    // Don't override `test` if it won't change anything
    if (!compliantLastIndexIncrement) {
        // Fix browser bug in native method
        RegExp.prototype.test = function (str) {
            // Use the native `exec` to skip some processing overhead, even though the overriden
            // `exec` would take care of the `lastIndex` fix
            var match = real.exec.call(this, str);
            // Fix browsers that increment `lastIndex` after zero-length matches
            if (match && this.global && !match[0].length && (this.lastIndex > match.index))
                this.lastIndex--;
            return !!match;
        };
    }

    // Adds named capture support and fixes browser bugs in native method
    String.prototype.match = function (regex) {
        if (!XRegExp.isRegExp(regex))
            regex = RegExp(regex); // Native `RegExp`
        if (regex.global) {
            var result = real.match.apply(this, arguments);
            regex.lastIndex = 0; // Fix IE bug
            return result;
        }
        return regex.exec(this); // Run the altered `exec`
    };

    // Adds support for `${n}` tokens for named and numbered backreferences in replacement text,
    // and provides named backreferences to replacement functions as `arguments[0].name`. Also
    // fixes cross-browser differences in replacement text syntax when performing a replacement
    // using a nonregex search value, and the value of replacement regexes' `lastIndex` property
    // during replacement iterations. Note that this doesn't support SpiderMonkey's proprietary
    // third (`flags`) parameter
    String.prototype.replace = function (search, replacement) {
        var isRegex = XRegExp.isRegExp(search),
            captureNames, result, str;

        // There are many combinations of search/replacement types/values and browser bugs that
        // preclude passing to native `replace`, so just keep this check relatively simple
        if (isRegex && typeof replacement.valueOf() === "string" && replacement.indexOf("${") === -1 && compliantLastIndexReset)
            return real.replace.apply(this, arguments);

        if (!isRegex)
            search = search + ""; // Type conversion
        else if (search._xregexp)
            captureNames = search._xregexp.captureNames; // Array or `null`

        if (typeof replacement === "function") {
            result = real.replace.call(this, search, function () {
                if (captureNames) {
                    // Change the `arguments[0]` string primitive to a String object which can store properties
                    arguments[0] = new String(arguments[0]);
                    // Store named backreferences on `arguments[0]`
                    for (var i = 0; i < captureNames.length; i++) {
                        if (captureNames[i])
                            arguments[0][captureNames[i]] = arguments[i + 1];
                    }
                }
                // Update `lastIndex` before calling `replacement`
                if (isRegex && search.global)
                    search.lastIndex = arguments[arguments.length - 2] + arguments[0].length;
                return replacement.apply(null, arguments);
            });
        } else {
            str = this + ""; // Type conversion, so `args[args.length - 1]` will be a string (given nonstring `this`)
            result = real.replace.call(str, search, function () {
                var args = arguments; // Keep this function's `arguments` available through closure
                return real.replace.call(replacement, replacementToken, function ($0, $1, $2) {
                    // Numbered backreference (without delimiters) or special variable
                    if ($1) {
                        switch ($1) {
                            case "$": return "$";
                            case "&": return args[0];
                            case "`": return args[args.length - 1].slice(0, args[args.length - 2]);
                            case "'": return args[args.length - 1].slice(args[args.length - 2] + args[0].length);
                            // Numbered backreference
                            default:
                                // What does "$10" mean?
                                // - Backreference 10, if 10 or more capturing groups exist
                                // - Backreference 1 followed by "0", if 1-9 capturing groups exist
                                // - Otherwise, it's the string "$10"
                                // Also note:
                                // - Backreferences cannot be more than two digits (enforced by `replacementToken`)
                                // - "$01" is equivalent to "$1" if a capturing group exists, otherwise it's the string "$01"
                                // - There is no "$0" token ("$&" is the entire match)
                                var literalNumbers = "";
                                $1 = +$1; // Type conversion; drop leading zero
                                if (!$1) // `$1` was "0" or "00"
                                    return $0;
                                while ($1 > args.length - 3) {
                                    literalNumbers = String.prototype.slice.call($1, -1) + literalNumbers;
                                    $1 = Math.floor($1 / 10); // Drop the last digit
                                }
                                return ($1 ? args[$1] || "" : "$") + literalNumbers;
                        }
                    // Named backreference or delimited numbered backreference
                    } else {
                        // What does "${n}" mean?
                        // - Backreference to numbered capture n. Two differences from "$n":
                        //   - n can be more than two digits
                        //   - Backreference 0 is allowed, and is the entire match
                        // - Backreference to named capture n, if it exists and is not a number overridden by numbered capture
                        // - Otherwise, it's the string "${n}"
                        var n = +$2; // Type conversion; drop leading zeros
                        if (n <= args.length - 3)
                            return args[n];
                        n = captureNames ? indexOf(captureNames, $2) : -1;
                        return n > -1 ? args[n + 1] : $0;
                    }
                });
            });
        }

        if (isRegex && search.global)
            search.lastIndex = 0; // Fix IE bug

        return result;
    };

    // A consistent cross-browser, ES3 compliant `split`
    String.prototype.split = function (s /* separator */, limit) {
        // If separator `s` is not a regex, use the native `split`
        if (!XRegExp.isRegExp(s))
            return real.split.apply(this, arguments);

        var str = this + "", // Type conversion
            output = [],
            lastLastIndex = 0,
            match, lastLength;

        // Behavior for `limit`: if it's...
        // - `undefined`: No limit
        // - `NaN` or zero: Return an empty array
        // - A positive number: Use `Math.floor(limit)`
        // - A negative number: No limit
        // - Other: Type-convert, then use the above rules
        if (limit === undefined || +limit < 0) {
            limit = Infinity;
        } else {
            limit = Math.floor(+limit);
            if (!limit)
                return [];
        }

        // This is required if not `s.global`, and it avoids needing to set `s.lastIndex` to zero
        // and restore it to its original value when we're done using the regex
        s = XRegExp.copyAsGlobal(s);

        while (match = s.exec(str)) { // Run the altered `exec` (required for `lastIndex` fix, etc.)
            if (s.lastIndex > lastLastIndex) {
                output.push(str.slice(lastLastIndex, match.index));

                if (match.length > 1 && match.index < str.length)
                    Array.prototype.push.apply(output, match.slice(1));

                lastLength = match[0].length;
                lastLastIndex = s.lastIndex;

                if (output.length >= limit)
                    break;
            }

            if (s.lastIndex === match.index)
                s.lastIndex++;
        }

        if (lastLastIndex === str.length) {
            if (!real.test.call(s, "") || lastLength)
                output.push("");
        } else {
            output.push(str.slice(lastLastIndex));
        }

        return output.length > limit ? output.slice(0, limit) : output;
    };


    //---------------------------------
    //  Private helper functions
    //---------------------------------

    // Supporting function for `XRegExp`, `XRegExp.copyAsGlobal`, etc. Returns a copy of a `RegExp`
    // instance with a fresh `lastIndex` (set to zero), preserving properties required for named
    // capture. Also allows adding new flags in the process of copying the regex
    function clone (regex, additionalFlags) {
        if (!XRegExp.isRegExp(regex))
            throw TypeError("type RegExp expected");
        var x = regex._xregexp;
        regex = XRegExp(regex.source, getNativeFlags(regex) + (additionalFlags || ""));
        if (x) {
            regex._xregexp = {
                source: x.source,
                captureNames: x.captureNames ? x.captureNames.slice(0) : null
            };
        }
        return regex;
    };

    function getNativeFlags (regex) {
        return (regex.global     ? "g" : "") +
               (regex.ignoreCase ? "i" : "") +
               (regex.multiline  ? "m" : "") +
               (regex.extended   ? "x" : "") + // Proposed for ES4; included in AS3
               (regex.sticky     ? "y" : "");
    };

    function runTokens (pattern, index, scope, context) {
        var i = tokens.length,
            result, match, t;
        // Protect against constructing XRegExps within token handler and trigger functions
        isInsideConstructor = true;
        // Must reset `isInsideConstructor`, even if a `trigger` or `handler` throws
        try {
            while (i--) { // Run in reverse order
                t = tokens[i];
                if ((scope & t.scope) && (!t.trigger || t.trigger.call(context))) {
                    t.pattern.lastIndex = index;
                    match = t.pattern.exec(pattern); // Running the altered `exec` here allows use of named backreferences, etc.
                    if (match && match.index === index) {
                        result = {
                            output: t.handler.call(context, match, scope),
                            match: match
                        };
                        break;
                    }
                }
            }
        } catch (err) {
            throw err;
        } finally {
            isInsideConstructor = false;
        }
        return result;
    };

    function indexOf (array, item, from) {
        if (Array.prototype.indexOf) // Use the native array method if available
            return array.indexOf(item, from);
        for (var i = from || 0; i < array.length; i++) {
            if (array[i] === item)
                return i;
        }
        return -1;
    };


    //---------------------------------
    //  Built-in tokens
    //---------------------------------

    // Augment XRegExp's regular expression syntax and flags. Note that when adding tokens, the
    // third (`scope`) argument defaults to `XRegExp.OUTSIDE_CLASS`

    // Comment pattern: (?# )
    XRegExp.addToken(
        /\(\?#[^)]*\)/,
        function (match) {
            // Keep tokens separated unless the following token is a quantifier
            return real.test.call(quantifier, match.input.slice(match.index + match[0].length)) ? "" : "(?:)";
        }
    );

    // Capturing group (match the opening parenthesis only).
    // Required for support of named capturing groups
    XRegExp.addToken(
        /\((?!\?)/,
        function () {
            this.captureNames.push(null);
            return "(";
        }
    );

    // Named capturing group (match the opening delimiter only): (?<name>
    XRegExp.addToken(
        /\(\?<([$\w]+)>/,
        function (match) {
            this.captureNames.push(match[1]);
            this.hasNamedCapture = true;
            return "(";
        }
    );

    // Named backreference: \k<name>
    XRegExp.addToken(
        /\\k<([\w$]+)>/,
        function (match) {
            var index = indexOf(this.captureNames, match[1]);
            // Keep backreferences separate from subsequent literal numbers. Preserve back-
            // references to named groups that are undefined at this point as literal strings
            return index > -1 ?
                "\\" + (index + 1) + (isNaN(match.input.charAt(match.index + match[0].length)) ? "" : "(?:)") :
                match[0];
        }
    );

    // Empty character class: [] or [^]
    XRegExp.addToken(
        /\[\^?]/,
        function (match) {
            // For cross-browser compatibility with ES3, convert [] to \b\B and [^] to [\s\S].
            // (?!) should work like \b\B, but is unreliable in Firefox
            return match[0] === "[]" ? "\\b\\B" : "[\\s\\S]";
        }
    );

    // Mode modifier at the start of the pattern only, with any combination of flags imsx: (?imsx)
    // Does not support x(?i), (?-i), (?i-m), (?i: ), (?i)(?m), etc.
    XRegExp.addToken(
        /^\(\?([imsx]+)\)/,
        function (match) {
            this.setFlag(match[1]);
            return "";
        }
    );

    // Whitespace and comments, in free-spacing (aka extended) mode only
    XRegExp.addToken(
        /(?:\s+|#.*)+/,
        function (match) {
            // Keep tokens separated unless the following token is a quantifier
            return real.test.call(quantifier, match.input.slice(match.index + match[0].length)) ? "" : "(?:)";
        },
        XRegExp.OUTSIDE_CLASS,
        function () {return this.hasFlag("x");}
    );

    // Dot, in dotall (aka singleline) mode only
    XRegExp.addToken(
        /\./,
        function () {return "[\\s\\S]";},
        XRegExp.OUTSIDE_CLASS,
        function () {return this.hasFlag("s");}
    );


    //---------------------------------
    //  Backward compatibility
    //---------------------------------

    // Uncomment the following block for compatibility with XRegExp 1.0-1.2:
    /*
    XRegExp.matchWithinChain = XRegExp.matchChain;
    RegExp.prototype.addFlags = function (s) {return clone(this, s);};
    RegExp.prototype.execAll = function (s) {var r = []; XRegExp.iterate(s, this, function (m) {r.push(m);}); return r;};
    RegExp.prototype.forEachExec = function (s, f, c) {return XRegExp.iterate(s, this, f, c);};
    RegExp.prototype.validate = function (s) {var r = RegExp("^(?:" + this.source + ")$(?!\\s)", getNativeFlags(this)); if (this.global) this.lastIndex = 0; return s.search(r) === 0;};
    */

})();

/*
 * #dependsFile client/third-party/xregexp/xregexp.js
 */

/*
XRegExp Unicode plugin base 0.5
(c) 2008-2010 Steven Levithan
MIT License
<http://xregexp.com>
Uses the Unicode 5.2 character database

The Unicode plugin base adds support for the \p{L} token only (Unicode category Letter). Plugin
packages are available that add support for the remaining Unicode categories, as well as Unicode
scripts and blocks.

All Unicode tokens can be inverted by using an uppercase P; e.g., \P{L} matches any character not
in Unicode's Letter category. Negated Unicode tokens are not supported within character classes.

Letter case, spaces, hyphens, and underscores are ignored when comparing Unicode token names.
*/

var XRegExp;

if (!XRegExp) {
    throw ReferenceError("XRegExp must be loaded before the Unicode plugin");
}

(function () {

    var unicode = {}; // protected storage for package tokens

    XRegExp.addUnicodePackage = function (pack) {
        var codePoint = /\w{4}/g,
            clip = /[- _]+/g,
            name, p;
        for (p in pack) {
            if (pack.hasOwnProperty(p)) {
                name = p.replace(clip, "").toLowerCase();
                // disallow overriding properties that have already been added
                if (!unicode.hasOwnProperty(name)) {
                    unicode[name] = pack[p].replace(codePoint, "\\u$&");
                }
            }
        }
    };

    XRegExp.addToken(
        /\\([pP]){(\^?)([^}]*)}/,
        function (match, scope) {
            var negated = (match[1] === "P" || match[2]),
                item = match[3].replace(/[- _]+/g, "").toLowerCase();

            // \p{}, \P{}, and \p{^} are valid, but the double negative \P{^} isn't
            if (match[1] === "P" && match[2])
                throw SyntaxError("erroneous characters: " + match[0]);
            if (negated && scope === XRegExp.INSIDE_CLASS)
                throw SyntaxError("not supported in character classes: \\" + match[1] + "{" + match[2] + "...}");
            if (!unicode.hasOwnProperty(item))
                throw SyntaxError("invalid or unsupported Unicode item: " + match[0]);

            return scope === XRegExp.OUTSIDE_CLASS ?
                "[" + (negated ? "^" : "") + unicode[item] + "]" :
                unicode[item];
        },
        XRegExp.INSIDE_CLASS | XRegExp.OUTSIDE_CLASS
    );

    XRegExp.addUnicodePackage({
        L: "0041-005A0061-007A00AA00B500BA00C0-00D600D8-00F600F8-02C102C6-02D102E0-02E402EC02EE0370-037403760377037A-037D03860388-038A038C038E-03A103A3-03F503F7-0481048A-05250531-055605590561-058705D0-05EA05F0-05F20621-064A066E066F0671-06D306D506E506E606EE06EF06FA-06FC06FF07100712-072F074D-07A507B107CA-07EA07F407F507FA0800-0815081A082408280904-0939093D09500958-0961097109720979-097F0985-098C098F09900993-09A809AA-09B009B209B6-09B909BD09CE09DC09DD09DF-09E109F009F10A05-0A0A0A0F0A100A13-0A280A2A-0A300A320A330A350A360A380A390A59-0A5C0A5E0A72-0A740A85-0A8D0A8F-0A910A93-0AA80AAA-0AB00AB20AB30AB5-0AB90ABD0AD00AE00AE10B05-0B0C0B0F0B100B13-0B280B2A-0B300B320B330B35-0B390B3D0B5C0B5D0B5F-0B610B710B830B85-0B8A0B8E-0B900B92-0B950B990B9A0B9C0B9E0B9F0BA30BA40BA8-0BAA0BAE-0BB90BD00C05-0C0C0C0E-0C100C12-0C280C2A-0C330C35-0C390C3D0C580C590C600C610C85-0C8C0C8E-0C900C92-0CA80CAA-0CB30CB5-0CB90CBD0CDE0CE00CE10D05-0D0C0D0E-0D100D12-0D280D2A-0D390D3D0D600D610D7A-0D7F0D85-0D960D9A-0DB10DB3-0DBB0DBD0DC0-0DC60E01-0E300E320E330E40-0E460E810E820E840E870E880E8A0E8D0E94-0E970E99-0E9F0EA1-0EA30EA50EA70EAA0EAB0EAD-0EB00EB20EB30EBD0EC0-0EC40EC60EDC0EDD0F000F40-0F470F49-0F6C0F88-0F8B1000-102A103F1050-1055105A-105D106110651066106E-10701075-1081108E10A0-10C510D0-10FA10FC1100-1248124A-124D1250-12561258125A-125D1260-1288128A-128D1290-12B012B2-12B512B8-12BE12C012C2-12C512C8-12D612D8-13101312-13151318-135A1380-138F13A0-13F41401-166C166F-167F1681-169A16A0-16EA1700-170C170E-17111720-17311740-17511760-176C176E-17701780-17B317D717DC1820-18771880-18A818AA18B0-18F51900-191C1950-196D1970-19741980-19AB19C1-19C71A00-1A161A20-1A541AA71B05-1B331B45-1B4B1B83-1BA01BAE1BAF1C00-1C231C4D-1C4F1C5A-1C7D1CE9-1CEC1CEE-1CF11D00-1DBF1E00-1F151F18-1F1D1F20-1F451F48-1F4D1F50-1F571F591F5B1F5D1F5F-1F7D1F80-1FB41FB6-1FBC1FBE1FC2-1FC41FC6-1FCC1FD0-1FD31FD6-1FDB1FE0-1FEC1FF2-1FF41FF6-1FFC2071207F2090-209421022107210A-211321152119-211D212421262128212A-212D212F-2139213C-213F2145-2149214E218321842C00-2C2E2C30-2C5E2C60-2CE42CEB-2CEE2D00-2D252D30-2D652D6F2D80-2D962DA0-2DA62DA8-2DAE2DB0-2DB62DB8-2DBE2DC0-2DC62DC8-2DCE2DD0-2DD62DD8-2DDE2E2F300530063031-3035303B303C3041-3096309D-309F30A1-30FA30FC-30FF3105-312D3131-318E31A0-31B731F0-31FF3400-4DB54E00-9FCBA000-A48CA4D0-A4FDA500-A60CA610-A61FA62AA62BA640-A65FA662-A66EA67F-A697A6A0-A6E5A717-A71FA722-A788A78BA78CA7FB-A801A803-A805A807-A80AA80C-A822A840-A873A882-A8B3A8F2-A8F7A8FBA90A-A925A930-A946A960-A97CA984-A9B2A9CFAA00-AA28AA40-AA42AA44-AA4BAA60-AA76AA7AAA80-AAAFAAB1AAB5AAB6AAB9-AABDAAC0AAC2AADB-AADDABC0-ABE2AC00-D7A3D7B0-D7C6D7CB-D7FBF900-FA2DFA30-FA6DFA70-FAD9FB00-FB06FB13-FB17FB1DFB1F-FB28FB2A-FB36FB38-FB3CFB3EFB40FB41FB43FB44FB46-FBB1FBD3-FD3DFD50-FD8FFD92-FDC7FDF0-FDFBFE70-FE74FE76-FEFCFF21-FF3AFF41-FF5AFF66-FFBEFFC2-FFC7FFCA-FFCFFFD2-FFD7FFDA-FFDC"
    });

})();

