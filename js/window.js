
const audio_folder = "audio";
const default_volume = 30; //percent
const audio = new Audio();
const noise = new Audio();
const media_session = new MediaSessionHandler();

const elements = {
	shelf: null,
	container: null,
	playing_container: null,
	cassette: null,
};

function getAbsoluteURL(url) {
	const a = document.createElement("a");
	a.href = url; //for some reason this turns absolute lol
	return a.href;
}

async function setCassetteAssets(metadata) {
	function checkTag(tag_contents) {
		return (tag_contents && typeof(tag_contents) === "string" && tag_contents.length > 16);
	}

	let style = "";
	if(checkTag(metadata.CASSETTE_BG))    style += `--tiled-bg: url("${metadata.CASSETTE_BG}");`;
	if(checkTag(metadata.CASSETTE_LABEL)) style += `--label-bg: url("${metadata.CASSETTE_LABEL}");`;
	cassette.style = style;

	return metadata;
}

async function loadCassette(title, url) {
	elements.playing_container.style.opacity = "0.0";
	elements.shelf.style.opacity = "0.0";
	elements.shelf.style.display = "none";
	elements.container.style.display = "";

	const messages = {
		"parent": document.getElementById("messages"),
		"percent": document.getElementById("percent"),
		"description": document.getElementById("description")
	};

	messages.percent.innerText = "0%";
	messages.description.innerText = "Downloading";
	messages.parent.style.display = "flex";


	messages.description.innerText = "Downloading";
	const file_contents = await (async () => {
		const r = await fetch(url);
		const content_length = r.headers.get("Content-Length");


		if(content_length) {
			const chunks = [];
			const reader = r.body.getReader();
			let received_bytes = 0;

			while(true) {
				const {done, value} = await reader.read();
				if(done) break;

				chunks.push(value);
				received_bytes += value.length;
				messages.percent.innerText = `${Math.trunc(received_bytes/content_length*95)}%`;
			}

			const buffer_array = new Uint8Array(received_bytes);
			let position = 0;
			for(const i in chunks) {
				buffer_array.set(chunks[i], position);
				position += chunks[i].length;
			}

			return buffer_array.buffer;
		} else {
			progress(-1, "Downloading");
			return await r.arrayBuffer();
		}
	})();

	const decodes = {
		"metadata": setCassetteAssets( (new OggParser(file_contents)).getMetadata() ),
		"audio": audio.decodeFile(file_contents)
	};

	messages.description.innerText = "Parsing Metadata";
	const metadata = await decodes["metadata"];
	messages.percent.innerText = "98%";

	(async () => {
		let info = `==== Metadata ====\n${getAbsoluteURL(url)}:\n`;
		if(metadata.TITLE) info += `- Title: ${metadata.TITLE}\n`;
		if(metadata.ARTIST) info += `- Artist: ${metadata.ARTIST}\n`;
		if(metadata.ALBUM) info += `- Album: ${metadata.ALBUM}\n`;
		console.log(info);
	})();

	messages.description.innerText = "Parsing Audiobuffer";
	const audio_buffer = await decodes["audio"];

	messages.parent.style.display = "";
	elements.playing_container.style.opacity = "1.0"; //opacity and not display, so that the images can preload a bit
	audio.changeTrack(audio_buffer);

	await buttonVolume(default_volume);
	document.getElementById("volume").value = default_volume;
	await buttonPlay();

	media_session.add(title, metadata);
}

window.onload = async () => {
	elements.shelf = document.getElementById("shelf");
	elements.container = document.getElementById("container");
	elements.playing_container = document.getElementById("playing-container");
	elements.cassette = document.getElementById("cassette");

	try {
		noise.load(await (await fetch("assets/noise.ogg")).arrayBuffer());
		console.warn(`Don't like the white noise? Block requests to ${getAbsoluteURL("assets/noise.ogg")}`);
	} catch(e) {
		console.warn("White noise not loaded");
	}

	shelf.style.opacity = "1.0";
};
