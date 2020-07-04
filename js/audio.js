"use strict";

function Audio() {
	const audio = new AudioContext();
	const node_gain = audio.createGain();
	const node_bass_boost = audio.createBiquadFilter();
	const node_treble_dampen = audio.createBiquadFilter();

	node_gain.connect(audio.destination);
	node_treble_dampen.connect(node_gain)
	node_bass_boost.connect(node_treble_dampen);
	audio.suspend();

	node_treble_dampen.type = "highshelf";
	node_treble_dampen.frequency.value = 10000;
	node_treble_dampen.gain.value = -12;

	node_bass_boost.type = "highshelf";
	node_bass_boost.frequency.value = 200;
	node_bass_boost.gain.value = -6;

	let buffer_source;

	this.decodeFile = async (file) => {
		return await audio.decodeAudioData(file, function(buffer) {
			return buffer;
		}, function(e) {
			console.log(e.toString());
		});
	};

	this.getCurrentTime = () => {
		if(!buffer_source) return 0;
		return audio.currentTime; //currentTime is the time from when the AudioContext was created
	}

	this.changeTrack = (buffer, startTime = 0) => {
		if(buffer_source) buffer_source.disconnect();

		buffer_source = audio.createBufferSource();
		buffer_source.buffer = buffer;

		buffer_source.connect(node_bass_boost);
		buffer_source.loop = true;
		buffer_source.start(0, startTime);
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

	this.suspend = async () => {await audio.suspend();};
	this.resume = async () => {await audio.resume();};

	this.state = () => {return audio.state;};

	this.gain = {
		get: () => { return node_gain.gain.value; },
		set: (v) => { node_gain.gain.value = v; }
	};

	this.rate = {
		get: () => { return (buffer_source) ? buffer_source.playbackRate.value : 1 },
		set: (v) => { if(buffer_source) buffer_source.playbackRate.value = v; }
	};
}
