//import * as d3 from 'd3'

export async function getJson(url) {
  return fetch(`${url}`).then(r => r.json())
}

export async function getTemplate(path) {
  return fetch(`${path}`).then(r => r.text())
}

export function multiples(arr, multiplyer) {

  let array = []

  arr.forEach(function(num) {
      if (num % multiplyer === 0 ) {
          array.push(num)
      }
  });

  return array
   
}

export function onElementHeightChange(elm, callback) {
  var lastHeight = elm.clientHeight, newHeight;
  (function run(){
    newHeight = elm.clientHeight;
    if( lastHeight != newHeight )
      callback();
    lastHeight = newHeight;

    if( elm.onElementHeightChangeTimer )
      clearTimeout(elm.onElementHeightChangeTimer);

    elm.onElementHeightChangeTimer = setTimeout(run, 250);
  })();
}


export const _$ = selector => document.querySelector(selector)
export const _$$ = selector => [].slice.apply(document.querySelectorAll(selector))

export const getDimensions = el => {
	const width = el.clientWidth || el.getBoundingClientRect().width
	const height = el.clientHeight || el.getBoundingClientRect().height
	return [ width, height ]
}

// console.log( dateChecker('2022/11/03', '2022/11/04', '2022/11/04') )

export function dateChecker(dt, start, end) {

	let date = new Date(dt);
	let from = new Date(start);
	let to = new Date(new Date(end).setDate(new Date(end).getDate() + 1));
	let check = new Date(dt).setMinutes(date.getMinutes() - date.getTimezoneOffset());

	if (check >= from && check < to) {
		console.log(dt)
	}

	return (check >= from && check < to) ? true : false

}



export function getNextHighestIndex(arr, value) {

  // Return the index of the next highest value in the array. 
  // If there is no value in the array that is higher than the supplied value, 
  // it will return the length of the array. If all values in the array are higher, 
  // it will return 0.
  var i = arr.length;
  while (arr[--i] > value);
  return ++i; 
}

export function merge(to, from) {

    for (const n in from) {
        if (typeof to[n] != 'object') {
            to[n] = from[n];
        } else if (typeof from[n] == 'object') {
            to[n] = merge(to[n], from[n]);
        }
    }
    return to;
};

