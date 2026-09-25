import os
import time
from typing import Tuple, Dict, Any  # additional type annotation support
from config.logging_config import logger
from flask import current_app

def save_uploaded_file_to_local(file) -> Tuple[str, str]:
    """
    Save the file locally
    :param file: the file
    :return: (path: file path, name: file name)
    """
    # generate a unique file name to avoid overwriting an existing file

    # generate the new file name using a timestamp and the original file name
    file_name = os.path.splitext(file.filename)[0] + '_' + str(int(time.time())) + os.path.splitext(file.filename)[1]
    os.makedirs(current_app.config['UPLOAD_FOLDER'], exist_ok=True)  # ensure the directory exists
    file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], file_name)
    try:
        with open(file_path, 'wb') as f:
            f.write(file.read())
        logger.info(f"File saved to: {file_path}")
    except IOError as e:
        logger.error(f"Failed to save file {file_name} due to I/O error: {e}")
        raise
    return file_path, file_name


def process_uploaded_file(file) -> Dict[str, Any]:
    try:
        _, name = save_uploaded_file_to_local(file)
        logger.info(f"File {name} uploaded successfully.")
        return {"status": True, "file_name": name}
    except Exception as error:
        logger.error(f"Upload file error: {error}")
        return {"status": False, "file_name": ''}

