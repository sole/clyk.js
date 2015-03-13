var Clyk = require('./Clyk');

window.CLYK = Clyk; // omg globalssss

window.addEventListener('load', function() {
	var container = document.getElementById('album_images');
	Clyk.load(container, 'http://p.soledadpenades.com/album/111/json/?jsoncallback=CLYKJS.jsonFlickr');
});
