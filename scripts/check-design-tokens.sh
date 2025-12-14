#!/bin/bash
# Local design token check script
# Run this before committing changes to report templates

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "🔍 DESIGN TOKEN CHECK"
echo "═══════════════════════════════════════════════════════════════"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Check 1: Hardcoded hex colors in report templates
echo "📋 Check 1: Hardcoded hex colors in report templates"
echo "─────────────────────────────────────────────────────────────"

DOCTOR_HEX=$(grep -c "#[0-9A-Fa-f]\{3,8\}" src/report_templates_doctor_v3.ts 2>/dev/null || echo "0")
PATIENT_HEX=$(grep -c "#[0-9A-Fa-f]\{3,8\}" src/report_templates_patient_v2.ts 2>/dev/null || echo "0")

echo "Doctor Report:   $DOCTOR_HEX hex colors"
echo "Patient Report:  $PATIENT_HEX hex colors"

if [ "$DOCTOR_HEX" -gt 0 ] || [ "$PATIENT_HEX" -gt 0 ]; then
  echo -e "${RED}❌ FAILED${NC}: Hardcoded hex colors detected!"
  echo ""
  echo "Report templates must use design tokens:"
  echo "  ❌ Bad:  style=\"background: #F0F9FF;\""
  echo "  ✅ Good: style=\"background: \${S.infoBg};\""
  echo ""
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ PASSED${NC}: No hardcoded hex colors"
fi

echo ""

# Check 2: rgb/rgba colors (warning only)
echo "📋 Check 2: rgb/rgba colors in report templates"
echo "─────────────────────────────────────────────────────────────"

DOCTOR_RGB=$(grep -c "rgba\?([0-9]" src/report_templates_doctor_v3.ts 2>/dev/null || echo "0")
PATIENT_RGB=$(grep -c "rgba\?([0-9]" src/report_templates_patient_v2.ts 2>/dev/null || echo "0")

echo "Doctor Report:   $DOCTOR_RGB rgb/rgba"
echo "Patient Report:  $PATIENT_RGB rgb/rgba"

if [ "$DOCTOR_RGB" -gt 0 ] || [ "$PATIENT_RGB" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  WARNING${NC}: rgb/rgba detected (OK if for opacity)"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}✅ OK${NC}: No rgb/rgba colors"
fi

echo ""

# Check 3: Token sync (tokens.cjs vs index.ts)
echo "📋 Check 3: Design token synchronization"
echo "─────────────────────────────────────────────────────────────"

CJS_PRIMARY=$(grep "'medless-primary':" src/design-system/tokens.cjs | grep -o "#[0-9A-Fa-f]\{6\}" | head -1)
TS_PRIMARY=$(grep "'medless-primary':" src/design-system/index.ts | grep -o "#[0-9A-Fa-f]\{6\}" | head -1)

echo "tokens.cjs medless-primary: $CJS_PRIMARY"
echo "index.ts medless-primary:   $TS_PRIMARY"

if [ "$CJS_PRIMARY" != "$TS_PRIMARY" ]; then
  echo -e "${RED}❌ FAILED${NC}: Tokens out of sync!"
  echo ""
  echo "After changing tokens.cjs, update index.ts with identical values!"
  echo ""
  ERRORS=$((ERRORS + 1))
else
  echo -e "${GREEN}✅ PASSED${NC}: Tokens in sync"
fi

echo ""

# Check 4: Token usage in templates
echo "📋 Check 4: getReportStyles() usage"
echo "─────────────────────────────────────────────────────────────"

DOCTOR_S=$(grep -c "S\.[a-z]" src/report_templates_doctor_v3.ts 2>/dev/null || echo "0")
PATIENT_S=$(grep -c "S\.[a-z]" src/report_templates_patient_v2.ts 2>/dev/null || echo "0")

echo "Doctor Report:   $DOCTOR_S uses of S.* tokens"
echo "Patient Report:  $PATIENT_S uses of S.* tokens"

if [ "$DOCTOR_S" -lt 10 ] || [ "$PATIENT_S" -lt 10 ]; then
  echo -e "${YELLOW}⚠️  WARNING${NC}: Low token usage (expected 10+)"
  WARNINGS=$((WARNINGS + 1))
else
  echo -e "${GREEN}✅ OK${NC}: Good token usage"
fi

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "📊 SUMMARY"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Errors:   $ERRORS"
echo "Warnings: $WARNINGS"
echo ""

if [ "$ERRORS" -gt 0 ]; then
  echo -e "${RED}❌ FAILED${NC}: Fix errors before committing"
  echo ""
  echo "See: src/design-system/TOKEN_GOVERNANCE.md"
  exit 1
elif [ "$WARNINGS" -gt 0 ]; then
  echo -e "${YELLOW}⚠️  WARNINGS${NC}: Review warnings (not blocking)"
  exit 0
else
  echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
  exit 0
fi
