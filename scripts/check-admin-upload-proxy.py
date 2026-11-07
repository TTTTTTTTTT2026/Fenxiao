"""Isolated CI check of the actual Nginx config; never calls a production API."""
import http.client
import http.server
import pathlib
import subprocess
import tempfile
import threading
import time
import uuid


class Backend(http.server.BaseHTTPRequestHandler):
    def do_POST(self):
        self.rfile.read(int(self.headers['Content-Length']))
        self.send_response(204)
        self.end_headers()

    def log_message(self, *_):
        pass


server = http.server.ThreadingHTTPServer(('127.0.0.1', 0), Backend)
threading.Thread(target=server.serve_forever, daemon=True).start()
name = 'bandeira-upload-check-' + uuid.uuid4().hex[:12]
try:
    with tempfile.TemporaryDirectory() as directory:
        config = pathlib.Path(directory) / 'default.conf'
        config.write_text(pathlib.Path('deploy/nginx.conf').read_text()
                          .replace('listen 80;', 'listen 127.0.0.1:18089;')
                          .replace('backend:8080', '127.0.0.1:' + str(server.server_port)))
        subprocess.run(['docker', 'run', '-d', '--name', name, '--network', 'host',
                        '-v', str(config) + ':/etc/nginx/conf.d/default.conf:ro',
                        'nginx:1.27-alpine'], check=True)
        for attempt in range(30):
            try:
                conn = http.client.HTTPConnection('127.0.0.1', 18089, timeout=5)
                conn.request('GET', '/admin')
                conn.getresponse().read()
                conn.close()
                break
            except OSError:
                time.sleep(1)
        else:
            raise RuntimeError('Nginx did not start')
        subprocess.run(['docker', 'exec', name, 'nginx', '-t'], check=True)
        for size, expected in [(1024 * 1024, 204), (2 * 1024 * 1024, 413)]:
            body = (b'--boundary\r\nContent-Disposition: form-data; name="image"; filename="test.png"\r\n'
                    b'Content-Type: image/png\r\n\r\n' + bytes(size) + b'\r\n--boundary--\r\n')
            conn = http.client.HTTPConnection('127.0.0.1', 18089, timeout=10)
            conn.request('POST', '/admin/content/timo-invitation/id', body,
                         {'Content-Type': 'multipart/form-data; boundary=boundary'})
            response = conn.getresponse()
            assert response.status == expected, (size, response.status, expected)
            response.read()
            conn.close()
            print('PASS proxy multipart bytes', len(body), 'status', expected)
finally:
    subprocess.run(['docker', 'rm', '-f', name], check=False)
    server.shutdown()
