/*
 * jQuery store - Plugin for persistent data storage using localStorage, userData (and window.name)
 * 
 * Authors: Rodney Rehm
 * Web: http://medialize.github.com/jQuery-store/
 * 
 * Licensed under the MIT License:
 *   http://www.opensource.org/licenses/mit-license.php
 *
 */

/**********************************************************************************
 * INITIALIZE EXAMPLES:
 **********************************************************************************
 * 	// automatically detect best suited storage driver and use default serializers
 *	$.storage = new $.store();
 *	// optionally initialize with specific driver and or serializers
 *	$.storage = new $.store( [driver] [, serializers] );
 *		driver		can be a scope ("browser" or "window"), a key (e.g. "windowName") or the driver-object itself
 *		serializers	can be a list of named serializers like $.store.serializers
 **********************************************************************************
 * USAGE EXAMPLES:
 **********************************************************************************
 *	$.storage.get( key );			// retrieves a value
 *	$.storage.set( key, value );	// saves a value
 *	$.storage.del( key );			// deletes a value
 *	$.storage.flush();				// deletes all values
 *	$.storage.length();				// the number of key-value pairs in storage
 *	$.storage.key( index );		    // returns a key for the given index (order is not guranteed, so just use it for looping on the set)
**********************************************************************************
 */

