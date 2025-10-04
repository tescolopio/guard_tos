"""Corpus pipeline helpers for Terms Guardian category model training."""

from importlib import metadata

__all__ = ["__version__"]

try:
    __version__ = metadata.version("terms-guardian-corpus")
except metadata.PackageNotFoundError:  # pragma: no cover
    __version__ = "0.0.0"
