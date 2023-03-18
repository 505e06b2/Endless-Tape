function _Noise() {
	let _element = new Audio();

	_element.oncanplay = () => console.warn(`Don't like the white noise? Block requests to "${location.origin}/assets/noise.ogg"`);
	_element.onerror = () => {
		console.warn("White noise not loaded as blocked by the browser");
		_element = null;
	}
	_element.src = "assets/noise.ogg";
	_element.loop = true;
	_element.preservesPitch = false;

	this.play = async () => { if(_element) await _element.play() };
	this.pause = () => { if(_element) _element.pause() };
	this.volume = {
		get: () => { if(_element) return _element.volume; else 0 },
		set: (v) => { if(_element) _element.volume = Math.min(v, 1.0) }
	};
}

export default new _Noise();
