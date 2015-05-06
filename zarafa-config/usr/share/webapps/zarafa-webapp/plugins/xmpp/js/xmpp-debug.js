Ext.namespace('Zarafa.plugins.xmpp');

/**
 * @class Zarafa.plugins.xmpp.ABOUT
 * @extends String
 *
 * The copyright string holding the copyright notice for the Zarafa xmpp Plugin.
 */
Zarafa.plugins.xmpp.ABOUT = "";
Ext.namespace('Zarafa.plugins.xmpp');

/**
 * @class Zarafa.plugins.xmpp.XmppChat
 * @extends Ext.util.Observable
 * 
 * The XmppChat class represents a one-on-one chat session. Note that group chat is currently not supported. 
 * 
 */
// TODO implement group chat support. Refer to XEP-0045 for more details: http://xmpp.org/extensions/xep-0045.html 
// TODO keep a maximum backlog of messages in the chat, i.e. 50 lines or so.   
Zarafa.plugins.xmpp.XmppChat = Ext.extend(Ext.util.Observable, {
	
	/**
	 * Constructs a new XmppChat object.
	 * 
	 * @param {String} id of the chat session. For one-to-one chats, this is simply the bare JID of the user on the other end.
	 */
	constructor : function(xmppPlugin, id, jid)
	{
		
		// reference to the XMPP plugin
		this.xmppPlugin = xmppPlugin;
		
		// Unique ID of the chat object
		this.id = id;
		
		// Jabber ID of the other person on this one-on-one chat. Note that 
		// when this class is extended to support group chats, this should probably
		// become a list.
		this.jid = jid;
		
		// Chat state of the other participant to indicate chat states. Initially the empty string (''), 
		// it can be set to 'composing' (the user is typing), 'active', 'inactive', 'gone', and 'paused'.
		// Please refer to XEP-0085 for more information: http://xmpp.org/extensions/xep-0085.html 
		this.state = '';
		
		// Initialise the message list
		this.messages = [];
		
		var config = {};
		this.addEvents({
			/**
			 * @event messageadded
			 * 
			 * Fires after a message has been added to the chat.
			 * 
			 * @param {Zarafa.plugins.xmpp.XmppChat} chat the chat to which the message was added.
			 * @param {Zarafa.plugins.xmpp.XmppChatMessage} message chat message that was added.
			 */
			'messageadded' : true,

			/**
			 * @event chatclosed
			 * 
			 * Fired after the chat has been closed, for example due to a user action such as
			 * clicking a close button in the UI.
			 * 
			 * @param {Zarafa.plugins.xmpp.XmppChat} chat the chat which was closed.
			 */
			'chatclosed' : true,
			
			/**
			 * @event statechanged
			 * 
			 * Fired when the chat status has changed. Possible statuses are
			 * 'inactive', 'active', 'composing', and 'paused'. More information 
			 * can be found <a href="http://xmpp.org/extensions/xep-0085.html">here</a>.
			 * 
			 * @param {Zarafa.plugins.xmpp.XmppChat} chat the chat whose active changed.
			 * @param {String} status new status
			 */
			'statechanged' : true
		});
		
		this.listeners = config.listeners;
		
		// Parent constructor
		Zarafa.plugins.xmpp.XmppChat.superclass.constructor.call(this, config);
	},
	
	/**
	 * Gets a display-friendly chat title. It uses the XMPP plugin's roster manager to obtain
	 * information about the user this chat is with. If this user is found in the roster,
	 * the 'display name' of this user is returned (see {@link Zarafa.plugins.xmpp.XmppRosterEntry}).
	 * 
	 * If the JID of the other user is not found in the roster, the raw JID is returned
	 * instead. 
	 * 
	 * @return {String} a display friendly representation the other participant of this chat. 
	 */
	getDisplayTitle : function()
	{
		var entry = this.xmppPlugin.getRosterManager().getEntryByJID(this.jid);

		return entry ? entry.getDisplayName() : this.jid;
	},
	
	/**
	 * Adds a message to the chat object. Adds the message to the internal list and fires
	 * the 'messageadded' event.
	 * 
	 * @param {Zarafa.plugins.xmpp.XmppChatMessage} message message to be added.
	 */
	addMessage : function(message)
	{
		// Add message
		this.messages.push(message);
		
		// Fire added event
		this.fireEvent('messageadded', this, message);
	},
	
	/**
	 * @return {Zarafa.plugins.xmpp.XmppChatMessage|Array} list of messages in the chat.
	 */
	getMessages : function()
	{
		return this.messages;
	},	

	/**
	 * Sends a chat message to this chat.
	 * 
	 * @param {String} body the body text of the message.
	 */
	sendMessage : function(body)
	{
		// Create and populate a JSJacMessage object
		// Message type is set to 'chat', as per RFC3921, Section 2.2.1:
		// http://xmpp.org/rfcs/rfc3921.html#stanzas-message-type
		var message = new JSJaCMessage();
		message.setType('chat');
		message.setBody(body);
		message.setTo(this.jid);
		
		// Send the message to the server
		this.xmppPlugin.getConnection().send(message);
		
		// Create an XmppChatMessage object to represent the outgoing message in this chat object
		// and add it to the list
		
		var jid = this.xmppPlugin.getUserJID();
		message = new Zarafa.plugins.xmpp.XmppChatMessage('', jid, this.xmppPlugin.getResource(), body, new Date());
		this.messages.push(message);
		
		// Fire added event
		this.fireEvent('messageadded', this, message);
	},
	
	/**
	 * Closes the chat and fires the 'chatclosed' event.
	 */
	close : function()
	{
		// Fire added event
		this.fireEvent('chatclosed', this);
	},
	
	/**
	 * Sets the current status of the chat. Fires the 'statuschanged' event.
	 * @param {String} status status to set.
	 */
	setStatus : function(status)
	{
		this.status = status;
		
		// Fire activity changed event
		this.fireEvent('statuschanged', this, status);
	}
	
});
Ext.namespace('Zarafa.plugins.xmpp');

/**
 * @class Zarafa.plugins.xmpp.XmppChatManager
 * @extends Ext.util.Observable
 * 
 * Manages chats that are ongoing. Each chat has a {@link Zarafa.plugins.xmpp.XmppChat} object associated with it. Each of these has a 
 * unique ID, which simply corresponds to the JID of the other participant until group chat is implemented.
 * 
 */
// TODO implement group chat.
// TODO implement support for the <thread> element in messages
// TODO 'chatclosed' event is not being fired because chats are not explicitly closed
Zarafa.plugins.xmpp.XmppChatManager = Ext.extend(Ext.util.Observable, {
	
	/**
	 * @constructor
	 * @param {Zarafa.plugins.xmpp.XmppChatManager} xmppPlugin xmpp plugin reference.
	 */
	constructor : function(xmppPlugin)
	{
		
		this.chats = {};
		
		var config = {};
		this.xmppPlugin = xmppPlugin;
	
		this.addEvents({
			/**
			 * @event chatcreated
			 * @param {Zarafa.plugins.xmpp.XmppChatManager} manager chat manager that fired the event.
			 * @param {Zarafa.plugins.xmpp.XmppChat} chat newly created chat.
			 */
			'chatcreated' : true,
			
			/**
			 * @event chatclosed
			 * 
			 * @param {Zarafa.plugins.xmpp.XmppChatManager} manager chat manager that fired the event.
			 * @param {Zarafa.plugins.xmpp.XmppChat} chat closed chat. 
			 */
			'chatclosed' : true,
			
			/**
			 * @event messagereceived
			 * 
			 * Fires when a message is received by the chat manager, after it has been sent to the
			 * corresponding XmppChat object. 
			 * 
			 * @param {Zarafa.plugins.xmpp.XmppChatManager} manager chat manager that fired the event.
			 * @param {Zarafa.plugins.xmpp.XmppChat} chat closed chat.
			 * @param {Zarafa.plugins.xmpp.XmppChatMessage} message chat message 
			 */
			'messagereceived' : true
		});
		
		this.listeners = config.listeners;
		
		Zarafa.plugins.xmpp.XmppChatManager.superclass.constructor.call(this, config);
		
		var connection = xmppPlugin.getConnection();
		connection.registerHandler('onconnect', this.onConnect.createDelegate(this));
		connection.registerHandler('ondisconnect', this.onDisconnect.createDelegate(this));
		connection.registerHandler('message_in', this.onMessage.createDelegate(this));
		
	},
	
	/**
	 * Handles a connection event from the XMPP connection. Clears and re-initialises the
	 * roster data.
	 */
	onConnect : function()
	{
	},
	
	/**
	 * Handles a disconnect even from the XMPP connection. Clears the roster.
	 */
	onDisconnect : function()
	{
	},
	
	/**
	 * Creates a new chat object for the given JID. If a chat already exists for this JID,
	 * this object is returned instead. 
	 * 
	 * @param {String} jid jabber ID of the other participant. 
	 * @return {Zarafa.plugins.xmpp.XmppChat} a chat object for the given JID.
	 */
	createChat : function(jid)
	{
		// Check if a chat already exists for the same jid
		if (jid in this.chats)
			return this.chats[jid];
		
		// If not, create a new one.
		var chat = this.chats[jid] = new Zarafa.plugins.xmpp.XmppChat(this.xmppPlugin, jid, jid);

		// Signal that a new chat has been created
		this.fireEvent('chatcreated', this, chat);
		
		return chat;
	},
	
	/*
	 * Handles an incoming message packet from JSJaC.
	 */
	onMessage : function(packet)
	{
		var messageNode = packet.getDoc().firstChild;
		
		// Split the JID/resource in the 'from' field 
		var id = messageNode.getAttribute('id');
		var from = messageNode.getAttribute('from');
		from = Zarafa.plugins.xmpp.splitJID(from);
		
		// Get the chat object for this chat session.
		var chat = this.chats[from.jid];
		
		// Create new chat if needed
		if (!chat)
			chat = this.createChat(from.jid);
			
		// Check if the message packet has an activity tag.
		Ext.each(['active', 'composing', 'inactive', 'paused'], function(status) {
			if (messageNode.getElementsByTagName(status).length > 0)
				chat.setStatus(status);
		});
		
		// Check if the message packet has at least one body tag (according to the spec a message
		// may have multiple body elements for multiple language) and create a new XmppChatMessage 
		// for the first such tag.
		//
		// TODO support multi-language messages by selecting the appropriate body tag here
		var bodyElements = messageNode.getElementsByTagName('body');
		if (bodyElements.length > 0)
		{
			var bodyText = bodyElements[0].firstChild.nodeValue;
			
			// Create chat message object
			var message = new Zarafa.plugins.xmpp.XmppChatMessage(id, from.jid, from.resource, bodyText, new Date());
			
			// Add the message to the chat
			chat.addMessage(message);
			
			// Fire event
			this.fireEvent('messagereceived', this, chat, message);
		}
		
	}
	
});
Ext.namespace('Zarafa.plugins.xmpp');

/**
 * @class Zarafa.plugins.xmpp.XmppChatMessage
 * @extends Object
 * 
 * A chat message. Contains a body and source JID/resource.  
 * 
 */
