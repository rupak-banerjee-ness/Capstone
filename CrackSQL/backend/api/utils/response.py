from flask import request, current_app
from api.utils.code import ResponseCode


class ResMsg(object):
    """
    Wraps the response text
    """

    def __init__(self, data=None, code=ResponseCode.Success, rq=request):
        # get the language selection from the request, default to Chinese
        self.lang = rq.headers.get("lang","en")
        self._data = data
        self._msg = current_app.config["RESPONSE_MESSAGE"].get(self.lang, {}).get(code, None)
        self._code = code

    def update(self, code=None, data=None, msg=None):
        """
        Update the default response text
        :param code: response code
        :param data: response data
        :param msg: response message
        :return:
        """
        if code is not None:
            self._code = code
            # get the response message for the corresponding language
            self._msg = current_app.config["RESPONSE_MESSAGE"].get(self.lang, {}).get(code, None)
        if data is not None:
            self._data = data
        if msg is not None:
            self._msg = msg

    def add_field(self, name=None, value=None):
        """
        Add a new field into the response text for convenience
        :param name: variable name
        :param value: variable value
        :return:
        """
        if name is not None and value is not None:
            self.__dict__[name] = value

    @property
    def data(self):
        """
        Output the response text content
        :return:
        """
        body = self.__dict__
        body["data"] = body.pop("_data")
        body["msg"] = body.pop("_msg")
        body["code"] = body.pop("_code")
        return body
