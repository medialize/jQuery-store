# `$.store` jQuery plugin #

`$.store` is a simple, yet easily extensible, plugin to persistently store data on the client side of things. It uses `window.localStore` where available. Older Internet Explorers will use `userData`. If all fails `$.store` will save your data to `window.name`.

*Note*: The `windowName` driver will only do JSON serialization. `windowName` is not persistent in the sense of making it across a closed browser window. If you need that ability you should check `$.storage.driver.scope == "browser"`.

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

## License ##

`$.store` is published under the [MIT license](http://www.opensource.org/licenses/mit-license.php).