Zarafa.plugins.xmpp.XmppChatMessage = Ext.extend(Object, {
	
	/**
	 * Constructs a new XmppChatMessage object.
	 *
	 * @param {String} id unique message ID.
	 * @param {String} jid jid source JID (i.e. piet@zarafa.com)
	 * @param {String} resource source resource (i.e. 'pidgin', 'zarafa-webaccess')
	 * @param {String} body the message body. 
	 * @param {Date} date reception data
	 */
	constructor : function(id, jid, resource, body, date)
	{
		this.id = id;
		this.jid = jid;
		this.resource = Ext.util.Format.htmlEncode(resource);
		this.body = Ext.util.Format.htmlEncode(body);
		this.date = date;
		
		// Parent constructor
		Zarafa.plugins.xmpp.XmppChatMessage.superclass.constructor.call(this);
	},
	
	/**
	 * @return {String} id unique message ID.
	 */
	getID : function()
	{
		return this.id;
	},
	
	/**
	 * @return {String} jid source JID (i.e. piet@zarafa.com)
	 */
	getJID : function()
	{
		return this.jid;
	},
	
	/**
	 * @return {String} source resource (i.e. 'pidgin', 'zarafa-webaccess')
	 */
	getResource : function()
	{
		return this.resource;
	},
	
	/**
	 * @return {String} message body
	 */
	getBody : function()
	{
		return this.body;
	},
	
	/**
	 * @return {Date} date at which the message was received.
	 */
	getDate : function()
	{
		return this.date;
	}
	
});
Ext.namespace('Zarafa.plugins.xmpp');

/**
 * XMPP presence- and chat messages identify the sender as JID. This JID can either be bare,
 * in the form [user]@[server], or full, in the form [user]@[server]/[resource]. This method
 * takes a JID and returns a tuple containing the bare JID and optionally the resource. If
 * the JID provided was a bare JID, the resource returned is null.
 * 
 * @param {String} from the full JID (i.e. user@server/resource)
 * @return {Object} an tuple in the form { jid : [bare JID], resource : [resource] }. Note that the resource part may be null if only a bare JID was provided as input.
 */
Zarafa.plugins.xmpp.splitJID = function(jid)
{
	if (jid.indexOf('/')==-1)
		return {
			jid : jid,
			resource : null
		};
	else
		return {
			jid : jid.split('/')[0],
			resource : jid.split('/')[1]
		};
};

/**
 * Convenience method that returns an XMPP status icon class for a given 'show'
 * status.
 * 
 * @param {String} show user availability. One of 'chat', 'dnd', 'away', 'xa', or null. Undefined maps to 'offline', null maps to 'online'.
 */
Zarafa.plugins.xmpp.getIconClass = function(show)
{
	return {
			'online' : 'icon_xmpp_online',
			'offline' : 'icon_xmpp_offline',
			'away' : 'icon_xmpp_away',
			'xa' : 'icon_xmpp_away',
			'chat' : 'icon_xmpp_online',
			'dnd' : 'icon_xmpp_busy'
		}[show];
};

/*
 * Helper function for XML parsing. Takes a DOM element, gets the first child element of the 'nodeName' type,
 * and returns its node value.
 * 
 * @param {Element} element dom element
 * @param {String} nodeName node name
 */
Zarafa.plugins.xmpp.getChildNodeValue = function(element, nodeName)
{
	try
	{
		return element.getElementsByTagName(nodeName)[0].firstChild.nodeValue;
	} catch (e)
	{
		return null;
	}
};

/**
 * @class Zarafa.plugins.xmpp.XmppPlugin
 * @extends Zarafa.core.Plugin
 * 
 * Note that connecting to (your local) OpenFire requires the extra option 'authtype = nonsasl'.
 * 
 */
Zarafa.plugins.xmpp.XmppPlugin = Ext.extend(Zarafa.core.Plugin, {
	
	/**
	 * @constructor
	 * @param {Object} config Configuration object
	 */
	constructor : function(config)
	{
		// Register events
		this.addEvents([
			/**
			 * @event connect
			 * 
			 * Fires when the XMPP plugin has successfully connected to the server.
			 * @param {XmppPlugin} plugin the XMPP plugin object that fired the event  
			 */
			'connect',
			
			/**
			 * @event disconnect
			 * 
			 * Fires when the XMPP plugin disconnected from the server.
			 * @param {XmppPlugin} plugin the XMPP plugin object that fired the event  
			 */
			'disconnect',
			
			/**
			 * @event statuschanged
			 * 
			 * Fires when the XMPP plugin's connection status changed. Possible values for the connection
			 * status are 'connecting', 'disconnecting', 'resuming', 'suspending', 'aborted', 'internal_server_error', 
			 * 'processing', 'onerror_fallback', 'proto_error_fallback', 'session-terminate-conflict'
			 * 
			 * @param {XmppPlugin} plugin the XMPP plugin object that fired the event  
			 * @param {String} status current connection status. 
			 */
			'statuschanged',
			
			/**
			 * @event error
			 * 
			 * Fires when the XMPP plugin has encountered an error.
			 * @param {XmppPlugin} plugin the XMPP plugin object that fired the event.
			 * @param {String} error error code as XML. Refer to the <a href="http://blog.jwchat.org/jsjac-1.3.4/doc">JsJac documentation</a> for more information.  
			 */
			'error'			
		]);
		
		// Call parent constructor
		Zarafa.plugins.xmpp.XmppPlugin.superclass.constructor.call(this, config);
	},
	
	/**
	 * Initialises the XMPP plug-in by creating an XMPP connection object, roster manager,
	 * and chat manager. This method is called directly by the constructor.
	 * @protected
	 */
	initPlugin : function()
	{
		var settingsModel = container.getSettingsModel();
		var user = container.getUser();

		Zarafa.plugins.xmpp.XmppPlugin.superclass.initPlugin.apply(this, arguments);

		// XMPP server settings
		// TODO get these from config/settings, etc
		this.xmppHttpBase = settingsModel.get(this.getSettingsBase() + '/httpbase'),
		this.xmppDomain = settingsModel.get(this.getSettingsBase() + '/domain'),
		this.xmppUser = user.getUserName(),
		this.xmppPassword = user.getSessionId(),
		this.xmppResource = settingsModel.get(this.getSettingsBase() + '/resource'),

		// Default presence settings
		this.presence = new Zarafa.plugins.xmpp.XmppPresence(null, null)

		// Create XMPP connection object and hook handler functions.
		this.connection = this.createConnection();
		
		// Create a roster manager 
		this.rosterManager = new Zarafa.plugins.xmpp.XmppRosterManager(this);
		
		// Create a chat manager
		this.chatManager = new Zarafa.plugins.xmpp.XmppChatManager(this);
		
		// Connect to the server
		this.connect();
		
	},
	
	/*
	 * Creates a JSJaC connection object and hooks the appropriate event handlers.
	 */
	createConnection : function()
	{
		// Create new arguments object
		var args = new Object();
		
		// Connection arguments
		args.httpbase = this.xmppHttpBase;
		args.timerval = 2000;
		
		// Debug logging interface
		args.oDbg = new JSJaCConsoleLogger();
		args.oDbg.setLevel(1);

		// Create a new HTTP binding connection
		var connection = new JSJaCHttpBindingConnection(args);

		// Hook event handlers
	    connection.registerHandler('onConnect', this.handleOnConnect.createDelegate(this));
	    connection.registerHandler('onError',this.handleError.createDelegate(this));
	    connection.registerHandler('onStatusChanged',this.handleStatusChanged.createDelegate(this));
	    connection.registerHandler('onDisconnect',this.handleDisconnected.createDelegate(this));

		return connection;
	},
	
	/*
	 * Connects to the XMPP server. 
	 */
	connect : function()
	{
		// setup args for connect method
		var args = new Object();
		
		// copy the configuration settings into the arguments 
		args.domain = this.xmppDomain;
		args.username = this.xmppUser;
		args.resource = this.xmppResource;
		args.pass = this.xmppPassword;
		args.register = false;
		args.authtype = this.authtype;
		
		// Connect
		this.connection.connect(args);
	},

	/*
	 * Handles the connect event fired by the JSJaC connection.
	 */
	handleOnConnect : function()
	{
		// Fire connect event
		this.fireEvent('connect', this);
		
		// Send a presence packet
		this.rosterManager.setPresence('online', '');
	},
	
	/*
	 * Handles the disconnect event fired by the JSJaC connection.
	 */
	handleDisconnected : function()
	{
		// Fire disconnect event
		this.fireEvent('disconnect', this);
	},	

	/*
	 * Handles the error event fired by the JSJaC connection.
	 */
	handleError : function(err)
	{
		// Fire error event
		this.fireEvent('error', this, err);
	},

	/*
	 * Handles the status changed event fired by the JSJaC connection.
	 */
	handleStatusChanged : function(status)
	{
		// Fire status event
		this.fireEvent('statuschanged', this, status);
	},
	
	/**
	 * Gets the roster manager associated with this XMPP plugin instance.
	 * @return {Zarafa.plugins.xmpp.XmppRosterManager} the roster manager associated with this XMPP plugin instance.
	 */
	getRosterManager : function()
	{
		return this.rosterManager;
	},
	
	/**
	 * Gets the chat manager associated with this XMPP plugin instance.
	 * @return {Zarafa.plugins.xmpp.XmppRosterManager} the chat manager associated with this XMPP plugin instance.
	 */
	getChatManager : function()
	{
		return this.chatManager;
	},
	
	/**
	 * Gets the JSJaC connection.
	 * 
	 * @return {JSJaCConnection} connection.
	 */
	getConnection : function()
	{
		return this.connection;
	},
	
	/**
	 * Gets the JID of the currently logged in user. 
	 * @return {String} JID of the currently logged in user.
	 */
	getUserJID : function()
	{
		return this.xmppUser + '@' + this.xmppDomain;
	},
	
	/**
	 * Gets the resource the current user is logged in with.
	 * @return {String} resource the current user is logged in with.
	 */
	getResource : function()
	{
		return this.xmppResource;
	}

});

// Register the plugin with the framework.
Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'xmpp',
		displayName : _('XMPP Plugin'),
		about : Zarafa.plugins.xmpp.ABOUT,
		pluginConstructor : Zarafa.plugins.xmpp.XmppPlugin
	}));
});

Ext.namespace('Zarafa.plugins.xmpp');

/**
 * @class Zarafa.plugins.xmpp.XmppPresence
 * @extends Object
 * 
 * Represents the presence of a roster entry. Presence is expressed as a (show, status) tuple. The <i>show</i> property 
 * represents the availability of a user, and may be one of 'chat', 'dnd', 'away', 'xa', 'online', or 'offline. 
 * 
 * The <i>status</i> property is a customized status message that can be set to anything and defaults to the empty string. 
 * 
 */
