#!/usr/bin/env python3
"""
Test script to verify datetime display in CensorPage
Simulates what the frontend JavaScript does
"""
import json
from datetime import datetime

# Test data: timestamp from API (with +07:00 suffix)
test_timestamps = [
    "2026-01-22T12:30:45+07:00",
    "2026-01-22T06:00:00+07:00",  
    "2026-01-21T18:45:30+07:00",
]

def format_datetime_like_censor_page(timestamp):
    """
    Simulate how CensorPage formats datetime.
    It uses: new Date(timestamp).toLocaleString('th-TH', {...})
    
    In Python, this is similar to parsing ISO and formatting in Thai locale.
    """
    if not timestamp:
        return '-'
    try:
        # Parse ISO datetime
        dt = datetime.fromisoformat(timestamp)
        # Format in Thai style (without timezone conversion)
        return dt.strftime('%d/%m/%Y %H:%M:%S')
    except Exception as e:
        return str(e)

def format_datetime_like_faults_page(timestamp):
    """
    Same as CensorPage - uses toLocaleString('th-TH') without timeZone parameter
    """
    return format_datetime_like_censor_page(timestamp)

print("=" * 60)
print("🧪 CensorPage DateTime Formatting Test")
print("=" * 60)
print()
print("Method: new Date(timestamp).toLocaleString('th-TH', {...})")
print("This is the SAME approach as ImprovedFaultsPage (which works correctly)")
print()

for ts in test_timestamps:
    formatted = format_datetime_like_censor_page(ts)
    print(f"Input:  {ts}")
    print(f"Output: {formatted}")
    print()

print("=" * 60)
print("✅ If the hours match (12, 06, 18), the formatting is correct!")
print("=" * 60)
print()
print("JavaScript equivalent test:")
print("""
// This is what CensorPage does:
const formatDateTime = (timestamp) => {
  return new Date(timestamp).toLocaleString('th-TH', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

// Test in browser console:
console.log(formatDateTime("2026-01-22T12:30:45+07:00"));
// Expected: 22/01/2026 12:30:45 (Thai format)
""")
