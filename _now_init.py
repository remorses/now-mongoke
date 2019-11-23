from http.server import BaseHTTPRequestHandler

import base64
import json
import inspect

import os.path
import sys
mongoke_parent = os.path.join(os.path.dirname(__file__), "__MONGOKE_PARENT_DIR")
sys.path += [os.path.abspath(mongoke_parent)]
import __NOW_HANDLER_FILENAME
__now_variables = dir(__NOW_HANDLER_FILENAME)


def format_headers(headers, decode=False):
    keyToList = {}
    for key, value in headers.items():
        if decode:
            key = key.decode()
            value = value.decode()
        if key not in keyToList:
            keyToList[key] = []
        keyToList[key].append(value)
    return keyToList


if True:
        print('using Asynchronous Server Gateway Interface (ASGI)')
        import asyncio
        import enum
        from urllib.parse import urlparse, unquote, urlencode
        from werkzeug.datastructures import Headers
        from mangum.lifespan import Lifespan
        import logging
        print('waiting startup')
        loop = asyncio.new_event_loop()
        lifespan = Lifespan(__NOW_HANDLER_FILENAME.app, logger=logging.getLogger())
        loop.create_task(lifespan.run())
        loop.run_until_complete(lifespan.wait_startup())
        print('started')



        class ASGICycleState(enum.Enum):
            REQUEST = enum.auto()
            RESPONSE = enum.auto()


        class ASGICycle:
            def __init__(self, scope):
                self.scope = scope
                self.body = b''
                self.state = ASGICycleState.REQUEST
                self.app_queue = None
                self.response = {}

            def __call__(self, app, body):
                """
                Receives the application and any body included in the request, then builds the
                ASGI instance using the connection scope.
                Runs until the response is completely read from the application.
                """
                loop = asyncio.new_event_loop()
                self.app_queue = asyncio.Queue(loop=loop)
                self.put_message({'type': 'http.request', 'body': body, 'more_body': False})

                asgi_instance = app(self.scope, self.receive, self.send)

                asgi_task = loop.create_task(asgi_instance)
                loop.run_until_complete(asgi_task)
                return self.response

            def put_message(self, message):
                self.app_queue.put_nowait(message)

            async def receive(self):
                """
                Awaited by the application to receive messages in the queue.
                """
                message = await self.app_queue.get()
                return message

            async def send(self, message):
                """
                Awaited by the application to send messages to the current cycle instance.
                """
                message_type = message['type']

                if self.state is ASGICycleState.REQUEST:
                    if message_type != 'http.response.start':
                        raise RuntimeError(
                            f"Expected 'http.response.start', received: {message_type}"
                        )

                    status_code = message['status']
                    headers = Headers(message.get('headers', []))

                    self.on_request(headers, status_code)
                    self.state = ASGICycleState.RESPONSE

                elif self.state is ASGICycleState.RESPONSE:
                    if message_type != 'http.response.body':
                        raise RuntimeError(
                            f"Expected 'http.response.body', received: {message_type}"
                        )

                    body = message.get('body', b'')
                    more_body = message.get('more_body', False)

                    # The body must be completely read before returning the response.
                    self.body += body

                    if not more_body:
                        self.on_response()
                        self.put_message({'type': 'http.disconnect'})

            def on_request(self, headers, status_code):
                self.response['statusCode'] = status_code
                self.response['headers'] = format_headers(headers, decode=True)

            def on_response(self):
                if self.body:
                    self.response['body'] = base64.b64encode(self.body).decode('utf-8')
                    self.response['encoding'] = 'base64'

        def now_handler(event, context):
            payload = json.loads(event['body'])

            headers = payload.get('headers', {})

            body = payload.get('body', b'')
            if payload.get('encoding') == 'base64':
                body = base64.b64decode(body)
            elif not isinstance(body, bytes):
                body = body.encode()

            url = urlparse(unquote(payload['path']))
            query = url.query.encode()
            path = url.path

            scope = {
                'server': (headers.get('host', 'lambda'), headers.get('x-forwarded-port', 80)),
                'client': (headers.get(
                    'x-forwarded-for', headers.get(
                        'x-real-ip', payload.get(
                            'true-client-ip', ''))), 0),
                'scheme': headers.get('x-forwarded-proto', 'http'),
                'root_path': '',
                'query_string': query,
                'headers': [[k.lower().encode(), v.encode()] for k, v in headers.items()],
                'type': 'http',
                'http_version': '1.1',
                'method': payload['method'],
                'path': path,
                'raw_path': path.encode(),
            }

            asgi_cycle = ASGICycle(scope)
            response = asgi_cycle(__NOW_HANDLER_FILENAME.app, body)
            return response

else:
    print('Missing variable `handler` or `app` in file __NOW_HANDLER_FILENAME.py')
    print('See the docs https://zeit.co/docs/v2/deployments/official-builders/python-now-python')
    exit(1)