Zarafa.plugins.xmpp.XmppPresence = Ext.extend(Object, {
	
	/**
	 * Constructs a new XmppPresence object.
	 * @param {String} show user availability. One of 'chat', 'dnd', 'away', 'xa', 'online', or 'offline'. 
	 * @param {String} status user status message
	 */
	constructor : function(show, status)
	{
		this.show = show;
		this.setStatus(status);
		
		// Parent constructor
		Zarafa.plugins.xmpp.XmppPresence.superclass.constructor.call(this);
	},
	
	/**
	 * @return {String} user status message.
	 */
	getStatus : function()
	{
		return this.status;
	},
	
	/**
	 * @return {String} the show property, which represents the availability of the user. One of 'chat', 'dnd', 'away', 'xa', 'online', or 'offline'.
	 */
	getShow : function()
	{
		return this.show;
	},
	
	/**
	 * Sets the show and status properties.
	 * @param {String} show user availability. One of 'chat', 'dnd', 'away', 'xa', 'online', or 'offline'. 
	 * @param {String} status user status message
	 */
	set : function(show, status)
	{
		this.show = show;
		this.setStatus(status);
	},
	
	/**
	 * Sets the user availability.
	 * 
	 * @param {String} show user availability. One of 'chat', 'dnd', 'away', 'xa', 'online', or 'offline'. 
	 */
	setShow : function(show)
	{
		this.show = show;		
	},

	/**
	 * Sets the status message.
	 *  
	 * @param {String} status user status message
	 */
	setStatus : function(status)
	{
		this.status = Ext.util.Format.htmlEncode(status);
	},
	
	/**
	 * Creates a JSJac packet representation of this presence.
	 * 
	 * @return {JSJaCPresence} JSJac presence packet.
	 */
	toJSJacPresence : function()
	{
		// Set presence
		var presencePacket = new JSJaCPresence();

		// Only include the 'show' property if it's not
		// set to 'online' (according to spec, just omit the show tag).
		if (this.show!='online' && this.show!='offline')
			presencePacket.setShow(this.show);
		
		presencePacket.setStatus(this.status);
		
		return presencePacket;
	}
	
});
Ext.namespace('Zarafa.plugins.xmpp');

/**
 * @class Zarafa.plugins.xmpp.XmppRosterEntry
 * @extends Object
 * 
 * Represents an entry (user) in the roster. 
 * 
 */
Zarafa.plugins.xmpp.XmppRosterEntry = Ext.extend(Object, {
	
	/**
	 * @constructor
	 * @param {String} jid Unique XMPP ID ('Jabber ID')
	 * @param {String} name user name
	 * @param {String} subscription subscription type ('none', 'to', 'from', 'both')
	 */
	constructor : function(jid, name, subscription)
	{
		
		// Copy parameters
		this.jid = jid;
		this.setName(name);
		this.subscription = subscription;
		
		// Initialise group list
		this.groups = [];
		
		// Create a vCard for this entry
		this.vCard = new Zarafa.plugins.xmpp.XmppVCard();
		
		// Create a presence object
		this.presence = new Zarafa.plugins.xmpp.XmppPresence('offline', '');
		
		// Parent constructor
		Zarafa.plugins.xmpp.XmppRosterEntry.superclass.constructor.call(this);
	},
	
	/**
	 * @return {String} JID ('Jabber ID') of this entry.
	 */
	getJID : function()
	{
		return this.jid;
	},
	
	/**
	 * @return {String} returns the user name of this entry. 
	 */
	getName : function()
	{
		return this.name;
	},
	
	/**
	 * Returns a display-friendly representation of the entry. 
	 * @return {String} the name of the entry if this has been set, the JID otherwise. 
	 */
	getDisplayName : function()
	{
		return this.getVCard().getFullName() || this.name || this.jid;
	},
	
	/**
	 * @return {String} subscription type ('none', 'to', 'from', 'both')
	 */
	getSubscription : function()
	{
		return this.subscription;
	},
	
	/**
	 * Sets the entry's JID.
	 * @param {String} jid Unique XMPP ID ('Jabber ID')
	 */
	setJID : function(jid)
	{
		this.jid = jid;
	},
	
	/**
	 * Sets the entry's user name.
	 * @param {String} name user name
	 */
	setName : function(name)
	{
		this.name = Ext.util.Format.htmlEncode(name);
	},
	
	/**
	 * Sets the entry's subscription type.
	 * @param {String} subscription subscription type ('none', 'to', 'from', 'both')
	 */
	setSubscription : function(subscription)
	{
		this.subscription = subscription;
	},
	
	/**
	 * @return {String|Array} the set of groups this entry is a member of
	 */
	getGroups : function()
	{
		return this.groups;
	},
	
	/**
	 * Clears the list of groups in this entry. 
	 */
	clearGroups : function()
	{
		this.groups = [];
	},
	
	/**
	 * Adds a group to this entry.  
	 * 
	 * @param {String} group a group this entry is a part of.
	 */
	addGroup : function(group)
	{
		this.groups.push(Ext.util.Format.htmlEncode(group));
	},
	
	/**
	 * Removes a group from this entry.
	 * 
	 * @param {String} group a group this entry is a part of.
	 */
	removeGroup : function(group)
	{
		this.groups.remove(group);
	},
	
	/**
	 * Returns the vCard for this entry.
	 * 
	 * @return {Zarafa.plugins.xmpp.XmppVCard} the vCard for this entry.
	 */
	getVCard : function()
	{
		return this.vCard;
	},
	
	/**
	 * Gets the presence of this entry.
	 * 
	 * @return {Zarafa.plugins.xmpp.XmppPresence} presence object.
	 */
	getPresence : function()
	{
		return this.presence;
	},
	
	/**
	 * Sets the presence of the entry.
	 *  
	 * @param show user availability. One of 'chat', 'dnd', 'away', 'xa', or null 
	 * @param status user status message
	 */
	setPresence : function(show, status)
	{
		this.presence.set(show, status);
	}
	
});
Ext.namespace('Zarafa.plugins.xmpp');

/**
 * @class Zarafa.plugins.xmpp.XmppRosterManager
 * @extends Ext.util.Observable
 * 
 * The roster manager maintains a list of known users. The manager obtains a complete list of known 
 * users at login, after which updates to this list (i.e. user add/remove events, presence changed)
 * are sent from the server as separate notifications (presence messages). 
 * 
 * For more information on the XMPP roster and roster management, refer to 
 * <a href="http://xmpp.org/rfcs/rfc3921.html#roster">Section 7 of the XMPP specification (rfc3921)</a>. 
 * 
 */
