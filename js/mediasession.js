function MediaSessionHandler() {
	const audio_element = document.createElement("audio");
	audio_element.src = "assets/silence.mp3";

	function _cassetteVisible() {
		console.log(elements.playing_container.style.opacity);
		return (elements.playing_container.style.opacity === "1");
	}

	function _pause() {
		if(!_cassetteVisible()) return;
		buttonStop();
		audio_element.pause();
	}

	function _play() {
		if(!_cassetteVisible()) return;
		buttonPlay();
		audio_element.play();
	}

	this.add = (title, metadata) => {
		if("mediaSession" in navigator) {
			const media_metadata = {
				title: title,
				artist: metadata["ARTIST"],
				album: metadata["ALBUM"],
				//artwork: [{src: "podcast.jpg"}]
			};

			navigator.mediaSession.metadata = new MediaMetadata(media_metadata);
			navigator.mediaSession.setActionHandler("play",         _play);
			navigator.mediaSession.setActionHandler("pause",        _pause);
			navigator.mediaSession.setActionHandler("stop",         _pause);
			navigator.mediaSession.setActionHandler("seekforward",  () => { if(_cassetteVisible()) buttonPlaySpeed(+0.1) });
			navigator.mediaSession.setActionHandler("seekbackward", () => { if(_cassetteVisible()) buttonPlaySpeed(-0.1) });

			audio_element.loop = true;
			audio_element.play();
		}
	}

	this.remove = () => {
		audio_element.pause();
		audio_element.loop = false;
		audio_element.currentTime = audio_element.duration+1;
		audio_element.play();
	}
}
