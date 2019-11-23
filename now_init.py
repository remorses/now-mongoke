from http.server import BaseHTTPRequestHandler
import os.path
import base64
import json
import traceback
import asyncio
import enum
from urllib.parse import urlparse, unquote, urlencode
from mangum import Mangum
import sys
from prtty import pretty

import os.path
import sys
mongoke_parent = os.path.join(os.path.dirname(__file__), "__MONGOKE_PARENT_DIR")
sys.path += [os.path.abspath(mongoke_parent)]
os.environ['MONGOKE_BASE_PATH'] = '__MONGOKE_BASE_PATH'
import __NOW_HANDLER_FILENAME
__now_variables = dir(__NOW_HANDLER_FILENAME)
app = __NOW_HANDLER_FILENAME.app


def map_event(event):
    evt = {}
    evt['requestContext'] = {
        'eventType': ''
    }
    evt['queryStringParameters'] = ''
    payload = json.loads(event.get('body', '{}'))
    evt['path'] = unquote(payload.get('path', {}))
    evt['headers'] = payload.get('headers', {})
    evt['httpMethod'] = payload['method']
    evt['isBase64Encoded'] = True if payload.get('encoding') == 'base64' else False
    evt['body'] = payload.get('body')
    return evt

def map_response(response):
    return_dict = response
    if response.get('isBase64Encoded'):
        return_dict['encoding'] = 'base64'
    return return_dict

def now_handler(event, ctx):
    handler = Mangum(app, )
    pretty(json.loads(event['body']))
    try:
        res = handler(map_event(event), ctx)
        pretty(res)
        return map_response(res)
    except Exception as e:
        traceback.print_exc()
        return {
                "statusCode": 500,
                "headers": {"content-type": "text/plain; charset=utf-8"},
                "body": str(e),
            }