// TODO add an 'entry changed' event for when the vCard is loaded, or for when some other change
// to a single item is made.
Zarafa.plugins.xmpp.XmppRosterManager = Ext.extend(Ext.util.Observable, {
	
	/**
	 * @constructor
	 * @param {Zarafa.plugins.xmpp.XmppPlugin} xmppPlugin XMPP plugin instance that the roster manager belongs to. 
	 */
	constructor : function(xmppPlugin)
	{
		
		// Reference to the XMPP plugin that this roster manager belongs to
		this.xmppPlugin = xmppPlugin;
		
		// Entries are kept in a map.
		this.entries = {};
	
		// Empty config object. Just a place holder for when someone wants to add it to the
		// parameter list in the future.
		var config = {};
		this.addEvents({
			/**
			 * @event rosterchanged
			 * 
			 * Fires when the set of entries in the roster has changed. It fires straight after the 
			 * roster has first been obtained from the server through and IQ query message, and when
			 * users are added to- or deleted from the roster. 
			 * 
			 * @param {Zarafa.plugins.xmpp.XmppRosterManager} rosterManager roster manager that fired the event
			 * @param {Object} entries map of entries in the roster, with JID as index.
			 */
			'rosterchanged' : true,
			
			/**
			 * @event presencechanged
			 * 
			 * Fires when the presence of an invididual entry changes. 
			 * 
			 * @param {Zarafa.plugins.xmpp.XmppRosterManager} rosterManager roster manager that fired the event
			 * @param {Zarafa.plugins.xmpp.XmppRosterEntry} item item whose presence has changed 
			 */
			'presencechanged' : true
		});
		
		
		this.listeners = config.listeners;

		// Call superclass constructor
		Zarafa.plugins.xmpp.XmppRosterManager.superclass.constructor.call(this, config);
		
		// Hook the event listeners of the connection object 
		// TODO unhook this somewhere for a cleanup? Only relevant if plugins can get un-loaded at run-time I guess?
		var connection = xmppPlugin.getConnection();
		connection.registerHandler('onconnect', this.onConnect.createDelegate(this));
		connection.registerHandler('ondisconnect', this.onDisconnect.createDelegate(this));
		connection.registerHandler('presence', this.onPresence.createDelegate(this));
		connection.registerHandler('iq', this.onIQ.createDelegate(this));
	},
	
	/*
	 * Handles a connection event from the XMPP connection. Clears and re-initialises the
	 * roster data.
	 */
	onConnect : function()
	{
		// Get roster
		this.queryRoster();
		
		// Get own vCard
		this.queryVCard();

		// Fire changed event
		this.fireEvent('rosterchanged', this, this.entries);
	},
	
	/*
	 * Handles a disconnect even from the XMPP connection. Clears the roster.
	 */
	onDisconnect : function()
	{
		// TODO fire event
		this.entries = {};
		
		// Fire changed event
		this.fireEvent('rosterchanged', this, this.entries);
	},
	
	/*
	 * Parses an XMPP presence packet.
	 */
	// TODO can a presence packet contain multiple presence nodes?
	onPresence : function(packet)
	{
		// Get the <presence> 
		var presenceNode = packet.getDoc().firstChild;
		
		// Get the from field
		var from = presenceNode.getAttribute('from');
		
		// The from field is constructed as JID/resource, so remove the resource part
		// here to yield the JID
		from = Zarafa.plugins.xmpp.splitJID(from).jid;

		// Optional show/status nodes
		// As per XMPP spec, the <show> is omitted when the user is online
		var show = Zarafa.plugins.xmpp.getChildNodeValue(presenceNode, 'show') || 'online';
		var status = Zarafa.plugins.xmpp.getChildNodeValue(presenceNode, 'status') || '';
		
		// Get the presence type
		var type = presenceNode.getAttribute('type');
		if (type == 'unavailable') show = 'offline';

		// Get an entry object that corresponds to JID 
		var entry = this.entries[from];
		
		// If the entry is not found in the roster, create a new one
		if (!entry)
		{
			// Create new entry
			entry = new Zarafa.plugins.xmpp.XmppRosterEntry(from, null, null);
			
			// Add it to the roster
			this.entries[from] = entry;
		
			// Fire changed event
			this.fireEvent('rosterchanged', this, this.entries);
			
		}

		// Update entry presence
		entry.getPresence().setShow(show);
		entry.getPresence().setStatus(status);
		
		var xElements = presenceNode.getElementsByTagName('x');

		/*
		for (var i=0, xElement; xElement=xElements[i]; i++)
		{
			var xmlns = xElement.getAttribute('xmlns');

			// Check if this JID has a vCard that can be queried
//			if (xmlns.indexOf(NS_VCARD) != -1 && !entry.getVCard().isPopulated())
//				this.queryVCard(from);
			
			// Check if this JID has an avatar image that can be retrieved
			// if (xmlns.indexOf('vcard-temp:x:update') != -1)
			// ...
		}
		*/
		
		// Fire presence changed event
		this.fireEvent('presencechanged', this, entry);
		
	},
	
	/**
	 * Sends a request to the server to acquire the roster.  
	 * 
	 * Refer to RFC3921 Section 7.3 for more information
	 * http://xmpp.org/rfcs/rfc3921.html#roster
	 */
	queryRoster : function()
	{
		// Create a new JSJacIQ object, which represents an IQ (information query) packet,
		// and populate it with the required information.
		var packet = new JSJaCIQ();
	    packet.setIQ(null, 'get', 'roster_1');
	    packet.setQuery(NS_ROSTER);
	    
	    // Sends the IQ packet to the server.
	    this.xmppPlugin.getConnection().sendIQ(packet, {result_handler: this.queryRosterCallback.createDelegate(this) });
	},
	
	/**
	 * Callback function for the queryRoster method. It inspects the received packet's contents and
	 * builds a list of roster entries. 
	 * @param {JsJacPacket} packet
	 */
	queryRosterCallback : function(packet)
	{
		// This method first clears the entries map and then repopulates it
		// from scratch as entries are found in the packet. This saves us from
		// having to write logic to remove entries from the current roster 
		// that do not appear in the packet. 
		
		// Retain the old entries so that we may re-insert them into the roster
		// as they are found in the packet
		var oldEntries = this.entries || {};
		var me = this.getMe();
		
		// Clear the roster, but retain the 'me' object.
		this.entries = {};
		this.entries[me.getJID()] = me;
		
		var itemNodeList = packet.getDoc().getElementsByTagName('item');
		for (var i=0, item; item = itemNodeList.item(i); i++)
		{
			var jid = item.getAttribute('jid');
			var name = item.getAttribute('name');
			var subscription = item.getAttribute('subscription');
			
			// Check if the user already existed in the roster, and recycle it if so
			var entry = oldEntries[jid];
			
			// If no entry is found, add it  
			if (entry)
			{
				
				entry.setJID(jid);
				entry.setName(name);
				entry.setSubscription(subscription);

				entry.clearGroups();
			} else
			{
				entry = new Zarafa.plugins.xmpp.XmppRosterEntry(jid, name, subscription);
			}

			// Add the entry to the entry map
			this.entries[jid] = entry;
			
			// Query the entry's vCard info
			this.queryVCard(jid);
			
			// Process for nested <group> elements. Since a user can be a member
			// of multiple groups, there may be zero or more.
			var groupNodeList = item.childNodes;
			for (var j=0, groupElement; groupElement = groupNodeList.item(j); j++)
			{
				// Child nodes of <item> should be <group>, but let's skip any non-<group>
				// nodes here just to make sure this method doesn't break when new stuff
				// gets added to the spec.
				if (groupElement.nodeName != 'group') continue;
				
				var groupName = groupElement.firstChild.nodeValue;
				
				// Add the group to the entry
				entry.addGroup(groupName);
			}
		}
		
		// Fire changed event
		this.fireEvent('rosterchanged', this, this.entries, this.groups);
	},
	
	/**
	 * Sends an information query (IQ) packet to the XMPP server to request the vCard for
	 * a given entry. 
	 * 
	 * @param {String} jid jid of the entry to query. 
	 */
	queryVCard : function(jid)
	{
		// Create a new JSJacIQ object, which represents an IQ (information query) packet,
		// and populate it with the required information.
		var packet = new JSJaCIQ();
	    packet.setIQ(jid, 'get', Math.random() * 10000000);
	    
	    // Cross-browser method for getting a <vCard xmlns="vcard-temp"/> element.
	    var doc = packet.getDoc();
	    if (doc.createElementNS)
    	{
    	    var vCardElement = doc.createElementNS(NS_VCARD, 'vCard');
    	    doc.firstChild.appendChild(vCardElement);
    	} else
		{
    	    var vCardElement = packet.appendNode('vcard');
    	    vCardElement.setAttribute('xmlns', NS_VCARD);
		}

	    // Fill in the 'from' field
	    // doc.firstChild.setAttribute('from', this.xmppPlugin.getUserJID());
	    
	    // Sends the IQ packet to the server.
	    this.xmppPlugin.getConnection().sendIQ(packet, { result_handler: this.queryVCardCallback.createDelegate(this) });
	},
	
	/*
	 * Handles a vcard query result.
	 */
	queryVCardCallback : function(packet)
	{
		var element = packet.getDoc().firstChild;
		
		// Get the JID of the originating user
		var from = element.getAttribute('from');
		
		if (from)
		{
			from = Zarafa.plugins.xmpp.splitJID(from).jid;
			
			// Get a roster entry for this vCard
			var entry = this.getEntryByJID(from);
			
			entry.getVCard().populate(element.getElementsByTagName('vCard')[0]);
		}
	},

	/*
	 * Handles incoming IQ (information query) packets and passes packets of the namespace
	 * 'jabber:iq:roster' (NS_ROSTER) to the processRosterQuery method. These packets update
	 * the roster contents and can hold messages about items being added, removed, or updated.
	 * 
	 * A large packet carrying multiple items is sent by the server to the client in response
	 * to the roster query sent by the queryRoster method. This packet is used to populate the
	 * roster initially after connect.
	 * 
	 * @param {JSJacIQ} packet incoming IQ packet 
	 */
	onIQ : function(packet)
	{
		// Process query items
		var queryNodes = packet.getDoc().firstChild.getElementsByTagName('query');
		Ext.each(queryNodes, function(query) {
			if (query.getAttribute('xmlns') == NS_ROSTER) this.processRosterQuery(query);
		}, this);
	},
	
	/*
	 * Processes a roster query element.
	 * 
	 * Refer to RFC3921 Section 7.3 for more information
	 * http://xmpp.org/rfcs/rfc3921.html#roster
	 * 
	 * @param {Element} element dom element that represents a <query> element.
	 */
	processRosterQuery : function(element)
	{
		
		Ext.each(element.getElementsByTagName('item'), function(item) {
			
			// Get the JID, name, and subscription type
			var jid = item.getAttribute('jid');
			var name = item.getAttribute('name');
			var subscription = item.getAttribute('subscription');
			
			// Get entry object
			var entry = this.entries[jid];
			
			// If the subscription type is 'remove' and the item exists in the
			// roster, remove it
			if (subscription == 'remove' && entry)
				delete this.entries[jid];

			// If the subscription type is not 'remove', add/update the entry
			if (subscription != 'remove')
			{
				// If the entry doesn't exist in the roster, create it.
				if (!entry)
				{
					entry = new Zarafa.plugins.xmpp.XmppRosterEntry(jid, name, subscription);
					this.entries[jid] = entry;
					
					// Get vCard for the new entry
					this.queryVCard(jid);
				}
				
				// Collect groups
				entry.clearGroups();
				Ext.each(item.getElementsByTagName('group'), function(group) {
					entry.addGroup(group.firstChild.nodeValue);
				});
			}
			
		}, this);
		
		// Fire presence changed event
		this.fireEvent('rosterchanged', this, this.entries);
		
	},

	/**
	 * Returns a map of entries
	 * @return {Object} map of roster entries, indexed by JID.
	 */
	getEntries : function()
	{
		return this.entries;
	},

	/**
	 * Gets and entry by (bare) JID. If the entry does not exists, this method returns undefined.
	 * @param {String} jid entry's bare JID. 
	 * @return {Zarafa.plugins.xmpp.XmppRosterEntry} the entry that corresponds to the given bare JID, or undefined if no such entry exists.
	 */
	getEntryByJID : function(jid)
	{
		return this.entries[jid];
	},
	
	/**
	 * Gets a roster entry by email address.
	 * 
	 * @param {String} email email address to look for.
	 * @return {Zarafa.plugins.xmpp.XmppRosterEntry} the entry that corresponds to the email address, or undefined if no such entry exists.
	 */
	getEntryByEmail : function(email)
	{
		for (var key in this.entries)
			if (this.entries[key].getVCard().containsEmail(email))
				return this.entries[key];
		
		return undefined;
	},
	
	/**
	 * Finds the XmppRosterEntry that corresponds to the currently logged in user. If the entry is not found, a new unitinialised entry is
	 * created.
	 * @return {XmppRosterEntry} the entry that corresponds to the currently logged in user.
	 */
	getMe : function()
	{
		var jid = this.xmppPlugin.getUserJID();
		var me = this.entries[jid];
		
		if (!me)
			this.entries[jid] = me = new Zarafa.plugins.xmpp.XmppRosterEntry(jid, null, 'both');
		
		return me;
	},
	
	/**
	 * @return {String} the 'show' property of the entry that represents the currently logged in user.
	 */
	getMyShow : function()
	{
		return this.getMe().getPresence().getShow();
	},
	
	/**
	 * @return {String} the status string of the entry that represents the currently logged in user.
	 */
	getMyStatus : function()
	{
		return this.getMe().getPresence().getStatus();
	},
	
	/**
	 * Sets the presence (show, status) of the currently logged in user and sends it to the XMPP server. For
	 * a description of the show and status properties, see {@see Zarafa.plugins.xmpp.XmppPresence}.
	 * 
	 * @param {String} show show presence (i.e. 'away', 'dnd', etc.) 
	 * @param {String} status status text (i.e. 'I'm not here right now) 
	 */
	setPresence : function(show, status)
	{
		// Get the entry of the currently logged in user and get its presence
		// If there is currently no entry in the roster that corresponds to this user,
		// Create a new empty presence object and use that instead
		var me = this.getMe();
		
		// Update the me object
		me.getPresence().setShow(show);
		me.getPresence().setStatus(status);

		// Send the presence packet to the server
		this.xmppPlugin.getConnection().send(me.getPresence().toJSJacPresence());
		
		// Fire presence changed event
		this.fireEvent('presencechanged', this, me);
	}
	
});
Ext.namespace('Zarafa.plugins.xmpp');

/**
 * @class Zarafa.plugins.xmpp.XmppVCard
 * @extends Object
 * 
 * Represents vCard information about an XMPP roster entry. This can be used for instance
 * to relate roster entries and email addresses. 
 * 
 */
