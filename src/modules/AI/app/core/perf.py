"""
Performance Profiling Utilities

Provides async context managers and utilities for measuring execution time
of async operations with trace ID correlation.
"""

import time
import logging
from contextlib import asynccontextmanager
from typing import Optional

logger = logging.getLogger(__name__)


def now_ms() -> float:
    """
    Get current time in milliseconds.
    
    Returns:
        Current time in milliseconds since epoch
    """
    return time.time() * 1000


@asynccontextmanager
async def perf_span(name: str, trace_id: Optional[str] = None):
    """
    Async context manager for measuring execution time of a code block.
    
    Usage:
        async with perf_span("database_query", trace_id="abc123"):
            result = await db.query(...)
    
    Args:
        name: Name of the operation being measured
        trace_id: Optional trace ID for correlation
    
    Yields:
        None
    """
    trace_prefix = f"[{trace_id}]" if trace_id else ""
    start_ms = now_ms()
    
    logger.info(f"{trace_prefix} PERF [{name}] START")
    
    try:
        yield
    finally:
        elapsed_ms = now_ms() - start_ms
        logger.info(f"{trace_prefix} PERF [{name}] END {elapsed_ms:.2f}ms")


class PerfTracker:
    """
    Performance tracker for accumulating timing data across multiple spans.
    """
    
    def __init__(self, trace_id: str):
        self.trace_id = trace_id
        self.spans = {}
        self.start_time = now_ms()
    
    @asynccontextmanager
    async def span(self, name: str):
        """
        Track a named span and record its timing.
        
        Args:
            name: Name of the span
        """
        start_ms = now_ms()
        logger.info(f"[{self.trace_id}] PERF [{name}] START")
        
        try:
            yield
        finally:
            elapsed_ms = now_ms() - start_ms
            self.spans[name] = elapsed_ms
            logger.info(f"[{self.trace_id}] PERF [{name}] END {elapsed_ms:.2f}ms")
    
    def get_total_ms(self) -> float:
        """Get total elapsed time since tracker creation."""
        return now_ms() - self.start_time
    
    def get_slowest_span(self) -> tuple[str, float]:
        """
        Get the slowest span.
        
        Returns:
            Tuple of (span_name, elapsed_ms)
        """
        if not self.spans:
            return ("none", 0.0)
        
        slowest = max(self.spans.items(), key=lambda x: x[1])
        return slowest
    
    def summary(self) -> dict:
        """
        Get performance summary.
        
        Returns:
            Dictionary with timing data
        """
        slowest_name, slowest_ms = self.get_slowest_span()
        
        return {
            "trace_id": self.trace_id,
            "total_ms": self.get_total_ms(),
            "slowest_span": slowest_name,
            "slowest_ms": slowest_ms,
            "spans": self.spans
        }
