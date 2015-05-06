(function() {
 	var orig_onClick = Ext.Button.prototype.onClick;

	Ext.override(Ext.Button, {
		/*
		 * Fix issue that when the Button is pressed the focus is not moved
		 * away from the current input field. This is an issue which exists
		 * on some browsers (at least Firefox), while other browsers (Chrome)
		 * are safe.
		 */
		onClick : function(e)
		{
			// Copy the original event, during focus() and blur() the
			// 'e' will be changed to the input element that is being
			// blurred. Hence we create a copy which we will pass to
			// the original function.
			var origEvent = new Ext.EventObjectImpl(e);
			this.focus();

			orig_onClick.call(this, origEvent);

			// Ensure that we have remove the focus again to prevent
			// the button from remaining blurred. Note that the event
			// handler for the button might have destroyed the button
			// (e.g. the Ok or cancel button in a dialog which closes
			// the dialog).
			if (!this.isDestroyed) {
				this.blur();
			}
		},

		/* Override default ext.js template, which uses tables for buttons.
		 * This way buttons are easier to handle, and the code is much cleaner and leaner.
		 * The scheme is <div><div><em><button>
		 * The two containers are needed because Ext.JS applies various classes for icons, etc.
		 * The em element is used for applying the arrow of split buttons, and for making buttons unselectable.
		 */
		template:new Ext.Template(
			'<div id="{4}" class="x-btn {3}"><div class="{1}">',
			'<em class="{2}" class="x-unselectable" unselectable="on"><button type="{0}"></button></em>',
			'</div></div>')
	});
})();
(function() {
	/**
	 * @class Ext.Component
	 * @extends Ext.util.Observable
	 * <p>Base class for all Ext components.  All subclasses of Component may participate in the automated
	 * Ext component lifecycle of creation, rendering and destruction which is provided by the {@link Ext.Container Container} class.
	 * Components may be added to a Container through the {@link Ext.Container#items items} config option at the time the Container is created,
	 * or they may be added dynamically via the {@link Ext.Container#add add} method.</p>
	 * <p>The Component base class has built-in support for basic hide/show and enable/disable behavior.</p>
	 * <p>All Components are registered with the {@link Ext.ComponentMgr} on construction so that they can be referenced at any time via
	 * {@link Ext#getCmp}, passing the {@link #id}.</p>
	 * <p>All user-developed visual widgets that are required to participate in automated lifecycle and size management should subclass Component (or
	 * {@link Ext.BoxComponent} if managed box model handling is required, ie height and width management).</p>
	 * <p>See the <a href="http://extjs.com/learn/Tutorial:Creating_new_UI_controls">Creating new UI controls</a> tutorial for details on how
	 * and to either extend or augment ExtJs base classes to create custom Components.</p>
	 * <p>Every component has a specific xtype, which is its Ext-specific type name, along with methods for checking the
	 * xtype like {@link #getXType} and {@link #isXType}. This is the list of all valid xtypes:</p>
	 * <pre>
	xtype            Class
	-------------    ------------------
	box              {@link Ext.BoxComponent}
	button           {@link Ext.Button}
	buttongroup      {@link Ext.ButtonGroup}
	colorpalette     {@link Ext.ColorPalette}
	component        {@link Ext.Component}
	container        {@link Ext.Container}
	cycle            {@link Ext.CycleButton}
	dataview         {@link Ext.DataView}
	datepicker       {@link Ext.DatePicker}
	editor           {@link Ext.Editor}
	editorgrid       {@link Ext.grid.EditorGridPanel}
	flash            {@link Ext.FlashComponent}
	grid             {@link Ext.grid.GridPanel}
	listview         {@link Ext.ListView}
	multislider      {@link Ext.slider.MultiSlider}
	panel            {@link Ext.Panel}
	progress         {@link Ext.ProgressBar}
	propertygrid     {@link Ext.grid.PropertyGrid}
	slider           {@link Ext.slider.SingleSlider}
	spacer           {@link Ext.Spacer}
	splitbutton      {@link Ext.SplitButton}
	tabpanel         {@link Ext.TabPanel}
	treepanel        {@link Ext.tree.TreePanel}
	viewport         {@link Ext.ViewPort}
	window           {@link Ext.Window}

	Toolbar components
	---------------------------------------
	paging           {@link Ext.PagingToolbar}
	toolbar          {@link Ext.Toolbar}
	tbbutton         {@link Ext.Toolbar.Button}        (deprecated; use button)
	tbfill           {@link Ext.Toolbar.Fill}
	tbitem           {@link Ext.Toolbar.Item}
	tbseparator      {@link Ext.Toolbar.Separator}
	tbspacer         {@link Ext.Toolbar.Spacer}
	tbsplit          {@link Ext.Toolbar.SplitButton}   (deprecated; use splitbutton)
	tbtext           {@link Ext.Toolbar.TextItem}

	Menu components
	---------------------------------------
	menu             {@link Ext.menu.Menu}
	colormenu        {@link Ext.menu.ColorMenu}
	datemenu         {@link Ext.menu.DateMenu}
	menubaseitem     {@link Ext.menu.BaseItem}
	menucheckitem    {@link Ext.menu.CheckItem}
	menuitem         {@link Ext.menu.Item}
	menuseparator    {@link Ext.menu.Separator}
	menutextitem     {@link Ext.menu.TextItem}

	Form components
	---------------------------------------
	form             {@link Ext.form.FormPanel}
	checkbox         {@link Ext.form.Checkbox}
	checkboxgroup    {@link Ext.form.CheckboxGroup}
	combo            {@link Ext.form.ComboBox}
	compositefield   {@link Ext.form.CompositeField}
	datefield        {@link Ext.form.DateField}
	displayfield     {@link Ext.form.DisplayField}
	field            {@link Ext.form.Field}
	fieldset         {@link Ext.form.FieldSet}
	hidden           {@link Ext.form.Hidden}
	htmleditor       {@link Ext.form.HtmlEditor}
	label            {@link Ext.form.Label}
	numberfield      {@link Ext.form.NumberField}
	radio            {@link Ext.form.Radio}
	radiogroup       {@link Ext.form.RadioGroup}
	textarea         {@link Ext.form.TextArea}
	textfield        {@link Ext.form.TextField}
	timefield        {@link Ext.form.TimeField}
	trigger          {@link Ext.form.TriggerField}

	Chart components
	---------------------------------------
	chart            {@link Ext.chart.Chart}
	barchart         {@link Ext.chart.BarChart}
	cartesianchart   {@link Ext.chart.CartesianChart}
	columnchart      {@link Ext.chart.ColumnChart}
	linechart        {@link Ext.chart.LineChart}
	piechart         {@link Ext.chart.PieChart}

	Store xtypes
	---------------------------------------
	arraystore       {@link Ext.data.ArrayStore}
	directstore      {@link Ext.data.DirectStore}
	groupingstore    {@link Ext.data.GroupingStore}
	jsonstore        {@link Ext.data.JsonStore}
	simplestore      {@link Ext.data.SimpleStore}      (deprecated; use arraystore)
	store            {@link Ext.data.Store}
	xmlstore         {@link Ext.data.XmlStore}
	</pre>
	* @constructor
	* @param {Ext.Element/String/Object} config The configuration options may be specified as either:
	* <div class="mdetail-params"><ul>
	* <li><b>an element</b> :
	* <p class="sub-desc">it is set as the internal element and its id used as the component id</p></li>
	* <li><b>a string</b> :
	* <p class="sub-desc">it is assumed to be the id of an existing element and is used as the component id</p></li>
	* <li><b>anything else</b> :
	* <p class="sub-desc">it is assumed to be a standard config object and is applied to the component</p></li>
	* </ul></div>
	*/
	var orig_initComponent = Ext.Component.prototype.initComponent;
	var orig_destroy = Ext.Component.prototype.destroy;
	Ext.override(Ext.Component, {
		// By default stateful is 'undefined' however a component
		// is stateful when this property !== false. Hence we have
		// to force-disable the statefulness of components.
		stateful : false,

		/**
		 * @cfg {Boolean} statefulRelativeDimensions True if the 'width' and 'height' of the {@link #field} must be
		 * converted to relative values before saving it to the settings. This will ensure the dimensions
		 * of the field will always depend on the current size of the {@link Ext#getBody body}.
		 * This option is only used when the {@link Zarafa.core.data.SettingsStateProvider SettingsStateProvider} is
		 * used in the {@link Ext.state.Manager}.
		 */
		statefulRelativeDimensions : true,

		/**
		 * @cfg {String} statefulName The unique name for this component by which the {@link #getState state}
		 * must be saved into the {@link Zarafa.settings.SettingsModel settings}.
		 * This option is only used when the {@link Zarafa.core.data.SettingsStateProvider SettingsStateProvider} is
		 * used in the {@link Ext.state.Manager}.
		 */
		statefulName : undefined,

		// Override to generate a stateId and register the Component to the Ext.state.Manager
		initComponent : function()
		{
			if (this.stateful !== false) {
				if (!this.stateId) {
					this.stateId = Ext.id(null, 'state-');
				}

				Ext.state.Manager.register(this);
			}

			orig_initComponent.apply(this, arguments);
		},

		/**
		 * Obtain the path in which the {@link #getState state} must be saved.
		 * This option is only used when the {@link Zarafa.core.data.SettingsStateProvider SettingsStateProvider} is
		 * used in the {@link Ext.state.Manager}. This returns {@link #statefulName} if provided, or else generates
		 * a custom name.
		 * @return {String} The unique name for this component by which the {@link #getState state} must be saved. 
		 */
		getStateName : function()
		{
			var name = this.statefulName;
			if (!name) {
				name = this.getXType().match(/(?:zarafa\.)?(.*)/)[1];
			}

			return name;
		},

		// Override the destroy function of the Ext.Component,
		// each component might have plugins installed on it.
		// Those plugins might be Ext.util.Observables and thus
		// need to be properly destroyed when the component is
		// destroyed. Otherwise references to the plugin will
		// remain and will still refer to the destroyed field.
		destroy : function()
		{
			if (this.plugins) {
				for (var key in this.plugins) {
					var plugin = this.plugins[key];
					if (plugin instanceof Ext.util.Observable) {
						plugin.purgeListeners();
					}
				}
			}

			if (this.stateful !== false) {
				Ext.state.Manager.unregister(this);
			}

			orig_destroy.apply(this, arguments);
		}
	});
})();
(function() {
	/*
	 * We must set the default value of the bufferResize property
	 * to something more appropriate to our needs.
	 */
	Ext.override(Ext.Container, {
		bufferResize : false
	});
})();
(function() {
	/**
	 * @class Ext.Element
	 * <p>Encapsulates a DOM element, adding simple DOM manipulation facilities, normalizing for browser differences.</p>
	 * <p>All instances of this class inherit the methods of {@link Ext.Fx} making visual effects easily available to all DOM elements.</p>
	 * <p>Note that the events documented in this class are not Ext events, they encapsulate browser events. To
	 * access the underlying browser event, see {@link Ext.EventObject#browserEvent}. Some older
	 * browsers may not support the full range of events. Which events are supported is beyond the control of ExtJs.</p>
	 * Usage:<br>
	<pre><code>
	// by id
	var el = Ext.get('my-div');

	// by DOM element reference
	var el = Ext.get(myDivElement);
	</code></pre>
	 * <b>Animations</b><br />
	 * <p>When an element is manipulated, by default there is no animation.</p>
	 * <pre><code>
	var el = Ext.get('my-div');

	// no animation
	el.setWidth(100);
	 * </code></pre>
	 * <p>Many of the functions for manipulating an element have an optional 'animate' parameter.  This
	 * parameter can be specified as boolean (<tt>true</tt>) for default animation effects.</p>
	 * <pre><code>
	// default animation
	el.setWidth(100, true);
	 * </code></pre>
	 *
	 * <p>To configure the effects, an object literal with animation options to use as the Element animation
	 * configuration object can also be specified. Note that the supported Element animation configuration
	 * options are a subset of the {@link Ext.Fx} animation options specific to Fx effects.  The supported
	 * Element animation configuration options are:</p>
	<pre>
	Option    Default   Description
	--------- --------  ---------------------------------------------
	{@link Ext.Fx#duration duration}  .35       The duration of the animation in seconds
	{@link Ext.Fx#easing easing}    easeOut   The easing method
	{@link Ext.Fx#callback callback}  none      A function to execute when the anim completes
	{@link Ext.Fx#scope scope}     this      The scope (this) of the callback function
	</pre>
	 *
	 * <pre><code>
	// Element animation options object
	var opt = {
		{@link Ext.Fx#duration duration}: 1,
		{@link Ext.Fx#easing easing}: 'elasticIn',
		{@link Ext.Fx#callback callback}: this.foo,
		{@link Ext.Fx#scope scope}: this
	};
	// animation with some options set
	el.setWidth(100, opt);
	 * </code></pre>
	 * <p>The Element animation object being used for the animation will be set on the options
	 * object as 'anim', which allows you to stop or manipulate the animation. Here is an example:</p>
	 * <pre><code>
	// using the 'anim' property to get the Anim object
	if(opt.anim.isAnimated()){
		opt.anim.stop();
	}
	 * </code></pre>
	 * <p>Also see the <tt>{@link #animate}</tt> method for another animation technique.</p>
	 * <p><b> Composite (Collections of) Elements</b></p>
	 * <p>For working with collections of Elements, see {@link Ext.CompositeElement}</p>
	 * @constructor Create a new Element directly.
	 * @param {String/HTMLElement} element
	 * @param {Boolean} forceNew (optional) By default the constructor checks to see if there is already an instance of this element in the cache and if there is it returns the same instance. This will skip that check (useful for extending this class).
	 */
	Ext.Element.addMethods({

		/**
		 * Test if size has a unit, otherwise appends the default
		 *
		 * FIX: Overridden Ext.Element to fix an issue that calling
		 * Element.addUnits(0/0) would return the string 'NaNpx'
		 * instead we return an empty string (which ExtJs already
		 * did when size was an empty string or undefined.
		 *
		 * @param {String} size The size where the units will be postfixed
		 * @return {String} The size plus the optional size unit postfixed
		 * @private
		 */
		addUnits : function(size)
		{
			if (Ext.isEmpty(size) || size == 'auto') {
				size = size || '';
			} else if (isNaN(size)) {
				size = '';
			} else if (!/\d+(px|em|%|en|ex|pt|in|cm|mm|pc)$/i.test(size)) {
				size = size + (this.defaultUnit || 'px');
			}

			return size;
		},

		/**
		 * Stops the specified event(s) from bubbling and optionally prevents the default action
		 * @param {String/Array} eventName an event / array of events to stop from bubbling
		 * @param {Boolean} preventDefault (optional) true to prevent the default action too
		 * @return {Ext.Element} this
		 * @override
		 */
		swallowEvent : function(eventName, preventDefault)
		{
			var me = this;
			var fn = (preventDefault === true) ? this.swallowEventHandlerPreventDefault : this.swallowEventHandler;

			if(Ext.isArray(eventName)){
				Ext.each(eventName, function(e) {
					me.on(e, fn, this);
				});
				return me;
			}
			me.on(eventName, fn, this);
			return me;
		},

		/**
		 * Event handler for {@link #swallowEvent} which is used
		 * to swallow a particular event. This will only call
		 * {@link Ext.EventObject#stopPropagation}. For preventing
		 * the {@link Ext.EventObject#preventDefault} then
		 * {@link #swallowEventHandlerPreventDefault} should be used instead.
		 * @param {Ext.EventObject} e The event object
		 * @private
		 */
		swallowEventHandler : function(e)
		{
			e.stopPropagation();
		},

		/**
		 * Event handler for {@link #swallowEvent} which is used
		 * to swallow a particular event. This will call
		 * {@link Ext.EventObject#stopPropagation} and
		 * {@link Ext.EventObject#preventDefault}. If the latter
		 * call is unwanted, the {@link #swallowEventHandler} should be
		 * used instead.
		 * @param {Ext.EventObject} e The event object
		 * @private
		 */
		swallowEventHandlerPreventDefault : function(e)
		{
			e.stopPropagation();
			e.preventDefault();
		},

		/**
		 * Opposite of {@link #swallowEvent}, this will re-enable the
		 * given event (or events).
		 * @param {String/Array} eventName an event / array of events to start bubbling
		 * @param {Boolean} preventDefault (optional) true if the default action was also prevented
		 * @return {Ext.Element} this
		 */
		spitOutEvent : function(eventName, preventDefault)
		{
			var me = this;
			var fn = (preventDefault === true) ? this.swallowEventHandlerPreventDefault : this.swallowEventHandler;
			if(Ext.isArray(eventName)){
				Ext.each(eventName, function(e) {
					me.un(e, fn, this);
				});
				return me;
			}
			me.un(eventName, fn, this);
			return me;
		},

		/**
		 * Opposite of {@link #unselectable}, enables text selection for this element (normalized across browsers)
		 * @return {Ext.Element} this
		 */
		selectable : function()
		{
			this.dom.unselectable = 'off';
			return this.spitOutEvent('selectstart', true).
					removeClass('x-unselectable');
		},

		/**
		 * Clear all CSS classes which were applied to the DOM tree
		 */
		clearClass : function()
		{
			this.dom.className = '';
		}
	});
})();
/*
 * Overriden because IE9 throws a 'permission denied' exception when trying to compare a missing element (e.g. an iframe) from the 'specialElCache'
 * The element has been removed, but is prevented from being garbage collected
 * That's why a try/catch was added on line 45 so that the entire function would not fail on such occasion
 */
