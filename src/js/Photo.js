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
			console.log('load', self.index);

			var thumbLoaded = loadImage(self.thumb_url, tmpContainer);
			var imagesLoaded = Promise.all(images.map(function(image) {
				return loadImage(image, tmpContainer);
			}));

			Promise.all([thumbLoaded, imagesLoaded]).then(function() {
				yay();
			});
		});
	};

	function loadImage(url, tmpContainer) {
		console.log('loadImage', url);
		return new Promise(function(yay, nay) {
			var img = document.createElement('img');
			
			img.addEventListener('load', function() {
				//TODO uncomment tmpContainer.removeChild(img);
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
