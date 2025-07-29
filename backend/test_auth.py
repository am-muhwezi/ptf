#!/usr/bin/env python
"""
Authentication Test Runner Script
Run this script to execute comprehensive authentication tests

Usage:
    python test_auth.py --all              # Run all authentication tests
    python test_auth.py --security         # Run only security tests
    python test_auth.py --integration      # Run only integration tests
    python test_auth.py --performance      # Run only performance tests
    python test_auth.py --coverage         # Run tests with coverage report
"""

import os
import sys
import subprocess
import argparse
from pathlib import Path

# Add the project root to Python path
project_root = Path(__file__).parent
sys.path.insert(0, str(project_root))

# Set Django settings
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ptf.settings')

def setup_django():
    """Setup Django for testing"""
    import django
    django.setup()

def run_tests(test_pattern=None, verbosity=2, coverage=False):
    """Run Django tests with optional coverage"""
    
    if coverage:
        # Install coverage if not available
        try:
            import coverage
        except ImportError:
            print("Installing coverage...")
            subprocess.run([sys.executable, "-m", "pip", "install", "coverage"])
    
    # Base command
    if coverage:
        cmd = [
            "coverage", "run", "--source=.", "manage.py", "test"
        ]
    else:
        cmd = ["python", "manage.py", "test"]
    
    # Add test pattern if specified
    if test_pattern:
        cmd.append(test_pattern)
    
    # Add verbosity
    cmd.extend(["-v", str(verbosity)])
    
    # Run tests
    print(f"Running command: {' '.join(cmd)}")
    result = subprocess.run(cmd, cwd=project_root)
    
    # Generate coverage report if requested
    if coverage and result.returncode == 0:
        print("\nGenerating coverage report...")
        subprocess.run(["coverage", "report", "-m"], cwd=project_root)
        subprocess.run(["coverage", "html"], cwd=project_root)
        print("Coverage report generated in htmlcov/index.html")
    
    return result.returncode

def main():
    parser = argparse.ArgumentParser(description='Run authentication tests')
    parser.add_argument('--all', action='store_true', help='Run all authentication tests')
    parser.add_argument('--security', action='store_true', help='Run security tests only')
    parser.add_argument('--integration', action='store_true', help='Run integration tests only')
    parser.add_argument('--performance', action='store_true', help='Run performance tests only')
    parser.add_argument('--model', action='store_true', help='Run model tests only')
    parser.add_argument('--api', action='store_true', help='Run API tests only')
    parser.add_argument('--coverage', action='store_true', help='Run with coverage report')
    parser.add_argument('--verbosity', type=int, default=2, help='Test verbosity (0-3)')
    
    args = parser.parse_args()
    
    # Setup Django
    setup_django()
    
    # Determine which tests to run
    test_pattern = None
    
    if args.security:
        test_pattern = "accounts.tests.AuthenticationSecurityTests"
    elif args.integration:
        test_pattern = "accounts.tests.AuthenticationIntegrationTests"
    elif args.performance:
        test_pattern = "accounts.tests.AuthenticationPerformanceTests"
    elif args.model:
        test_pattern = "accounts.tests.UserModelTests"
    elif args.api:
        test_pattern = "accounts.tests.AuthenticationAPITests"
    elif args.all:
        test_pattern = "accounts.tests"
    else:
        # Default to all authentication tests
        test_pattern = "accounts.tests"
    
    # Run the tests
    exit_code = run_tests(test_pattern, args.verbosity, args.coverage)
    
    if exit_code == 0:
        print("\n✅ All tests passed!")
    else:
        print("\n❌ Some tests failed!")
    
    sys.exit(exit_code)

if __name__ == "__main__":
    main()
