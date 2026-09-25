import base64
import io
import random
import re
import string
from functools import wraps

from PIL import Image, ImageFont, ImageDraw
from flask import jsonify, Response
from api.utils.response import ResMsg
from config import cache


def route(bp, *args, **kwargs):
    """
    Route setup, unified response format
    :param bp: blueprint
    :param args:
    :param kwargs:
    :return:
    """
    kwargs.setdefault('strict_slashes', False)

    def decorator(f):
        @bp.route(*args, **kwargs)
        @wraps(f)
        def wrapper(*args, **kwargs):
            rv = f(*args, **kwargs)
            # response function returns int or float
            if isinstance(rv, (int, float)):
                res = ResMsg()
                res.update(data=rv)
                return jsonify(res.data)
            # response function returns a tuple
            elif isinstance(rv, tuple):
                # check whether it has multiple params and the first param isn't a Response object
                if len(rv) >= 3 and not isinstance(rv[0], Response):
                    return jsonify(rv[0]), rv[1], rv[2]
                elif not isinstance(rv[0], Response):
                    return jsonify(rv[0]), rv[1]
                else:
                    return rv  # return the Response object directly
            # response function returns a dict
            elif isinstance(rv, dict):
                return jsonify(rv)
            # response function returns bytes
            elif isinstance(rv, bytes):
                rv = rv.decode('utf-8')
                return jsonify(rv)
            # if the response function returns a Flask Response object or other non-string/bytes type
            elif isinstance(rv, Response):
                return rv
            # other cases: try to return it directly, might be a file, etc.
            else:
                return rv

        return wrapper

    return decorator


def view_route(f):
    """
    Route setup, unified response format
    :param f:
    :return:
    """

    def decorator(*args, **kwargs):
        rv = f(*args, **kwargs)
        if isinstance(rv, (int, float)):
            res = ResMsg()
            res.update(data=rv)
            return jsonify(res.data)
        elif isinstance(rv, tuple):
            if len(rv) >= 3:
                return jsonify(rv[0]), rv[1], rv[2]
            else:
                return jsonify(rv[0]), rv[1]
        elif isinstance(rv, dict):
            return jsonify(rv)
        elif isinstance(rv, bytes):
            rv = rv.decode('utf-8')
            return jsonify(rv)
        else:
            return jsonify(rv)

    return decorator
