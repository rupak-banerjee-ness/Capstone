from flask_sqlalchemy import SQLAlchemy
from config.logging_config import logger
from flask import current_app
from functools import wraps

db = SQLAlchemy()


def db_session_manager(func):
    """Database session manager decorator
    Ensure database operations are executed in the application context
    """

    @wraps(func)
    def wrapper(*args, **kwargs):
        try:
            # first try to get the current application context
            if not current_app:
                # if there's no current context, check whether db.app has been initialized
                if not hasattr(db, 'app') or db.app is None:
                    raise RuntimeError("Database application context not initialized, make sure to call create_app() first")
                    
                with db.app.app_context():
                    return func(*args, **kwargs)
            return func(*args, **kwargs)
        except Exception as e:
            logger.error(f"Database operation failed: {str(e)}")
            # re-raise the exception, preserving the original stack trace
            raise

    return wrapper 