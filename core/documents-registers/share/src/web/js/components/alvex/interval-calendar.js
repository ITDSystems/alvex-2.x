(function() {

    /**
    * IntervalCalendar is an extension of the CalendarGroup designed specifically
    * for the selection of an interval of dates.
    *
    * @namespace YAHOO.example.calendar
    * @module calendar
    * @since 2.5.2
    * @requires yahoo, dom, event, calendar
    */

    /**
    * IntervalCalendar is an extension of the CalendarGroup designed specifically
    * for the selection of an interval of dates, as opposed to a single date or
    * an arbitrary collection of dates.
    * <p>
    * <b>Note:</b> When using IntervalCalendar, dates should not be selected or
    * deselected using the 'selected' configuration property or any of the
    * CalendarGroup select/deselect methods. Doing so will corrupt the internal
    * state of the control. Instead, use the provided methods setInterval and
    * resetInterval.
    * </p>
    * <p>
    * Similarly, when handling select/deselect/etc. events, do not use the
    * dates passed in the arguments to attempt to keep track of the currently
    * selected interval. Instead, use getInterval.
    * </p>
    *
    * @namespace YAHOO.example.calendar
    * @class IntervalCalendar
    * @extends YAHOO.widget.CalendarGroup
    * @constructor
    * @param {String | HTMLElement} container The id of, or reference to, an HTML DIV element which will contain the control.
    * @param {Object} cfg optional The initial configuration options for the control.
    */
    function IntervalCalendar(container, id, cfg) {
        /**
        * The interval state, which counts the number of interval endpoints that have
        * been selected (0 to 2).
        * 
        * @private
        * @type Number
        */
        this.submit = false;
        this._iState = 0;
        this._fromMin = false;
        this._toMax = false;

        // Must be a multi-select CalendarGroup
        cfg = cfg || {};
        cfg.MULTI_SELECT = true;
        
        // Call parent constructor
        IntervalCalendar.superclass.constructor.call(this, container, id, cfg);

        this.extCfg = cfg;
        
        // Subscribe internal event handlers
        this.beforeSelectEvent.subscribe(this._intervalOnBeforeSelect, this, true);
        this.selectEvent.subscribe(this._intervalOnSelect, this, true);
        this.beforeDeselectEvent.subscribe(this._intervalOnBeforeDeselect, this, true);
        this.deselectEvent.subscribe(this._intervalOnDeselect, this, true);
        this.renderEvent.subscribe(this._renderButtons, this, true);
    }

    /**
    * Default configuration parameters.
    * 
    * @property IntervalCalendar._DEFAULT_CONFIG
    * @final
    * @static
    * @private
    * @type Object
    */
    IntervalCalendar._DEFAULT_CONFIG = YAHOO.widget.Calendar._DEFAULT_CONFIG;

    YAHOO.lang.extend(IntervalCalendar, YAHOO.widget.Calendar, {

        _clearMinMax: function f() {
            this._fromMin = false;
            this._toMax = false;
        },

        submitForm: function f(scope) {
            scope.submit = true;
            scope.selectEvent.fire();
        },

        clearForm: function f(scope) {
            scope._clearMinMax();
            scope._iState = 0;
            scope.submit = true;
            scope.selectEvent.fire();
        },

        minClick: function f(scope) {
            var date = new Date(2000, 0, 1);
            scope._fromMin = true;
            scope.select( scope._dateString(date) );
        },

        maxClick: function f(scope) {
            var date = new Date(2020, 0, 1);
            scope._toMax = true;
            scope.select( scope._dateString(date) );
        },

        _renderButtons : function f() {

            var scope = this;

            var butEl = document.createElement('div');

            var minmaxEl = document.createElement('div');

            var minBut = document.createElement('button');
            minBut.innerHTML = this.extCfg.minText;
            minBut.style.left = "5px";
            minBut.style.position = "absolute";
            minBut.setAttribute('type', 'button');
            minBut.onclick = function() { scope.minClick(scope); };
            minmaxEl.appendChild( minBut );

            var maxBut = document.createElement('button');
            maxBut.innerHTML = this.extCfg.maxText;
            maxBut.style.right = "5px";
            maxBut.style.position = "absolute";
            maxBut.setAttribute('type', 'button');
            maxBut.onclick = function() { scope.maxClick(scope); };
            minmaxEl.appendChild( maxBut );

            butEl.appendChild( minmaxEl );

            var acEl = document.createElement('div');
            acEl.style.paddingTop = "10px";
            acEl.style.textAlign = 'center';

            var okBut = document.createElement('button');
            okBut.innerHTML = this.extCfg.okText;
            okBut.setAttribute('type', 'button');
            okBut.onclick = function() { scope.submitForm(scope); };
            acEl.appendChild( okBut );

            var cancelBut = document.createElement('button');
            cancelBut.innerHTML = this.extCfg.cancelText;
            cancelBut.setAttribute('type', 'button');
            cancelBut.onclick = function() { scope.clearForm(scope); };
            acEl.appendChild( cancelBut );

            butEl.appendChild( acEl );

            this.oDomContainer.appendChild( butEl );

            this._buttonsReady = true;
        },

        /**
        * Returns a string representation of a date which takes into account
        * relevant localization settings and is suitable for use with
        * YAHOO.widget.CalendarGroup and YAHOO.widget.Calendar methods.
        * 
        * @method _dateString
        * @private
        * @param {Date} d The JavaScript Date object of which to obtain a string representation.
        * @return {String} The string representation of the JavaScript Date object.
        */
        _dateString : function(d) {
            var a = [];
            a[this.cfg.getProperty(IntervalCalendar._DEFAULT_CONFIG.MDY_MONTH_POSITION.key)-1] = (d.getMonth() + 1);
            a[this.cfg.getProperty(IntervalCalendar._DEFAULT_CONFIG.MDY_DAY_POSITION.key)-1] = d.getDate();
            a[this.cfg.getProperty(IntervalCalendar._DEFAULT_CONFIG.MDY_YEAR_POSITION.key)-1] = d.getFullYear();
            var s = this.cfg.getProperty(IntervalCalendar._DEFAULT_CONFIG.DATE_FIELD_DELIMITER.key);
            return a.join(s);
        },

        /**
        * Given a lower and upper date, returns a string representing the interval
        * of dates between and including them, which takes into account relevant
        * localization settings and is suitable for use with
        * YAHOO.widget.CalendarGroup and YAHOO.widget.Calendar methods.
        * <p>
        * <b>Note:</b> No internal checking is done to ensure that the lower date
        * is in fact less than or equal to the upper date.
        * </p>
        * 
        * @method _dateIntervalString
        * @private
        * @param {Date} l The lower date of the interval, as a JavaScript Date object.
        * @param {Date} u The upper date of the interval, as a JavaScript Date object.
        * @return {String} The string representing the interval of dates between and
        *                   including the lower and upper dates.
        */
        _dateIntervalString : function(l, u) {
            var s = this.cfg.getProperty(IntervalCalendar._DEFAULT_CONFIG.DATE_RANGE_DELIMITER.key);
            return (this._dateString(l)
                    + s + this._dateString(u));
        },

        /**
        * Returns the lower and upper dates of the currently selected interval, if an
        * interval is selected.
        * 
        * @method getInterval
        * @return {Array} An empty array if no interval is selected; otherwise an array
        *                 consisting of two JavaScript Date objects, the first being the
        *                 lower date of the interval and the second being the upper date.
        */
        getInterval : function() {
            // Get selected dates
            var dates = this.getSelectedDates();
            if( this._iState != 0 && dates.length > 0 ) {
                // Return lower and upper date in array
                var l = this._fromMin ? "MIN" : dates[0];
                var u = this._toMax ? "MAX" : dates[dates.length - 1];
                return [l, u];
            }
            else {
                // No dates selected, return empty array
                return [];
            }
        },

        /**
        * Sets the currently selected interval by specifying the lower and upper
        * dates of the interval (in either order).
        * <p>
        * <b>Note:</b> The render method must be called after setting the interval
        * for any changes to be seen.
        * </p>
        * 
        * @method setInterval
        * @param {Date} d1 A JavaScript Date object.
        * @param {Date} d2 A JavaScript Date object.
        */
        setInterval : function(d1, d2) {
            // Determine lower and upper dates
            var b = ( (d1 <= d2) || (d1 == "MIN") || (d2 == "MAX") );
            var l = b ? d1 : d2;
            var u = b ? d2 : d1;

            if( l == "MIN" ) {
                l = new Date(2000, 0, 1);
                this._fromMin = true;
            }
            if( u == "MAX" ) {
                u = new Date(2020, 0, 1);
                this._toMax = true;
            }

            // Update configuration
            this.cfg.setProperty('selected', this._dateIntervalString(l, u), false);
            this._iState = 2;
        },

        /**
        * Resets the currently selected interval.
        * <p>
        * <b>Note:</b> The render method must be called after resetting the interval
        * for any changes to be seen.
        * </p>
        * 
        * @method resetInterval
        */
        resetInterval : function() {
            // Update configuration
            this.cfg.setProperty('selected', [], false);
            this._iState = 0;
        },

        /**
        * Handles beforeSelect event.
        * 
        * @method _intervalOnBeforeSelect
        * @private
        */
        _intervalOnBeforeSelect : function(t,a,o) {
            // Update interval state
            this._iState = (this._iState + 1) % 3;
            if(this._iState == 0) {
                // If starting over with upcoming selection, first deselect all
                this.deselectAll();
                this._clearMinMax();
                this._iState++;
            }
        },

        /**
        * Handles selectEvent event.
        * 
        * @method _intervalOnSelect
        * @private
        */
        _intervalOnSelect : function(t,a,o) {
            // Get selected dates
            var dates = this.getSelectedDates();
            if(dates.length > 1) {
                /* If more than one date is selected, ensure that the entire interval
                    between and including them is selected */
                var l = dates[0];
                l.setHours(12);
                var u = dates[dates.length - 1];
                u.setHours(12);
                this.cfg.setProperty('selected', this._dateIntervalString(l, u), false);
            }
            // Render changes
            this.render();
        },

        /**
        * Handles beforeDeselect event.
        * 
        * @method _intervalOnBeforeDeselect
        * @private
        */
        _intervalOnBeforeDeselect : function(t,a,o) {
            if(this._iState != 0) {
                /* If part of an interval is already selected, then swallow up
                    this event because it is superfluous (see _intervalOnDeselect) */
                return false;
            }
        },

        /**
        * Handles deselectEvent event.
        *
        * @method _intervalOnDeselect
        * @private
        */
        _intervalOnDeselect : function(t,a,o) {
            if(this._iState != 0) {
                // If part of an interval is already selected, then first deselect all
                this._iState = 0;
                this.deselectAll();

                // Get individual date deselected and page containing it
                var d = a[0][0];
                var date = YAHOO.widget.DateMath.getDate(d[0], d[1] - 1, d[2]);

                this.beforeSelectEvent.fire();
                this.cfg.setProperty('selected', this._dateString(date), false);
                this.selectEvent.fire([d]);

                // Swallow up since we called deselectAll above
                return false;
            }
        }
    });

    // Ensure root object exists
    if (typeof YAHOO.thirdparty == "undefined" || !YAHOO.thirdparty)
    {
        YAHOO.thirdparty = {};
    }

    YAHOO.thirdparty.IntervalCalendar = IntervalCalendar;

})();
