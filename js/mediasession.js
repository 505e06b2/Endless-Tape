function MediaSessionHandler() {
	const audio_element = document.createElement("audio");
	audio_element.src = "assets/silence.mp3";

	function _cassetteVisible() {
		return (elements.container.style.display !== "none" && elements.playing_container.style.opacity === "1");
	}

	this.pause = () => {
		audio_element.pause();
	}

	this.play = () => {
		audio_element.play();
	}

	this.add = (title, metadata) => {
		if("mediaSession" in navigator) {
			const media_metadata = {
				title: title,
				artist: metadata["ARTIST"],
				album: metadata["ALBUM"],
				artwork: [{src: "assets/icon.svg"}]
			};

			navigator.mediaSession.metadata = new MediaMetadata(media_metadata);
			navigator.mediaSession.setPositionState({duration: 0});

			navigator.mediaSession.setActionHandler("play",         () => { if(_cassetteVisible()) {buttonPlay(); this.play()} });
			navigator.mediaSession.setActionHandler("pause",        () => { if(_cassetteVisible()) {buttonStop(); this.pause()} });
			navigator.mediaSession.setActionHandler("stop",         () => { if(_cassetteVisible()) {buttonStop(); this.pause()} });
			navigator.mediaSession.setActionHandler("seekforward",  () => { if(_cassetteVisible()) buttonPlaySpeed(+0.1) });
			navigator.mediaSession.setActionHandler("seekbackward", () => { if(_cassetteVisible()) buttonPlaySpeed(-0.1) });

			audio_element.loop = true;
			audio_element.playbackRate = 10.0; //max of 1s before it ends
			audio_element.play();
		}
	}

	this.remove = () => {
		this.pause();
		audio_element.loop = false;
		//audio_element.currentTime = audio_element.duration-1; //for some reason this now resets to 0 regardless
		audio_element.play();
	}
}