// TODO parse the rest of the VCARD information
// TODO implement avatars
Zarafa.plugins.xmpp.XmppVCard = Ext.extend(Object, {
	
	/**
	 * @constructor
	 */
	constructor : function()
	{
		
		// Set populated to false. This property is used to check if the 
		// vcard has previously been populated using a vcard query. 
		this.populated = false;
		
		// Image is not initialised initially (to be used for avatar)
		this.imageType = '';
		this.imageData = '';
		
		// Initialise group list
		this.emailAddresses = [];
		
		// Initialise full name
		this.fullName = '';
		
		// Parent constructor
		Zarafa.plugins.xmpp.XmppVCard.superclass.constructor.call(this);
	},
	
	/**
	 * 
	 * @return {Array}
	 */
	getEmailAddresses : function()
	{
		return this.emailAddresses;
	},
	
	/**
	 * @return {String} full name (i.e. 'Bill Gates').
	 */
	getFullName : function()
	{
		return this.fullName;
	},
	
	/**
	 * Checks if a given email is one of the email addresses in this vCard.
	 * 
	 * @param {String} email email address to check against. 
	 * @return {Boolean} true iff the email address is in this vcard instance.
	 */
	containsEmail : function(email)
	{
		return this.emailAddresses.indexOf(email) != -1;
	},
	
	/**
	 * Extracts the email addresses from a vCard XML item. 
	 *  
	 * @param {Element} element a <vCard> dom element from an information query (<iq>) message.
	 */
	populateEmail : function(element)
	{
		// Get email addresses from the vCard element. First get the <EMAIL> element
		var emailElements = element.getElementsByTagName('EMAIL');
		
		// If there is at least one such element, just take the first one (assume that there are
		// either zero or none). Iterate over its children.
		if (emailElements.length>0)
			Ext.each(emailElements[0].childNodes, function(emailElement) {
				
				// These tags may be empty (i.e. <USER></USER>), so check
				// if emailElement.firstChild isn't falsy. 
				if (emailElement.firstChild)
					this.emailAddresses.push(emailElement.firstChild.nodeValue);
				
			}, this);
	},
	
	/**
	 * Extracts the avatar (photo) from a vCard XML item. 
	 *  
	 * @param {Element} element a <vCard> dom element from an information query (<iq>) message.
	 */
	populatePhoto : function(element)
	{
		/*
		// Get avatars from the vCard element. First get the <PHOTO> element
		var photoElements = element.getElementsByTagName('PHOTO');
		
		// If there is at least one such element, just take the first one (assume that there are
		// either zero or none). Iterate over its children.
		if (photoElements.length>0)
		{
			...
		}
		*/
	},
	
	/**
	 * Extracts the personal info from a vCard XML item (name, address, etc.) 
	 *  
	 * @param {Element} element a <vCard> dom element from an information query (<iq>) message.
	 * TODO incomplete
	 */
	populatePersonalInfo : function(element)
	{
		this.fullName = Zarafa.plugins.xmpp.getChildNodeValue(element, 'FN');
	},
	
	/**
	 * Populates the vCard with data from an XML DOM element. 
	 *  
	 * @param {Element} element a <vCard> dom element from an information query (<iq>) message.
	 */
	populate : function(element)
	{
		
		// Get email addresses
		this.populateEmail(element);
		
		// Get avatar
		this.populatePhoto(element);
		
		// Personal information (name, department, address, etc.)
		this.populatePersonalInfo(element);
		
		// Signal that the vCard has now been populated with data from a vCard element
		this.populated = true;
	},
	
	/**
	 * @return {Boolean} true iff this entry has been previously populated with data from a vCard element. 
	 */
	isPopulated : function()
	{
		return this.populated;
	}

	
});
Ext.namespace('Zarafa.plugins.xmpp');
/**
 * @class Zarafa.plugins.xmpp.XmppWidget
 * @extends Zarafa.core.ui.widget.Widget
 */
// TODO the status text on the right in the tool bar does not show the correct status text if the widget is 
// created after the XMPP plugin was already connected (in which case the 'connect' event is missed).
Zarafa.plugins.xmpp.Widget = Ext.extend(Zarafa.core.ui.widget.Widget,
{

	/**
	 * @constructor
	 */
	constructor : function(config)
	{
		
		// Hook into the plugin events
		this.hookPlugin();
		
		// Get the show status of the currently logged in user (used for the menu icon)
		var show = this.xmppPlugin.getRosterManager().getMe().getPresence().getShow();
		
		config = config || {};
		Ext.applyIf(config,
			{
			
			    height : 400,
			    layout: 'fit',
			    tbar : {
			    	xtype : 'toolbar',
			    	items : [{
			    		xtype : 'tbbutton',
						text: _('Status'),
						ref : '../statusToolbarItem',
						iconCls : Zarafa.plugins.xmpp.getIconClass(show),
						menu : this.statusMenu = new Ext.menu.Menu({
							items : [{
								text : 'Available',
								iconCls : 'icon_xmpp_online',
								handler : function() { this.onStatusMenu('online'); },
								scope : this
							},{
								text : 'Free to chat',
								iconCls : 'icon_xmpp_online',
								handler : function() { this.onStatusMenu('chat'); },
								scope : this
							},{
								text : 'Away',
								iconCls : 'icon_xmpp_away',
								handler : function() { this.onStatusMenu('away'); },
								scope : this
							},{
								text : 'Extended Away',
								iconCls : 'icon_xmpp_away',
								handler : function() { this.onStatusMenu('xa'); },
								scope : this
							},{
								text : 'Do not disturb',
								iconCls : 'icon_xmpp_busy',
								handler : function() { this.onStatusMenu('dnd'); },
								scope : this
							},
							this.statusTextField = new Ext.form.TextField({
						    	ref : '../../statusTextField',
						    	listeners : {
						    		change : this.onStatusFieldChange,
						    		specialkey : this.onStatusFieldSpecialKey,
						    		scope : this
						    	}
				    		})]
						})
				    },{
				    	xtype: 'tbfill'
				    },{
				    	xtype : 'tbtext',
				    	name : 'statusText',
				    	ref : '../statusText',
				    	text : '...'
				    }]
			    },
			    items : [
			    this.chatPanel = new Zarafa.plugins.xmpp.ui.XmppChatTabPanel({
					activeTab: 0,
		    		items : [
	    			    this.rosterPanel = new Zarafa.plugins.xmpp.ui.XmppRosterPanel({
	    			    	title : 'Contacts',
	    					listeners : {
	    						'rowdblclick' : this.rosterDoubleClick,
	    						scope : this
	    					}
	    			    })]
			    })]
			});
		
		// Call parent constructor
		Zarafa.plugins.xmpp.Widget.superclass.constructor.call(this, config);
	},
	
	/*
	 * Does a lookup on the XMPP plugin from the container and hooks the event handlers it needs. 
	 */
	hookPlugin : function()
	{
		// Find the XMPP plugin
		this.xmppPlugin = container.getPluginByName('xmpp');
		
		if (this.xmppPlugin)
		{
			
			this.xmppPlugin.addListener('connect', this.onConnect, this);
			this.xmppPlugin.addListener('disconnect', this.onDisconnect, this);
			this.xmppPlugin.getRosterManager().addListener('presencechanged', this.onPresenceChanged, this);
			
		} else
			throw 'XMPP plugin not found';
	},
	
	/*
	 * Does the reverse of hookplugin, unhooking any event handlers that were outstanding.  
	 */
	unhookPlugin : function()
	{
		// Find the XMPP plugin
		if (this.xmppPlugin)
		{
			this.xmppPlugin.removeListener('connect', this.onConnect, this);
			this.xmppPlugin.removeListener('disconnect', this.onDisconnect, this);
			this.xmppPlugin.getRosterManager().removeListener('presencechanged', this.onPresenceChanged, this);
		}
	},
	
	/*
	 * Handles a 'presencechanged' event from the roster manager.
	 */
	onPresenceChanged : function(roster, entry)
	{
		if (entry == roster.getMe())
		{
			// Get status text and show
			var show = entry.getPresence().getShow();
			var status = entry.getPresence().getStatus();
			
			// If the status is set, update the status textfield
			if (status!==undefined)
			{
				this.statusTextField.setValue(status);
				
				this.statusToolbarItem.setText(status ? ('Status (' + status + ')') : 'Status');
			}
			
			// Update the menu icon
			this.statusToolbarItem.setIconClass(Zarafa.plugins.xmpp.getIconClass(show));
		}
	},
	
	/*
	 * Handles the status menu events, changing the 'show' property of the user presence.
	 */
	onStatusMenu : function(show)
	{
		// Get status text
		var roster = this.xmppPlugin.getRosterManager();
		roster.setPresence(show, roster.getMyStatus());
	},
	
	/*
	 * Handles the status field 'change' event. 
	 */
	onStatusFieldChange : function(field)
	{
		// Get status text
		var roster = this.xmppPlugin.getRosterManager();
		
		// Update status text. If roster.getMyShow() returns undefined ('offline'),
		// set the show to null ('online').
		roster.setPresence(roster.getMyShow() || null, field.getValue());
	},
	
	/*
	 * Handles the status field 'specialkey' event. Checks if the special key pressed is the
	 * enter key, and blurs the field if this is the case. The blur in turn will cause the 
	 * 'change' event to fire, which is handled by onStatusFieldChange.
	 */
	onStatusFieldSpecialKey : function(field, event)
	{
		if (event.getKey() == event.ENTER)
		{
			field.blur();
			this.statusMenu.hide();
		}
	},
	
	/*
	 * Handles the double-click event from the roster grid. 
	 */
	rosterDoubleClick : function(grid, rowIndex, event)
	{
		// Get the data element that belongs to the clicked row 
		var clickedElement = this.rosterPanel.getStore().getAt(rowIndex);
		
		// Create a new chat that corresponds to the user's JID.
		// If a chat already exists in the chat manager with this ID the previously
		// created one will be returned instead.
		var chat = this.xmppPlugin.getChatManager().createChat(clickedElement.data.jid);
		
		// Select chat
		this.chatPanel.selectChat(chat);
	},
	
	/*
	 * Handles the 'connect' event by setting the status text to 'connected'.
	 */
	onConnect : function()
	{
		this.showStatus('connected');
	},
	
	/*
	 * Handles the 'disconnect' event by setting the status text to 'disconnect'.
	 */
	onDisconnect : function()
	{
		this.showStatus('disconnected');
	},
	
	/*
	 * Updates the status text field.
	 */
	showStatus : function(status)
	{
		this.statusText.setText(status);
	},
	
	/**
	 * Cleans up the XMPP widget.
	 */
	destroy : function()
	{
		// Remove plugin hooks.
		this.unhookPlugin();
		
		// Parent destroy
		Zarafa.plugins.xmpp.Widget.superclass.destroy.call(this);
	}
	
});

Zarafa.onReady(function()
{
	if (container.getSettingsModel().get('zarafa/v1/plugins/xmpp/enable') === true) {
		container.registerWidget(new Zarafa.core.ui.widget.WidgetMetaData({
			name : 'chat',
			displayName : _('Chat'),
			iconPath : 'plugins/xmpp/resources/icons/chat.png',
			widgetConstructor : Zarafa.plugins.xmpp.Widget
		}));
	}
});
Ext.namespace('Zarafa.plugins.xmpp.data');

// Chat participant colors
// TODO come up with a nice palette here
Zarafa.plugins.xmpp.ChatColors = [ '#8A9B0F', '#BD1550', '#F8CA00', '#78C0A8'];

// Record type
Zarafa.plugins.xmpp.data.ChatMessageRecord = Ext.data.Record.create(
		[{ name : 'messageid' }, { name : 'jid' }, { name : 'resource' }, { name : 'color' }, { name : 'displayname' }, { name : 'body'}, { name : 'date'}]);

/**
 * @class Zarafa.plugins.xmpp.data.XmppChatStore
 * @extends Ext.data.Store
 * @xtype zarafa.xmppchatstore
 * 
 * A store that represents the messages in a chat in a way that an XmppChatPanel can render.
 * 
 */