(function($,undefined){

/**********************************************************************************
 * $.store base and convinience accessor
 **********************************************************************************/

$.store = function( driver, serializers )
{
	var that = this;
	
	if( typeof driver == 'string' )
	{   
        if ( driver == 'browser' ) {
            // get the best browser scoped storage
            this.driver = $.store.drivers[ 'localStorage' ];
            if( !$.isFunction( this.driver.available ) || !this.driver.available() )
                this.driver = $.store.drivers[ 'userData' ];
            if( !$.isFunction( this.driver.available ) || !this.driver.available() )
                this.driver = $.store.drivers[ 'windowName' ]; //extreme fallback
        } else if (driver == 'window' ) {
            // get the best browser scoped storage
            this.driver = $.store.drivers[ 'sessionStorage' ];
            if( !$.isFunction( this.driver.available ) || !this.driver.available() )
                this.driver = $.store.drivers[ 'windowName' ];
		} else if( $.store.drivers[ driver ] )
			this.driver = $.store.drivers[ driver ];
		else
			throw new Error( 'Unknown driver '+ driver );
	}
	else if( typeof driver == 'object' )
	{
		var invalidAPI = !$.isFunction( driver.init )
			|| !$.isFunction( driver.get )
			|| !$.isFunction( driver.set )
			|| !$.isFunction( driver.del )
			|| !$.isFunction( driver.flush );
			
		if( invalidAPI )
			throw new Error( 'The specified driver does not fulfill the API requirements' );
		
		this.driver = driver;
	}
	else
	{
		// detect and initialize storage driver
		$.each( $.store.drivers, function()
		{
			// skip unavailable drivers
			if( !$.isFunction( this.available ) || !this.available() )
				return true; // continue;
			
			that.driver = this;
			if( that.driver.init() === false )
			{
				that.driver = null;
				return true; // continue;
			}
			
			return false; // break;
		});
	}
	
	// use default serializers if not told otherwise
	if( !serializers )
		serializers = $.store.serializers;
	
	// intialize serializers
	this.serializers = {};
	$.each( serializers, function( key, serializer )
	{
		// skip invalid processors
		if( !$.isFunction( this.init ) )
			return; // continue;
		
		that.serializers[ key ] = this;
		that.serializers[ key ].init( that.encoders, that.decoders );
	});
};


/**********************************************************************************
 * $.store API
 **********************************************************************************/

$.extend( $.store.prototype, {
	get: function( key )
	{
		var value = this.driver.get( key );
		return this.driver.encodes ? value : this.unserialize( value );
	},
	set: function( key, value )
	{
		this.driver.set( key, this.driver.encodes ? value : this.serialize( value ) );
	},
	del: function( key )
	{
		this.driver.del( key );
	},
	flush: function()
	{
		this.driver.flush();
	},
    length: function()
    {
        return this.driver.length();
    },
    key: function( index )
    {
        return this.driver.key( index );
    },
	driver : undefined,
	encoders : [],
	decoders : [],
	serialize: function( value )
	{
		var that = this;
		
		$.each( this.encoders, function()
		{
			var serializer = that.serializers[ this + "" ];
			if( !serializer || !serializer.encode )
				return; // continue;
			try
			{
				value = serializer.encode( value );
			}
			catch( e ){}
		});

		return value;
	},
	unserialize: function( value )
	{
		var that = this;
		if( !value )
			return value;
		
		$.each( this.decoders, function()
		{
			var serializer = that.serializers[ this + "" ];
			if( !serializer || !serializer.decode )
				return; // continue;
			
			value = serializer.decode( value );
		});

		return value;
	}
});


/**********************************************************************************
 * $.store drivers
 **********************************************************************************/

$.store.drivers = {
	// Firefox 3.5, Safari 4.0, Chrome 5, Opera 10.5, IE8
	'localStorage': {
		// see https://developer.mozilla.org/en/dom/storage#localStorage
		ident: "$.store.drivers.localStorage",
		scope: 'browser',
		available: function()
		{
			try
			{	// localStorage support test, the Modernizr way
				return !!localStorage.getItem;
			}
			catch(e)
			{
				// Firefox won't allow localStorage if cookies are disabled
				return false;
			}
		},
		init: $.noop,
		get: function( key )
		{
			return window.localStorage.getItem( key );
		},
		set: function( key, value )
		{
			window.localStorage.setItem( key, value );
		},
		del: function( key )
		{
			window.localStorage.removeItem( key );
		},
		flush: function()
		{
			window.localStorage.clear();
		},
        length: function()
		{
			return window.localStorage.length
        },
        key: function( index )
        {
            return (index >= 0 && index < window.localStorage.length) ?
                window.localStorage.key(index) : null;
		} 
	},
	
	// Firefox 3.5, Safari 4.0, Chrome 5, Opera 10.5, IE8
	'sessionStorage': {
		// see https://developer.mozilla.org/en/dom/storage#sessionStorage
		ident: "$.store.drivers.sessionStorage",
		scope: 'window',
		available: function()
		{
			try
			{   // sessionStorage support test, the Modernizr way
                return !!sessionStorage.getItem;
			}
			catch(e)
			{
				// Firefox won't allow sessionStorage if DOM Storage disabled
				return false;
			}
		},
		init: $.noop,
		get: function( key )
		{
			return window.sessionStorage.getItem( key );
		},
		set: function( key, value )
		{
			window.sessionStorage.setItem( key, value );
		},
		del: function( key )
		{
			window.sessionStorage.removeItem( key );
		},
		flush: function()
		{   
            try {
			    window.sessionStorage.clear();
            } catch(e) {
                // older (3.x) FF does not allow this on sessionStorage
                for (var r = 0; r < window.sessionStorage.length; r++) {
                    window.sessionStorage.removeItem( window.sessionStorage.key(r) );
                }
            }
		},
        length: function()
		{
			return window.sessionStorage.length
        },
        key: function( index )
        {
            return (index >= 0 && index < window.sessionStorage.length) ?
                window.sessionStorage.key(index) : null;
		}
	},
	
	// IE6, IE7
	'userData': {
		// see http://msdn.microsoft.com/en-us/library/ms531424.aspx
		ident: "$.store.drivers.userData",
		element: null,
		nodeName: 'userdatadriver',
		scope: 'browser',
		initialized: false,
        keys: [],
		available: function()
		{
			try
			{
				return !!( document.documentElement && document.documentElement.addBehavior );
			}
			catch(e)
			{
				return false;
			}
		},
		init: function()
		{
			// $.store can only utilize one userData store at a time, thus avoid duplicate initialization
			if( this.initialized )
				return;
			
			try
			{
				// Create a non-existing element and append it to the root element (html)
				this.element = document.createElement( this.nodeName );
				var headElement = document.getElementsByTagName('head')[0];
				headElement.insertBefore( this.element, document.getElementsByTagName('title')[0] );
				// Apply userData behavior
				this.element.addBehavior( "#default#userData" );
				this.initialized = true;
				return;
			}
			catch( e )
			{
				return false; 
			}
		},
		get: function( key )
		{
			this.element.load( this.nodeName );
			return this.element.getAttribute( key );
		},
		set: function( key, value )
		{
			this.element.setAttribute( key, value );
			this.element.save( this.nodeName );
            this.keys[ this.keys.length ] = key;
		},
		del: function( key )
		{
			this.element.removeAttribute( key );
			this.element.save( this.nodeName );
            var i = this.keys.indexOf( key ); 
            if (i != -1) this.keys.splice(i, 1); 
		},
		flush: function()
		{
			// flush by expiration
			this.element.expires = (new Date).toUTCString();
			this.element.save( this.nodeName );
            this.keys = [];
		},
        length: function()
		{
			return this.keys.length
        },
        key: function( index )
        {
            if (index >= 0 && index < this.keys.length) {
                var i = 0;
                for (var arrayIndex in this.keys) {
                    if (index == i++) 
                        return arrayIndex;
                }
                return null;
            } else {
                return null;
            }
		}
	},
	
	// most other browsers
	'windowName': {
		ident: "$.store.drivers.windowName",
		scope: 'window',
		cache: {},
		encodes: true,
		available: function()
		{
			return true;
		},
		init: function()
		{
			this.load();
		},
		save: function()
		{
			window.name = $.store.serializers.json.encode( this.cache );
		},
		load: function()
		{
			try
			{
				this.cache = $.store.serializers.json.decode( window.name + "" );
				if( typeof this.cache != "object" )
					this.cache = {};
			}
			catch(e)
			{
				this.cache = {};
				window.name = "{}";
			}
		},
		get: function( key )
		{
			return this.cache[ key ];
		},
		set: function( key, value )
		{
			this.cache[ key ] = value;
			this.save();
		},
		del: function( key )
		{
			try
			{
				delete this.cache[ key ];
			}
			catch(e)
			{
				this.cache[ key ] = undefined;
			}
			
			this.save();
		},
		flush: function()
		{
			window.name = "{}";
		},
        length: function()
		{
			return this.cache.length
        },
        key: function( index )
        {
            if (index >= 0 && index < this.cache.length) {
                var i = 0;
                for (var arrayIndex in this.cache) {
                    if (index == i++) return arrayIndex;
                }
                return null;
            } else {
                return null;
            }
		}
	}
};

/**********************************************************************************
 * $.store serializers
 **********************************************************************************/

$.store.serializers = {
	
	'json': {
		ident: "$.store.serializers.json",
		init: function( encoders, decoders )
		{
			encoders.push( "json" );
			decoders.push( "json" );
		},
		encode: JSON.stringify,
		decode: JSON.parse
	},
	
	// TODO: html serializer
	// 'html' : {},
	
	'xml': {
		ident: "$.store.serializers.xml",
		init: function( encoders, decoders )
		{
			encoders.unshift( "xml" );
			decoders.push( "xml" );
		},
		
		// wouldn't be necessary if jQuery exposed this function
		isXML: function( value )
		{
			var documentElement = ( value ? value.ownerDocument || value : 0 ).documentElement;
			return documentElement ? documentElement.nodeName.toLowerCase() !== "html" : false;
		},

		// encodes a XML node to string (taken from $.jStorage, MIT License)
		encode: function( value )
		{
			if( !value || value._serialized || !this.isXML( value ) )
				return value;

			var _value = { _serialized: this.ident, value: value };
			
			try
			{
				// Mozilla, Webkit, Opera
				_value.value = new XMLSerializer().serializeToString( value );
				return _value;
			}
			catch(E1)
			{
				try
				{
					// Internet Explorer
					_value.value = value.xml;
					return _value;
				}
				catch(E2){}
			}
			
			return value;
		},
		
		// decodes a XML node from string (taken from $.jStorage, MIT License)
		decode: function( value )
		{
			if( !value || !value._serialized || value._serialized != this.ident )
				return value;

			var dom_parser = ( "DOMParser" in window && (new DOMParser()).parseFromString );
			if( !dom_parser && window.ActiveXObject )
			{
				dom_parser = function( _xmlString )
				{
					var xml_doc = new ActiveXObject( 'Microsoft.XMLDOM' );
					xml_doc.async = 'false';
					xml_doc.loadXML( _xmlString );
					return xml_doc;
				}
			}

			if( !dom_parser )
			{
				return undefined;
			}
			
			value.value = dom_parser.call(
				"DOMParser" in window && (new DOMParser()) || window, 
				value.value, 
				'text/xml'
			);
			
			return this.isXML( value.value ) ? value.value : undefined;
		}
	}
};

})(jQuery);