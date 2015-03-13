var Promise = require('es6-promise').Promise;

module.exports = Photo;

function Photo(index, id, title, link, thumb_url, images) {
	this.index = index;
	this.id = id;
	this.title = title;
	this.link = link;
	this.thumb_url = thumb_url;
	this.tmp_images = images;
	this.image_url = null;
	this.image_w = 0;
	this.image_h = 0;
	this.rotation = 0;
	this.z_index = index;
	this.margin_w = 0;
	this.margin_h = 0;
	this.client_width = 0;
	this.client_height = 0;

	var el = document.createElement('div');
	var img = document.createElement('img');
	var desc = document.createElement('div');

	el.id = id;
	el.appendChild(img);
	el.appendChild(desc);
	el.className = 'photo shadow';

	this.elContainer = el;
	this.elImage = img;
	this.elDescription = desc;

	img.src = thumb_url;

	desc.className = 'description';
	desc.innerHTML = '<a href="' + link + '">#</a> ' + title;

	this.thumb_w = img.naturalWidth;
	this.thumb_h = img.naturalHeight;
	this.img_w = this.thumb_w;
	this.img_h = this.thumb_h;

	var is = img.style;
	is.width = this.thumb_w + 'px';
	is.height = this.thumb_h + 'px';

	// Restrict description to image width too
	var ds = desc.style;
	ds.width = is.width;

	this.load = function(tmpContainer) {
		var self = this;
		
		return new Promise(function(yay, nay) {
			var thumbLoaded = loadImage(self.thumb_url, tmpContainer);
			var imagesLoaded = Promise.all(images.map(function(image) {
				return loadImage(image, tmpContainer);
			}));

			Promise.all([thumbLoaded, imagesLoaded]).then(function() {
				yay();
			});
		});
	};

	this.setEnabled = function(enabled) {
		var img = this.elImage;
		// TODO actually finish implementing
		// maybe capture the clicks on the container instead of per image
		if(enabled) {
			//img.addEventListener('click', CLYK.onImageClick, false);
			img.style.cursor = 'pointer';
		} else {
			//img.removeEventListener('click', CLYK.onImageClick, false);
			img.style.cursor = 'default';
		}
	};

	this.guessMarginsAndSizes = function() {
		var el_w = this.elContainer.clientWidth;
		var el_h = this.elContainer.clientHeight;
		var img_w = this.elImage.clientWidth;
		var img_h = this.elImage.clientHeight;

		this.client_width = el_w;
		this.client_height = el_h;
		this.margin_w = el_w - img_w;
		this.margin_h = el_h - img_h;
	};

	function loadImage(url, tmpContainer) {
		return new Promise(function(yay, nay) {
			var img = document.createElement('img');
			
			img.addEventListener('load', function() {
				tmpContainer.removeChild(img);
				yay(img);
			});

			img.addEventListener('error', function() {
				tmpContainer.removeChild(img);
				nay();
			});

			img.src = url;

			tmpContainer.appendChild(img);
		});
	}
}