Zarafa.plugins.xmpp.data.XmppChatStore = Ext.extend(Ext.data.Store, {
	
	/**
	 * @constructyor
	 * @param {Zarafa.plugins.xmpp.XmppChat} chat the chat object that this store wraps.
	 */
	constructor : function(chat)
	{
		
		var config = {
			
			// Standard data reader
		    reader: new Ext.data.ArrayReader({
		    		idIndex: 0
		    	},
		    	Zarafa.plugins.xmpp.data.ChatMessageRecord
		    )
		
		};
		
		// Copy the chat object
		this.hookChat(chat);
		
		// Call parent constructor
		Zarafa.plugins.xmpp.data.XmppChatStore.superclass.constructor.call(this, config);		
	},
	
	/**
	 * Forces the store to reload its contents.
	 */
	load : function()
	{
		this.update();
	},
	
	/*
	 * Updates the store.
	 */
	update : function()
	{
		
		var data = [];
		
		// Get the XMPP plugin
		var xmppPlugin = container.getPluginByName('xmpp');
		if (!xmppPlugin)
			throw 'XMPP plugin not found';

		// Get the roster manager from the plugin
		var roster = xmppPlugin.getRosterManager();
		
		// Each participant in the chat should get a unique color
		var colorIds = {};
		var colors = 0;

		// Iterate over the messages in the chat and add them to the store
		Ext.each(this.chat.getMessages(), function(message) {
			
			// Get the XmppRosterEntry for the given JID
			var jid = message.getJID();
			var entry = roster.getEntryByJID(jid);
			
			// Get the display name of the entry. For example, if we're chatting with foo@x.y.com, 
			// the display could be be 'Kung Foo'
			var displayName = entry ? entry.getDisplayName() : jid;
			
			// Check if the person who wrote this message has already been assigned a color, and 
			// assign one if not.
			if (!(jid in colorIds))
				colorIds[jid] = colors++;
			
			// Get a color from the color palette
			var color = Zarafa.plugins.xmpp.ChatColors[colorIds[jid] % Zarafa.plugins.xmpp.ChatColors.length];
			
			// Push the message into the data 
			data.push([message.getID(), jid, message.getResource(), color, displayName, message.getBody(), message.getDate().format('H:i:s') ]);
		});
		
		// Push the data into the store
		this.loadData(data);

	},
	
	/*
	 * Hooks the events of the chat object.
	 */
	hookChat : function(chat)
	{
		this.chat = chat;
		this.chat.addListener('messageadded', this.onMessageAdded, this);
	},
	
	/*
	 * Unhooks the events of the chat object.
	 */
	unhookChat : function()
	{
		this.chat.removeListener('messageadded', this.onMessageAdded, this);
	},
	
	/*
	 * Handles the 'messageadded' event from the chat.
	 */
	onMessageAdded : function(chat, message)
	{
		this.update();
	},
	
	/**
	 * Unhooks the event handlers and cleans up the store.
	 */
	destroy : function()
	{
		// unhook events from chat object
		this.unhookChat();
		
		// Parent destroy
		Zarafa.plugins.xmpp.data.XmppChatStore.superclass.destroy.call(this);		
	}
	
});

Ext.reg('zarafa.xmppchatstore', Zarafa.plugins.xmpp.data.XmppChatStore);
Ext.namespace('Zarafa.plugins.xmpp.data');

// Record type
Zarafa.plugins.xmpp.data.RosterRecord = Ext.data.Record.create(
		[{ name : 'id' }, { name : 'jid' }, { name : 'name'}, {name : 'subscription'}, {name : 'show'}, {name : 'status'}, { name : 'displayname'}, { name : 'group'}]);

/**
 * @class Zarafa.plugins.xmpp.data.XmppRosterStore
 * @extends Ext.data.GroupingStore
 * @xtype zarafa.xmpprosterstore
 * 
 * A store that exposes the roster to ExtJS views such as grids, dataviews, and so on. The store is a grouping
 * store and groups by the 'group' property (naturally). If an entry appears in more than one group, it appears
 * in the store more than once.
 * 
 */
// TODO initialise the showOffline setting from the configuration, and have the widget store this setting
// as a persistent value.
Zarafa.plugins.xmpp.data.XmppRosterStore = Ext.extend(Ext.data.GroupingStore, {
	
	/**
	 * @constructyor
	 * @param {Object} config configuration object.
	 */
	constructor : function(config)
	{
		
		config = Ext.applyIf(config || {}, {
			
			// Standard data reader
		    reader: new Ext.data.ArrayReader({
		    		idIndex: 0
		    	},
		    	Zarafa.plugins.xmpp.data.RosterRecord
		    ),
		    
		    sortInfo: {field: 'group', direction: 'ASC'},
	        groupOnSort: true,
	        remoteGroup: true,
	        groupField: 'group'		    
		
		});
		
		// Initialise the search string to ''
		// This field is used when searching for roster entries and can be set using the
		// setSearchString() method
		this.searchString = '';
		
		// Initialise the showOffline setting to true. The default is to show all users, 
		// not just the ones that are online.
		this.showOffline = true;
		
		// Call parent constructor
		Zarafa.plugins.xmpp.data.XmppRosterStore.superclass.constructor.call(this, config);

		this.hookPlugin();
		
	},
	
	/**
	 * Loads the store with data from the XMPP roster.
	 */
	load : function()
	{
		this.update();
	},
	
	/*
	 * Helder method for update. Checks if an entry should appear in the store by
	 * matching it against the search string and by checking if the entry 
	 * represents the currently logged in user.
	 * 
	 * Note that all the string matching is in lowercase to implement 
	 * case-insensitive search. 
	 *  
	 * @param {Zarafa.plugins.xmpp.XmppRosterEntry} entry roster entry to check
	 */
	filter : function(entry) 
	{
		// Filter out the entry that represents the currently logged in user.
		if (entry == this.xmppPlugin.getRosterManager().getMe()) return false;
		
		// Filter out offline users
		if (!this.showOffline && entry.getPresence().getShow() == 'offline')
			return false;

		// If the search string is '', simply return true 
		if (this.searchString=='') return true;
		
		// Convert all the matching strings to lower case, makes for case-insensitive
		// matching.
		var searchString = this.searchString.toLowerCase();

		// Match the user part of the JID
		var jid = entry.getJID(); 
		var user = jid.split('@')[0].toLowerCase();
		if (user.indexOf(searchString)!=-1) return true;
		
		// Match the name part
		var name = entry.getName();
		if (name && name.toLowerCase().indexOf(searchString)!=-1) return true;
	
		// If we've reached this point, the entry did not match the search query.
		return false;
	},
	
	/* 
	 * Updates the store contents.
	 */
	update : function()
	{
		
		if (this.rosterManager)
		{
			
			var data = [];
			data.pushEntry = function(group, entry)
			{
				var key = entry.getJID() + (group ? '/' + group : ''); 
				var displayName = entry.getName() || entry.getJID();
				var show = entry.getPresence().getShow();
				
				if (!group) group = 'Not in a group';

				if (show===null) show = 'online';
				if (show===undefined) show = 'offline';
				
				this.push([ key, entry.getJID(), entry.getName(), entry.getSubscription(), show, entry.getPresence().getStatus(), displayName, group ]);
			};
			
			var entries = [];
			var groups = {};
			
			// Filter out entries that do not match the search string, and
			// also filter out the roster entry that represents 'me' (the
			// user currently logged into the Zarafa client)
			for (var key in this.rosterManager.getEntries())
			{
				var entry = this.rosterManager.getEntries()[key];
				if (this.filter(entry))
					entries.push(entry);
			}

			// First add all entries that do not belong to any groups.
			Ext.each(entries, function(entry) {
				if (entry.getGroups().length == 0)
					data.pushEntry(null, entry);
			});
			
			// Gather the groups and the items in them
			Ext.each(entries, function(entry) {
				Ext.each(entry.getGroups(), function(group) {
					// If the group doesn't exist yet, create it
					if (groups[group] === undefined)
						groups[group] = [];
					
					// Add the entry to the group
					groups[group].push(entry);
				});
			});
			
			// Add the entries that are in one or more groups
			for (var key in groups)
			{
				var group = groups[key];
				for (var i=0, entry; entry=group[i]; i++)
					data.pushEntry(key, entry);
			}
			
			this.loadData(data);
			
		}
	},
	
	/**
	 * Sets the search string. Search in the roster works like a filter. Each element is
	 * matched against the search string both by user (the part before the '@' in the
	 * JID), and the entry name. An entry matches simply when the search string appears
	 * in either field. For example, 'foo' would match 'foo', 'barfoo', and 'foobar'. 
	 * 
	 * Setting the search string to '' disables filtering. 
	 * 
	 * @param {String} search search string. Set to '' to disable.
	 */
	setSearchString : function(search)
	{
		this.searchString = search;
		
		// Update the store contents
		this.update();
	},
	
	/**
	 * Sets whether the store should include entries from the roster that are offline.
	 * 
	 * @param {Boolean} showOffline whether or not to include entries in the roster that are offline. 
	 */
	setShowOffline : function(showOffline)
	{
		this.showOffline = showOffline;
		
		// Update the store contents
		this.update();
	},
	
	/*
	 * Hooks into events from the XMPP plugin's roster manager. 
	 */
	hookPlugin : function()
	{
		// Find the XMPP plugin
		this.xmppPlugin = container.getPluginByName('xmpp');
		
		if (this.xmppPlugin)
		{
			this.rosterManager = this.xmppPlugin.getRosterManager();
			this.rosterManager.addListener('rosterchanged', this.onRosterChanged, this);
			this.rosterManager.addListener('presencechanged', this.onPresenceChanged, this);

			this.update();
			
		} else
			throw 'XMPP plugin not found';
	},
	
	/*
	 * Removes event hooks from the XMPP plugin's roster manager. 
	 */
	unhookPlugin : function()
	{
		// Find the XMPP plugin
		if (this.xmppPlugin)
		{
			this.rosterManager.removeListener('rosterchanged', this.onRosterChanged, this);
			this.rosterManager.removeListener('presencechanged', this.onPresenceChanged, this);
		}
	},
	
	/*
	 * Handles a 'rosterchanged' event by calling update, which in turn populates the store with the new data.
	 */
	onRosterChanged : function()
	{
		this.update();
	},
	
	/*
	 * Handles a 'rosterchanged' event by calling update, which in turn populates the store with the new data.
	 */
	onPresenceChanged : function(manager, entry)
	{
		this.update();
	},

	/*
	 * Destroys the store and releases the event hooks.
	 */
	destroy : function()
	{
		// Unhook the events from the XMPP plugin.
		this.unhookPlugin();
		
		// Call super.destroy
		Zarafa.plugins.xmpp.XmppRosterStore.superclass.destroy();
	}
	
});

Ext.reg('zarafa.xmpprosterstore', Zarafa.plugins.xmpp.data.XmppRosterStore);
Ext.namespace('Zarafa.plugins.xmpp.ui');

/**
 * @class Zarafa.plugins.xmpp.ui.XmppChatPanel
 * @extends Ext.Panel
 * 
 * A chat panel is the view (in the MVC sense) of an ongoing chat session. It contains a data view that shows 
 * the text and automatically updates and new message are received, for which it uses the XmppChatStore class.
 * It also contains an input text field.
 * 
 */
