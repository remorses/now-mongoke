

import distutils.text_file
import pkg_resources
from pkg_resources import DistributionNotFound, VersionConflict
dependencies = distutils.text_file.TextFile(filename='requirements.txt').readlines()
pkg_resources.require(dependencies)