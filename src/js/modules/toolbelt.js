export class Toolbelt {

    constructor() {

        var self = this

        // Random shuffle on arrays just like they did with underscore in the olden days
        Array.prototype.shuffle = function() {
          var i = this.length, j, temp;
          if ( i == 0 ) return this;
          while ( --i ) {
             j = Math.floor( Math.random() * ( i + 1 ) );
             temp = this[i];
             this[i] = this[j];
             this[j] = temp;
          }
          return this;
        }

        Array.prototype.sum = function (prop) {
            var total = 0
            for ( var i = 0, _len = this.length; i < _len; i++ ) {
                total += this[i][prop]
            }
            return total
        }
        
        // Returns an array of values without any duplicate values
        Array.prototype.unique = function() {
            var unique = [];
            for ( i = 0; i < this.length; i++ ) {
                var current = this[i];
                if (unique.indexOf(current) < 0) unique.push(current);
            }
            return unique;
        }

    }

    // returns true for 1 or more matches, where 'a' is an array and 'b' is a search string or an array of multiple search strings
    contains(a, b) {
        // array matches
        if (Array.isArray(b)) {
            return b.some(x => a.indexOf(x) > -1);
        }
        // string match
        return a.indexOf(b) > -1;
    }

    // Returns an array of items that match items in another array, where 'a' is an array and 'b' is a search string or an array of multiple search strings
    match_array(a, b) {

        // array matches
        if (Array.isArray(b)) {

            var filteredArray = b.filter(function( c ) {
                if (a.indexOf(c) > -1) {
                    return c;
                }
            });

            return filteredArray

        }

        // string match
        return  (a.indexOf(b) > -1) ? b : [] ;

    }

    // Returns true if the array contains duplicates
    has_duplicates(array) {
        var valuesSoFar = Object.create(null);
        for (var i = 0; i < array.length; ++i) {
            var value = array[i];
            if (value in valuesSoFar) {
                return true;
            }
            valuesSoFar[value] = true;
        }
        return false;
    }

    readCookie(name) {
        var nameEQ = name + "=";
        var ca = document.cookie.split(';');
        for(var i=0;i < ca.length;i++) {
            var c = ca[i];
            while (c.charAt(0)==' ') c = c.substring(1,c.length);
            if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
        }
        return null;
    }

    getOffsetTop(elem) {

        // Set our distance placeholder
        var distance = 0;

        // Loop up the DOM
        if (elem.offsetParent) {
            do {
                distance += elem.offsetTop;
                elem = elem.offsetParent;
            } while (elem);
        }

        // Return our distance
        return distance < 0 ? 0 : distance;
    }

    toTitleCase(string) {
        return string.toLowerCase().replace(/_/g, ' ').replace(/\b([a-z\u00C0-\u00ff])/g, function (_, initial) {
          return initial.toUpperCase();
        }).replace(/(\s(?:de|a|o|e|da|do|em|ou|[\u00C0-\u00ff]))\b/ig, function (_, match) {
          return match.toLowerCase();
        });
    }

    addCommasToNumbers(num) {
        var result = parseFloat(num).toFixed();
        result = result.replace(/(\d)(?=(\d{3})+$)/g, '$1,');
        return result
    }

    niceNumber(num) {
                if ( num > 0 ) {
                    if ( num >= 1000000000 ) { return ( num / 1000000000 ).toFixed(0) + 'bn' }
                    if ( num >= 1000000 ) { return ( num / 1000000 ).toFixed(0) + 'm' }
                    if ( num >= 1000 ) { return ( num / 1000 ).toFixed(0) + 'k' }
                    if (num % 1 != 0) { return num.toFixed(2) }
                    else { return num }
            }

            if ( num < 0 ) {
                var posNum = num * -1;
                if ( posNum > 1000000000 ) return [ "-" + String(( posNum / 1000000000 ).toFixed(1)) + 'bn'];
                if ( posNum > 1000000 ) return ["-" + String(( posNum / 1000000 ).toFixed(1)) + 'm'];
                if ( posNum > 1000 ) return ["-" + String(( posNum / 1000 ).toFixed(1)) + 'k'];
                else { return num }
            }

            else {
                return num
            }
      
    }

    keyNumber(num) {
                if ( num > 0 ) {
                if ( num > 1000000000 ) { return ( num / 1000000000 ).toFixed(1) + 'bn' }
                else if ( num > 1000000 ) { return ( num / 1000000 ).toFixed(1) + 'm' }
                else if ( num > 1000 ) { return ( num / 1000000 ).toFixed(1) + 'k' }
                else if (num % 1 != 0) { return num.toFixed(2) }
                else { return num.toLocaleString() }
            }

            if ( num < 0 ) {
                var posNum = num * -1;
                if ( posNum > 1000000000 ) return [ "-" + String(( posNum / 1000000000 ).toFixed(1)) + 'bn'];
                if ( posNum > 1000000 ) return ["-" + String(( posNum / 1000000 ).toFixed(1)) + 'm'];
                if ( posNum > 1000 ) return ["-" + String(( posNum / 1000 ).toFixed(1)) + 'k'];
                else { return num.toLocaleString() }
            }

            return num;
      
    }

    localStorage() {
        if (typeof localStorage !== 'undefined') {
            try {
                localStorage.setItem('verify', 'confirm');
                if (localStorage.getItem('verify') === 'confirm') {
                    localStorage.removeItem('verify');
                    //localStorage is enabled
                    this.localstore = true;
                } else {
                    //localStorage is disabled
                    this.localstore = false;
                }
            } catch(e) {
                //localStorage is disabled
                this.localstore = false;
            }
        } else {
            //localStorage is not available
            this.localstore = false;
        }
        return this.localstore
    }

    clearLocalStorage(target) {
        localStorage.removeItem(target);
    }

    getShareUrl() { 
        var isInIframe = (parent !== window);
        var parentUrl = null;
        shareUrl = (isInIframe) ? document.referrer : shareUrl = window.location.href;
        return shareUrl;  
    }

    getURLParams(paramName) {
        var searchString = window.location.search.substring(1),
            i, val, params = searchString.split("&");

        for (i = 0; i < params.length; i++) {
            val = params[i].split("=");
            if (val[0] == paramName) {
                return val[1];
            }
        }
        return null;
    }

    getParams(index) {

        var urlParams; 
        var params = {};

        var elements = document.getElementsByClassName('element-interactive');
        var el = elements[index];

        try {

            urlParams = el.getAttribute('data-alt').split('&');

        } catch(err) {

            console.log("Params: " + err)

        }

        if (urlParams) {

            urlParams.forEach(function(param){
             
                if (param.indexOf('=') === -1) {
                    params[param.trim()] = true;
                } else {
                    var pair = param.split('=');
                    params[ pair[0] ] = pair[1];
                }
                
            });

        }
        
        return (params.length > 0) ? params : false
        
    }

    mobileCheck() {
        
        var check = false;
        (function(a) {
            if (/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|mobile.+firefox|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows ce|xda|xiino/i.test(a) || /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(a.substr(0, 4))) check = true
        })(navigator.userAgent || navigator.vendor || window.opera);
        var isiPad = navigator.userAgent.match(/iPad/i) != null;
        return (check || isiPad ? true : false);
    }

    temporalFormat(time) {   
        
        // Hours, minutes and seconds
        time = parseInt(time);
        var hrs = ~~(time / 3600);
        var mins = ~~((time % 3600) / 60);
        var secs = time % 60;

        // Output like "1:01" or "4:03:59" or "123:03:59"
        var ret = "";

        if (hrs > 0) {
            ret += "" + hrs + ":" + (mins < 10 ? "0" : "");
        }

        ret += "" + mins + ":" + (secs < 10 ? "0" : "");
        ret += "" + secs;
        return ret;
    }

    temporalToSeconds(hms) {

        var a = hms.split(':');

        var seconds = (+a[0]) * 60 * 60 + (+a[1]) * 60 + (+a[2])

        return seconds

    }

    hexToRgb(hex) {
        // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
        var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
        hex = hex.replace(shorthandRegex, function(m, r, g, b) {
            return r + r + g + g + b + b;
        });

        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    componentToHex(c) {
        var hex = c.toString(16);
        return hex.length == 1 ? "0" + hex : hex;
    }

    rgbToHex(r, g, b) {
        return "#" + this.componentToHex(r) + this.componentToHex(g) + this.componentToHex(b);
    }

    alpharizer(element, level) {

        var current_color = getComputedStyle(element).getPropertyValue("background-color");
        var match = /rgba?\((\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(,\s*\d+[\.\d+]*)*\)/g.exec(current_color)
        level > 1 ? (level / 100) : level;
        element.style.backgroundColor = "rgba(" + [match[1],match[2],match[3],level].join(',') +")";

    }

    multiples(arr, multiplyer) {

        let array = []

        arr.forEach(function(num) {
            if (num % multiplyer === 0 ) {
                array.push(num)
            }
        });

        return array
         
    }

    getNextHighestIndex(arr, value) {

        // Return the index of the next highest value in the array. 
        // If there is no value in the array that is higher than the supplied value, 
        // it will return the length of the array. If all values in the array are higher, 
        // it will return 0.
        var i = arr.length;
        while (arr[--i] > value);
        return ++i; 
    }

    mustache(l, a, m, c) {

        var self = this

        function h(a, b) {
            b = b.pop ? b : b.split(".");
            a = a[b.shift()] || "";
            return 0 in b ? h(a, b) : a
        }
        var k = self.mustache,
            e = "";
        a = Array.isArray(a) ? a : a ? [a] : [];
        a = c ? 0 in a ? [] : [1] : a;
        for (c = 0; c < a.length; c++) {
            var d = "",
                f = 0,
                n, b = "object" == typeof a[c] ? a[c] : {},
                b = Object.assign({}, m, b);
            b[""] = {
                "": a[c]
            };
            l.replace(/([\s\S]*?)({{((\/)|(\^)|#)(.*?)}}|$)/g, function(a, c, l, m, p, q, g) {
                f ? d += f && !p || 1 < f ? a : c : (e += c.replace(/{{{(.*?)}}}|{{(!?)(&?)(>?)(.*?)}}/g, function(a, c, e, f, g, d) {
                    return c ? h(b, c) : f ? h(b, d) : g ? k(h(b, d), b) : e ? "" : (new Option(h(b, d))).innerHTML
                }), n = q);
                p ? --f || (g = h(b, g), e = /^f/.test(typeof g) ? e + g.call(b, d, function(a) {
                    return k(a, b)
                }) : e + k(d, g, b, n), d = "") : ++f
            })
        }
        return e
    }

    validate(email) {

        var filter = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

        return (filter.test(email)) ?  true : false ;

    }


}
