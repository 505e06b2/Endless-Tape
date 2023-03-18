function _CassetteAudio() {
	const audio = new AudioContext();

	const node_gain = audio.createGain();
	const node_bass_boost = audio.createBiquadFilter();
	const node_treble_boost = audio.createBiquadFilter();
	const node_lowpass = audio.createBiquadFilter();

	node_gain.connect(audio.destination);
	node_treble_boost.connect(node_gain)
	node_bass_boost.connect(node_treble_boost);
	node_lowpass.connect(node_bass_boost);
	audio.suspend();

	node_treble_boost.type = "highshelf";
	node_treble_boost.frequency.value = 5000;
	node_treble_boost.gain.value = 32;

	node_bass_boost.type = "highshelf";
	node_bass_boost.frequency.value = 300;
	node_bass_boost.gain.value = -12;

	node_lowpass.type = "lowpass"; //cassettify
	node_lowpass.frequency.value = 4000;
	node_lowpass.Q.value = -5;


	let buffer_source;

	this.decodeFile = async (file) => {
		return await audio.decodeAudioData(file, function(buffer) {
			return buffer;
		}, function(e) {
			console.log(e.toString());
		});
	};

	this.changeTrack = (buffer_or_url, startTime = 0) => {
		this.eject();

		if(typeof(buffer_or_url) === "string") {
			buffer_source = audio.createMediaElementSource(document.createElement("audio"));
			buffer_source.mediaElement.src = buffer_or_url;
			buffer_source.mediaElement.loop = true;
			buffer_source.mediaElement.preservesPitch = false;
			buffer_source.mediaElement.play();

		} else {
			buffer_source = audio.createBufferSource();
			buffer_source.buffer = buffer_or_url;
			buffer_source.loop = true;
			buffer_source.start(0, startTime);
		}

		buffer_source.connect(node_lowpass);
	}

	//Helper for decodeFile -> changeTrack
	this.load = async (file) => {
		const buffer = await this.decodeFile(file);
		if(!buffer) {
			console.log("Could not decode file");
			return;
		}

		this.changeTrack(buffer);

		return buffer; //for possible later use
	};

	this.eject = () => {
		if(buffer_source) {
			buffer_source.disconnect();
			if(buffer_source.mediaElement) URL.revokeObjectURL(buffer_source.mediaElement.src);
		}
		buffer_source = undefined;
	}

	this.suspend = async () => await audio.suspend();
	this.resume = async () => await audio.resume();

	this.state = () => audio.state;

	this.gain = {
		get: () => { return node_gain.gain.value; },
		set: (v) => { node_gain.gain.value = v; }
	};

	this.rate = {
		get: () => {
			if(buffer_source) {
				if(buffer_source.mediaElement) return buffer_source.mediaElement.playbackRate;
				return buffer_source.playbackRate.value;
			}
			return 1;
		},

		set: (v) => {
			if(buffer_source) {
				if(buffer_source.mediaElement) {
					if(v < 0.1) v = 0.1;
					//node_pitchcorrect.detune.value = 0;
					return buffer_source.mediaElement.playbackRate = v;

				} else {
					return buffer_source.playbackRate.value = v;
				}
			}
		}
	};
}

export default new _CassetteAudio();