(function(){
	/**
	 * @class Ext.EventManager
	 * Registers event handlers that want to receive a normalized EventObject instead of the standard browser event and provides
	 * several useful events directly.
	 * See {@link Ext.EventObject} for more details on normalized event objects.
	 * @singleton
	 */
	Ext.apply(Ext.EventManager, function(){
		var docReadyEvent,
		docReadyProcId,
		docReadyState = false,
		DETECT_NATIVE = Ext.isGecko || Ext.isWebKit || Ext.isSafari,
		E = Ext.lib.Event,
		D = Ext.lib.Dom,
		DOC = document,
		WINDOW = window,
		DOMCONTENTLOADED = "DOMContentLoaded",
		COMPLETE = 'complete',
		propRe = /^(?:scope|delay|buffer|single|stopEvent|preventDefault|stopPropagation|normalized|args|delegate)$/,
		/*
		 * This cache is used to hold special js objects, the document and window, that don't have an id. We need to keep
		 * a reference to them so we can look them up at a later point.
		 */
		specialElCache = [];

		function getId(el){
			var id = false,
				i = 0,
				len = specialElCache.length,
				skip = false,
				o;
				
			if (el) {
				if (el.getElementById || el.navigator) {
					// look up the id
					for(; i < len; ++i){
						o = specialElCache[i];
						//entire override because of this try - otherwise IE9 chokes on missing elements
						try{
							if(o.el === el){
								id = o.id;
								break;
							}
						} catch(e){}
					}
					if(!id){
						// for browsers that support it, ensure that give the el the same id
						id = Ext.id(el);
						specialElCache.push({
							id: id,
							el: el
						});
						skip = true;
					}
				}else{
					id = Ext.id(el);
				}
				if(!Ext.elCache[id]){
					Ext.Element.addToCache(new Ext.Element(el), id);
					if(skip){
						Ext.elCache[id].skipGC = true;
					}
				}
			}
			return id;
		 }

		/// There is some jquery work around stuff here that isn't needed in Ext Core.
		function addListener(el, ename, fn, task, wrap, scope){
			el = Ext.getDom(el);
			var id = getId(el),
				es = Ext.elCache[id].events,
				wfn;

			wfn = E.on(el, ename, wrap);
			es[ename] = es[ename] || [];

			/* 0 = Original Function,
			   1 = Event Manager Wrapped Function,
			   2 = Scope,
			   3 = Adapter Wrapped Function,
			   4 = Buffered Task
			*/
			es[ename].push([fn, wrap, scope, wfn, task]);

			// this is a workaround for jQuery and should somehow be removed from Ext Core in the future
			// without breaking ExtJS.

			// workaround for jQuery
			if(el.addEventListener && ename == "mousewheel"){
				var args = ["DOMMouseScroll", wrap, false];
				el.addEventListener.apply(el, args);
				Ext.EventManager.addListener(WINDOW, 'unload', function(){
					el.removeEventListener.apply(el, args);
				});
			}

			// fix stopped mousedowns on the document
			if(el == DOC && ename == "mousedown"){
				Ext.EventManager.stoppedMouseDownEvent.addListener(wrap);
			}
		}

		function doScrollChk(){
			/* Notes:
				 'doScroll' will NOT work in a IFRAME/FRAMESET.
				 The method succeeds but, a DOM query done immediately after -- FAILS.
			  */
			if(window != top){
				return false;
			}

			try{
				DOC.documentElement.doScroll('left');
			}catch(e){
				 return false;
			}

			fireDocReady();
			return true;
		}
		/**
		 * @return {Boolean} True if the document is in a 'complete' state (or was determined to
		 * be true by other means). If false, the state is evaluated again until canceled.
		 */
		function checkReadyState(e){

			if(Ext.isIE && doScrollChk()){
				return true;
			}
			if(DOC.readyState == COMPLETE){
				fireDocReady();
				return true;
			}
			docReadyState || (docReadyProcId = setTimeout(arguments.callee, 2));
			return false;
		}

		var styles;
		function checkStyleSheets(e){
			styles || (styles = Ext.query('style, link[rel=stylesheet]'));
			if(styles.length == DOC.styleSheets.length){
				fireDocReady();
				return true;
			}
			docReadyState || (docReadyProcId = setTimeout(arguments.callee, 2));
			return false;
		}

		function OperaDOMContentLoaded(e){
			DOC.removeEventListener(DOMCONTENTLOADED, arguments.callee, false);
			checkStyleSheets();
		}

		function fireDocReady(e){
			if(!docReadyState){
				docReadyState = true; //only attempt listener removal once

				if(docReadyProcId){
					clearTimeout(docReadyProcId);
				}
				if(DETECT_NATIVE) {
					DOC.removeEventListener(DOMCONTENTLOADED, fireDocReady, false);
				}
				if(Ext.isIE && checkReadyState.bindIE){  //was this was actually set ??
					DOC.detachEvent('onreadystatechange', checkReadyState);
				}
				E.un(WINDOW, "load", arguments.callee);
			}
			if(docReadyEvent && !Ext.isReady){
				Ext.isReady = true;
				docReadyEvent.fire();
				docReadyEvent.listeners = [];
			}

		}

		function initDocReady(){
			docReadyEvent || (docReadyEvent = new Ext.util.Event());
			if (DETECT_NATIVE) {
				DOC.addEventListener(DOMCONTENTLOADED, fireDocReady, false);
			}
			/*
			 * Handle additional (exceptional) detection strategies here
			 */
			if (Ext.isIE){
				//Use readystatechange as a backup AND primary detection mechanism for a FRAME/IFRAME
				//See if page is already loaded
				if(!checkReadyState()){
					checkReadyState.bindIE = true;
					DOC.attachEvent('onreadystatechange', checkReadyState);
				}

			}else if(Ext.isOpera ){
				/* Notes:
				   Opera needs special treatment needed here because CSS rules are NOT QUITE
				   available after DOMContentLoaded is raised.
				*/

				//See if page is already loaded and all styleSheets are in place
				(DOC.readyState == COMPLETE && checkStyleSheets()) ||
					DOC.addEventListener(DOMCONTENTLOADED, OperaDOMContentLoaded, false);

			}else if (Ext.isWebKit){
				//Fallback for older Webkits without DOMCONTENTLOADED support
				checkReadyState();
			}
			// no matter what, make sure it fires on load
			E.on(WINDOW, "load", fireDocReady);
		}

		function createTargeted(h, o){
			return function(){
				var args = Ext.toArray(arguments);
				if(o.target == Ext.EventObject.setEvent(args[0]).target){
					h.apply(this, args);
				}
			};
		}

		function createBuffered(h, o, task){
			return function(e){
				// create new event object impl so new events don't wipe out properties
				task.delay(o.buffer, h, null, [new Ext.EventObjectImpl(e)]);
			};
		}

		function createSingle(h, el, ename, fn, scope){
			return function(e){
				Ext.EventManager.removeListener(el, ename, fn, scope);
				h(e);
			};
		}

		function createDelayed(h, o, fn){
			return function(e){
				var task = new Ext.util.DelayedTask(h);
				if(!fn.tasks) {
					fn.tasks = [];
				}
				fn.tasks.push(task);
				task.delay(o.delay || 10, h, null, [new Ext.EventObjectImpl(e)]);
			};
		}

		function listen(element, ename, opt, fn, scope){
			var o = (!opt || typeof opt == "boolean") ? {} : opt,
				el = Ext.getDom(element), task;

			fn = fn || o.fn;
			scope = scope || o.scope;

			if(!el){
				throw "Error listening for \"" + ename + '\". Element "' + element + '" doesn\'t exist.';
			}
			function h(e){
				// prevent errors while unload occurring
				if(!Ext){// !window[xname]){  ==> can't we do this?
					return;
				}
				e = Ext.EventObject.setEvent(e);
				var t;
				if (o.delegate) {
					if(!(t = e.getTarget(o.delegate, el))){
						return;
					}
				} else {
					t = e.target;
				}
				if (o.stopEvent) {
					e.stopEvent();
				}
				if (o.preventDefault) {
				   e.preventDefault();
				}
				if (o.stopPropagation) {
					e.stopPropagation();
				}
				if (o.normalized === false) {
					e = e.browserEvent;
				}

				fn.call(scope || el, e, t, o);
			}
			if(o.target){
				h = createTargeted(h, o);
			}
			if(o.delay){
				h = createDelayed(h, o, fn);
			}
			if(o.single){
				h = createSingle(h, el, ename, fn, scope);
			}
			if(o.buffer){
				task = new Ext.util.DelayedTask(h);
				h = createBuffered(h, o, task);
			}

			addListener(el, ename, fn, task, h, scope);
			return h;
		}
		
		var pub = {
			/**
			 * Appends an event handler to an element.  The shorthand version {@link #on} is equivalent.  Typically you will
			 * use {@link Ext.Element#addListener} directly on an Element in favor of calling this version.
			 * @param {String/HTMLElement} el The html element or id to assign the event handler to.
			 * @param {String} eventName The name of the event to listen for.
			 * @param {Function} handler The handler function the event invokes. This function is passed
			 * the following parameters:<ul>
			 * <li>evt : EventObject<div class="sub-desc">The {@link Ext.EventObject EventObject} describing the event.</div></li>
			 * <li>t : Element<div class="sub-desc">The {@link Ext.Element Element} which was the target of the event.
			 * Note that this may be filtered by using the <tt>delegate</tt> option.</div></li>
			 * <li>o : Object<div class="sub-desc">The options object from the addListener call.</div></li>
			 * </ul>
			 * @param {Object} scope (optional) The scope (<b><code>this</code></b> reference) in which the handler function is executed. <b>Defaults to the Element</b>.
			 * @param {Object} options (optional) An object containing handler configuration properties.
			 * This may contain any of the following properties:<ul>
			 * <li>scope : Object<div class="sub-desc">The scope (<b><code>this</code></b> reference) in which the handler function is executed. <b>Defaults to the Element</b>.</div></li>
			 * <li>delegate : String<div class="sub-desc">A simple selector to filter the target or look for a descendant of the target</div></li>
			 * <li>stopEvent : Boolean<div class="sub-desc">True to stop the event. That is stop propagation, and prevent the default action.</div></li>
			 * <li>preventDefault : Boolean<div class="sub-desc">True to prevent the default action</div></li>
			 * <li>stopPropagation : Boolean<div class="sub-desc">True to prevent event propagation</div></li>
			 * <li>normalized : Boolean<div class="sub-desc">False to pass a browser event to the handler function instead of an Ext.EventObject</div></li>
			 * <li>delay : Number<div class="sub-desc">The number of milliseconds to delay the invocation of the handler after te event fires.</div></li>
			 * <li>single : Boolean<div class="sub-desc">True to add a handler to handle just the next firing of the event, and then remove itself.</div></li>
			 * <li>buffer : Number<div class="sub-desc">Causes the handler to be scheduled to run in an {@link Ext.util.DelayedTask} delayed
			 * by the specified number of milliseconds. If the event fires again within that time, the original
			 * handler is <em>not</em> invoked, but the new handler is scheduled in its place.</div></li>
			 * <li>target : Element<div class="sub-desc">Only call the handler if the event was fired on the target Element, <i>not</i> if the event was bubbled up from a child node.</div></li>
			 * </ul><br>
			 * <p>See {@link Ext.Element#addListener} for examples of how to use these options.</p>
			 */
			addListener : function(element, eventName, fn, scope, options){
				if(typeof eventName == 'object'){
					var o = eventName, e, val;
					for(e in o){
						val = o[e];
						if(!propRe.test(e)){
							if(Ext.isFunction(val)){
								// shared options
								listen(element, e, o, val, o.scope);
							}else{
								// individual options
								listen(element, e, val);
							}
						}
					}
				} else {
					listen(element, eventName, options, fn, scope);
				}
			},
			/**
			 * Removes an event handler from an element.  The shorthand version {@link #un} is equivalent.  Typically
			 * you will use {@link Ext.Element#removeListener} directly on an Element in favor of calling this version.
			 * @param {String/HTMLElement} el The id or html element from which to remove the listener.
			 * @param {String} eventName The name of the event.
			 * @param {Function} fn The handler function to remove. <b>This must be a reference to the function passed into the {@link #addListener} call.</b>
			 * @param {Object} scope If a scope (<b><code>this</code></b> reference) was specified when the listener was added,
			 * then this must refer to the same object.
			 */
			removeListener : function(el, eventName, fn, scope){
				el = Ext.getDom(el);
				var id = getId(el),
					f = el && (Ext.elCache[id].events)[eventName] || [],
					wrap, i, l, k, len, fnc;

				for (i = 0, len = f.length; i < len; i++) {

					/* 0 = Original Function,
					   1 = Event Manager Wrapped Function,
					   2 = Scope,
					   3 = Adapter Wrapped Function,
					   4 = Buffered Task
					*/
					if (Ext.isArray(fnc = f[i]) && fnc[0] == fn && (!scope || fnc[2] == scope)) {
						if(fnc[4]) {
							fnc[4].cancel();
						}
						k = fn.tasks && fn.tasks.length;
						if(k) {
							while(k--) {
								fn.tasks[k].cancel();
							}
							delete fn.tasks;
						}
						wrap = fnc[1];
						E.un(el, eventName, E.extAdapter ? fnc[3] : wrap);

						// jQuery workaround that should be removed from Ext Core
						if(wrap && el.addEventListener && eventName == "mousewheel"){
							el.removeEventListener("DOMMouseScroll", wrap, false);
						}

						// fix stopped mousedowns on the document
						if(wrap && el == DOC && eventName == "mousedown"){
							Ext.EventManager.stoppedMouseDownEvent.removeListener(wrap);
						}

						f.splice(i, 1);
						if (f.length === 0) {
							delete Ext.elCache[id].events[eventName];
						}
						for (k in Ext.elCache[id].events) {
							return false;
						}
						Ext.elCache[id].events = {};
						return false;
					}
				}
			},

			/**
			 * Removes all event handers from an element.  Typically you will use {@link Ext.Element#removeAllListeners}
			 * directly on an Element in favor of calling this version.
			 * @param {String/HTMLElement} el The id or html element from which to remove all event handlers.
			 */
			removeAll : function(el){
				el = Ext.getDom(el);
				var id = getId(el),
					ec = Ext.elCache[id] || {},
					es = ec.events || {},
					f, i, len, ename, fn, k, wrap;

				for(ename in es){
					if(es.hasOwnProperty(ename)){
						f = es[ename];
						/* 0 = Original Function,
						   1 = Event Manager Wrapped Function,
						   2 = Scope,
						   3 = Adapter Wrapped Function,
						   4 = Buffered Task
						*/
						for (i = 0, len = f.length; i < len; i++) {
							fn = f[i];
							if(fn[4]) {
								fn[4].cancel();
							}
							if(fn[0].tasks && (k = fn[0].tasks.length)) {
								while(k--) {
									fn[0].tasks[k].cancel();
								}
								delete fn.tasks;
							}
							wrap =  fn[1];
							E.un(el, ename, E.extAdapter ? fn[3] : wrap);

							// jQuery workaround that should be removed from Ext Core
							if(el.addEventListener && wrap && ename == "mousewheel"){
								el.removeEventListener("DOMMouseScroll", wrap, false);
							}

							// fix stopped mousedowns on the document
							if(wrap && el == DOC &&  ename == "mousedown"){
								Ext.EventManager.stoppedMouseDownEvent.removeListener(wrap);
							}
						}
					}
				}
				if (Ext.elCache[id]) {
					Ext.elCache[id].events = {};
				}
			},

			getListeners : function(el, eventName) {
				el = Ext.getDom(el);
				var id = getId(el),
					ec = Ext.elCache[id] || {},
					es = ec.events || {},
					results = [];
				if (es && es[eventName]) {
					return es[eventName];
				} else {
					return null;
				}
			},

			purgeElement : function(el, recurse, eventName) {
				el = Ext.getDom(el);
				var id = getId(el),
					ec = Ext.elCache[id] || {},
					es = ec.events || {},
					i, f, len;
				if (eventName) {
					if (es && es.hasOwnProperty(eventName)) {
						f = es[eventName];
						for (i = 0, len = f.length; i < len; i++) {
							Ext.EventManager.removeListener(el, eventName, f[i][0]);
						}
					}
				} else {
					Ext.EventManager.removeAll(el);
				}
				if (recurse && el && el.childNodes) {
					for (i = 0, len = el.childNodes.length; i < len; i++) {
						Ext.EventManager.purgeElement(el.childNodes[i], recurse, eventName);
					}
				}
			},
					_unload : function() {
			var el;
			for (el in Ext.elCache) {
				Ext.EventManager.removeAll(el);
			}
			delete Ext.elCache;
			delete Ext.Element._flyweights;

			// Abort any outstanding Ajax requests
			var c,
				conn,
				tid,
				ajax = Ext.lib.Ajax;
			(typeof ajax.conn == 'object') ? conn = ajax.conn : conn = {};
			for (tid in conn) {
				c = conn[tid];
				if (c) {
					ajax.abort({conn: c, tId: tid});
				}
			}
		},
		/**
		 * Adds a listener to be notified when the document is ready (before onload and before images are loaded). Can be
		 * accessed shorthanded as Ext.onReady().
		 * @param {Function} fn The method the event invokes.
		 * @param {Object} scope (optional) The scope (<code>this</code> reference) in which the handler function executes. Defaults to the browser window.
		 * @param {boolean} options (optional) Options object as passed to {@link Ext.Element#addListener}. It is recommended that the options
		 * <code>{single: true}</code> be used so that the handler is removed on first invocation.
		 */
		onDocumentReady : function(fn, scope, options){
			if (Ext.isReady) { // if it already fired or document.body is present
				docReadyEvent || (docReadyEvent = new Ext.util.Event());
				docReadyEvent.addListener(fn, scope, options);
				docReadyEvent.fire();
				docReadyEvent.listeners = [];
			} else {
				if (!docReadyEvent) {
					initDocReady();
				}
				options = options || {};
				options.delay = options.delay || 1;
				docReadyEvent.addListener(fn, scope, options);
			}
		},

		/**
		 * Forces a document ready state transition for the framework.  Used when Ext is loaded
		 * into a DOM structure AFTER initial page load (Google API or other dynamic load scenario.
		 * Any pending 'onDocumentReady' handlers will be fired (if not already handled).
		 */
		fireDocReady : fireDocReady
		};
		pub.on = pub.addListener;
		pub.un = pub.removeListener;
		pub.stoppedMouseDownEvent = new Ext.util.Event();
		
		return pub;
	}());
})();
(function() {
	/*
	 * Extend the EventObjectImp with additional keycodes.
	 */
	Ext.apply(Ext.EventObjectImpl.prototype, {
		SEMI_COLON : 186,
		EQUAL_SIGN : 187,
		COMMA : 188,
		DASH : 189,
		PERIOD : 190,
		FORWARD_SLASH : 191,
		OPEN_BRACKET : 219,
		BACK_SLASH : 220,
		CLOSE_BRACKET : 221,
		SINGLE_QUOTE : 222
	});
})();
(function() {
/**
 * @class Ext.Fx
 * <p>A class to provide basic animation and visual effects support.  <b>Note:</b> This class is automatically applied
 * to the {@link Ext.Element} interface when included, so all effects calls should be performed via {@link Ext.Element}.
 * Conversely, since the effects are not actually defined in {@link Ext.Element}, Ext.Fx <b>must</b> be
 * {@link Ext#enableFx included} in order for the Element effects to work.</p><br/>
 * 
 * <p><b><u>Method Chaining</u></b></p>
 * <p>It is important to note that although the Fx methods and many non-Fx Element methods support "method chaining" in that
 * they return the Element object itself as the method return value, it is not always possible to mix the two in a single
 * method chain.  The Fx methods use an internal effects queue so that each effect can be properly timed and sequenced.
 * Non-Fx methods, on the other hand, have no such internal queueing and will always execute immediately.  For this reason,
 * while it may be possible to mix certain Fx and non-Fx method calls in a single chain, it may not always provide the
 * expected results and should be done with care.  Also see <tt>{@link #callback}</tt>.</p><br/>
 *
 * <p><b><u>Anchor Options for Motion Effects</u></b></p>
 * <p>Motion effects support 8-way anchoring, meaning that you can choose one of 8 different anchor points on the Element
 * that will serve as either the start or end point of the animation.  Following are all of the supported anchor positions:</p>
<pre>
Value  Description
-----  -----------------------------
tl     The top left corner
t      The center of the top edge
tr     The top right corner
l      The center of the left edge
r      The center of the right edge
bl     The bottom left corner
b      The center of the bottom edge
br     The bottom right corner
</pre>
 * <b>Note</b>: some Fx methods accept specific custom config parameters.  The options shown in the Config Options
 * section below are common options that can be passed to any Fx method unless otherwise noted.</b>
 * 
 * @cfg {Function} callback A function called when the effect is finished.  Note that effects are queued internally by the
 * Fx class, so a callback is not required to specify another effect -- effects can simply be chained together
 * and called in sequence (see note for <b><u>Method Chaining</u></b> above), for example:<pre><code>
 * el.slideIn().highlight();
 * </code></pre>
 * The callback is intended for any additional code that should run once a particular effect has completed. The Element
 * being operated upon is passed as the first parameter.
 * 
 * @cfg {Object} scope The scope (<code>this</code> reference) in which the <tt>{@link #callback}</tt> function is executed. Defaults to the browser window.
 * 
 * @cfg {String} easing A valid Ext.lib.Easing value for the effect:</p><div class="mdetail-params"><ul>
 * <li><b><tt>backBoth</tt></b></li>
 * <li><b><tt>backIn</tt></b></li>
 * <li><b><tt>backOut</tt></b></li>
 * <li><b><tt>bounceBoth</tt></b></li>
 * <li><b><tt>bounceIn</tt></b></li>
 * <li><b><tt>bounceOut</tt></b></li>
 * <li><b><tt>easeBoth</tt></b></li>
 * <li><b><tt>easeBothStrong</tt></b></li>
 * <li><b><tt>easeIn</tt></b></li>
 * <li><b><tt>easeInStrong</tt></b></li>
 * <li><b><tt>easeNone</tt></b></li>
 * <li><b><tt>easeOut</tt></b></li>
 * <li><b><tt>easeOutStrong</tt></b></li>
 * <li><b><tt>elasticBoth</tt></b></li>
 * <li><b><tt>elasticIn</tt></b></li>
 * <li><b><tt>elasticOut</tt></b></li>
 * </ul></div>
 *
 * @cfg {String} afterCls A css class to apply after the effect
 * @cfg {Number} duration The length of time (in seconds) that the effect should last
 * 
 * @cfg {Number} endOpacity Only applicable for {@link #fadeIn} or {@link #fadeOut}, a number between
 * <tt>0</tt> and <tt>1</tt> inclusive to configure the ending opacity value.
 *  
 * @cfg {Boolean} remove Whether the Element should be removed from the DOM and destroyed after the effect finishes
 * @cfg {Boolean} useDisplay Whether to use the <i>display</i> CSS property instead of <i>visibility</i> when hiding Elements (only applies to 
 * effects that end with the element being visually hidden, ignored otherwise)
 * @cfg {String/Object/Function} afterStyle A style specification string, e.g. <tt>"width:100px"</tt>, or an object
 * in the form <tt>{width:"100px"}</tt>, or a function which returns such a specification that will be applied to the
 * Element after the effect finishes.
 * @cfg {Boolean} block Whether the effect should block other effects from queueing while it runs
 * @cfg {Boolean} concurrent Whether to allow subsequently-queued effects to run at the same time as the current effect, or to ensure that they run in sequence
 * @cfg {Boolean} stopFx Whether preceding effects should be stopped and removed before running current effect (only applies to non blocking effects)
 */
	Ext.apply(Ext.Fx, {
		/**
		 * Move element outside its wrap
		 * Overridden in order to check for the existence of parentNode before accessing it
		 * IE9 was failing at this point when the container had been destroyed
		 * 
		 * @private
		 * @override
		 */
		fxUnwrap : function(wrap, pos, o) {
			var dom = this.dom;
			Ext.fly(dom).clearPositioning();
			Ext.fly(dom).setPositioning(pos);
			if(!o.wrap){
				var pn = Ext.fly(wrap).dom.parentNode;
				if (pn) {
					pn.insertBefore(dom, wrap); 
					Ext.fly(wrap).remove();
				}
			}
		}
	});
	
	Ext.Element.addMethods(Ext.Fx);
})();
(function() {
	var orig_register = Ext.QuickTip.prototype.register;
	var orig_getTipCfg = Ext.QuickTip.prototype.getTipCfg;

	/**
	 * @class Ext.QuickTip
	 * This will encode the content of tooltip to prevent the HTML injection.
	 * @singleton
	 */
	Ext.override(Ext.QuickTip, {
		/**
		 * Here it will encode title and text of tooltip when component is initialized time.
		 * It is used to prevent HTML Injection.
		 * 
		 * @param {Object} config Configuration object
		 */
		register : function(config)
		{
			config.title = Ext.util.Format.htmlEncode(config.title);
			config.text = Ext.util.Format.htmlEncode(config.text);
			orig_register.apply(this, arguments);
		},

		/**
		 * Here it will encode tooltip's text when hover the cursor on component.
		 * It is used to prevent HTML Injection.
		 * 
		 * @param {Ext.EventObject} e The mouse event object
		 * @return {String} The encoded text of tooltip.
		 */
		getTipCfg: function(e)
		{
			return Ext.util.Format.htmlEncode(orig_getTipCfg.apply(this, arguments));
		}
	});
})();(function() {
 	var orig_doAutoWidth = Ext.Tip.prototype.doAutoWidth;

	Ext.override(Ext.Tip, {
		/*
		 * Fix an issue where IE9 & IE10 & IE11 breaks words and wraps it to new line
		 * because of wrong calculation of text width
		 * Maybe this is caused when we request an element's dimension via offsetWidth or offsetHeight, getBoundingClientRect, etc.
		 * the browser returns the subpixel width rounded to the nearest pixel.
		 */
		doAutoWidth : function()
		{
			orig_doAutoWidth.call(this, Ext.isIE ? 1 : 0);
		}
	});
})();(function() {
	/**
	 * Override Ext.Toolbar.TextItem to make the text unselectable.
	 */
	var orig_onRender = Ext.Toolbar.TextItem.prototype.onRender;
	Ext.override(Ext.Toolbar.TextItem, {

		onRender : function(ct, position)
		{
			orig_onRender.apply(this, arguments);

			if (this.el) {
				this.el.unselectable();
			}
		}

	});
})();
(function() {
	/*
	 * Fix the Ext.data.Node, when child nodes have been added or removed, the 'leaf'
	 * property must be updated. Otherwise the expand button will never be actually
	 * updated when adding or removing child nodes.
	 */
	var orig_appendChild = Ext.data.Node.prototype.appendChild;
	var orig_removeChild = Ext.data.Node.prototype.removeChild;

	Ext.override(Ext.data.Node, {
		appendChild : function(node)
		{
			this.leaf = false;
			return orig_appendChild.apply(this, arguments);
		},

		removeChild : function(node, destroy)
		{
			var ret = orig_removeChild.apply(this, arguments);
			if (!this.hasChildNodes()) {
				this.leaf = true;
			}
			return ret;
		}
	});
})();
(function() {

 	// Convert a string to a Integer
	//
	// Opposite to the Extjs implementation, this won't apply the
	// Ext.data.Types.stripRe regular expression, which means that
	// the protocol will demand that when the field is declared as
	// "Int" it _must_ be an integer and not a string like "$14,00"
	// or "15%".
 	var intConvert = function(v) {
		return v !== undefined && v !== null && v !== '' ?
		       parseInt(v, 10) : (this.useNull ? null : 0);
	};

	Ext.data.Types.INT.convert = intConvert;
	Ext.data.Types.INTEGER.convert = intConvert;

 	// Convert a string to a Float
	//
	// Opposite to the Extjs implementation, this won't apply the
	// Ext.data.Types.stripRe regular expression, which means that
	// the protocol will demand that when the field is declared as
	// "Float" it _must_ be an number and not a string like "$14,00"
	// or "15%".
 	var floatConvert = function(v) {
		return v !== undefined && v !== null && v !== '' ?
		       parseFloat(v, 10) : (this.useNull ? null : 0);
	};

	Ext.data.Types.FLOAT.convert = floatConvert;
	Ext.data.Types.NUMBER.convert = floatConvert;
})();
Ext.override(Ext.dd.DD, {
	/**
	 * When set to true, the utility automatically tries to scroll the browser
	 * window when a drag and drop element is dragged near the viewport boundary.
	 * Defaults to false. Overriden because in webapp we will never need to drag anything out of window.
	 * @property scroll
	 * @type boolean
	 */
	scroll : false
});(function() {
	/**
	 * @class Ext.dd.DragDropMgr
	 * DragDropMgr is a singleton that tracks the element interaction for
	 * all DragDrop items in the window.  Generally, you will not call
	 * this class directly, but it does have helper methods that could
	 * be useful in your DragDrop implementations.
	 * @singleton
	 */
	var orig_getLocation = Ext.dd.DragDropMgr.getLocation;

	Ext.apply(Ext.dd.DragDropMgr, {

		/**
		 * Returns the DragDrop instance for a given id which belongs to
		 * the given group (as configured in the {@link Ext.dd.DragSource}.
		 * @method getGroupDDById
		 * @param {String} group the {@link Ext.dd.DragSource#ddGroup ddGroup}
		 * for which the id is searched for.
		 * @param {String} id the id of the DragDrop object
		 * @return {DragDrop} the drag drop object, null if it is not found
		 * @static
		 */
		getGroupDDById : function(group, id)
		{
			if (this.ids[group] && this.ids[group][id]) {
				return this.ids[group][id];
			}
			return null;
		},

		/**
		 * Returns a Region object containing the drag and drop element's position
		 * and size, including the padding configured for it
		 * @method getLocation
		 * @param {DragDrop} oDD the drag and drop object to get the
		 *                       location for
		 * @return {Ext.lib.Region} a Region object representing the total area
		 *                             the element occupies, including any padding
		 *                             the instance is configured for.
		 */
		getLocation : function(oDD)
		{
			var el = oDD.getEl();

			var region = orig_getLocation.apply(this, arguments);

			// below code is taken from previous version of extjs
			// to fix drag and drop between overlapping elements
			if(el && region) {
				/*
				 * The code below is to ensure that large scrolling elements will
				 * only have their visible area recognized as a drop target, otherwise it
				 * can potentially erronously register as a target when the element scrolls
				 * over the top of something below it.
				 */
				el = Ext.get(el.parentNode);
				while (el && region) {
					if (el.isScrollable()) {
						// check whether our element is visible in the view port:
						region = region.intersect(el.getRegion());
					}
					el = el.parent();
				}
			}

			return region;
		},

		/**
		 * @private
		 * Collects the z-index of the passed element, looking up the parentNode axis to find an absolutely positioned ancestor
		 * which is able to yield a z-index. If found to be not absolutely positionedm returns -1.
		 *
		 * This is used when sorting potential drop targets into z-index order so that only the topmost receives `over` and `drop` events.
		 *
		 * @return {Number} The z-index of the element, or of its topmost absolutely positioned ancestor. Returns -1 if the element is not
		 * absolutely positioned.
		 */
		getZIndex : function(element)
		{
			// to fix drag and drop between overlapping elements
			// we are removing use of this function as previous version of extjs was not having this function
			return -1;
		}
	});
})();
(function() {
	/*
	 * Fix the Ext.dd.DragSource, so that it uses the Ext.dd.DragDropMgr.getGroupDDById
	 * to find the correct DropZone class for the given id. ExtJs does support
	 * registering multiple zones to an id, but the DragSource doesn't handle
	 * that case since it would always return the first dropZone which the
	 * DragDropMgr would return (the one with a ddGroup name which is
	 * alphabetical the highest).
	 */
	var orig_onDragEnter = Ext.dd.DragSource.prototype.onDragEnter;
	var orig_onDragOver = Ext.dd.DragSource.prototype.onDragOver;
	var orig_onDragOut = Ext.dd.DragSource.prototype.onDragOut;
	var orig_onDragDrop = Ext.dd.DragSource.prototype.onDragDrop;

	Ext.override(Ext.dd.DragSource, {
		onDragEnter : function(e, id)
		{
			// If we still have a cached target, then we still have
			// a connection with a DropZone which we should now force
			// to disconnect using onDragOut(). This prevents that we
			// are dragging the same item over 2 dragzones at the same
			// time.
			if (this.cachedTarget) {
				var oldId = this.cachedTarget.id;

				this.onDragOut(e, oldId);
			}

			var target;
			if (this.ddGroup) {       
				target = Ext.dd.DragDropMgr.getGroupDDById(this.ddGroup, id);
			} else {
				// backwards compatible for components which didn't use
				// configure the ddGroup correctly (as they actually should,
				// but as ExtJs was bugged, it was unnoticed).
				target = Ext.dd.DragDropMgr.getDDById(id);
			}

			// Literally copied from original function, we can't call the original
			// function as we have no way to pass our intended target variable.
			this.cachedTarget = target;
			if (target && this.beforeDragEnter(target, e, id) !== false) {
				if (target.isNotifyTarget) {
					var status = target.notifyEnter(this, e, this.dragData);
					this.proxy.setStatus(status);
				} else {
					this.proxy.setStatus(this.dropAllowed);
				}

				if (this.afterDragEnter) {
					this.afterDragEnter(target, e, id);
				}
			}
		},

		onDragOver : function(e, id)
		{
			// If we don't have a cached target, then we haven't got a connection
			// with a DropZone. This can happen when 2 DropZones are hovering over
			// eachother, when we enter the second DropZone, onDragEnter will have
			// unhooked the first DropZone. But since we are now hovering over it
			// again, we seem to have exited the top DropZone and we are back at
			// the first. So we force the connection again using onDragEnter().
			if (!this.cachedTarget){
				this.onDragEnter(e, id);
			}

			this.cachedTarget = this.cachedTarget || Ext.dd.DragDropMgr.getGroupDDById(this.ddGroup, id);
			return orig_onDragOver.apply(this, arguments);
		},

		onDragOut : function(e, id)
		{
			// If we haven't cached our target, then apparently we aren't hovering over
			// this DropZone. So no point in informing the onDragOut then.
			if (this.cachedTarget){
				return orig_onDragOut.apply(this, arguments);
			}
		},

		onDragDrop : function(e, id)
		{
			// If we haven't cached our target, then apparently we aren't hovering over
			// this DropZone. So no point in informing the onDragDrop then.
			if (this.cachedTarget){
				return orig_onDragDrop.apply(this, arguments);
			}
		}
	});
})();
(function() {
	/*
	 * Override Ext.form.BasicForm, there is a unwanted behavior in there
	 * which annoys users. For example the user is typing in field A, but
	 * loadRecord() is called on the form. This will remove the changes
	 * in field A and load them with the new contents.
	 *
	 * So to fix this, we prevent that when a field has the focus, and
	 * contains modifications, we ignore that given field.
	 */
	Ext.override(Ext.form.BasicForm, {

		// updateRecord overridden to check for the 'isSingleValued' property.
		updateRecord : function(record)
		{
			record.beginEdit();
			var fs = record.fields,
				 field,
				 value;
			fs.each(function(f){
				field = this.findField(f.name);
				if (field) {
					value = field.getValue();
					if (Ext.type(value) !== false && value.getGroupValue) {
						value = value.getGroupValue();
						// This else statement has been changed, originally it was if (field.eachItem).
						// From ExtJs code this could only be true for CompositeFields, however in WebApp
						// we use Composite fields for returning a single values based on combining the
						// values from the individual components. To keep supporting this feature without
						// requiring a completely new component support for the config option 'isSingleValued'
						// has been added (defined in Zarafa.common.ui.CompositeField).
					} else if (field.isSingleValued !== true && field.eachItem) {
						value = [];
						field.eachItem(function(item){
							value.push(item.getValue());
						});
					}
					record.set(f.name, value);
				}
			}, this);
			record.endEdit();
			return this;
		},

		// setValues overridden to add the checks:
		//   if (!field.hasFocus || (field.originalValue == field.el.dom.value)) {
		//   }
		setValues : function(values)
		{
			if(Ext.isArray(values)){ // array of objects
				for(var i = 0, len = values.length; i < len; i++){
					var v = values[i];
					var f = this.findField(v.id);
					if(f){
						// Don't update an input field which the user is working in
						if (!f.hasFocus || (f.originalValue == f.el.dom.value)) {
							f.setValue(v.value);
							if(this.trackResetOnLoad){
								f.originalValue = f.getValue();
							}
						}
					}
				}
			}else{ // object hash
				var field, id;
				for(id in values){
					if(!Ext.isFunction(values[id]) && (field = this.findField(id))) {
						// Don't update an input field which the user is working in
						if (!field.hasFocus || (field.originalValue == field.el.dom.value)) {
							field.setValue(values[id]);
							if(this.trackResetOnLoad){
								field.originalValue = field.getValue();
							}
						}
					}
				}
			}
			return this;
		}
	});
})();
(function() {
	/*
	 * Override Ext.form.Checkbox to add the proper CSS class to the wrap
	 * element of the checkbox. This fixes the behavioral difference between:
	 *
	 *  {
	 *      xtype: 'textfield',
	 *      fieldLabel: 'test'
	 *  }
	 *
	 * and
	 *
	 *  {
	 *      xtype: 'checkbox',
	 *      boxLabel: 'test'
	 *  }
	 *
	 *  In the first example the HTML looks like:
	 *
	 *  <div class="... x-form-item ...">
	 *    <label>test</test>
	 *    ...
	 *  </div>
	 *
	 *  While for the second example the HTML looks like:
	 *
	 *  <div class="... x-box-item ...">
	 *    <label>test</test>
	 *  </div>
	 *
	 *  In the first example, the CSS class x-form-item is applied,
	 *  which causes the label to be rendered differently then when
	 *  the CSS class is not applied.
	 *
	 *  However since both are Ext.form.Field subclasses, they should
	 *  behave the same when considering CSS classes and rendering of
	 *  labels.
	 */
	var orig_onRender = Ext.form.Checkbox.prototype.onRender;
	Ext.override(Ext.form.Checkbox, {

		onRender : function(ct, position)
		{
			orig_onRender.apply(this, arguments);

			// Add x-form-item CSS class to the wrap element
			this.wrap.addClass('x-form-item');

			// Make the text in the label unselectable
			if(this.boxLabel && this.el){
				var lbl = Ext.query('.x-form-cb-label', this.el.parent().dom)[0];
				if (lbl) {
					Ext.get(lbl).unselectable();
				}
			}
		}
	});
})();
(function() {
	/*
	 * Fix the default behavior for the Ext.form.Combobox. By default the combobox
	 * will not encode any text which is placed into the list. Since the entire
	 * combobox accepts data directly from a store this can be dangerous and it is
	 * better to htmlEncode the data by default.
	 */
	var orig_initList = Ext.form.ComboBox.prototype.initList;

	Ext.override(Ext.form.ComboBox, {
		initList : function()
		{
			if (!this.tpl) {
				this.tpl = '<tpl for="."><div class="x-combo-list-item">{' + this.displayField + ':htmlEncode}</div></tpl>';
			}
			orig_initList.apply(this, arguments);
		}
	});
})();
(function() {
	var orig_getValue = Ext.form.DateField.prototype.getValue;
	var orig_initComponent = Ext.form.DateField.prototype.initComponent;
	Ext.override(Ext.form.DateField, {

		/**
		 * overriden to set starting day of the week
		 * @override
		 */
		initComponent: function()
		{
			// if startDay is not specified through config then use one specified in settings
			if(!this.initialConfig.startDay) {
				this.startDay = container.getSettingsModel().get('zarafa/v1/main/week_start');
			}

			orig_initComponent.apply(this, arguments);

			// Check for invalid start day
			if(this.startDay < 0 || this.startDay >= Date.dayNames.length) {
				// by default make it sunday
				this.startDay = 0;
			}
		},

		/*
		 * Fix the getValue function for the DateField, normally Extjs would
		 * return an empty string ("") when no date was provided, but it more
		 * logically would be to return null.
		 */
		getValue : function()
		{
			var value = orig_getValue.apply(this, arguments);
			return Ext.isEmpty(value) ? null : value;
		},

		/**
		* This function prepares raw values for validation purpose only. Here when
		* field value is null than empty string will be returned because ExtJS by default uses
		* empty string to indicate that date is not present but there is no way in mapi to set
		* empty date. Here the validation function for date field doesn't expect null so we have
		* overriden processValue to give empty string if value is null.
		* @param {Mixed} value
		* @return {Mixed} value or empty string.
		*/
		processValue : function(value)
		{
			return Ext.isEmpty(value) ? "" : value;
		}
	});
})();
(function() {
	/*
	 * Override Ext.form.DisplayField to guarentee the availability
	 * of the 'x-form-item' CSS class.
	 * This is normally only applied when the component is being
	 * rendered using the FormLayout, but this doesn't really make
	 * sense for styling.
	 */
	Ext.override(Ext.form.DisplayField, {
		cls: 'x-form-item'
	});
})();
(function() {
	/**
	 * @class Ext.form.FormPanel
	 * @extends Ext.Panel
	 * <p>Standard form container.</p>
	 *
	 * <p><b><u>Layout</u></b></p>
	 * <p>By default, FormPanel is configured with <tt>layout:'form'</tt> to use an {@link Ext.layout.FormLayout}
	 * layout manager, which styles and renders fields and labels correctly. When nesting additional Containers
	 * within a FormPanel, you should ensure that any descendant Containers which host input Fields use the
	 * {@link Ext.layout.FormLayout} layout manager.</p>
	 *
	 * <p><b><u>BasicForm</u></b></p>
	 * <p>Although <b>not listed</b> as configuration options of FormPanel, the FormPanel class accepts all
	 * of the config options required to configure its internal {@link Ext.form.BasicForm} for:
	 * <div class="mdetail-params"><ul>
	 * <li>{@link Ext.form.BasicForm#fileUpload file uploads}</li>
	 * <li>functionality for {@link Ext.form.BasicForm#doAction loading, validating and submitting} the form</li>
	 * </ul></div>
	 *
	 * <p><b>Note</b>: If subclassing FormPanel, any configuration options for the BasicForm must be applied to
	 * the <tt><b>initialConfig</b></tt> property of the FormPanel. Applying {@link Ext.form.BasicForm BasicForm}
	 * configuration settings to <b><tt>this</tt></b> will <b>not</b> affect the BasicForm's configuration.</p>
	 *
	 * <p><b><u>Form Validation</u></b></p>
	 * <p>For information on form validation see the following:</p>
	 * <div class="mdetail-params"><ul>
	 * <li>{@link Ext.form.TextField}</li>
	 * <li>{@link Ext.form.VTypes}</li>
	 * <li>{@link Ext.form.BasicForm#doAction BasicForm.doAction <b>clientValidation</b> notes}</li>
	 * <li><tt>{@link Ext.form.FormPanel#monitorValid monitorValid}</tt></li>
	 * </ul></div>
	 *
	 * <p><b><u>Form Submission</u></b></p>
	 * <p>By default, Ext Forms are submitted through Ajax, using {@link Ext.form.Action}. To enable normal browser
	 * submission of the {@link Ext.form.BasicForm BasicForm} contained in this FormPanel, see the
	 * <tt><b>{@link Ext.form.BasicForm#standardSubmit standardSubmit}</b></tt> option.</p>
	 *
	 * @constructor
	 * @param {Object} config Configuration options
	 * @xtype form
	 */
	Ext.override(Ext.form.FormPanel, {
		/**
		 * @cfg {String} labelAlign The label alignment value used for the <tt>text-align</tt> specification
		 * for the <b>container</b>. Valid values are <tt>"left</tt>", <tt>"top"</tt> or <tt>"right"</tt>
		 * (defaults to <tt>"right"</tt>). This property cascades to child <b>containers</b> and can be
		 * overridden on any child <b>container</b> (e.g., a fieldset can specify a different <tt>labelAlign</tt>
		 * for its fields).
		 */
		labelAlign: 'right'
	});
})();
(function() {
	var orig_createToolbar = Ext.form.HtmlEditor.prototype.createToolbar;
	var orig_initEditor = Ext.form.HtmlEditor.prototype.initEditor;
	var orig_initFrame = Ext.form.HtmlEditor.prototype.initFrame;

	Ext.override(Ext.form.HtmlEditor, {

		/*
		 * Fix createToolbar, the font-selection combobox doesn't get a tabindex applied
		 * like any of the other buttons in the toolbar. So fix this behavior to match
		 * the rest of the toolbar buttons.
		 */
		createToolbar : function(editor)
		{
			orig_createToolbar.apply(this, arguments);

			// Make the 'more' button of the toolbar not selectable by tab
			this.getToolbar().layout.overflowTabIndex = -1;
			if (this.enableFont && !Ext.isSafari2) {
				 var btn = Ext.DomQuery.select('.x-font-select', this.tb.getEl().dom);
				 if (!Ext.isEmpty(btn)) {
					btn[0].setAttribute('tabindex', '-1');
				 }
			}
		},

		// private
		onFirstFocus : function()
		{
			this.activated = true;
			this.disableItems(this.readOnly);
			//removed the Gecko/Firefox, as things seems to work fine
			this.fireEvent('activate', this);
		},

		/*
		 * Override Ext.form.HtmlEditor, in htmleditor in chrome when user presses
		 * enter it should add only one <br /> but for some weird reason code was adding
		 * two <br /> which is really annoying for users.
		 * so this function is overriden to add only one <br />.
		 */
		fixKeys : function() // load time branching for fastest keydown performance
		{
			if (Ext.isIE) {
				return function(e) {
					var k = e.getKey(),
						doc = this.getDoc(),
						sel,
						r;

					if (k == e.TAB) {
						e.stopEvent();
						// DOM 2 alternative to old IE pasteHTML method
						sel = this.win.getSelection();

						if (sel.getRangeAt && sel.rangeCount) {
							r = sel.getRangeAt(0);
							r.deleteContents();
							var el = doc.createElement('div');
							el.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;';
							var frag = doc.createDocumentFragment(), node, lastNode;
							while ((node = el.firstChild)) {
								lastNode = frag.appendChild(node);
							}
							r.insertNode(frag);

							if (lastNode) {
								r = r.cloneRange();
								r.setStartAfter(lastNode);
								r.collapse(true);
								sel.removeAllRanges();
								sel.addRange(r);
							}
						}
						this.deferFocus();

					} else if(k == e.ENTER) {
						// DOM 2 alternative to old IE pasteHTML method
						sel = this.win.getSelection();
						if (sel.getRangeAt && sel.rangeCount) {
							r = sel.getRangeAt(0);
							r.deleteContents();
							var target = r.commonAncestorContainer;

							if (!target || target.nodeName.toLowerCase() != 'li' && target.parentNode.nodeName.toLowerCase() != 'li') {
								e.stopEvent();
								var el = doc.createElement('div');
								el.innerHTML = '<br />';
								var frag = doc.createDocumentFragment(), node, lastNode;
								while ((node = el.firstChild)) {
									lastNode = frag.appendChild(node);
								}
								r.insertNode(frag);

								if (lastNode) {
									r = r.cloneRange();
									r.setStartAfter(lastNode);
									r.collapse(false);
									sel.removeAllRanges();
									sel.addRange(r);
								}
							}
						}
					}
				};
			} else if(Ext.isOpera) {
				return function(e) {
					var k = e.getKey();
					if (k == e.TAB) {
						e.stopEvent();
						this.win.focus();
						this.execCmd('InsertHTML','&nbsp;&nbsp;&nbsp;&nbsp;');
						this.deferFocus();
					}
				};
			} else if(Ext.isWebKit) {
				return function(e) {
					var k = e.getKey();
					if (k == e.TAB) {
						e.stopEvent();
						this.execCmd('InsertText','\t');
						this.deferFocus();
					}
					//here removed the check for Enter keypress as it seems the Chrome is working well with this event
				};
			}
		}(),

		/**
		 * initialize editor body
		 * overriden in order to disable default drag&drop behaviour
		 * which loads a file in the current window when dropped into the editor body
		 * @override
		 * @private
		 */
		initEditor : function()
		{
			orig_initEditor.apply(this, arguments);

			this.getWin().addEventListener('dragover', Zarafa.onWindowDragDrop, false);
			this.getWin().addEventListener('drop', Zarafa.onWindowDragDrop, false);
		},

		/**
		 * initialize iframe and writes contents to it
		 * overriden in order to fix a nasty bug in chrome where scrolling is stuck at bottom
		 * and user will not be able to scroll upwards when url contains # (that is added when any anchor
		 * element with href="#" is clicked in webapp)
		 * https://code.google.com/p/chromium/issues/detail?id=102816
		 * @override
		 * @private
		 */
		initFrame : function()
		{
			orig_initFrame.apply(this, arguments);

			// Bug is only in chrome and when url contains hash
			if(Ext.isChrome && window.location.href.search(/#$/) !== -1) {
				// find out parent container which is scrollable
				var scrollEl = this.findParentBy(function(cmp) {
					var el = cmp.getEl();
					return el.isScrollable();
				});

				// this will fix actuall bug and re-enable scrolling in the parent scrollable container
				// although position of the scrollbar is still at bottom
				var body = this.getEditorBody();
				body.scrollTop = 0;

				if(scrollEl !== null) {
					// now set scroll position to top
					scrollEl.getEl().scrollTo('top', 0);
				}
			}
		}
	});
})();
(function() {
	/*
	 * Override Ext.form.Label, there is a bahavioral difference
	 * between with using:
	 *      {
	 *          xtype: 'component',
	 *          fieldLabel: 'test'
	 *      }
	 * and
	 *      {
	 *          xtype: 'label',
	 *          text: 'test'
	 *      }
	 *
	 *  Altough both would render a label with the contents 'test',
	 *  the CSS classes are applied incorrectly. When using the
	 *  fieldLabel option, the generated HTML is:
	 *
	 *      <div class="x-form-item">
	 *          <label class="x-form-item-label">test</label>
	 *      </div>
	 *
	 * while using xtype: 'label' generates the HTML:
	 *
	 *      <label>test</test>
	 *
	 * Due to the missing CSS classes the Font size and padding are
	 * not applied correctly. However, adding the 'cls' statement
	 * to the configuration for adding the CSS classes 'x-form-item'
	 * or 'x-form-item-label' will not result in the same behavior
	 * either. The CSS definitions from Extjs really require the
	 * <label> element to be wrapped by a <div class="x-form-item">
	 * element.
	 */
	var orig_onRender = Ext.form.Label.prototype.onRender;
	Ext.override(Ext.form.Label, {
		cls: 'x-form-item-label',

		onRender : function(ct, position)
		{
			orig_onRender.apply(this, arguments);

			// Wrap the main element in a div element with class x-form-item. By naming it positionEl,
			// ExtJs will correctly position the div and its  contents on the correct location.
			this.positionEl = this.el.wrap({cls: 'x-form-item'});

			// Make the element unselectable by default.
			this.el.unselectable();
		}
	});
})();
(function() {
	var checkPerc = /^(100?|\d?\d)?%?$/;

	/**
	 * @class Ext.form.VTypes
	 * This will apply the custom vtype which is used to check
	 * given percentage must be between 0 to 100.
	 * @singleton
	 */
	Ext.apply(Ext.form.VTypes, {
		/**
		 * Used to validate the given percentage value must be between 0 to 100.
		 * and also check that value is not float.
		 * @param {Number} perc the perc is represent percentage value from field.
		 * @return {Boolean} return true if given percentage value matches
		 * with regular expression else return false.
		 */
		percentage : function(perc) {
			return checkPerc.test(perc);
		},

		//The error text to display when the validation function returns false
		percentageText: _('Value must be between 0% to 100%')
	});
})();(function() {
	var orig_setColumnWidth = Ext.grid.ColumnModel.prototype.setColumnWidth;

	Ext.override(Ext.grid.ColumnModel, {
		/**
		 * {@link Ext.grid.GridView#fitColumns fitColumns} has buggy behavior,
		 * which generates the fraction using division operation. When all columns 
		 * are disable (except fixed width columns), then fraction is "Infinity" 
		 * because the division operation is performed with "0". So to overcome this problem
		 * we check that width should not be infinite.
		 * 
		 * @param {Number} col The column index
		 * @param {Number} width The new width
		 * @param {Boolean} suppressEvent True to suppress firing the <code>{@link #widthchange}</code>
		 * event. Defaults to false.
		 */
		setColumnWidth : function(col, width, suppressEvent)
		{
			if(isFinite(width)) {
				orig_setColumnWidth.apply(this, arguments);
			}
		}
	});
})();(function() {
	var orig_onClick = Ext.grid.GridPanel.prototype.onClick;

	Ext.override(Ext.grid.GridPanel, {
		/*
		 * Override onClick to fix an issue that clicking on an
		 * already selected row will not put the focus on the grid itself. This
		 * prevents key-control to work properly on a grid.
		 */
		onClick : function(e)
		{
			orig_onClick.apply(this, arguments);

			this.view.focusEl.focus();
		},

		/*
		 * Override reconfigure to fix an issue that reconfiguring grid with
		 * new column model and store, was not re-initializing the state to get state settings
		 * for column model.
		 */
		reconfigure : function(store, colModel)
		{
			// initStateEvents registers 'hiddenchange' event on column model,
			// and we are going to change the column model, so we are here removing listener for hiddenchange event
			// and this will be again registered by initStateEvents for new column model
			if(this.stateful !== false && colModel !== this.colModel) {
				this.mun(this.colModel, 'hiddenchange', this.saveState, this);
			}

			var rendered = this.rendered;
			if(rendered){
				if(this.loadMask){
					this.loadMask.destroy();
					this.loadMask = new Ext.LoadMask(this.bwrap,
							Ext.apply({}, {store:store}, this.initialConfig.loadMask));
				}
			}

			if(this.view){
				this.view.initData(store, colModel);
			}

			this.store = store;
			this.colModel = colModel;

			// we have reconfigured column model, so re-apply state settings
			// that will change column order in column model
			if(this.stateful !== false) {
				this.initStateEvents();
				this.initState();
			}

			if(rendered){
				this.view.refresh(true);
			}

			this.fireEvent('reconfigure', this, store, colModel);
		}
	});
})();
(function() {
	var orig_onColConfigChange = Ext.grid.GridView.prototype.onColConfigChange;
	var orig_onLoad = Ext.grid.GridView.prototype.onLoad;

	Ext.override(Ext.grid.GridView, {
		/*
		 * Override the Ext.grid.GridView onLoad method.
		 * The original one in ExtJs 3 "resets the scrollbar" every time new items
		 * are added. This is especially uncomfortable when doing a large, slow,
		 * search.
		 * The original onLoad is now replaced by something which checks if the
		 * scroll position is below the actual bottom grid row. If that's the case,
		 * then and only then we reset the scroll position to the top of the grid.
		 * It is thought that the original scroll-to-the-top behaviour was only
		 * intended to prevent the situation where the user was left with a white
		 * screen when a grid was reloaded with less items than before (- when the
		 * scroll was done).
		 */
		onLoad : function()
		{
			var rowCount = this.getRows().length;

			// Count the content hight in pixels.
			var totalPixels = 0;
			for(var rowNr=0; rowNr<rowCount; rowNr++) {
				totalPixels += this.getRow(rowNr).clientHeight;
			}

			/*
			 * If the current scroll position is below the bottom of
			 * the grid-items, then scroll all the way up
			 * In theory we could also just move to [bottom - window size] but that
			 * might be confusing.
			 * We let the original onLoad take care of the scrolling: in case it
			 * has other things to do so besides the this.scrollToTop() call.
			 */
			if (this.el.getScroll().top >= totalPixels) {
				orig_onLoad.apply(this, arguments);
			}
		},

		/*
		 * Override the Ext.grid.GridView to fix an issue where the columns are rendered
		 * partally behind the scrollbar in Google Chrome. This is due to the fact that
		 * ExtJs assumes the borders take up no space in Chrome, while in fact they do.
		 */
		getColumnWidth : function(column)
		{
			var columnWidth = this.cm.getColumnWidth(column);
			var borderWidth = this.borderWidth;

			if (Ext.isNumber(columnWidth)) {
				// Original if-statement: Ext.isBorderBox || (Ext.isWebKit && !Ext.isSafari2)
				if (Ext.isBorderBox) {
					return columnWidth + 'px';
				} else {
					return Math.max(columnWidth - borderWidth, 0) + 'px';
				}
			} else {
				return columnWidth;
			}
		},

		/**
		 * Event handler for the {@link #cm}#{@link Ext.grid.ColumnModel#configchange configchange} event.
		 * This will call {@link Ext.grid.GridPanel#initState initState} on the {@link #grid}.
	 	 * @private
	 	 */
		onColConfigChange : function()
		{
			// Call initState on the gridpanel at this exact time, the superclass will
			// perform a layout on the applied configuration and needs the updated information.
			var grid = this.grid;

			if(grid.stateful !== false) {
				grid.initState();
			}

			orig_onColConfigChange.apply(this, arguments);
		}
	});
})();(function() {
	/**
	 * @class Ext
	 * Overridden to add checks for identifying Internet Explorer and it's latest versions
	 * @singleton
	 */
	var userAgentString = navigator.userAgent.toLowerCase();
	var isIE = !Ext.isOpera && (((/msie/).test(userAgentString)) || ((/trident/).test(userAgentString)));

	Ext.apply(Ext, {
		/**
		 * True if the detected browser is Internet Explorer.
		 * @type Boolean
		 * @property
		 */
		isIE : isIE,

		/**
		 * True if the detected browser is Internet Explorer 10.
		 * @type Boolean
		 * @property
		 */
		isIE10 : isIE && ((/msie 10/).test(userAgentString)),

		/**
		 * True if the detected browser is Internet Explorer 11.
		 * @type Boolean
		 * @property
		 */
		isIE11 : isIE && ((/rv:11/).test(userAgentString))
	});
})();
(function() {
	/*
	 * Fix the BorderLayout#Region class, whenever the region is collapsed, we should
	 * hide the split element in such a way it will not be considered by the browser
	 * for sizing/positioning. By default the BorderLayout#region would apply "visibility: none" 
	 * to the style of the CSS element. However due to a bug in Extjs the splitEl would have
	 * a greater height then the MainViewPort element. As a result the entire WebApp could be
	 * scrolled up partially out of the view of the user. This occurred primarily when using
	 * debugging tools...
	 */
	var orig_beforeCollapse = Ext.layout.BorderLayout.Region.prototype.beforeCollapse;
	var orig_onExpand = Ext.layout.BorderLayout.Region.prototype.onExpand;
	Ext.override(Ext.layout.BorderLayout.Region, {
		// Instead of only applying "visibility: none" to the splitEl,
		// we apply the x-hide-display CSS class to prevent that the element
		// still occupies space during rendering.
		beforeCollapse : function()
		{
			if (this.splitEl) {
				this.splitEl.addClass('x-hide-display');
			}
			orig_beforeCollapse.apply(this, arguments);
		},

		// Remove the x-hide-display CSS class again.
		onExpand : function()
		{
			if (this.splitEl) {
				this.splitEl.removeClass('x-hide-display');
			}
			orig_onExpand.apply(this, arguments);
		}
	});
})();
(function() {
 	var orig_configureItem = Ext.layout.ToolbarLayout.prototype.configureItem;
 	var orig_hideItem = Ext.layout.ToolbarLayout.prototype.hideItem;
 	var orig_unhideItem = Ext.layout.ToolbarLayout.prototype.unhideItem;
	var orig_onLayout = Ext.layout.ToolbarLayout.prototype.onLayout;
	var orig_addComponentToMenu = Ext.layout.ToolbarLayout.prototype.addComponentToMenu;
	Ext.override(Ext.layout.ToolbarLayout, {
		// Fix the trigger width, Extjs defines it as 18 which only covers the '>>' button, but not
		// the padding for the trigger button itself.
		triggerWidth : 41,

		// The tabIndex that should be applied to the 'more' button when the toolbar overflows
		overflowTabIndex : undefined,

		/*
		 * Fix that the ToolbarLayout will go over all items in the container
		 * and check if those items contains layouts which need to be called as
		 * well. This ensures that the ToolbarLayout is capable of containing
		 * other Containers as well.
		 */
		onLayout : function(ct, target) 
		{
			orig_onLayout.apply(this, arguments);
			ct.items.each(function(item) {
				if (Ext.isFunction(item.doLayout)) {
					item.doLayout();
				}
			}, this);

			if (this.overflowTabIndex && this.more) {
				Ext.get(this.more.el).child('button').set({ 'tabIndex' : this.overflowTabIndex });
			}
		},

		/*
		 * Override configureItem to hook the 'show' and 'hide'
		 * event handlers to the items. This allows us to peform
		 * a layout of the items when one of them is being hidden
		 * or shown (as this means we have to consider moving items
		 * into or out of the overflow menu).
		 */
		configureItem : function(item)
		{
			var ct = this.container;
			var target = ct.getLayoutTarget();

			orig_configureItem.apply(this, arguments);

			item.on('show', function(item) {
				if (item.xtbHidden !== true) {
					this.onLayout(ct, target);
				}
			}, this);

			item.on('hide', function(item) {
				if (item.xtbHidden !== true) {
					this.onLayout(ct, target);
				}
			}, this);
		},

		/*
		 * Override the hideItem function, when the item is placed in the overflow menu,
		 * we do want to remain in touch with the "show" and "hide" requests from the
		 * component itself. Because in those cases we want to ensure that the item
		 * is removed or added into the overflow menu.
		 */
		hideItem : function(item)
		{
			var layout = this;
			orig_hideItem.apply(this, arguments);

			// When showing a previously hidden item,
			// them we must update the xtbWidth to ensure that
			// the toolbar knows if the item must be removed
			// from the overflow menu or not.
			item.xtbOrigShow = item.show;
			item.show = function() {
				item.xtbOrigShow(true);
				item.xtbWidth = item.getPositionEl().dom.parentNode.offsetWidth;
				item.xtbOrigHide(false);
			}

			// When we are hiding an item in the overflow menu,
			// we must unhide it, and invoke the real hide function
			// to make it invisible.
			item.xtbOrigHide = item.hide;
			item.hide = function() {
				layout.unhideItem(item);
				item.hide();
			}
		},

		/*
		 * Override the unhideItem function to ensure we restore
		 * the "show" and "hide" function to the original implementation again.
		 */
		unhideItem : function(item)
		{
			item.show = item.xtbOrigShow;
			delete item.xtbOrigShow;

			item.hide = item.xtbOrigHide;
			delete item.xtbOrigHide;

			// Another bug from Extjs, the xtbWidth must be
			// removed when unhiding, as otherwise the layout
			// will still try to use it when the item must
			// be completely hidden.
			delete item.xtbWidth;

			orig_unhideItem.apply(this, arguments);
		},

		/*
		 * Fix that hidden items inside a buttongroup will be rendered into the
		 * overflow menu. This happens because only the top components in the
		 * toolbar will be marked with 'xtbHidden' which indicates that the 'hidden'
		 * state should be ignored because the toolbar has hidden the item.
		 * However the items below are added regardless of their 'hidden' status.
		 * This fix will not only check for xtbHidden, but also for the normal
		 * 'hidden' flag before deciding to render the item into the menu. 
		 */
		addComponentToMenu : function(menu, component)
		{
			if (component.xtbHidden === true || component.hidden !== true) {
				orig_addComponentToMenu.apply(this, arguments);
			}
		}
	});
})();
(function() {
	var orig_addComponentToMenu = Ext.layout.boxOverflow.Menu.prototype.addComponentToMenu;
	Ext.override(Ext.layout.boxOverflow.Menu, {
		/*
		 * Fix that hidden items inside a buttongroup will be rendered into the
		 * overflow menu. This happens because only the top components in the
		 * toolbar will be marked with 'xtbHidden' which indicates that the 'hidden'
		 * state should be ignored because the toolbar has hidden the item.
		 * However the items below are added regardless of their 'hidden' status.
		 * This fix will not only check for xtbHidden, but also for the normal
		 * 'hidden' flag before deciding to render the item into the menu. 
		 */
		addComponentToMenu : function(menu, component)
		{
			if (component.xtbHidden === true || component.hidden !== true) {
				orig_addComponentToMenu.apply(this, arguments);
			}
		}
	});
})();
(function() {
	/**
	 * @class Ext.state.Manager
	 * This is the global state manager. By default all components that are "state aware" check this class
	 * for state information if you don't pass them a custom state provider. In order for this class
	 * to be useful, it must be initialized with a provider when your application initializes. Example usage:
	 <pre><code>
	 // in your initialization function
	init : function(){
	    Ext.state.Manager.setProvider(new Ext.state.CookieProvider());
	    var win = new Window(...);
	    win.restoreState();
	}
	 </code></pre>
	 * @singleton
	 */
	Ext.apply(Ext.state.Manager, {

		/**
		 * The list of {@link Ext.Component#stateful stateful} components
		 * This can be used by {@link Ext.state.Provider State providers} to
		 * {@link #getComponent obtain} the {@link Ext.Component} which corresponds
		 * to the given stateId.
		 * @property
		 * @type Ext.util.MixedCollection
		 * @private
		 */
		components : new Ext.util.MixedCollection(false, function(item) {
			return item.getStateId();
		}),

		/**
		 * Register the {@link Ext.Component#stateful stateful} {@link Ext.Component}
		 * to the {@link #components} list.
		 * @param {Ext.Component} component The component to register
		 */
		register : function(component)
		{
			this.components.add(component);
		},

		/**
		 * Unregister a previously {@link #register registered} {@link Ext.Component}
		 * from the {@link #components}.
		 * @param {Ext.Component} component The component to unregister
		 */
		unregister : function(component)
		{
			this.components.remove(component);
		},

		/**
		 * Obtain a previously {@link #register registered} {@link Ext.Component}
		 * by the components {@link Ext.Component#getStateId State Id}.
		 * @param {String} stateId The stateId for the component
		 * @return {Ext.Component} The registered component
		 */
		getComponent : function(stateId)
		{
			return this.components.get(stateId);
		}
	});
})();
(function() {
	/*
	 * Fix the Ext.tree.TreeEditor, the fitToTree and bindScroll are called with a small delay,
	 * and unfortunately ExtJs doesn't care that objects can be destroyed while
	 * a function which expects that object is deferred.
	 */
	var orig_bindScroll = Ext.tree.TreeEditor.prototype.bindScroll;
	var orig_fitToTree = Ext.tree.TreeEditor.prototype.fitToTree;

	Ext.override(Ext.tree.TreeEditor, {
		fitToTree : function()
		{
			if (this.tree && this.tree.isDestroyed !== true) {
				orig_fitToTree.apply(this, arguments);
			}
		},

		bindScroll : function()
		{
			if (this.tree && this.tree.isDestroyed !== true) {
				orig_bindScroll.apply(this, arguments);
			}
		}
	});
})();
(function() {
	/*
	 * Fix the Ext.tree.TreeSorter, the doSort function is always deferred
	 * by ExtJs, but unfortunately it doesn't keep in mind that the node
	 * could have been destroyed before the function is being called...
	 */
	Ext.override(Ext.tree.TreeSorter, {
		doSort : function(node)
		{
			// Check if the node has children which
			// can be sorted.
			if (node.childNodes) {
				node.sort(this.sortFn);
			}
		}
	});
})();
(function() {
	/**
	 * @class Ext.util.Format
	 * Reusable data formatting functions
	 * @singleton
	 */
	Ext.apply(Ext.util.Format, {
		/**
		 * Simple format for a file size (xxx bytes, xxx KB, xxx MB)
		 * @param {Number/String} size The numeric value to format
		 * @return {String} The formatted file size
		 */
		fileSize : function(size)
		{
			if (!Ext.isNumber(size)) {
				size = 0;
			}

			if (size < 1024) {
				return String.format(ngettext('{0} byte', '{0} bytes', size), size);
			}

			size = parseFloat((size / 1024).toFixed(1));
			if (size < 1024) {
				return String.format(ngettext('{0} KB', '{0} KB', size), size);
			}

			size = parseFloat((size / 1024).toFixed(1));
			if (size < 1024) {
				return String.format(ngettext('{0} MB', '{0} MB', size), size);
			}

			size = parseFloat((size / 1024).toFixed(1));
			if (size < 1024) {
				return String.format(ngettext('{0} GB', '{0} GB', size), size);
			}

			size = parseFloat((size / 1024).toFixed(1));
			return String.format(ngettext('{0} TB', '{0} TB', size), size);
		},

		/**
		 * Returns a string version of a float number as a percentage.
		 * @param {Float} value A number in the range [0..1]
		 * @param {Number} fixed optional, The number of digits in the percentage, defaults to 2.
		 * @return {String} Formatted percentage string
		 */
		percentage: function(value, fixed)
		{
			if (!Ext.isDefined(fixed)) {
				fixed = 2;
			}
			return (value * 100.0).toFixed(fixed) + "%";
		},

		/**
		 * Generate a string which represents a duration (xx minutes, xx hours, etc)
		 * @param {Number} value The duration (in minutes)
		 * @param {Number} decimals When rounding, how many decimals should be used
		 * @return {String} The formatted duration
		 */
		duration : function(value, decimals)
		{
			decimals = Ext.isDefined(decimals) ? decimals : 0;

			// Duration is less then an hour, print the number of minutes
			if (value < 60) {
				return String.format(ngettext('{0} minute', '{0} minutes', value), value);
			}

			// Duration is less then a day, print the number of hours
			// rounded to the requested number after the decimal point.
			value = parseFloat((value / 60).toFixed(decimals));
			if (value < 24) {
				return String.format(ngettext('{0} hour', '{0} hours', value), value);
			}

			// Duration is less then a week, print the number of days
			// rounded to the requested number after the decimal point.
			value = parseFloat((value / 24).toFixed(decimals));
			if (value < 7) {
				return String.format(ngettext('{0} day', '{0} days', value), value);
			}

			// Duration is one week or more, print the number of weeks
			// rounded to the requested number after the decimal point.
			value = parseFloat((value / 7).toFixed(decimals));
			return String.format(ngettext('{0} week', '{0} weeks', value), value);
		},

		/**
		 * Generate a string which can be used for indentation in the HTML.
		 * @param {Number} value The number of tabs to indent
		 * @param {Number} size (optional) The number of spaces per tab which should be generated
		 * @return {String} A string containing multiple '&nbsp' strings
		 */
		indent : function(value, size)
		{
			var spaces = (Ext.isDefined(value) ? value : 1) * (Ext.isDefined(size) ? size : 4);
			var indent = '';

			for (var i = 0; i < spaces; i++) {
				indent += '&nbsp;';
			}

			return indent;
		},

		/**
		 * Truncate a string from the middle and add an ellipsis ('...') in between.
		 * length of the string before and after ellipsis ('...') are specified in
		 * function parameters.
		 * @param {String} value The string to truncate
		 * @param {Number} startLength The maximum length to allow before truncation
		 * @param {Number} endLength The maximum length to allow after truncation
		 * @return {String} The converted/truncated text
		 */
		elide : function(value, startLength, endLength)
		{
			startLength = startLength || 0;
			endLength = Ext.isDefined(endLength) ? endLength : startLength;

			if (startLength === 0 && endLength === 0) {
				return value;
			}

			if (value && value.length > startLength + endLength) {
				return value.substr(0, startLength) + '...' + value.substr(value.length - endLength);
			}
			return value;
		},

		/**
		 * Combination of {@link #htmlEncode} and {@link #undef}.
		 * @param {String} value The string to encode
		 * @return {String} The htmlEncoded text
		 */
		htmlEncodeUndef : function(value)
		{
			return this.htmlEncode(this.undef.apply(this, arguments));
		},

		/**
		 * Combination of {@link #htmlEncode} and {@link #defaultValue}.
		 * @param {String} value The string which will be first replaced by defaultValue if it is empty / undefined
		 * and then it will be encoded.
		 * @return {String} The htmlEncoded text.
		 */
		htmlEncodeDefaultValue : function(value, defaultValue)
		{
			return this.htmlEncode(this.defaultValue.apply(this, arguments));
		},

		/**
		 * Combination of {@link #htmlEncode} and {@link #elide}.
		 * @param {String} value The string to truncate
		 * @param {Number} startLength The maximum length to allow before truncation
		 * @param {Number} endLength The maximum length to allow after truncation
		 * @return {String} The htmlEncoded and truncated text
		 */
		htmlEncodeElide : function(value, startLength, endLength)
		{
			return this.htmlEncode(this.elide.apply(this, arguments));
		},

		/**
		 * Combination of {@link #htmlEncode} and {@link #ellipsis}.
		 * @param {String} value The string to truncate
		 * @param {Number} length The maximum length to allow before truncating
		 * @param {Boolean} word True to try to find a common work break
		 * @return {String} The converted text
		 */
		htmlEncodeEllipsis : function(value, len, word)
		{
			return this.htmlEncode(this.ellipsis.apply(this, arguments));
		},

		/**
		 * Obtain the basename (filename) from the given string. This will remove
		 * everything which came before the last '\' character.
		 * @param {String} value The filename for which the basename is requested
		 * @return {String} The basename
		 */
		basename : function(value)
		{
			return value.split('\\').pop();
		},

		/**
		 * Combination of {@link #htmlEncode} and {@link #basename}.
		 * @param {String} value The filename for which the basename is requested
		 * @return {String} The htmlEncoded basename
		 */
		htmlEncodeBasename : function(value)
		{
			return this.htmlEncode(this.basename.apply(this, arguments));
		},

		/**
		 * Returns a translated string version for PR_SENSITIVITY
		 * @param {Number} value Value in PR_SENSITIVITY
		 * @return {String} Human readable sensitivity
		 */
		sensitivityString: function(value)
		{
			return Zarafa.core.mapi.Sensitivity.getDisplayName(value);
		},

		/**
		 * Returns a translated string version for PR_IMPORTANCE
		 * @param {Number} value Value in PR_IMPORTANCE
		 * @return {String} Human readable importance
		 */
		importanceString: function(value)
		{
			return Zarafa.core.mapi.Importance.getDisplayName(value);
		},

		/**
		 * Returns a translated string version for MeetingStatus property
		 * @param {Number} value Value in MeetingStatus
		 * @return {String} Human readable meeting status
		 */
		meetingStatusString: function(value)
		{
			return Zarafa.core.mapi.MeetingStatus.getDisplayName(value);
		},

		/**
		 * Returns a translated string version for ResponseStatus property
		 * @param {Number} value Value in ResponseStatus
		 * @return {String} Human readable response status
		 */
		responseStatusString: function(value)
		{
			return Zarafa.core.mapi.ResponseStatus.getDisplayName(value);
		},

		/**
		 * Returns a translated string version for Task status property
		 * @param {Number} value Enum value in TaskStatus
		 * @return {String} Human readable task status
		 */
		taskStatusString: function(value)
		{
			return Zarafa.core.mapi.TaskStatus.getDisplayName(value);
		},

		/**
		 * Returns a translated string version for busy status property
		 * @param {Number} value Enum value in BusyStatus
		 * @return {String} Human readable busy status
		 */
		busyStatusString: function(value)
		{
			return Zarafa.core.mapi.BusyStatus.getDisplayName(value);
		}
	});
})();
(function() {
	/*
	 * Override @class Ext.ux.Spinner class
	 * so that click event on trigger is actually fired after mousedown/mouseup has been called and
	 * focus has been shifted to the {@link Ext.form.TriggerField TriggerField}
	 */
	Ext.override(Ext.ux.Spinner, {
		initSpinner: function(){
			this.field.addEvents({
				'spin': true,
				'spinup': true,
				'spindown': true
			});

			this.keyNav = new Ext.KeyNav(this.el, {
				"up": function(e){
					e.preventDefault();
					this.onSpinUp();
				},

				"down": function(e){
					e.preventDefault();
					this.onSpinDown();
				},

				"pageUp": function(e){
					e.preventDefault();
					this.onSpinUpAlternate();
				},

				"pageDown": function(e){
					e.preventDefault();
					this.onSpinDownAlternate();
				},

				scope: this
			});

			// this code has beenchanged to listen on click event of trigger instead of
			// listening on click event of Ext.util.ClickRepeater which is fired on mousedown event
			this.field.mon(this.trigger, 'click', this.onTriggerClick, this, {
				preventDefault: true
			});

			this.field.mon(this.trigger, {
				mouseover: this.onMouseOver,
				mouseout: this.onMouseOut,
				mousemove: this.onMouseMove,
				mousedown: this.onMouseDown,
				mouseup: this.onMouseUp,
				scope: this,
				preventDefault: true
			});

			this.field.mon(this.wrap, "mousewheel", this.handleMouseWheel, this);

			this.dd.setXConstraint(0, 0, 10)
			this.dd.setYConstraint(1500, 1500, 10);
			this.dd.endDrag = this.endDrag.createDelegate(this);
			this.dd.startDrag = this.startDrag.createDelegate(this);
			this.dd.onDrag = this.onDrag.createDelegate(this);
		}
	});
})();
Ext.namespace('Zarafa.util');

// This class is defined counter-intuitively in extjs-mod,
// because we need the utility function in both extjs-mod as
// well as the WebApp core.

/**
 * @class Zarafa.util.Translations
 * @extends Object
 * Utility class containing utility functions for creating
 * translation strings.
 */
Zarafa.util.Translations = {
	msg: _('The quick brown fox jumps over the lazy dog'),

	/**
	 * This will split a translation string up into different sections.
	 * The intension is to fix problems which might occur when two labels
	 * are used to construct a full sentence, this could happen with for example
	 * paging, where the translation string is "Page X of Y" where the used labels
	 * are: "Page" and "of Y". Obviously this will not translate correctly for
	 * all languages and thus we must attempt to translate the full string, and
	 * split it up ourselves, so we can provide the correct sentences to ExtJs.
	 *
	 * @param {String} translation The translation string which must be split
	 * @param {String} split The separation string which must be found in 'translation'
	 * @return {Array} Array of strings, the first element is the translation string
	 * which comes before the 'split' and the second element is the translation string
	 * which comes after the 'split'. Note that 'split' itself is not within the result.
	 * @static
	 */
	SplitTranslation : function(translation, split)
	{
		if (!Ext.isDefined(split))
			return translation;

		var index = translation.indexOf(split);
		if (index == -1)
			return translation;

		// Find the last non-space character before the split-string
		var endFirst = index - 1;
		while (translation[endFirst] == ' ' && endFirst >= 0)
			endFirst--;

		// Find the first non-space character after the split-string
		var startSecond = index + split.length;
		while (translation[startSecond] == ' ' && startSecond < translation.length)
			startSecond++;

		return [
			translation.substr(0, endFirst + 1),
			translation.substr(startSecond)
		];
	},

	/**
	 * This will split a translation string up into different sections.
	 * The intension is to fix problems which might occur when more then two labels
	 * are used to construct a full sentence, this could happen with for example
	 * recurrence where the translation string is 'Every X Y of every Z month(s)'.
	 * We don't want to translate 'Every', 'of every' and 'month(s)' separately.
	 * Instead we want to translate the full String. And split the translated
	 * string up into the multiple labels.
	 *
	 * @param {String} translation The translation string which must be split
	 * @param {Array} split The separation strings which must be found in 'translation'
	 * @return {Array} Array of strings This contains all pieces of the translation,
	 * including the split strings. 'Every X Y of every Z month(s)' will be returned as:
	 * [ 'Every', 'X', 'Y', 'of every', 'Z', 'month(s)' ].
	 * @static
	 */
	MultiSplitTranslation : function(translation, split)
	{
		// Split must always be an array
		if (!Ext.isArray(split))
			split = [ split ];

		// Prepare our translated pieces, by default the
		// main translation string is our piece
		var pieces = new Ext.util.MixedCollection();
		pieces.add(translation);

		// Time for some magic, for each split string, we are going
		// to loop through all pieces until we find the first piece
		// which contains our split string. We then remove the piece
		// and replace it with the result from SplitTranslation
		// with a reference to which split string we have found.
		for (var i = 0; i < split.length; i++) {
			pieces.each(function(piece, index) {
				// Let SplitTranslation determine if the
				// split string is inside this piece. If it isn't then it will
				// return a single string.
				var splitPiece = Zarafa.util.Translations.SplitTranslation(piece, split[i]);
				if (!Ext.isArray(splitPiece))
					return true;

				// Remove the old piece, we are replacing it with
				// the new pieces.
				pieces.removeAt(index);

				// Depending on the translation it could happen that either
				// the first or the second piece is empty...
				if (!Ext.isEmpty(splitPiece[0])) {
					pieces.insert(index, splitPiece[0]);
					index++;
				}

				// Always insert the reference to the split string which
				// we have found.
				pieces.insert(index, split[i]);
				index++;

				if (!Ext.isEmpty(splitPiece[1])) {
					pieces.insert(index, splitPiece[1]);
					index++;
				}

				// We're done, we don't support the same split string
				// multiple times in the same string.
				return false;
			});
		}

		return pieces.getRange();
	}
};

// This document contains all translations of ExtJs components,
// translations are done using Ext.Override and must _only_ override
// the strings within an ExtJs component.
(function() {
	Ext.apply(Date, {
		dayNames : [
			_('Sunday'),
			_('Monday'),
			_('Tuesday'),
			_('Wednesday'),
			_('Thursday'),
			_('Friday'),
			_('Saturday')
		],

		monthNames : [
			_('January'),
			_('February'),
			_('March'),
			_('April'),
			_('May'),
			_('June'),
			_('July'),
			_('August'),
			_('September'),
			_('October'),
			_('November'),
			_('December')
		]
	});

	Ext.PagingToolbar.tmpPageText = Zarafa.util.Translations.SplitTranslation(_('Page {A} of {0}'), '{A}');
	Ext.override(Ext.PagingToolbar, {
		displayMsg : _('Displaying messages {0} - {1} of {2}'),
		emptyMsg : _('No messages to display'),
		beforePageText : Ext.PagingToolbar.tmpPageText[0],
		afterPageText : Ext.PagingToolbar.tmpPageText[1],
		firstText : _('First Page'),
		prevText : _('Previous Page'),
		nextText : _('Next Page'),
		lastText : _('Last Page'),
		refreshText : _('Refresh')
	});
	delete Ext.PagingToolbar.tmpPageText;

	Ext.override(Ext.DatePicker, {
		todayText : _('Today'),
		okText : '&nbsp;' + _('OK') + '&nbsp;',
		cancelText : _('Cancel'),
		todayTip : _('{0} (Spacebar)'),
		minText : _('This date is before the minimum date'),
		maxText : _('This date is after the maximum date'),
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		format : _('d/m/Y'),
		disabledDaysText : _('Disabled'),
		disabledDatesText : _('Disabled'),
		nextText : _('Next Month (Control+Right)'),
		prevText : _('Previous Month (Control+Left)'),
		monthYearText : _('Choose a month (Control+Up/Down to move years)'),
		// DatePicker prototype has copied the Date.monthNames and Date.dayNames,
		// since we just translated that, we need to copy it here again.
		monthNames : Date.monthNames,
		dayNames : Date.dayNames
	});

	Ext.override(Ext.form.HtmlEditor, {
		createLinkText : _('Please enter the URL for the link') + ':',
		buttonTips: {
			bold : {
				title: _('Bold (Ctrl+B) text'),
				text: _('Make the selected text bold.'),
				cls: 'x-html-editor-tip'
			},
			italic : {
				title: _('Italic (Ctrl+I)'),
				text: _('Make the selected text italic.'),
				cls: 'x-html-editor-tip'
			},
			underline : {
				title: _('Underline (Ctrl+U)'),
				text: _('Underline the selected text.'),
				cls: 'x-html-editor-tip'
			},
			increasefontsize : {
				title: _('Grow Text'),
				text: _('Increase the font size.'),
				cls: 'x-html-editor-tip'
			},
			decreasefontsize : {
				title: _('Shrink Text'),
				text: _('Decrease the font size.'),
				cls: 'x-html-editor-tip'
			},
			backcolor : {
				title: _('Text Highlight Color'),
				text: _('Change the background color of the selected text.'),
				cls: 'x-html-editor-tip'
			},
			forecolor : {
				title: _('Font Color'),
				text: _('Change the color of the selected text.'),
				cls: 'x-html-editor-tip'
			},
			justifyleft : {
				title: _('Align Text Left'),
				text: _('Align text to the left.'),
				cls: 'x-html-editor-tip'
			},
			justifycenter : {
				title: _('Center Text'),
				text: _('Center text in the editor.'),
				cls: 'x-html-editor-tip'
			},
			justifyright : {
				title: _('Align Text Right'),
				text: _('Align text to the right.'),
				cls: 'x-html-editor-tip'
			},
			insertunorderedlist : {
				title: _('Bullet List'),
				text: _('Start a bulleted list.'),
				cls: 'x-html-editor-tip'
			},
			insertorderedlist : {
				title: _('Numbered List'),
				text: _('Start a numbered list.'),
				cls: 'x-html-editor-tip'
			},
			createlink : {
				title: _('Hyperlink'),
				text: _('Make the selected text a hyperlink.'),
				cls: 'x-html-editor-tip'
			},
			sourceedit : {
				title: _('Source Edit'),
				text: _('Switch to source editing mode.'),
				cls: 'x-html-editor-tip'
			}
		}
	});

	Ext.override(Ext.grid.GridView, {
		sortAscText : _('Sort Ascending'),
		sortDescText: _('Sort Descending'),
		columnsText: _('Columns')
	});

	Ext.override(Ext.grid.GroupingView, {
		groupByText : _('Group By This Field'),
		showGroupsText : _('Show in Groups'),
		emptyGroupText : _('(None)')
	});

	Ext.MessageBox.buttonText.ok = _('Ok');
	Ext.MessageBox.buttonText.cancel = _('Cancel');
	Ext.MessageBox.buttonText.yes = _('Yes');
	Ext.MessageBox.buttonText.no = _('No');

	Ext.override(Ext.LoadMask, {
		msg : _('Loading') + '...'
	});

	Ext.override(Ext.form.ComboBox, {
		loadingText : _('Loading') + '...'
	});

	Ext.override(Ext.form.Field, {
		invalidText : _('The value in this field is invalid')
	});

	Ext.override(Ext.form.TextField, {
		minLengthText : _('The minimum length for this field is {0}'),
		maxLengthText : _('The maximum length for this field is {0}'),
		blankText : _('This field is required')
	});

	Ext.override(Ext.form.NumberField, {
		minText : _('The minimum value for this field is {0}'),
		maxText : _('The maximum value for this field is {0}'),
		nanText : _('{0} is not a valid number')
	});

	Ext.override(Ext.form.DateField, {
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		format : _('d/m/Y'),
		disabledDaysText : _('Disabled'),
		disabledDatesText : _('Disabled'),
		minText : _('The date in this field must be equal to or after {0}'),
		maxText : _('The date in this field must be equal to or before {0}'),
		invalidText : _('{0} is not a valid date - it must be in the format {1}')
	});

	Ext.override(Ext.form.CheckboxGroup, {
		blankText : _('You must select at least one item in this group')
	});

	Ext.override(Ext.form.RadioGroup, {
		blankText : _('You must select one item in this group')
	});

	Ext.override(Ext.form.TimeField, {
		minText : _('The time in this field must be equal to or after {0}'),
		maxText : _('The time in this field must be equal to or before {0}'),
		invalidText : _('{0} is not a valid time'),
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		format : _('G:i')
	});

	Ext.override(Ext.grid.GridView, {
		sortAscText : _('Sort Ascending'),
		sortDescText : _('Sort Descending'),
		columnsText : _('Columns')
	});

	Ext.override(Ext.grid.PropertyColumnModel, {
		nameText : _('Name'),
		valueText : _('Value'),
		// # TRANSLATORS: See http://docs.sencha.com/ext-js/3-4/#!/api/Date for the meaning of these formatting instructions
		dateFormat : _('d/m/Y'),
		trueText: _('true'),
		falseText: _('false')
	});

	Ext.apply(Ext.form.VTypes, {
		emailText : _('This field should be an e-mail address in the format "user@example.com"'),
		urlText : String.format(_('This field should be a URL in the format "{0}"'),  'http:/' + '/www.example.com'),
		alphaText : _('This field should only contain letters and _'),
		alphanumText : _('This field should only contain letters, numbers and _')
	});
})();
(function() {
	/**
	 * @class Ext.DatePicker
	 * @extends Ext.Component
	 * <p>A popup date picker. This class is used by the {@link Ext.form.DateField DateField} class
	 * to allow browsing and selection of valid dates.</p>
	 * <p>All the string values documented below may be overridden by including an Ext locale file in
	 * your page.</p>
	 * @constructor
	 * Create a new DatePicker
	 * @param {Object} config The config object
	 * @xtype datepicker
	 */
	var orig_onRender = Ext.DatePicker.prototype.onRender;
	var orig_update = Ext.DatePicker.prototype.update;
	var orig_beforeDestroy = Ext.DatePicker.prototype.beforeDestroy;
	var orig_initComponent = Ext.DatePicker.prototype.initComponent;
	Ext.override(Ext.DatePicker, {
		/**
		 * @cfg {number} width width of the datepicker (defaults to auto)
		 */
		width: '180',

		/**
		 * True to show week numbers, false otherwise.
		 * defaults to false.
		 * @cfg {Boolean} showWeekNumber
		 */
		showWeekNumber: false,

		/**
		 * Contains a collection DOM elements for week number.
		 * @property
		 * @type Ext.CompositeElementLite
		 */
		weekCells : undefined,

		/**
		 * overriden to set starting day of the week
		 * @override
		 */
		initComponent: function()
		{
			// if startDay is not specified through config then use one specified in settings
			if(!this.initialConfig.startDay) {
				this.startDay = container.getSettingsModel().get('zarafa/v1/main/week_start');
			}

			// Check for invalid start day
			if(this.startDay < 0 || this.startDay >= Date.dayNames.length) {
				// by default make it sunday
				this.startDay = 0;
			}

			orig_initComponent.apply(this, arguments);
		},

		/**
		 * handler for the render event
		 * overriden to set the width of the table
		 * @private
		 * @override
		 */
		onRender: function()
		{
			orig_onRender.apply(this, arguments);

			var table = this.getEl().down('table');
			table.applyStyles({ 'width' : this.width });
		},

		/**
		 * update function called when date has been changed (by clicking on date, through month picker, etc.)
		 * Additionally, an extra column will be created to display week number, if {@link #showWeekNumber} is configured as true.
		 * @param {Date} date The newly selected date
		 * @param {Boolean} forceRefresh
		 * @private
		 * @override
		 */
		update: function(date, forceRefresh)
		{
			// Check if week-number column will be shown or not.
			// Also check if week number column is already created.
			if(this.showWeekNumber === true && !Ext.isDefined(this.weekCells)) {
				// Get the table element of date-picker.
				var datePickerTable = this.el.child('table.x-date-inner', true);

				// Dynamically create week-number header.
				var tblHeadObj = datePickerTable.tHead;
				var headerRow = tblHeadObj.rows[0];
				var headerElement = {
					tag : 'th',
					/* # TRANSLATORS: This message is used as label for the column which indicates the week number of the month in date picker. and 'Wk' stands for week */
					html : '<span>' + _('Wk') + '</span>'
				};
				// Insert an extra table header at first position.
				Ext.DomHelper.insertFirst(headerRow, headerElement);

				// Dynamically create week-number cell in all rows.
				var tblBodyObj = datePickerTable.tBodies[0];
				var rowElement = {
					tag : 'td',
					cls : 'x-date-weeknumber',
					html : '<a><em><span></span></em></a>'
				};
				// Insert an extra cell at first position of all table rows.
				for (var i=0; i<tblBodyObj.rows.length; i++) {
					Ext.DomHelper.insertFirst(tblBodyObj.rows[i], rowElement);
				}

				this.weekCells = this.el.select('td.x-date-weeknumber a em span');
			}

			orig_update.apply(this, arguments);

			// Check if week-number column will be shown or not.
			if(this.showWeekNumber === true) {
				// Set week-number values into the dom elements respectively.
				var weekCells = this.weekCells.elements;
				var monthStartDate = date.getFirstDateOfMonth();

				for(var index = 0, len = weekCells.length; index < len; index++) {
					weekCells[index].innerHTML = monthStartDate.getWeekOfYear();
					monthStartDate = monthStartDate.add(Date.DAY, 7);
				}
			}
		},

		/**
		 * Handler for the before destroy event
		 * overriden to delete the {@link Ext.DatePicker#weekCells} property.
		 * @private
		 * @override
		 */
		beforeDestroy : function()
		{
			orig_beforeDestroy.apply(this, arguments);
			if(this.rendered && Ext.isDefined(this.weekCells)) {
				Ext.destroy(
					this.weekCells.el
				);

				delete this.weekCells;
			}
		}
	});
})();
