#!/usr/bin/env python3
"""
Test script to verify the Python backend is working correctly
"""

import sys
import os
import json

# Add the backend directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'backend'))

from main import handle_command

def test_microphone_check():
    """Test the microphone check functionality"""
    print("Testing microphone check...")
    
    try:
        result = handle_command("check_microphone")
        print(f"Result: {json.dumps(result, indent=2)}")
        
        if result.get("success"):
            mic_available = result.get("microphone_available", False)
            print(f"Microphone available: {mic_available}")
            return mic_available
        else:
            print(f"Error: {result.get('error', 'Unknown error')}")
            return False
            
    except Exception as e:
        print(f"Exception during test: {e}")
        return False

def test_available_models():
    """Test getting available models"""
    print("\nTesting available models...")
    
    try:
        result = handle_command("get_models")
        print(f"Result: {json.dumps(result, indent=2)}")
        return result.get("success", False)
        
    except Exception as e:
        print(f"Exception during test: {e}")
        return False

def main():
    print("OpenWispr Backend Test")
    print("=" * 30)
    
    # Test microphone
    mic_ok = test_microphone_check()
    
    # Test models
    models_ok = test_available_models()
    
    print("\n" + "=" * 30)
    print("Test Results:")
    print(f"Microphone check: {'✅ PASS' if mic_ok else '❌ FAIL'}")
    print(f"Models check: {'✅ PASS' if models_ok else '❌ FAIL'}")
    
    if mic_ok and models_ok:
        print("\n🎉 All tests passed! Backend is working correctly.")
        return 0
    else:
        print("\n❌ Some tests failed. Check the errors above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
