function _MediaSessionHandler() {
	const _mediaSession = navigator.mediaSession;

	this.add = (title, metadata) => {
		if(_mediaSession) {
			const media_metadata = {
				title: title,
				artist: metadata["ARTIST"],
				album: metadata["ALBUM"],
				artwork: [
					//{src: `url('${metadata["CASSETTE_BG"]}')`}, //Doen't seem to work with base64
					{src: "assets/icon.svg"},
					{src: "assets/icon.png"},
				]
			};

			_mediaSession.metadata = new MediaMetadata(media_metadata);
			_mediaSession.setPositionState({duration: 0});

			_mediaSession.setActionHandler("play",         () => { if(cassetteVisible()) buttonPlay() });
			_mediaSession.setActionHandler("pause",        () => { if(cassetteVisible()) buttonStop() });
			_mediaSession.setActionHandler("stop",         () => { if(cassetteVisible()) buttonStop() });
			_mediaSession.setActionHandler("seekforward",  () => { if(cassetteVisible()) buttonPlaySpeed(+0.1) });
			_mediaSession.setActionHandler("seekbackward", () => { if(cassetteVisible()) buttonPlaySpeed(-0.1) });
		}
	}

	this.remove = () => {
		if(_mediaSession) {
			_mediaSession.metadata = null;
		}
	}
}

export default new _MediaSessionHandler();
