#!/usr/bin/env python3

import sys, subprocess, base64, mimetypes, os
import urllib.parse

if len(sys.argv) < 4:
	print("3 arguments required")
	print("%s [ogg file] [bg_image] [label_image]" % sys.argv[0])
	sys.exit(1)

meta_file = "/tmp/metadata.txt"

def optimizeSVG(filename):
	return urllib.parse.quote(subprocess.check_output([
		"scour",
		filename,
		"--enable-viewboxing",
		"--enable-id-stripping",
		"--enable-comment-stripping",
		"--shorten-ids",
		"--indent=none",
		"--no-line-breaks",
		"--strip-xml-prolog",
		"-q"
	]).decode("utf8").strip().replace("\"", "'"), safe="/ =:'")

def getTagContents(filename):
	mime = mimetypes.guess_type(filename)[0]
	if not mime:
		print("Can't get mimetype for \"%s\"" % filename)
		sys.exit(1)

	if mime == "image/svg+xml":
		return "data:%s;utf8,%s" % (mime, optimizeSVG(filename))

	return "data:%s;base64,%s" % (mime, base64.b64encode( open(filename, "rb").read() ).decode("utf8"))

with open(meta_file, "w") as f:
	#f.write(";FFMETADATA1\n")
	f.write("CASSETTE_BG=%s\n" % getTagContents(sys.argv[2]))
	f.write("CASSETTE_LABEL=%s\n" % getTagContents(sys.argv[3]))

out_filename = "%s_cassette.ogg" % ( os.path.splitext(os.path.basename(sys.argv[1]))[0] )

subprocess.call([
	"vorbiscomment",
	"-a",
	"-R",
	"-c", meta_file,
	sys.argv[1],
	out_filename
])

"""
subprocess.call([
	"ffmpeg",
		"-hide_banner",
		"-loglevel", "panic",
		"-i", sys.argv[1],
		"-i", meta_file,
		"-c:a", "copy",
		"-map_metadata", "1",
		out_filename
])
"""
