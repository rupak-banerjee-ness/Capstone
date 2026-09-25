class ResponseCode(object):
    Success = 0  # success
    Fail = -1  # failure
    NoResourceFound = 40001  # resource not found
    InvalidParameter = 40002  # invalid parameter
    FrequentOperation = 40009  # too many operations, please try again later
    ResourceAlreadyExists = 40010  # resource already exists
