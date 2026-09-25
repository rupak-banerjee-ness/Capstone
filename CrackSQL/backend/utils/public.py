import yaml
import os
import sys
import importlib.resources


def read_yaml(config_name, config_path):
    """
    config_name: configuration content to read
    config_path: configuration file path
    """
    if config_name and config_path:
        # first try opening the specified path directly
        try:
            with open(config_path, 'r', encoding='utf-8') as f:
                conf = yaml.safe_load(f.read())
        except FileNotFoundError:
            # if the file can't be found, try reading it from within the package
            try:
                # get the package's install path
                package_path = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
                # build the config file path relative to the package
                relative_path = os.path.join(package_path, 'config', 'config.yaml')
                
                with open(relative_path, 'r', encoding='utf-8') as f:
                    conf = yaml.safe_load(f.read())
                print(f"Using in-package config file: {relative_path}")
            except FileNotFoundError:
                raise FileNotFoundError(f"Could not find config file: {config_path} or in-package config")
        
        if config_name in conf.keys():
            return conf[config_name.upper()]
        else:
            raise KeyError('No corresponding configuration information found')
    else:
        raise ValueError('Please enter the correct configuration name or configuration file path')