// TODO automatically scroll down the data view component when a new message is received.
// TODO add a label that shows that the other user is typing (the chat is 'active')
Zarafa.plugins.xmpp.ui.XmppChatPanel = Ext.extend(Ext.Panel, {
	
	/**
	 * @constructor
	 * @param {Zarafa.plugins.xmpp.XmppChat} chat a chat session to act as a model for this component. 
	 */
	constructor : function(chat)
	{
		
		// Attach the chat object to this view, hook event handlers.
		this.hookChat(chat);
		
		// Create an XmppChatStore object to use with the data view
		this.store = new Zarafa.plugins.xmpp.data.XmppChatStore(chat);
		this.store.load();
		
		// Attach the load event to the chat store, we use this to scroll
		// the text into view automatically
		this.store.addListener('load', this.onStoreLoad, this);

		// Template for lines of chat text.
		var template = new Ext.XTemplate(
			'<tpl for=".">',
				'<div class="thumb-wrap" id="{messageid}">',
				'<div style="width:100%">',
				'<span style="font-size: 8px;">{date}</span> ',
				'<span style="text-weight: bold; color: {color}">{displayname}: </span>{body}</div>',
			'</tpl>',
			'<div class="x-clear"></div>'
			);

		// Component configuration
		var config = {
			title : chat.getDisplayTitle(),
			layout: 'border',
			closable: true,
			items : [
				this.dataView = new Ext.DataView({
					autoScroll : true,
					store : this.store,
					tpl : template,
					itemSelector:'div.thumb-wrap',
					region : 'center'
				}),{
					xtype : 'textfield',
			    	// ref : '../input',
			    	listeners : {
			    		specialkey : this.onInputFieldSpecialKey,
			    		scope : this
			    	},
					region : 'south'
				},
				this.statusField = new Ext.form.Label({
					region : 'north',
					height : 12,
					// TODO style this in a style sheet somewhere
					style : 'font-size: 10px'
				})
			]
		};
		
		// Call parent constructor
		Zarafa.plugins.xmpp.ui.XmppChatPanel.superclass.constructor.call(this, config);
	},
	
	/**
	 * 
	 * @return {Zarafa.plugins.xmpp.XmppChat} the chat session associated with this panel
	 */
	getChat : function()
	{
		return this.chat;
	},
	
	/*
	 * Copies the chat into the chat panel for future reference and hooks the 'activechanged' event.
	 */
	hookChat : function(chat)
	{
		this.chat = chat;
		this.chat.addListener('statuschanged', this.onStatusChanged, this);
	},
	
	/*
	 * Unhooks the 'activechanged' event.
	 */
	unhookChat : function()
	{
		this.chat.removeListener('statuschanged', this.onStatusChanged, this);
	},
	
	/*
	 * Handles the store's load event by scrolling the data view's content
	 * down to reveal the latest message. 
	 */
	onStoreLoad : function()
	{
		this.scrollDown();
	},
	
	scrollDown : function()
	{
		var nodes = this.dataView.getNodes();
		
		// If the view is empty, simply return (no need to scroll)
		if (nodes.length==0) return;
		
		// Get the last HTML node
		var lastNode = nodes[nodes.length-1];
		
		// Scroll this node into view
		lastNode.scrollIntoView(this.dataView);
	},
	
	setTitleStyle : function(alert)
	{
		if (alert)
			this.setTitle('<span style="font-weight: bold; color:red">' + this.chat.getDisplayTitle() + '</span>');
		else
			this.setTitle(this.chat.getDisplayTitle());
	},
	
	/*
	 * Handles the 'statuschanged' event from the chat session. Refer to {@link Zarafa.plugins.xmpp.XmppChat} for more information.
	 * 
	 * @param {Zarafa.plugins.xmpp.XmppChat} chat chat session that fired the event.
	 * @param {String} status updated chat status
	 */
	onStatusChanged : function(chat, status)
	{
		if (status=='composing')
			this.statusField.setText(chat.getDisplayTitle() + ' is typing ...');
		else
			this.statusField.setText('');
	},
	
	/* 
	 * Handles the 'specialkey' event from the input text field.
	 * 
	 * @param {Ext.TextField} field the field that fired the event.
	 * @param {Ext.Event} event event object
	 */
	onInputFieldSpecialKey : function(field, event)
	{
		// If the key pressed was enter, send the contents of the (non-empty) text field
		if (event.getKey() == event.ENTER)
			if (field.getValue())
			{
				this.chat.sendMessage(field.getValue());
				field.setValue('');
			}
	},
	
	/**
	 * Cleans up the chat panel.
	 */
	destroy : function()
	{
		// Release events
		this.unhookChat();
		
		// Destroy the underlying store
		this.store.removeListener('load', this.onStoreLoad(), this);
		this.store.destroy();		
		
		// Parent destroy
		Zarafa.plugins.xmpp.ui.XmppChatPanel.superclass.destroy.call(this);
	}

});
Ext.namespace('Zarafa.plugins.xmpp.ui');

/**
 * @class Zarafa.plugins.xmpp.ui.XmppChatTabPanel
 * @extends Ext.TabPanel
 */
Zarafa.plugins.xmpp.ui.XmppChatTabPanel = Ext.extend(Ext.TabPanel, {
	
	/**
	 * @constructor
	 * @param {Object} config configuration object
	 */
	constructor : function(config)
	{
		config = Ext.applyIf(config || {}, {
			enableTabScroll : true,
			listeners :
			{
				tabchange : this.onTabChanged,
				scope: this
			}
		});
		
		this.hookPlugin();
		
		// Call parent constructor
		Zarafa.plugins.xmpp.ui.XmppChatTabPanel.superclass.constructor.call(this, config);
	},
	
	/*
	 * Hooks events on the XMPP plugin's chat manager.
	 */
	hookPlugin : function()
	{
		// Find the XMPP plugin
		this.xmppPlugin = container.getPluginByName('xmpp');
		
		if (this.xmppPlugin)
		{
			this.chatManager = this.xmppPlugin.getChatManager();
			this.chatManager.addListener('chatcreated', this.onChatCreated, this);
			this.chatManager.addListener('chatclosed', this.onChatClosed, this);
			this.chatManager.addListener('messagereceived', this.onMessageReceived, this);
		} else
			throw 'XMPP plugin not found';
	},
	
	/*
	 * Unhooks events from the XMPP plugin's chat manager.
	 */
	unhookPlugin : function()
	{
		// Find the XMPP plugin
		if (this.xmppPlugin)
		{
			this.chatManager.removeListener('chatcreated', this.onChatCreated, this);
			this.chatManager.removeListener('chatclosed', this.onChatClosed, this);
			this.chatManager.removeListener('messagereceived', this.onMessageReceived, this);
		}
	},
	
	/*
	 * Handles the 'chatcreated' event from the chat manager. 
	 */
	onChatCreated : function(chatManager, chat)
	{
		// The selectChat method creates a new chat panel if one doesn't exist for the given chat
		var panel = this.createPanel(chat);
		
		this.activate(panel);
	},
	
	/*
	 * Handles the 'chatcreated' event from the chat manager. 
	 */
	onChatClosed : function(chatManager, chat)
	{
		// TODO implement. Currently the chat manager does not explicitly close chats and does not fire this event
	},
	
	/*
	 * Handles a messagereceived event from the chat manager. Checks if a panel exists
	 * that is displaying the chat in question. If not, one is created and added to the 
	 * tab panel.
	 */
	onMessageReceived : function(chatManager, chat, message)
	{
		var panel = this.findPanel(chat);
		
		// Create a new chat panel for the chat if none exists
		if (!panel)
			panel = this.createPanel(chat);
		
		// Find the chat panel and change its title if it's not selected
		if (panel != this.getActiveTab())
		{
			panel.setTitleStyle(true);
			this.doLayout();
		}
	},
	
	/**
	 * Convenience method for getting a chat panel.
	 * @param {Zarafa.plugins.xmpp.XmppChat} chat chat instance to search for.
	 */
	findPanel : function(chat)
	{
		// Check if a panel exists that is showing the current chat
		for (var i=0, panel; panel=this.items.items[i]; i++)
			if (panel.getChat && panel.getChat() == chat)
				return panel;
		
		// Not found
		return undefined;
	},

	/*
	 * Creates a new tab with a {@link Zarafa.plugins.xmpp.ui.XmppChatPanel} panel for the given chat.
	 */
	createPanel : function(chat)
	{
		// Create a new tab
		var chatPanel = new Zarafa.plugins.xmpp.ui.XmppChatPanel(chat);
		this.add(chatPanel);
		this.doLayout();
		
		return chatPanel;
	},
	
	onTabChanged : function(tabPanel, panel)
	{
		// Automatically scroll the panel text down
		if (panel.scrollDown)
		{
			panel.scrollDown();
			panel.setTitleStyle(false);
		}
	},

	/**
	 * Activates the chat panel that is displaying the given chat object. If no such
	 * panel exists, a new one is created and added to the tab panel. 
	 * 
	 * @param {Zarafa.plugins.xmpp.XmppChat} chat chat instance to search for.
	 */
	selectChat : function(chat)
	{
		// Lookup the panel that is displaying the given chat
		var panel = this.findPanel(chat);
		
		// If no chat panel exists for this chat, create one.
		if (!panel)
			panel = this.createPanel(chat);
		
		// Active the panel
		this.activate(panel);
	},
	
	destroy : function()
	{
		this.unhookPlugin();
		
		// Super class destroy
		Zarafa.plugins.xmpp.ui.XmppChatTabPanel.superclass.destroy.call(this);		
	}
	
	
});
Ext.namespace('Zarafa.plugins.xmpp.ui');

/**
 * @class Zarafa.plugins.xmpp.ui.XmppRosterPanel
 * @extends Ext.DataView
 */
Zarafa.plugins.xmpp.ui.XmppRosterPanel = Ext.extend(Ext.grid.GridPanel, {
	
	constructor : function(config)
	{
		
		// Custom renderer for the icon column
		function iconRenderer(show, p, record)
		{
			var icon = {
				'online' : 'icon_xmpp_online',
				'offline' : 'icon_xmpp_offline',
				'away' : 'icon_xmpp_away',
				'xa' : 'icon_xmpp_away',
				'chat' : 'icon_xmpp_online',
				'dnd' : 'icon_xmpp_busy'
			}[show];
			
			p.css = icon;
			
			return '';
		}

		// Custom renderer for the name column
		function nameRenderer(value, p, record)
		{
			var status = record.data.status;
			var text = value;
			if (status) text += ' (' + status + ')';
			
			return text;
		}
		
		var view = new Ext.grid.GroupingView({
	        forceFit: true,
	        groupTextTpl: '{group}'
	    });		
		
		config = Ext.applyIf(config || {}, {
			
			layout : 'fit',
			
			tbar : {
				xtype : 'toolbar',
				layout : 'border',
				height : 24,
				items : [{
					xtype : 'trigger',
					region : 'center',
					ref : '../searchField',
					triggerClass : 'x-form-search-trigger',
					onTriggerClick : this.onSearchFieldTriggerClick.createDelegate(this),
					enableKeyEvents : true, 
					listeners :	{
						change : this.onSearchFieldChange,
			    		specialkey : this.onSearchFieldSpecialKey,
						scope : this
					}
				},{
		    		xtype : 'tbbutton',
					region : 'east',
					text: _('Show'),
					ref : '../statusToolbarItem',
					menu : this.statusMenu = new Ext.menu.Menu({
						items : [{
							text : 'Show offline',
							iconCls : 'icon_xmpp_offline',
							handler : function() { this.showOffline(true); },
							scope : this
						},{
							text : 'Show online',
							iconCls : 'icon_xmpp_online',
							handler : function() { this.showOffline(false); },
							scope : this
						}
						]
					})
				}]
			},
			
			// Column model
			cm: new Ext.grid.ColumnModel([
				{id:'JID', hidden: true, dataIndex: 'jid'},
				{
					header : '<p class="icon_xmpp_online">&nbsp;</p>',
					width : 24,
					fixed : true,
					dataIndex: 'show',
					renderer : iconRenderer
				},{
					header: "Group",
					dataIndex: 'group',
					hidden : true
				},{
					header: "Name",
					dataIndex: 'displayname',
					renderer : nameRenderer
				}]),				
				
			view : view,
			
			store : this.store = new Zarafa.plugins.xmpp.data.XmppRosterStore()
		});
		
		this.xmppPlugin = container.getPluginByName('xmpp');
		
		if (!this.xmppPlugin)
			throw 'XMPP plugin not found';

		// Call parent constructor
		Zarafa.plugins.xmpp.ui.XmppRosterPanel.superclass.constructor.call(this, config);
	},	
	
	/*
	 * Handles the search field 'change' event. 
	 */
	onSearchFieldChange : function(field)
	{
		this.store.setSearchString(field.getValue());
	},
	
	/*
	 * Handles the search field 'specialkey' event. Checks if the special key pressed is the
	 * enter key, and blurs the field if this is the case. The blur in turn will cause the 
	 * 'change' event to fire, which is handled by onSearchFieldChange.
	 */
	onSearchFieldSpecialKey : function(field, event)
	{
		if (event.getKey() == event.ENTER)
		{
			field.blur();
			this.store.setSearchString(field.getValue());
		}
	},
	
	/*
	 * Handles the search field trigger click event. 
	 */
	onSearchFieldTriggerClick : function(event)
	{
		this.store.setSearchString(this.searchField.getValue());
	},
	
	showOffline : function(show)
	{
		this.store.setShowOffline(show);
	}
	
});
Ext.namespace('Zarafa.plugins.xmpp');

