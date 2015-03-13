// We're assuming there's only one Clyk ever, per page
var initialised = false;
var container;
var containerSngX, containerSngY;
var bgDiv;
var queueContainer;
var needsRefresh = false;
var loaderScriptId;
var photos = [];
var Promise = require('es6-promise').Promise;
var Photo = require('./Photo');

function load(dstElement, srcURL) {
	init(dstElement);
	var fixedURL = srcURL;

	if(srcURL.match(/picasa/))
	{
		fixedURL = jsonpify(srcURL, 'alt', 'json', 'callback', 'CLYK.jsonPicasa');
	}
	else
	{
		fixedURL = jsonpify(srcURL, 'format', 'json', 'jsoncallback', 'CLYK.jsonFlickr');
	}
	
	var script = document.createElement('script');
	script.setAttribute('src', fixedURL);
	script.setAttribute('type', 'text/javascript');
	script.setAttribute('id', loaderScriptId);
	document.body.appendChild(script);
}

function init(element) {

	if(initialised) {
		return;
	}

	document.body.style.overflowX = 'hidden';

	container = element;
	container.innerHTML = '';
	var cs = container.style;
	cs.position = 'absolute';
	cs.top = '0px';
	cs.left = '0px';
	var cpos = getAbsolutePosition(container);
	containerSngX = -cpos.x;
	containerSngY = -cpos.y;

	// Background DIV
	var bd = document.createElement('div');
	var bs = bd.style;
	container.appendChild(bd);
	bgDiv = bd;
	bs.position = 'absolute';
	bs.top = '0px';
	bs.left = '0px';
	bs.zIndex = -1;
	updateBackground();
	
	// Queue container
	var qc = document.createElement('div');
	var qs = qc.style;
	document.body.appendChild(qc);
	qs.position = 'absolute';
	qs.top = '0px';
	qs.left = '0px';
	qs.overflow = 'hidden';
	qs.width = '300px';
	qs.height = '300px';
	qs.visibility = 'hidden';
	queueContainer = qc;

	// Event handlers
	window.addEventListener('keypress', function(event) {
		if([37, 38, 39, 40].indexOf(event.keyCode) != -1) {
			event.preventDefault();
		}
	}, true);

	window.addEventListener('keyup', function(event) {
		if(event.keyCode == 37) {
			focusPrevPhoto();
		} else if(event.keyCode == 39) {
			focusNextPhoto();
		}
		return false;
	}, false);

	window.addEventListener('resize', function() {
		needsRefresh = true;
	}, false);

	bgDiv.addEventListener('click', function(event) {
		event.preventDefault();
		event.stopPropagation();
		swapToMultiple();
		return false;
	}, true);

	window.focus();

	updateInterfaceFunction = updateInterfaceMultiple;
	/*updateInterfaceHandler = setInterval(function() {
		CLYK.updateInterfaceFunction();
		JSTweener.update();
	}, 1000/60);*/
	// TODO requestAnimationFrame

	initialised = true;
}

function jsonpify(url, format_parameter, format_value, callback_parameter, callback_value) {
	var parts = url.split('?', 2);
	
	if(parts.length > 1)
	{
		var query = parts[1];
		var pairs = query.split('&');
		var params = {};
		for(var i = 0; i < pairs.length; i++) {
			var pair = pairs[i].split('=');
			var param = pair[0];
			var value = pair[1];

			params[param] = value;
		}
		params[format_parameter] = format_value;
		params[callback_parameter] = callback_value;

		var new_params = [];
		for(var prop in params) {
			new_params.push(prop + '=' + params[prop]);
		}
		var fixed_url = parts[0] + '?' + new_params.join('&');
		return fixed_url;
	}
	return url;
}

function jsonFlickr(data) {
	console.log('data', data);
	
	var promises = [];

	for(var i = 0; i < data.items.length; i++) {
		var item = data.items[i];
		var images = [];
		var thumb = item.media.m;
		var suffixes = ['', '_b', '_o'];

		if(item.media.b) {
			images.push(item.media.b);
		} else {
			for (var k in suffixes) {
				var suffix = suffixes[k];
				var replaced = thumb.replace('_m.', suffix.concat('.'));
				images.push(replaced);
			}
		}

		var id = 'photo_' + i;
		var photo = new Photo(i, id, item.title, item.link, thumb, images);
		photos.push(photo);
		promises.push(photo.load(queueContainer));
	}

	Promise.all(promises).then(onPhotosLoaded);
}

function jsonPicasa(data) {
	// TODO
	console.log('jsonPicasa: TODO');
}

function onPhotosLoaded() {
	console.log('photos loaded');
	photos.forEach(addPhoto);
}

function addPhoto(photo, index) {
	var photoContainer = photo.elContainer;
	var ps = photoContainer.style;
	//ps.opacity = 0.0;
	ps.position = 'absolute';
	
	ps.zIndex = index;
	container.appendChild(photo.elContainer);

	photo.guessMarginsAndSizes();
	photo.setEnabled(false);

	var i = index;
	var pos = getGridPhotoPos(i);
	console.log(i, pos);
/*	ps.top = window.innerHeight + 'px';
	ps.left = pos.x + 'px';
	photo.grid_left = pos.x;
	photo.grid_top = pos.y;
	photo.top = window.innerHeight;
	photo.left = pos.x;
	photo.opacity = 0;
	/*photo.rotation = 100 * this._getRandRotation();
	photo.animate({
		delay: i * 0.03,
		top: photo.grid_top,
		opacity: 1,
		rotation: this._getRandRotation()
	}, 1);*/

}

function getGridPhotoPos(index) {
	if(index == 0) {
		return { x: 0, y: 0 };
	}

	var c_width = container.parentNode.clientWidth;
	var photo = photos[index];
	var prev_photo = photos[index - 1];

	var pw = prev_photo.client_width;
	var ph = prev_photo.client_height;
	var margin = 10;

	var left = prev_photo.grid_left + pw + margin;
	var top = prev_photo.grid_top;

	if(left + photo.client_width >= c_width) {
		left = 0;
		top += ph + margin;
	}
	
	return {
		x: left,
		y: top
	};
}

function updateBackground() {
	bgDiv.style.width = window.innerWidth + 'px';
	bgDiv.style.height = window.innerHeight + 'px';
}

function updateInterfaceMultiple() {
	if(needsRefresh) {
		for(var i = 0; i < photos.length; i++) {
			var p = photos[i];
			var new_pos = getGridPhotoPos(i);
			
			if(new_pos.x != p.grid_left || new_pos.y != p.grid_top) {
				var els = p.elContainer.style;
				els.left = new_pos.x + 'px';
				els.top = new_pos.y + 'px';
				p.grid_left = new_pos.x;
				p.grid_top = new_pos.y;
			}
		}

		updateBackground();
	}
	
	needsRefresh = false;
}

function updateInterfaceSingle() {
	if(needsRefresh) {
		setFocus(focusedPhotoIndex);
		updateBackground();
	}

	needsRefresh = false;
}

function getAbsolutePosition(el) {
	var left = el.offsetLeft;
	var top = el.offsetTop;
	var e = el.offsetParent;

	do {
		left += e.offsetLeft;
		top += e.offsetTop;
	} while (e = e.offsetParent);

	return {x: left, y: top};
}

module.exports = {
	load: load,
	jsonFlickr: jsonFlickr
};


