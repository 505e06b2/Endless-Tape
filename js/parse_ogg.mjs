function OggParser(file) {
	const uint8 = new Uint8Array(file);

	this.getMetadata = () => {
		try {
			return _parseMetadataSegments( _getMetadataSegments() );
		} catch(e) {
			console.error(e);
			return {};
		}
	};

	this.parsePage = (starting_index) => {
		const magic_str = "OggS";
		const page_magic_str = String.fromCharCode.apply(null, uint8.slice(starting_index, starting_index+magic_str.length));
		if(page_magic_str != magic_str) throw `File signature is not "${magic_str}"`;

		function getInt(index, sizeof) { //to tidy up the following
			return _getLEInt(starting_index+index, sizeof);
		}

		const ret = {};
		ret.start_index = starting_index;
		ret.version = getInt(4, 1);
		ret.type = getInt(5, 1);
		ret.granule_position = getInt(6, 8);
		ret.serial_number = getInt(14, 4);
		ret.page_sequence_number = getInt(18, 4);
		ret.crc_checksum = getInt(22, 4);
		ret.segments_len = getInt(26, 1);
		ret.segments = [];

		ret.segment_table_size = 0;
		ret.contents_start = starting_index + ret.segments_len+27;

		for(let i = 0, j = 0; i < ret.segments_len; i++) {
			const segment_size = getInt(i+27, 1);
			ret.segment_table_size += segment_size;

			const std_array = Array.from(uint8.slice(ret.contents_start+j, ret.contents_start+j+segment_size));
			ret.segments = ret.segments.concat( std_array );
			j += segment_size;
		}
		ret.page_size = ret.segments_len+26 + ret.segment_table_size;
		//console.log(`Starting Index: ${starting_index.toString(16)}\nPage Size: ${ret.page_size.toString(16)}`);

		ret.next = () => {
			return this.parsePage(ret.start_index+ret.page_size+1);
		};

		return ret;
	};

	//Private
	const _getLEInt = (index, sizeof) => { //uses global uint8
		if(sizeof === 1) return uint8[index]; //optimise :^)
		if(sizeof <= 4) return parseInt( _uint8ToLittleEndian(uint8.slice(index, index+sizeof)), 16 );
		return BigInt("0x" + _uint8ToLittleEndian(uint8.slice(index, index+sizeof)));
	}

	const _uint8ToLittleEndian = (arr) => {
		const hex = [];
		for(let i = arr.length-1; i >= 0; i--) { //little endian
			hex.push( arr[i].toString(16).padStart(2, "0") );
		}
		return hex.join("");
	}

	const _getMetadataSegments = () => {
		let current_page = this.parsePage(0).next(); //metadata page start
		let ret = [];

		let i, e = 100;
		for(i = 0; i < e; i++) {
			ret = ret.concat( current_page.segments );
			if(current_page.segments_len < 255) break;
			current_page = current_page.next();
		}

		if(i === e) {
			console.warn(`Too many pages for metadata??? Max Set to: ${e}`);
			ret = [];
		}

		return ret;
	};

	const _parseMetadataSegments = (segments) => {
		const codec_heading = new TextDecoder().decode( new Uint8Array( segments.slice(0, 10) ) );
		let i = 0;

		if(codec_heading.startsWith("OpusTags")) {
			i += 8;

		} else if(codec_heading.slice(1).startsWith("vorbis")) {
			i += 7;

		} else {
			throw `Not a supported codec ${codec_heading}`;
		}

		function getUint32() { //segments is global
			return parseInt( _uint8ToLittleEndian(segments.slice(i, i+4)), 16 );
		}

		function getStr() {
			let len = getUint32();
			i += 4;
			const ret = new TextDecoder().decode( new Uint8Array(segments.slice(i, i+len)) );
			i += len;
			return ret;
		}

		const encoder = getStr(); //pull in encoder (pre-tags)
		const tags_len = getUint32();
		i += 4; //start of tags

		const ret = {};
		for(let j = 0; j < tags_len; j++) {
			const tag_str = getStr();
			const equals = tag_str.indexOf("=");
			ret[tag_str.slice(0,equals).toUpperCase()] = tag_str.slice(equals+1);
		}
		return ret;
	};
}

export default OggParser;
