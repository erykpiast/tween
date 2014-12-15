module.exports = (function() {

    var Easing = require('./lib/easing');
    var Interpolation = require('./lib/interpolation');


    var TWEEN = ( function () {

        var _tweens = [];

        return {

            REVISION: '14',

            getAll: function () {

                return _tweens;

            },

            removeAll: function () {

                _tweens = [];

            },

            add: function ( tween ) {

                _tweens.push( tween );

            },

            remove: function ( tween ) {

                var i = _tweens.indexOf( tween );

                if ( i !== -1 ) {

                    _tweens.splice( i, 1 );

                }

            },

            update: function ( time, backward ) {

                if ( _tweens.length === 0 ) {
                    return false;
                }

                var i = 0;

                while ( i < _tweens.length ) {

                    if ( _tweens[ i ].update( time, backward ) ) {

                        i++;

                    } else {

                        _tweens.splice( i, 1 );

                    }

                }

                return true;

            }
        };

    } )();

    TWEEN.Tween = function ( object ) {

        var _object = object;
        var _valuesStart = {};
        var _valuesEnd = {};
        var _valuesStartRepeat = {};
        var _duration = 1000;
        var _isPlaying = false;
        var _startTime = null;
        var _easingFunction = TWEEN.Easing.Linear.None;
        var _interpolationFunction = TWEEN.Interpolation.Linear;
        var _onStartCallback = null;
        var _onStartCallbackFired = false;
        var _onUpdateCallback = null;
        var _onCompleteCallback = null;
        var _onStopCallback = null;

        // Set all starting values present on the target object
        Object.keys(object).forEach(function(field) {
            _valuesStart[ field ] = parseFloat(object[field], 10);
        });

        this.to = function ( properties, duration ) {

            if ( duration !== undefined ) {

                _duration = duration;

            }

            _valuesEnd = properties;

            return this;

        };

        this.start = function ( time ) {

            TWEEN.add( this );

            _isPlaying = true;

            _onStartCallbackFired = false;

            _startTime = time;

            Object.keys(_valuesEnd).forEach(function(property) {
                // check if an Array was provided as property value
                if ( Array.isArray( _valuesEnd[ property ] ) ) {

                    if ( _valuesEnd[ property ].length === 0 ) {

                        return false;

                    }

                    // create a local copy of the Array with the start value at the front
                    _valuesEnd[ property ] = [ _object[ property ] ].concat( _valuesEnd[ property ] );

                }

                _valuesStart[ property ] = _object[ property ];

                if( ! Array.isArray( _valuesStart[ property ] ) ) {
                    _valuesStart[ property ] *= 1.0; // Ensures we're using numbers, not strings
                }

                _valuesStartRepeat[ property ] = _valuesStart[ property ] || 0;
            });

            return this;

        };

        this.stop = function () {

            if ( !_isPlaying ) {
                return this;
            }

            TWEEN.remove( this );
            _isPlaying = false;

            if ( _onStopCallback !== null ) {

                _onStopCallback.call( _object );

            }

            return this;

        };

        this.easing = function ( easing ) {

            _easingFunction = easing;
            return this;

        };

        this.interpolation = function ( interpolation ) {

            _interpolationFunction = interpolation;
            return this;

        };

        this.onStart = function ( callback ) {

            _onStartCallback = callback;
            return this;

        };

        this.onUpdate = function ( callback ) {

            _onUpdateCallback = callback;
            return this;

        };

        this.onComplete = function ( callback ) {

            _onCompleteCallback = callback;
            return this;

        };

        this.onStop = function ( callback ) {

            _onStopCallback = callback;
            return this;

        };

        this.update = function ( time, backward ) {

            if ( _onStartCallbackFired === false ) {

                if ( _onStartCallback !== null ) {

                    _onStartCallback.call( _object );

                }

                _onStartCallbackFired = true;

            }

            var elapsed = ( time - _startTime ) / _duration;
            elapsed = ( elapsed > 1 ? 1 : ( elapsed < 0 ? 0 : elapsed ) );

            var value = _easingFunction( elapsed );

            Object.keys(_valuesEnd).forEach(function(property) {

                var start = _valuesStart[ property ] || 0;
                var end = _valuesEnd[ property ];

                if ( Array.isArray( end ) ) {

                    _object[ property ] = _interpolationFunction( end, value );

                } else {

                    // Parses relative end values with start as base (e.g.: +10, -3)
                    if ( typeof(end) === 'string' ) {
                        end = start + parseFloat(end, 10);
                    }

                    // protect against non numeric properties.
                    if ( typeof(end) === 'number' ) {
                        _object[ property ] = start + ( end - start ) * value;
                    }

                }

            });

            if ( _onUpdateCallback !== null ) {

                _onUpdateCallback.call( _object, value );

            }

            if (
                ( backward && ( elapsed === 0 ) ) ||
                ( !backward && ( elapsed === 1 ) )
            ) {
                if ( _onCompleteCallback !== null ) {

                    _onCompleteCallback.call( _object );

                }

                return false;

            }

            return true;

        };

    };

    TWEEN.Easing = Easing;

    TWEEN.Interpolation = Interpolation;


    return TWEEN;

})();