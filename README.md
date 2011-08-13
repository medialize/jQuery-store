# $.store jQuery plugin #

'$.store' is a simple, yet easily extensible, plugin to persistently store data on the client side of things. It uses 'window.localStore' where available. Older Internet Explorers will use 'userData'. If all fails '$.store' will save your data to 'window.name'.

*Note*: The 'windowName' driver will only do JSON serialization. 'windowName' is not persistent in the sense of making it across a closed browser window. If you need that ability you should check '$.storage.driver.scope == "browser"'.

## Usage ##

	//initialize
	$.storage = new $.store();
	
	// save a value
	$.storage.set( key, value );
	
	// read a value
	$.storage.get( key );
	
	// deletes a value
	$.storage.del( key );
	
	// delete all values
	$.storage.flush();

	// get the number of stored entries
	$.storage.length();
    
	// get a key by index (order is not guaranteed, use for iterating through keys)
	$.storage.key( index );    
    
## Adding Serializers ##

You can easily add your own serializers to the stack. Make sure to add them before initializing the '$.store'.

*Note:* Serializers do not apply to the 'windowName' storage driver.

	$.store.serializers.yaddayadda = {
		ident: "$.store.serializers.yaddayadda",
		init: function( encoders, decoders )
		{
			// register your serializer with en/decoder stack
			encoders.unshift( "yaddayadda" );
			decoders.push( "yaddayadda" );
		},
		
		isYaddaYadda: function( value )
		{
			// determine if value should be processed by this serializer
			return true;
		},
		
		encode: function( value )
		{
			// check if the value can be encoded
			if( !value || value._serialized || !this.isYaddaYadda( value ) )
				return value;
			
			// prepare serialized-data-wrapper
			var _value = { _serialized: this.ident, value: value };
			
			// work your magic
			_value.value = "serializedVersionOf data";
			
			return value;
		},
		
		decode: function( value )
		{
			// check if the value can be decoded
			if( !value || !value._serialized || value._serialized != this.ident )
				return value;
			
			// work your magic
			value.value = "unserializedVersionOf data";
			
			return this.isYaddaYadda( value.value ) ? value.value : undefined;
		}
	};

## License ##

'$.store' is published under the [MIT license][].

[MIT license]: http://www.opensource.org/licenses/mit-license.php