// Make sure the XMPP plugin gets loaded first
// FIXME: This is a bad and undesired dependency!
/**
 * #dependsFile plugins/xmpp/js/XmppPlugin.js
 */

/**
 * @class Zarafa.plugins.xmpp.XmppNotificationPlugin
 * @extends Zarafa.core.Plugin
 * 
 * A notification plug-in for XMPP. Fades in a message in the lower-left hand side of the status bar
 * whenever a new chat message is received. The message lingers for five seconds before fading out
 * again.
 * 
 */
Zarafa.plugins.xmpp.XmppNotificationPlugin = Ext.extend(Zarafa.core.Plugin, {
	
	/**
	 * Initialize plugin
	 * @protected
	 */
	initPlugin : function()
	{
		Zarafa.plugins.xmpp.XmppNotificationPlugin.superclass.initPlugin.apply(this, arguments);

		// Find the XMPP plugin and get the chat- and roster manager
		var xmppPlugin = container.getPluginByName('xmpp');
		this.chatManager = xmppPlugin.getChatManager();
		this.rosterManager = xmppPlugin.getRosterManager();
		
		// Hook events
		this.chatManager.addListener('messagereceived', this.onMessageReceived, this);		
		this.rosterManager.addListener('presencechanged', this.onPresenceChanged, this);		

		// Insertion point
		this.registerInsertionPoint('statusbar.left', function() {
			return new Ext.Toolbar.Item({ html : '<div id="xmpp-notification-bar"></div>' });
		}, this);

	},
	
	/*
	 * Sets the fade-in/fade-out element animation on an Ext.Element.
	 */
	doElementAnimation : function(element)
	{
		// Stop any currently running/queued animation
		element.stopFx();
		
		// Queue the element animation
		element.fadeIn();
		element.pause(5);
		element.fadeOut();
	},

	/*
	 * Handles the 'messagereceived' event fired by the chat manager. It first gets the notification HTML element
	 * by DOM id and sets its contents to reflect the status update ('foo says: bla bla bla'). It then uses the
	 * Ext.Fx effects to queue fade-in/fade-out effects on the element.
	 */
	onMessageReceived : function(manager, chat, message)
	{
		// Get the notification element. If this returns null, the plugin has not been initialised yet, so we just return.
		var element = Ext.get('xmpp-notification-bar');
		if (!element) return;
		
		// Get the XmppRosterEntry for the given JID
		var jid = message.getJID();
		var entry = this.rosterManager.getEntryByJID(jid);
		
		// Get the display name of the entry. For example, if we're chatting with foo@x.y.com, 
		// the display could be be 'Kung Foo'
		var displayName = entry ? entry.getDisplayName() : jid;

		var iconClass = Zarafa.plugins.xmpp.getIconClass(entry.getPresence().getShow());
		
		// TODO use a template here?
		element.update(
				'<span style="padding-left: 24px; background-position: left ! important" class="' + 
				iconClass + 
				'"><b>' + 
				displayName + 
				' says:</b> ' + 
				message.getBody() + 
				'</span>');

		// Queue the element animation
		this.doElementAnimation(element);
	},
	
	/*
	 * Handles the 'messagereceived' event fired by the chat manager. It first gets the notification HTML element
	 * by DOM id and sets its contents to reflect the status update ('foo says: bla bla bla'). It then uses the
	 * Ext.Fx effects to queue fade-in/fade-out effects on the element.
	 */
	onPresenceChanged : function(roster, entry)
	{
		// Get the notification element. If this returns null, the plugin has not been initialised yet, so we just return.
		var element = Ext.get('xmpp-notification-bar');
		if (!element) return;

		var show = entry.getPresence().getShow();
		var iconClass = Zarafa.plugins.xmpp.getIconClass(show);
		
		if (show===undefined) show = 'offline';
		if (show===null) show = 'online';

		var statusMessage = {
				'online' : 'changed status to available.',
				'offline' : 'has gone offline.',
				'away' : 'is now away.',
				'xa' : 'is now away.',
				'chat' : 'is feeling chatty.',
				'dnd' : 'has changed status to "do not disturb".'
			}[show];		
		
		// TODO use a template here?
		element.update(
				'<span style="padding-left: 24px; background-position: left ! important" class="' + 
				iconClass + 
				'"><b>' + 
				entry.getDisplayName() + 
				'</b> ' + 
				statusMessage + 
				'</span>');

		// Queue the element animation
		this.doElementAnimation(element);
	}
	
});

// Register the plugin with the container.
Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'xmpp-notification-plugin',
		displayName : _('XMPP Notification Plugin'),
		settingsName : 'xmpp',
		allowUserVisible : false,
		pluginConstructor : Zarafa.plugins.xmpp.XmppNotificationPlugin
	}));
});
Ext.namespace('Zarafa.plugins.xmpp');

// Make sure the XMPP plugin gets loaded first
// FIXME: This is a bad and undesired dependency!
/**
 * #dependsFile plugins/xmpp/js/XmppPlugin.js
 */

/**
 * @class Zarafa.plugins.xmpp.XmppPreviewPanelButton
 * @extends Ext.Button
 * @xtype zarafa.xmpp.previewpanelbutton
 * 
 * A quick-and-dirty XMPP button that updates itself based on the record loaded in the preview panel. 
 * 
 * This is by no means meant to be a fully-working feature, just an example of how to integrate
 * the XMPP plugin into the mail and other features. 
 * 
 */
Zarafa.plugins.xmpp.XmppPreviewPanelButton = Ext.extend(Ext.Button, {
	
	/**
	 * @constructor
	 */
	constructor : function(config)
	{
		this.panel = config.panel;
		this.model = config.model;
		
		config = Ext.applyIf(config, { 
			
			text : 'Lol ik ben een knopje',
			listeners :
			{
				click : this.onClick,
				scope : this
			}
			
		});
	
		// Parent constructor
		Zarafa.plugins.xmpp.XmppPreviewPanelButton.superclass.constructor.call(this, config);
	},

	/**
	 * initialize component
	 * @protected
	 */
	initComponent : function()
	{
		Zarafa.plugins.xmpp.XmppPreviewPanelButton.superclass.initComponent.apply(this, arguments);

		this.setVisible(false);

		// Hook into the 'updaterecord' event of the parent panel. 
		this.panel.addListener('updaterecord', this.onUpdateRecord, this);
		
		// Grab the XMPP plugin instance
		this.xmppPlugin = container.getPluginByName('xmpp');
		if (this.xmppPlugin)
		{
			// Hook into the preview panel
			this.model.addListener('previewrecordchange', this.onRecordChange, this);
		}
		
	},
	
	update : function(record)
	{
		var entry = undefined;
		
		if (record != undefined)
		{
			var senderEmail = record.data.sent_representing_email_address;
			entry = this.xmppPlugin.getRosterManager().getEntryByEmail(senderEmail);
		}

		
		if (entry)
		{
			this.setIconClass(Zarafa.plugins.xmpp.getIconClass(entry.getPresence().getShow()));						
			this.setText(entry.getDisplayName());
			this.setVisible(true);
		} else
		{
			this.setVisible(false);
		}
		
		this.entry = entry;
		
	},
	
	onClick : function()
	{
		if (this.entry)
		{
			this.xmppPlugin.getChatManager().createChat(this.entry.getJID());			
		}
	},
	
	onRecordChange : function(contextModel, record)
	{
		this.update(record);
	},
	
	onUpdateRecord : function(panel, event, record)
	{
		this.update(record);
	},
	
	destroy : function()
	{
		// Unhook the 'updaterecord' event of the parent panel. 
		this.panel.removeListener('updaterecord', this.onUpdateRecord, this);
		this.model.removeListener('previewrecordchange', this.onRecordChange, this);

		// Superclass.destroy
		Zarafa.plugins.xmpp.XmppPreviewPanelButton.superclass.destroy.call(this);		
	}
	
});

// Register xtype for lazy instantiation
Ext.reg('zarafa.xmpp.previewpanelbutton', Zarafa.plugins.xmpp.XmppPreviewPanelButton);

/**
 * @class Zarafa.plugins.xmpp.XmppPreviewPanelPlugin
 * @extends Zarafa.core.Plugin
 * 
 * A notification plug-in for XMPP. Fades in a message in the lower-left hand side of the status bar
 * whenever a new chat message is received. The message lingers for five seconds before fading out
 * again.
 * 
 */
Zarafa.plugins.xmpp.XmppPreviewPanelPlugin = Ext.extend(Zarafa.core.Plugin, {
	
	/**
	 * Initialize plugin
	 * @protected
	 */
	initPlugin : function()
	{
		Zarafa.plugins.xmpp.XmppPreviewPanelPlugin.superclass.initPlugin.apply(this, arguments);

		// Find the XMPP plugin and get the chat- and roster manager
		var xmppPlugin = container.getPluginByName('xmpp');
		this.chatManager = xmppPlugin.getChatManager();
		this.rosterManager = xmppPlugin.getRosterManager();
		
		// Hook events
//		this.chatManager.addListener('messagereceived', this.onMessageReceived, this);
//		this.rosterManager.addListener('presencechanged', this.onPresenceChanged, this);

		// Insertion point
		this.registerInsertionPoint('previewpanel.toolbar.right', function(insertionPointName, panel, model) {
			
			return {
				xtype : 'zarafa.xmpp.previewpanelbutton',
				panel : panel,
				model : model
			};
			
		}, this);

	},

	/*
	 * Handles the 'messagereceived' event fired by the chat manager. 
	 */
	onMessageReceived : function(manager, chat, message)
	{
	},
	
	/*
	 * Handles the 'messagereceived' event fired by the chat manager. 
	 */
	onPresenceChanged : function(roster, entry)
	{
	}
	
});

// Register the plugin with the container.
Zarafa.onReady(function() {
	container.registerPlugin(new Zarafa.core.PluginMetaData({
		name : 'xmpp-previewpanel-plugin',
		displayName : _('XMPP Preview Panel Plugin'),
		settingsName : 'xmpp',
		allowUserVisible : false,
		pluginConstructor : Zarafa.plugins.xmpp.XmppPreviewPanelPlugin
	}));
});
