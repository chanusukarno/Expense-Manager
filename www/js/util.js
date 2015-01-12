/* 
 Switch actions
 */
function unmask() {

    if ($(this).prev('input').attr('type') == 'password')
        changeType($(this).prev('input'), 'text');

    else
        changeType($(this).prev('input'), 'password');

    return false;
}


function changeType(x, type) {
    if (x.prop('type') == type)
        return x; //That was easy.
    try {
        return x.prop('type', type); //Stupid IE security will not allow this
    } catch (e) {
        //Try re-creating the element (yep... this sucks)
        //jQuery has no html() method for the element, so we have to put into a div first
        var html = $("<div>").append(x.clone()).html();
        var regex = /type=(\")?([^\"\s]+)(\")?/; //matches type=text or type="text"
        //If no match, we add the type attribute to the end; otherwise, we replace
        var tmp = $(html.match(regex) == null ?
                html.replace(">", ' type="' + type + '">') :
                html.replace(regex, 'type="' + type + '"'));
        //Copy data from old element
        tmp.data('type', x.data('type'));
        var events = x.data('events');
        var cb = function(events) {
            return function() {
                //Bind all prior events
                for (i in events)
                {
                    var y = events[i];
                    for (j in y)
                        tmp.bind(i, y[j].handler);
                }
            }
        }(events);
        x.replaceWith(tmp);
        setTimeout(cb, 10); //Wait a bit to call function
        return tmp;
    }
}

function isValidDate(d) {
    if ( Object.prototype.toString.call(d) !== "[object Date]" )
        return false;
    return !isNaN(d.getTime());
}

/**
 * You first need to create a formatting function to pad numbers to two digits…
 **/
function twoDigits(d) {
    if(0 <= d && d < 10) return "0" + d.toString();
    if(-10 < d && d < 0) return "-0" + (-1*d).toString();
    return d.toString();
}

/**
 * …and then create the method to output the date string as desired.
 * Some people hate using prototypes this way, but if you are going
 * to apply this to more than one Date object, having it as a prototype
 * makes sense.
 **/
Date.prototype.toMysqlFormat = function() {
    return this.getUTCFullYear() + "-" + twoDigits(1 + this.getUTCMonth()) + "-" + twoDigits(this.getUTCDate()) + " " + twoDigits(this.getUTCHours()) + ":" + twoDigits(this.getUTCMinutes()) + ":" + twoDigits(this.getUTCSeconds());
};