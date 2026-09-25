import os

from flask import Blueprint, request
from api.utils.code import ResponseCode
from api.utils.response import ResMsg
from api.utils.util import route
from api.services.file import process_uploaded_file


bp = Blueprint("file", __name__, url_prefix='/api/file')


@route(bp, '/test', methods=["GET"])
def test():
    """
    Test endpoint
    :return:
    """
    res = ResMsg()
    data = {'status': True}
    res.update(data=data)
    return res.data


@route(bp, '/upload_file', methods=["POST"])
def upload_file():
    """
    File upload endpoint
    :return:
    """
    res = ResMsg()
    file = request.files.get('file', None)
    print("===File received")
    if not file:
        res.update(code=ResponseCode.InvalidParameter)
        return res.data

    print("===Saving file")
    result = process_uploaded_file(file)
    print("===File saved successfully")
    res.update(data=result)
    return res.data

