from http.server import BaseHTTPRequestHandler
import os.path
import base64
import json
import inspect
import asyncio
import enum
from urllib.parse import urlparse, unquote, urlencode
from mangum import Mangum

import sys

mongoke_parent = os.path.join(os.path.dirname(__file__), "api")
sys.path += [os.path.abspath(mongoke_parent)]


import api._mongoke.main

__now_variables = dir(api._mongoke.main)
app = api._mongoke.main.app


now_handler = Mangum(app, enable_lifespan=True)

