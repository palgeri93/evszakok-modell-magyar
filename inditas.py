"""Offline launcher. Serves only this folder, on the loopback interface."""
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from functools import partial
from pathlib import Path
import webbrowser

folder = Path(__file__).resolve().parent
server = ThreadingHTTPServer(('127.0.0.1', 0), partial(SimpleHTTPRequestHandler, directory=str(folder)))
url = f'http://127.0.0.1:{server.server_port}/index.html'
print('Nap-szimulator: ' + url)
print('A bezarashoz zarja be ezt az ablakot, vagy nyomjon Ctrl+C-t.')
webbrowser.open(url)
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
