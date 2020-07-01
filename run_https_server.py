#!/usr/bin/env python3

import http.server, ssl
import os, subprocess

key_file = os.path.join( os.environ["HOME"], "downloads", "localhost.pem" )

if not os.path.isfile(key_file):
	print("You can just press enter on all these prompts")
	subprocess.call("openssl", "req", "-new", "-x509", "-keyout", key_file, "-out", key_file, "-days", "365", "-nodes")


print("Hosting Server...")
server_address = ("0.0.0.0", 4443)
httpd = http.server.HTTPServer(server_address, http.server.SimpleHTTPRequestHandler)
httpd.socket = ssl.wrap_socket(httpd.socket,
                               server_side=True,
                               certfile=key_file,
                               ssl_version=ssl.PROTOCOL_TLS)
httpd.serve_forever()
