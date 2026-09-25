import datetime
import decimal
import uuid

from flask.json import JSONEncoder as BaseJSONEncoder

class JSONEncoder(BaseJSONEncoder):

    def default(self, o):
        """
        Additional needs can be added directly below
        :param o:
        :return:
        """
        if isinstance(o, datetime.datetime):
            # format datetime
            return o.strftime("%Y-%m-%d %H:%M:%S")
        if isinstance(o, datetime.date):
            # format date
            return o.strftime('%Y-%m-%d')
        if isinstance(o, decimal.Decimal):
            # format high-precision numbers
            return str(o)
        if isinstance(o, uuid.UUID):
            # format uuid
            return str(o)
        if isinstance(o, bytes):
            # format byte data
            return o.decode("utf-8")
        return super(JSONEncoder, self).default(o)
