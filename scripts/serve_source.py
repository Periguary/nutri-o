from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

ROOT = Path('/home/ubuntu/nutriapoio').resolve()

class Handler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-store')
        super().end_headers()
    def log_message(self, format, *args):
        pass

class Server(ThreadingHTTPServer):
    daemon_threads = True

if __name__ == '__main__':
    import os
    os.chdir(ROOT)
    Server(('0.0.0.0', 3001), Handler).serve_forever()
