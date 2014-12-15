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

            update: function ( time ) {

                if ( _tweens.length === 0 ) return false;

                var i = 0;

                time = time !== undefined ? time : ( typeof window !== 'undefined' && window.performance !== undefined && window.performance.now !== undefined ? window.performance.now() : Date.now() );

                while ( i < _tweens.length ) {

                    if ( _tweens[ i ].update( time ) ) {

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
        var _repeat = 0;
        var _yoyo = false;
        var _isPlaying = false;
        var _reversed = false;
        var _delayTime = 0;
        var _startTime = null;
        var _easingFunction = TWEEN.Easing.Linear.None;
        var _interpolationFunction = TWEEN.Interpolation.Linear;
        var _chainedTweens = [];
        var _onStartCallback = null;
        var _onStartCallbackFired = false;
        var _onUpdateCallback = null;
        var _onCompleteCallback = null;
        var _onStopCallback = null;

        // Set all starting values present on the target object
        for ( var field in object ) {

            _valuesStart[ field ] = parseFloat(object[field], 10);

        }

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

            _startTime = time !== undefined ? time : ( typeof window !== 'undefined' && window.performance !== undefined && window.performance.now !== undefined ? window.performance.now() : Date.now() );
            _startTime += _delayTime;

            for ( var property in _valuesEnd ) {

                // check if an Array was provided as property value
                if ( _valuesEnd[ property ] instanceof Array ) {

                    if ( _valuesEnd[ property ].length === 0 ) {

                        continue;

                    }

                    // create a local copy of the Array with the start value at the front
                    _valuesEnd[ property ] = [ _object[ property ] ].concat( _valuesEnd[ property ] );

                }

                _valuesStart[ property ] = _object[ property ];

                if( ( _valuesStart[ property ] instanceof Array ) === false ) {
                    _valuesStart[ property ] *= 1.0; // Ensures we're using numbers, not strings
                }

                _valuesStartRepeat[ property ] = _valuesStart[ property ] || 0;

            }

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

            this.stopChainedTweens();
            return this;

        };

        this.stopChainedTweens = function () {

            for ( var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++ ) {

                _chainedTweens[ i ].stop();

            }

        };

        this.delay = function ( amount ) {

            _delayTime = amount;
            return this;

        };

        this.repeat = function ( times ) {

            _repeat = times;
            return this;

        };

        this.yoyo = function( yoyo ) {

            _yoyo = yoyo;
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

        this.chain = function () {

            _chainedTweens = arguments;
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

        this.update = function ( time ) {

            var property;

            if ( time < _startTime ) {

                return true;

            }

            if ( _onStartCallbackFired === false ) {

                if ( _onStartCallback !== null ) {

                    _onStartCallback.call( _object );

                }

                _onStartCallbackFired = true;

            }

            var elapsed = ( time - _startTime ) / _duration;
            elapsed = elapsed > 1 ? 1 : elapsed;

            var value = _easingFunction( elapsed );

            for ( property in _valuesEnd ) {

                var start = _valuesStart[ property ] || 0;
                var end = _valuesEnd[ property ];

                if ( end instanceof Array ) {

                    _object[ property ] = _interpolationFunction( end, value );

                } else {

                    // Parses relative end values with start as base (e.g.: +10, -3)
                    if ( typeof(end) === "string" ) {
                        end = start + parseFloat(end, 10);
                    }

                    // protect against non numeric properties.
                    if ( typeof(end) === "number" ) {
                        _object[ property ] = start + ( end - start ) * value;
                    }

                }

            }

            if ( _onUpdateCallback !== null ) {

                _onUpdateCallback.call( _object, value );

            }

            if ( elapsed == 1 ) {

                if ( _repeat > 0 ) {

                    if( isFinite( _repeat ) ) {
                        _repeat--;
                    }

                    // reassign starting values, restart by making startTime = now
                    for( property in _valuesStartRepeat ) {

                        if ( typeof( _valuesEnd[ property ] ) === "string" ) {
                            _valuesStartRepeat[ property ] = _valuesStartRepeat[ property ] + parseFloat(_valuesEnd[ property ], 10);
                        }

                        if (_yoyo) {
                            var tmp = _valuesStartRepeat[ property ];
                            _valuesStartRepeat[ property ] = _valuesEnd[ property ];
                            _valuesEnd[ property ] = tmp;
                        }

                        _valuesStart[ property ] = _valuesStartRepeat[ property ];

                    }

                    if (_yoyo) {
                        _reversed = !_reversed;
                    }

                    _startTime = time + _delayTime;

                    return true;

                } else {

                    if ( _onCompleteCallback !== null ) {

                        _onCompleteCallback.call( _object );

                    }

                    for ( var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++ ) {

                        _chainedTweens[ i ].start( time );

                    }

                    return false;

                }

            }

            return true;

        };

    };

    TWEEN.Easing = Easing;

    TWEEN.Interpolation = Interpolation;

})();