export function hexToRgb(hex) {
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

export function closestDate(dates, meridian) {

  var arr = dates.map(d => new Date(d))
  var diffdate = new Date(meridian);
  
  let resp = arr.sort(function(a, b) {
      var distancea = Math.abs(diffdate - a);
      var distanceb = Math.abs(diffdate - b);
      return distancea - distanceb; // sort a before b when the distance is smaller
  });

  let fin = resp[0].toISOString()

  return fin.slice(0,10)

}

/*
export function closest(array, num) {

    return array.reduce((a, b) => {
        return Math.abs(b - num) < Math.abs(a - num) ? b : a;
    });
}
*/

export function closest(array, num) {
	return array.reduce((a, b) => {
		let aDiff = Math.abs(a - num);
		let bDiff = Math.abs(b - num);
		if (aDiff == bDiff) {
			// Grab the biggest
			return a > b ? a : b;
		} else {
			return bDiff < aDiff ? b : a;
		}
	});
}

export function contains(a, b) {

    if (Array.isArray(b)) {
        return b.some(x => a.indexOf(x) > -1);
    }

    return a.indexOf(b) > -1;
}

export function commas(num) {
    var result = parseFloat(num).toFixed();
    result = result.replace(/(\d)(?=(\d{3})+$)/g, '$1,');
    return result
}

export function getMargins(json) {

      let margins = {
        top: +json["margin-top"],
        right: +json["margin-right"],
        bottom: +json["margin-bottom"],
        left: +json["margin-left"]
      }

    return margins
}

export function mobile() {

    var windowWidth = Math.max(
        document.documentElement.clientWidth,
        window.innerWidth || 0
    )

    return windowWidth < 610 ? true : false
}

export function numberFormat(num) {
    if ( num > 0 ) {
        if ( num >= 1000000000 ) { 

            if ((num / 1000000000) % 1 == 0) {
                return ( num / 1000000000 ) + 'bn' 
            }
            else {
                return ( num / 1000000000 ).toFixed(1) + 'bn' 
            }
            
            }
        if ( num >= 1000000 ) { 

            if (( num / 1000000 ) % 1 == 0) {
              return ( num / 1000000 ) + 'm' 
            }  
            else {
              return ( num / 1000000 ).toFixed(1) + 'm' 
            }
            
            }
        if ( num >= 1000 ) {

            if (( num / 1000 ) % 1 == 0) {
              return ( num / 1000 ) + 'k' 
            }

            else {
              return ( num / 1000 ).toFixed(1) + 'k' 
            }
          }
        if (num % 1 != 0) { 
            return num
          }
        else { return num }
    }
    if ( num < 0 ) {
        var posNum = num * -1;
        if ( posNum >= 1000000000 ) return [ "-" + String(( posNum / 1000000000 ).toFixed(1)) + 'bn'];
        if ( posNum >= 1000000 ) return ["-" + String(( posNum / 1000000 ).toFixed(1)) + 'm'];
        if ( posNum >= 1000 ) return ["-" + String(( posNum / 1000 ).toFixed(1)) + 'k'];
        else { return num }
    }
    return num;
}

export function mustache(template, self, parent, invert) {
  var render = mustache
  var output = ""
  var i

  function get (ctx, path) {
    path = path.pop ? path : path.split(".")
    ctx = ctx[path.shift()]
    ctx = ctx != null ? ctx : ""
    return (0 in path) ? get(ctx, path) : ctx
  }

  self = Array.isArray(self) ? self : (self ? [self] : [])
  self = invert ? (0 in self) ? [] : [1] : self
  
  for (i = 0; i < self.length; i++) {
    var childCode = ''
    var depth = 0
    var inverted
    var ctx = (typeof self[i] == "object") ? self[i] : {}
    ctx = Object.assign({}, parent, ctx)
    ctx[""] = {"": self[i]}
    
    template.replace(/([\s\S]*?)({{((\/)|(\^)|#)(.*?)}}|$)/g,
      function(match, code, y, z, close, invert, name) {
        if (!depth) {
          output += code.replace(/{{{(.*?)}}}|{{(!?)(&?)(>?)(.*?)}}/g,
            function(match, raw, comment, isRaw, partial, name) {
              return raw ? get(ctx, raw)
                : isRaw ? get(ctx, name)
                : partial ? render(get(ctx, name), ctx)
                : !comment ? new Option(get(ctx, name)).innerHTML
                : ""
            }
          )
          inverted = invert
        } else {
          childCode += depth && !close || depth > 1 ? match : code
        }
        if (close) {
          if (!--depth) {
            name = get(ctx, name)
            if (/^f/.test(typeof name)) {
              output += name.call(ctx, childCode, function (template) {
                return render(template, ctx)
              })
            } else {
              output += render(childCode, name, ctx, inverted) 
            }
            childCode = ""
          }
        } else {
          ++depth
        }
      }
    )
  }
  return output
}

export function createElement(element, attribute, inner) {
  if (typeof(element) === "undefined") {
    return false;
  }
  if (typeof(inner) === "undefined") {
    inner = "";
  }
  var el = document.createElement(element);
  if (typeof(attribute) === 'object') {
    for (var key in attribute) {
      el.setAttribute(key, attribute[key]);
    }
  }
  if (!Array.isArray(inner)) {
    inner = [inner];
  }
  for (var k = 0; k < inner.length; k++) {
    if (inner[k].tagName) {
      el.appendChild(inner[k]);
    } else {
      el.appendChild(document.createTextNode(inner[k]));
    }
  }
  return el;
}

export function autocomplete(query, arr) {

  let result = []

  if (query.length > 2) { 

    result = arr.filter( (item) => { 

	      if (item.meta.toLowerCase().includes(query)) { 

	          return true

	      } else {

          return false

        }

		})

    result = result.sort(function(a, b) {

      return a.length - b.length;

    });

  } else {

      result = []

  }

  return result

  
}

export async function postData(url = '', data = {}) {
  // Default options are marked with *
  const response = await fetch(url, {
    method: 'POST', // *GET, POST, PUT, DELETE, etc.
    mode: 'cors', // no-cors, *cors, same-origin
    cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    credentials: 'same-origin', // include, *same-origin, omit
    headers: {
      'Content-Type': 'application/json'
      // 'Content-Type': 'application/x-www-form-urlencoded',
    },
    redirect: 'follow', // manual, *follow, error
    referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
    body: JSON.stringify(data) // body data type must match "Content-Type" header
  });
  return response.json(); // parses JSON response into native JavaScript objects
}

export function sorter(arr, value) {

      let shortlist = arr.sort((a, b) => (a[value] < b[value]) ? 1 : -1).slice(0,5)
      return shortlist

}

export function highest(arr, value) {
  let ordered = arr.sort((a, b) => (a[value] < b[value]) ? 1 : -1)
  return ordered[0].label
}

export function isFormValid(data){

  if(!isRequiredFieldValid(data.name)){
    return false
  }

  if(!isRequiredFieldValid(data.contact)){
    return false
  }

  if(!isRequiredFieldValid(data.comment)){
    return false
  }

  return true
}

export function formHelper(data, state){

  state.namePassed = (!isRequiredFieldValid(data.name)) ? false : true ;

  state.contactPassed = (!isRequiredFieldValid(data.contact)) ? false : true ;

  state.commentPassed = (!isRequiredFieldValid(data.comment)) ? false : true ;

  return state
}

export function isRequiredFieldValid(value){
  return value != null && value !== ""
}

async function checkStatus(response) {
  if (response.status >= 200 && response.status < 300) {
    return response
  } else {
    var error = new Error(response.statusText)
    error.response = response
    throw error
  }
}

export function postForm(data) {

  var formData = new FormData()
  
  formData.append('entry.1196995990', data.name)
  formData.append('entry.716503595', data.contact)
  formData.append('entry.1334711016', data.comment)
  formData.append('entry.196113448', data.id)
  
  fetch('https://docs.google.com/forms/u/0/d/e/1FAIpQLSdr3ralX0-iWxBkf739qDV-pFrOhvt1UnbHGQtjECG-Vk0hdw/formResponse', {
      method: 'POST',
      mode: 'no-cors',
      body: formData
    })
    .then(response => response.text())
    .then(
      text => console.log(text))
}

export function getClosest(array, num) {

	var i=0;
	var minDiff=1000;
	var ans;
	for(i in array) {
	  var m=Math.abs(num-array[i]);
	  if(m<minDiff){ 
		minDiff=m; 
		ans=array[i]; 
	  }
	}
	return ans;
  }

export function sort(arr, value) {
    let ordered = arr.sort((a, b) => (a[value] < b[value]) ? 1 : -1)
    return ordered
}

export function rank(arr, value) {
    let ordered = arr.sort((a, b) => (a[value] < b[value]) ? 1 : -1)
    ordered.forEach( (item, index) => {
        item.rank = index + 1
    });
    return ordered
}

export function sum(arr, prop) {

    let total = 0
    for ( var i = 0, _len = arr.length; i < _len; i++ ) {
        total += arr[i][prop]
    }
    return total
}
